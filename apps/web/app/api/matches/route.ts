import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"

import { authenticateRequest, isAuthenticatedResult } from "@/lib/api-auth"
import { getFirebaseAdminDb } from "@/lib/firebase-admin"
import { type MatchRequest } from "@acme/core"

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  try {
    const { receiverId } = await req.json()

    if (!receiverId || typeof receiverId !== "string") {
      return NextResponse.json({ error: "Missing receiverId." }, { status: 400 })
    }

    const senderId = authResult.decoded.uid
    if (receiverId === senderId) {
      return NextResponse.json({ error: "You cannot create a match request for yourself." }, { status: 400 })
    }

    const db = getFirebaseAdminDb()
    const customId = `${senderId}_${receiverId}`
    const docRef = db.collection("matches").doc(customId)
    const snapshot = await docRef.get()

    const request: MatchRequest = {
      id: customId,
      senderId,
      receiverId,
      status: snapshot.exists ? ((snapshot.data()?.status as MatchRequest["status"]) ?? "pending") : "pending",
      createdAt: snapshot.exists ? ((snapshot.data()?.createdAt as number) ?? Date.now()) : Date.now(),
      updatedAt: Date.now(),
    }

    await docRef.set(
      {
        ...request,
        updatedAt: FieldValue.serverTimestamp(),
        ...(snapshot.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    )

    return NextResponse.json({ match: request })
  } catch {
    return NextResponse.json({ error: "Could not create match request." }, { status: 500 })
  }
}
