import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

const publicRoutes = ["/login"];

export default auth((request: NextRequest & { auth: unknown }) => {
  const { nextUrl } = request;
  const isLoggedIn = Boolean(request.auth);
  const isPublicRoute = publicRoutes.some((route) => nextUrl.pathname.startsWith(route));

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
