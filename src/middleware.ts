import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { edgeAuthConfig } from "@/lib/auth/edge-config";

const { auth } = NextAuth(edgeAuthConfig);

const PUBLIC_PATHS = ["/login", "/onboard", "/forgot", "/api/auth", "/api/health"];
const PUBLIC_PREFIXES = ["/r/", "/invite/", "/reset/", "/lead-id/"]; // public lead capture, invite accept, password reset, national-ID upload

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(`${p}/`))) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|uploads|factoring-demo).*)"],
};
