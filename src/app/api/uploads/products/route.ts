import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth/config";
import { Role } from "@prisma/client";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== Role.ADMIN && session.user.role !== Role.BUSINESS_LINE_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = EXT_BY_MIME[file.type];
  const id = randomBytes(12).toString("hex");
  const filename = `${id}.${ext}`;

  const uploadDir = path.resolve(env.UPLOAD_LOCAL_DIR, "products");
  await mkdir(uploadDir, { recursive: true });
  const fullPath = path.join(uploadDir, filename);
  await writeFile(fullPath, buffer);

  const url = `/uploads/products/${filename}`;
  logger.info({ url, size: file.size, by: session.user.id }, "upload.product_image");

  return NextResponse.json({ url });
}
