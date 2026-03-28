import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const CANONICAL_DEV_HOST = "127.0.0.1:3000"

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.next()
  }

  const host = request.headers.get("host")
  if (!host || host === CANONICAL_DEV_HOST || !host.startsWith("localhost:")) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.host = CANONICAL_DEV_HOST
  url.protocol = "http"

  return NextResponse.redirect(url, 307)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
