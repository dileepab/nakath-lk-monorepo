import { NextResponse } from "next/server"

import { getFirebaseAdminAuth, getFirebaseAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase-admin"
import { reviewQueueItemFromDoc } from "@/lib/review-api"
import { hasReviewerAccess, resolveReviewerRole } from "@/lib/reviewer-role"

function extractBearerToken(header: string | null) {
  if (!header?.startsWith("Bearer ")) return null
  return header.slice("Bearer ".length)
}

export async function GET(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: "Firebase Admin SDK is not configured." }, { status: 503 })
  }

  const token = extractBearerToken(request.headers.get("authorization"))
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token." }, { status: 401 })
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token)
    const role = resolveReviewerRole(decoded)

    if (!hasReviewerAccess(role)) {
      return NextResponse.json({ error: "Reviewer access required." }, { status: 403 })
    }

    const snapshot = await getFirebaseAdminDb()
      .collection("profiles")
      .orderBy("updatedAt", "desc")
      .limit(30)
      .get()

    const profiles = snapshot.docs.map((doc) => reviewQueueItemFromDoc(doc.id, doc.data()))

    return NextResponse.json({ role, profiles })
  } catch {
    return NextResponse.json({ error: "Could not load review queue." }, { status: 500 })
  }
}
