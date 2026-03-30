import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"

import { authenticateRequest, isAuthenticatedResult, loadAuthorizedMatch } from "@/lib/api-auth"
import { getFirebaseAdminDb } from "@/lib/firebase-admin"
import { type MatchStatus } from "@acme/core"

const ALLOWED_STATUSES: MatchStatus[] = ["approved", "rejected", "withdrawn"]

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> },
) {
  const authResult = await authenticateRequest(req)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  try {
    const { newStatus } = (await req.json()) as { newStatus?: MatchStatus }
    const { matchId } = await context.params

    if (!newStatus || !ALLOWED_STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: "Unsupported match status." }, { status: 400 })
    }

    const matchResult = await loadAuthorizedMatch(matchId, authResult.decoded.uid)
    if ("response" in matchResult) {
      return matchResult.response
    }

    const match = matchResult.match
    const actorId = authResult.decoded.uid

    if (newStatus === "withdrawn") {
      if (match.senderId !== actorId) {
        return NextResponse.json({ error: "Only the sender can withdraw this request." }, { status: 403 })
      }
    } else if (match.receiverId !== actorId) {
      return NextResponse.json({ error: "Only the receiver can approve or reject this request." }, { status: 403 })
    }

    await getFirebaseAdminDb().collection("matches").doc(matchId).set(
      {
        status: newStatus,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    return NextResponse.json({
      match: {
        ...match,
        status: newStatus,
        updatedAt: Date.now(),
      },
    })
  } catch {
    return NextResponse.json({ error: "Could not update match status." }, { status: 500 })
  }
}
