import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"

import { getFirebaseAdminAuth, getFirebaseAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase-admin"
import { applyVerificationDecision, reviewQueueItemFromDoc } from "@/lib/review-api"
import { hasReviewerAccess, resolveReviewerRole } from "@/lib/reviewer-role"
import { type VerificationState } from "@acme/core"

function extractBearerToken(header: string | null) {
  if (!header?.startsWith("Bearer ")) return null
  return header.slice("Bearer ".length)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
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

    const body = (await request.json()) as {
      nicStatus?: VerificationState
      selfieStatus?: VerificationState
    }

    const { userId } = await context.params
    const docRef = getFirebaseAdminDb().collection("profiles").doc(userId)
    const snapshot = await docRef.get()

    if (!snapshot.exists) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 })
    }

    const current = reviewQueueItemFromDoc(snapshot.id, snapshot.data() ?? {})
    const nextDraft = applyVerificationDecision(current.draft, {
      nicStatus: body.nicStatus,
      selfieStatus: body.selfieStatus,
    })

    await docRef.set(
      {
        displayName: `${nextDraft.basics.firstName} ${nextDraft.basics.lastName}`.trim(),
        verificationStatus: `${nextDraft.verification.nicStatus}:${nextDraft.verification.selfieStatus}`,
        isVerified:
          nextDraft.verification.nicStatus === "verified" &&
          nextDraft.verification.selfieStatus === "verified",
        draft: nextDraft,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    return NextResponse.json({
      role,
      profile: {
        ...current,
        displayName: `${nextDraft.basics.firstName} ${nextDraft.basics.lastName}`.trim(),
        verificationStatus: `${nextDraft.verification.nicStatus}:${nextDraft.verification.selfieStatus}`,
        draft: nextDraft,
      },
    })
  } catch {
    return NextResponse.json({ error: "Could not update verification state." }, { status: 500 })
  }
}
