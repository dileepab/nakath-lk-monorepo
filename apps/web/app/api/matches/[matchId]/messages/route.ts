import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"

import { authenticateRequest, isAuthenticatedResult, loadAuthorizedMatch } from "@/lib/api-auth"
import { getFirebaseAdminDb } from "@/lib/firebase-admin"
import { type ChatMessage } from "@acme/core"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> },
) {
  const authResult = await authenticateRequest(req)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  try {
    const { text } = (await req.json()) as { text?: string }
    const { matchId } = await context.params

    if (!text?.trim()) {
      return NextResponse.json({ error: "Message text is required." }, { status: 400 })
    }

    const matchResult = await loadAuthorizedMatch(matchId, authResult.decoded.uid, {
      requireApproved: true,
    })
    if ("response" in matchResult) {
      return matchResult.response
    }

    const db = getFirebaseAdminDb()
    const msgRef = db.collection("matches").doc(matchId).collection("messages").doc()
    const message: ChatMessage = {
      id: msgRef.id,
      matchId,
      senderId: authResult.decoded.uid,
      text: text.trim(),
      createdAt: Date.now(),
    }

    await msgRef.set({
      ...message,
      createdAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ message })
  } catch {
    return NextResponse.json({ error: "Could not send message." }, { status: 500 })
  }
}
