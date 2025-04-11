import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware can be used to validate activation links
// or add additional security measures
export function middleware(request: NextRequest) {
    const { pathname, searchParams } = new URL(request.url)

    // Only run on activation routes
    if (pathname === "/activate") {
        const client = searchParams.get("client")
        const action = searchParams.get("action")

        // Basic validation
        if (!client || !action) {
            return NextResponse.redirect(new URL("/?error=invalid_link", request.url))
        }

        // You could add additional validation here
        // For example, checking if the email exists in your database
    }

    return NextResponse.next()
}

export const config = {
    matcher: "/activate",
}

