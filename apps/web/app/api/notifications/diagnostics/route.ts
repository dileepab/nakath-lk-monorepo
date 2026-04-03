import { NextResponse } from "next/server"

import { authenticateRequest, isAuthenticatedResult } from "@/lib/api-auth"
import { getFirebaseAdminDb } from "@/lib/firebase-admin"

type FirestoreNotificationRecord = {
  fcmTokens?: string[]
}

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  const snapshot = await getFirebaseAdminDb().collection("profiles").doc(authResult.decoded.uid).get()
  const record = snapshot.exists ? (snapshot.data() as FirestoreNotificationRecord) : null
  const tokens = Array.from(new Set((record?.fcmTokens ?? []).filter(Boolean)))

  return NextResponse.json({
    tokenCount: tokens.length,
  })
}
