import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"

import { authenticateRequest, isAuthenticatedResult } from "@/lib/api-auth"
import { getFailedTokensToPrune, pruneProfileTokens } from "@/lib/fcm-token-hygiene"
import { getFirebaseAdminDb, getFirebaseAdminMessaging } from "@/lib/firebase-admin"
import { buildTestNotificationCopy } from "@/lib/notification-copy"
import { hasReviewerAccess, resolveReviewerRole } from "@/lib/reviewer-role"
import { mergeProfileDraft, type ProfileDraft } from "@acme/core"

type FirestoreReminderRecord = {
  draft?: Partial<ProfileDraft>
  fcmTokens?: string[]
}

export async function POST(request: Request) {
  const authResult = await authenticateRequest(request)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  const role = resolveReviewerRole(authResult.decoded)
  if (!hasReviewerAccess(role)) {
    return NextResponse.json({ error: "Reviewer access required." }, { status: 403 })
  }

  const db = getFirebaseAdminDb()
  const profileSnapshot = await db.collection("profiles").doc(authResult.decoded.uid).get()

  if (!profileSnapshot.exists) {
    return NextResponse.json({ error: "No saved profile found for this reviewer account." }, { status: 404 })
  }

  const profileRecord = profileSnapshot.data() as FirestoreReminderRecord
  const tokens = Array.from(new Set((profileRecord.fcmTokens ?? []).filter(Boolean)))

  if (!tokens.length) {
    return NextResponse.json(
      {
        error: "No push token found for this account. Enable browser notifications on the dashboard first.",
      },
      { status: 409 },
    )
  }

  const draft = mergeProfileDraft(profileRecord.draft)
  const copy = buildTestNotificationCopy(draft)

  const response = await getFirebaseAdminMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: copy.title,
      body: copy.body,
    },
    data: {
      type: "test-reminder",
      source: "review-workspace",
    },
    webpush: {
      fcmOptions: {
        link: "/dashboard",
      },
    },
  })

  const successCount = response.responses.filter((item) => item.success).length
  const failureCount = response.responses.length - successCount
  const prunedTokens = getFailedTokensToPrune(tokens, response)

  if (prunedTokens.length) {
    await pruneProfileTokens(authResult.decoded.uid, prunedTokens)
  }

  if (successCount > 0) {
    await db.collection("reminderDispatches").add({
      userId: authResult.decoded.uid,
      category: "test",
      title: copy.title,
      body: copy.body,
      sentAt: FieldValue.serverTimestamp(),
      source: "review-workspace",
    })
  }

  return NextResponse.json({
    sent: successCount > 0,
    tokens: tokens.length,
    successCount,
    failureCount,
    prunedTokens: prunedTokens.length,
  })
}
