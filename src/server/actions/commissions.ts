"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { CommissionPersona, Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/auth/permissions";
import { commissionRepository } from "@/server/repositories/commission.repository";
import { prisma } from "@/lib/prisma";
import { smartDelete, type SmartDeleteResult } from "@/server/lib/smart-delete";
import { logger } from "@/lib/logger";

const TierSchema = z
  .object({
    fromEgp: z.coerce.number().min(0),
    toEgp: z
      .union([z.coerce.number().min(0), z.literal(""), z.null()])
      .transform((v) => (v === "" || v === null ? null : Number(v))),
    valueType: z.enum(["percent", "flat"]),
    valueAmount: z.coerce.number().min(0),
    label: z.string().max(120).optional().or(z.literal("")),
  })
  .refine((d) => d.toEgp === null || d.toEgp > d.fromEgp, {
    path: ["toEgp"],
    message: "Upper bound must be greater than the lower bound (or empty for ∞).",
  })
  .refine((d) => d.valueType !== "percent" || d.valueAmount <= 100, {
    path: ["valueAmount"],
    message: "Percent must be ≤ 100.",
  });

const SaveSchema = z.object({
  productId: z.string().min(1),
  persona: z.nativeEnum(CommissionPersona),
  isActive: z.coerce.boolean().default(true),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type SaveCommissionState = { ok: true } | { ok: false; message: string };

export async function saveCommissionAction(
  _prev: SaveCommissionState | null,
  fd: FormData,
): Promise<SaveCommissionState> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) throw new ForbiddenError("Admin only");

  const parsed = SaveSchema.safeParse({
    productId: fd.get("productId")?.toString() ?? "",
    persona: fd.get("persona"),
    isActive: fd.get("isActive") === "on" || fd.get("isActive") === "true",
    notes: fd.get("notes")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const head = parsed.data;

  // Tiers come in as parallel arrays keyed by row index.
  const fromList = fd.getAll("tier.from").map((v) => v.toString());
  const toList = fd.getAll("tier.to").map((v) => v.toString());
  const valueTypeList = fd.getAll("tier.valueType").map((v) => v.toString());
  const valueAmountList = fd.getAll("tier.valueAmount").map((v) => v.toString());
  const labelList = fd.getAll("tier.label").map((v) => v.toString());

  const rowCount = Math.max(
    fromList.length,
    toList.length,
    valueTypeList.length,
    valueAmountList.length,
    labelList.length,
  );

  const tiers: Array<{
    sortOrder: number;
    fromAmountPiastres: bigint;
    toAmountPiastres: bigint | null;
    ratePercentBps: number | null;
    flatPiastres: bigint | null;
    label: string | null;
  }> = [];
  for (let i = 0; i < rowCount; i++) {
    const raw = {
      fromEgp: fromList[i] ?? "0",
      toEgp: toList[i] ?? "",
      valueType: (valueTypeList[i] ?? "percent") as "percent" | "flat",
      valueAmount: valueAmountList[i] ?? "0",
      label: labelList[i] ?? "",
    };
    // Skip blank rows (no values entered).
    if (raw.fromEgp === "" && raw.toEgp === "" && raw.valueAmount === "") continue;
    const t = TierSchema.safeParse(raw);
    if (!t.success) {
      return { ok: false, message: `Tier ${i + 1}: ${t.error.errors[0]?.message ?? "invalid"}` };
    }
    const v = t.data;
    tiers.push({
      sortOrder: i,
      fromAmountPiastres: BigInt(Math.round(v.fromEgp * 100)),
      toAmountPiastres: v.toEgp === null ? null : BigInt(Math.round(v.toEgp * 100)),
      ratePercentBps: v.valueType === "percent" ? Math.round(v.valueAmount * 100) : null,
      flatPiastres: v.valueType === "flat" ? BigInt(Math.round(v.valueAmount * 100)) : null,
      label: v.label ? v.label.trim() : null,
    });
  }

  try {
    await commissionRepository.replaceTiers(
      head.productId,
      head.persona,
      head.notes && head.notes.trim() !== "" ? head.notes.trim() : null,
      head.isActive,
      tiers,
    );
    revalidatePath("/commission");
    revalidatePath("/admin/commission");
    revalidatePath(`/admin/commission/${head.productId}`);
    return { ok: true };
  } catch (err) {
    logger.error({ err, productId: head.productId }, "commission.save_failed");
    return { ok: false, message: "Could not save the commission table, please retry." };
  }
}

export async function deleteCommissionAction(id: string): Promise<SmartDeleteResult> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) throw new ForbiddenError("Admin only");
  if (!id) return { ok: false, message: "Missing id" };
  const result = await smartDelete({
    label: "productCommission",
    id,
    hard: () => prisma.productCommission.delete({ where: { id } }),
    soft: () => prisma.productCommission.update({ where: { id }, data: { isActive: false } }),
  });
  if (result.ok) {
    revalidatePath("/commission");
    revalidatePath("/admin/commission");
  }
  return result;
}
