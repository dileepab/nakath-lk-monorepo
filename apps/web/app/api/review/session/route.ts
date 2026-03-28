import { NextResponse } from "next/server"

import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase-admin"
import { hasReviewerAccess, resolveReviewerRole } from "@/lib/reviewer-role"

function extractBearerToken(header: string | null) {
  if (!header?.startsWith("Bearer ")) return null
  return header.slice("Bearer ".length)
}

export async function GET(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({
      configured: false,
      role: "user",
      access: false,
      reason: "Firebase Admin SDK is not configured yet.",
    })
  }

  const token = extractBearerToken(request.headers.get("authorization"))
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token." }, { status: 401 })
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token)
    const role = resolveReviewerRole(decoded)

    return NextResponse.json({
      configured: true,
      role,
      access: hasReviewerAccess(role),
      email: decoded.email ?? null,
    })
  } catch {
    return NextResponse.json({ error: "Invalid auth token." }, { status: 401 })
  }
}
