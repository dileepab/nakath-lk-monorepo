import { NextResponse } from "next/server"

import { authenticateRequest, isAuthenticatedResult } from "@/lib/api-auth"
import { getFirebaseAdminDb } from "@/lib/firebase-admin"

type ReminderHistoryRecord = {
  category: "rahu" | "poya" | "avurudu" | "test" | "match-request" | "match-approved" | "match-message"
  title: string
  body: string
  sentAt?: {
    toDate?: () => Date
  } | null
}

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("reminderDispatches")
    .where("userId", "==", authResult.decoded.uid)
    .get()

  const reminders = snapshot.docs
    .map((document) => {
      const record = document.data() as ReminderHistoryRecord
      return {
        id: document.id,
        category: record.category,
        title: record.title,
        body: record.body,
        sentAt: record.sentAt?.toDate ? record.sentAt.toDate().toISOString() : null,
      }
    })
    .sort((left, right) => {
      const leftTime = left.sentAt ? new Date(left.sentAt).getTime() : 0
      const rightTime = right.sentAt ? new Date(right.sentAt).getTime() : 0
      return rightTime - leftTime
    })
    .slice(0, 6)

  return NextResponse.json({ reminders })
}
