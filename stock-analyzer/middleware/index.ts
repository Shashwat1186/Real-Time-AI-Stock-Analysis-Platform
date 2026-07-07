import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);
    const url = new URL(request.url);
    const isAuthPage = url.pathname === "/sign-in" || url.pathname === "/sign-up";

    if (sessionCookie && isAuthPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (!sessionCookie && !isAuthPage) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
    ],
};