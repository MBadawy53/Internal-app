import { put } from "@vercel/blob";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadError";
  }
}

/**
 * Upload an image File (from a server-action FormData) to Vercel Blob and
 * return its public URL. Caller is responsible for catching ImageUploadError.
 *
 * Requires BLOB_READ_WRITE_TOKEN in the environment (auto-injected by Vercel
 * when Blob Storage is enabled on the project).
 */
export async function uploadImage(file: File, pathnamePrefix: string): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new ImageUploadError(
      "Image upload is not configured. Enable Vercel Blob Storage on this project.",
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new ImageUploadError("Unsupported image type. Use PNG, JPEG, WEBP, or GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new ImageUploadError("Image is larger than 5 MB.");
  }
  // Pick an extension from the MIME type so the blob URL has a sensible suffix.
  const ext = file.type.split("/")[1] ?? "bin";
  const safePrefix = pathnamePrefix.replace(/[^a-z0-9/_-]/gi, "-");
  const blob = await put(`${safePrefix}-${Date.now()}.${ext}`, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: true,
  });
  return blob.url;
}
