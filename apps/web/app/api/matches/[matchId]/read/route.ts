import { NextRequest, NextResponse } from "next/server"

import { authenticateRequest, isAuthenticatedResult, loadAuthorizedMatch } from "@/lib/api-auth"
import { getFirebaseAdminDb } from "@/lib/firebase-admin"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> },
) {
  const authResult = await authenticateRequest(req)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  try {
    const { lastReadAt } = (await req.json()) as { lastReadAt?: number }
    const { matchId } = await context.params

    if (!lastReadAt || !Number.isFinite(lastReadAt)) {
      return NextResponse.json({ error: "A valid lastReadAt value is required." }, { status: 400 })
    }

    const matchResult = await loadAuthorizedMatch(matchId, authResult.decoded.uid, {
      requireApproved: true,
    })
    if ("response" in matchResult) {
      return matchResult.response
    }

    const currentState = matchResult.match.readStates?.[authResult.decoded.uid]
    const nextReadAt = Math.max(currentState?.lastReadAt ?? 0, lastReadAt)
    const seenAt = Date.now()

    await getFirebaseAdminDb().collection("matches").doc(matchId).set(
      {
        updatedAt: seenAt,
        [`readStates.${authResult.decoded.uid}.lastReadAt`]: nextReadAt,
        [`readStates.${authResult.decoded.uid}.seenAt`]: seenAt,
      },
      { merge: true },
    )

    return NextResponse.json({
      ok: true,
      readState: {
        lastReadAt: nextReadAt,
        seenAt,
      },
    })
  } catch {
    return NextResponse.json({ error: "Could not update read status." }, { status: 500 })
  }
}
