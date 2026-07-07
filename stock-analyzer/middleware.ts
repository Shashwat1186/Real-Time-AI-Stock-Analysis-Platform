import { NextRequest, NextResponse } from "next/server";
export async function middleware(request: NextRequest) {
    // Manually read the session cookie to avoid importing better-auth Node.js dependencies into Edge Middleware
    const sessionCookie = request.cookies.get("better-auth.session_token") || request.cookies.get("__Secure-better-auth.session_token");
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
