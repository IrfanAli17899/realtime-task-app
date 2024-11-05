import { NextResponse } from "next/server"
import { session } from "./libs"

export const middleware = session((request) => {
    if (!request.auth && request.nextUrl.pathname !== '/login') {
        return NextResponse.redirect(new URL('/login', request.nextUrl))
    } else if (request.auth && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.nextUrl))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images).*)',
    ],
}