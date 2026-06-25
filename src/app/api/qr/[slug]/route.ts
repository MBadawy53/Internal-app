import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

/**
 * Renders a PNG for the public landing URL of the given campaign slug.
 * The endpoint is public — slugs are 60+ bits of entropy and the PNG only
 * encodes the same URL the campaign owner is already sharing.
 *
 * Slug arrives as e.g. "abc123.png" — we strip the .png and use the rest.
 */
export async function GET(_req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await context.params;
  const slug = raw.endsWith(".png") ? raw.slice(0, -4) : raw;
  if (!/^[a-z0-9]{4,32}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const url = `${base}/r/${slug}`;

  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 360,
    margin: 1,
    errorCorrectionLevel: "M",
  });
  // Cache for a day; the PNG is a deterministic function of the slug.
  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
