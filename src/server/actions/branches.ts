"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type BranchActionState = { ok: true } | { ok: false; message: string } | null;

const BranchSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, or hyphens"),
  nameEn: z.string().trim().min(1).max(160),
  nameAr: z.string().trim().min(1).max(160),
  city: z.string().max(120).optional().or(z.literal("")),
  governorate: z.string().max(120).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  phone: z.string().max(64).optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

function parse(fd: FormData) {
  return {
    slug: fd.get("slug")?.toString().trim() ?? "",
    nameEn: fd.get("nameEn")?.toString() ?? "",
    nameAr: fd.get("nameAr")?.toString() ?? "",
    city: fd.get("city")?.toString() ?? "",
    governorate: fd.get("governorate")?.toString() ?? "",
    address: fd.get("address")?.toString() ?? "",
    phone: fd.get("phone")?.toString() ?? "",
    isActive: fd.get("isActive") === "on" || fd.get("isActive") === "true",
    sortOrder: fd.get("sortOrder")?.toString() ?? "0",
  };
}

async function adminOnly() {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) throw new ForbiddenError("Admin only");
}

export async function createBranchAction(
  _prev: BranchActionState,
  fd: FormData,
): Promise<BranchActionState> {
  await adminOnly();
  const parsed = BranchSchema.safeParse(parse(fd));
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid" };
  const d = parsed.data;
  try {
    await prisma.branch.create({
      data: {
        slug: d.slug,
        nameEn: d.nameEn,
        nameAr: d.nameAr,
        city: d.city || null,
        governorate: d.governorate || null,
        address: d.address || null,
        phone: d.phone || null,
        isActive: d.isActive,
        sortOrder: d.sortOrder,
      },
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "P2002") return { ok: false, message: `Slug '${d.slug}' is already taken.` };
    logger.error({ err }, "branch.create_failed");
    return { ok: false, message: "Create failed" };
  }
  revalidatePath("/admin/branches");
  return { ok: true };
}

export async function updateBranchAction(
  id: string,
  _prev: BranchActionState,
  fd: FormData,
): Promise<BranchActionState> {
  await adminOnly();
  const parsed = BranchSchema.safeParse(parse(fd));
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid" };
  const d = parsed.data;
  try {
    await prisma.branch.update({
      where: { id },
      data: {
        slug: d.slug,
        nameEn: d.nameEn,
        nameAr: d.nameAr,
        city: d.city || null,
        governorate: d.governorate || null,
        address: d.address || null,
        phone: d.phone || null,
        isActive: d.isActive,
        sortOrder: d.sortOrder,
      },
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "P2002") return { ok: false, message: `Slug '${d.slug}' is already taken.` };
    logger.error({ err, id }, "branch.update_failed");
    return { ok: false, message: "Update failed" };
  }
  revalidatePath("/admin/branches");
  return { ok: true };
}

export async function deleteBranchAction(id: string): Promise<BranchActionState> {
  await adminOnly();
  try {
    await prisma.branch.delete({ where: { id } });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "P2003") {
      // Referenced by leads — soft-disable instead.
      await prisma.branch.update({ where: { id }, data: { isActive: false } });
      revalidatePath("/admin/branches");
      return { ok: true };
    }
    logger.error({ err, id }, "branch.delete_failed");
    return { ok: false, message: "Delete failed" };
  }
  revalidatePath("/admin/branches");
  return { ok: true };
}
