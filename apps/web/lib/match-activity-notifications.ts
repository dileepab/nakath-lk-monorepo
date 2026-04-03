import "server-only"

import { FieldValue } from "firebase-admin/firestore"

import { getFailedTokensToPrune, pruneProfileTokens } from "@/lib/fcm-token-hygiene"
import { getFirebaseAdminDb, getFirebaseAdminMessaging } from "@/lib/firebase-admin"
import { buildMatchNotificationCopy, getReminderLanguage } from "@/lib/notification-copy"
import { mergeProfileDraft, type MatchStatus, type ProfileDraft } from "@acme/core"

type MatchActivityType = "request-received" | "request-approved" | "message-received"

type ProfileNotificationRecord = {
  draft?: Partial<ProfileDraft>
  fcmTokens?: string[]
}

type MatchActivityPayload = {
  type: MatchActivityType
  actorUserId: string
  recipientUserId: string
  matchId: string
  actorDraft?: ProfileDraft | null
  messageText?: string
}

function getActorName(draft?: ProfileDraft | null) {
  const fullName = `${draft?.basics.firstName ?? ""} ${draft?.basics.lastName ?? ""}`.trim()
  return fullName || draft?.basics.firstName?.trim() || "Someone"
}

function truncateMessage(text: string) {
  return text.length > 88 ? `${text.slice(0, 85).trimEnd()}...` : text
}

function buildNotificationContent(payload: MatchActivityPayload, actorName: string, recipientDraft: ProfileDraft) {
  const copy = buildMatchNotificationCopy({
    language: getReminderLanguage(recipientDraft),
    actorName,
    type: payload.type,
    messageText: payload.messageText ? truncateMessage(payload.messageText) : undefined,
  })

  switch (payload.type) {
    case "request-received":
      return {
        title: copy.title,
        body: copy.body,
        link: "/dashboard",
        category: "match-request" as const,
      }
    case "request-approved":
      return {
        title: copy.title,
        body: copy.body,
        link: `/messages?matchId=${payload.matchId}`,
        category: "match-approved" as const,
      }
    case "message-received":
      return {
        title: copy.title,
        body: copy.body,
        link: `/messages?matchId=${payload.matchId}`,
        category: "match-message" as const,
      }
  }
}

export async function notifyMatchActivity(payload: MatchActivityPayload) {
  const db = getFirebaseAdminDb()
  const recipientSnapshot = await db.collection("profiles").doc(payload.recipientUserId).get()

  if (!recipientSnapshot.exists) {
    return { skipped: "recipient-missing" as const }
  }

  const recipientRecord = recipientSnapshot.data() as ProfileNotificationRecord
  const recipientDraft = mergeProfileDraft(recipientRecord.draft)
  const tokens = Array.from(new Set((recipientRecord.fcmTokens ?? []).filter(Boolean)))

  if (!recipientDraft.alerts.matchActivity) {
    return { skipped: "match-alerts-disabled" as const }
  }

  if (!tokens.length) {
    return { skipped: "no-tokens" as const }
  }

  let actorDraft = payload.actorDraft ?? null
  if (!actorDraft) {
    const actorSnapshot = await db.collection("profiles").doc(payload.actorUserId).get()
    if (actorSnapshot.exists) {
      const actorRecord = actorSnapshot.data() as ProfileNotificationRecord
      actorDraft = mergeProfileDraft(actorRecord.draft)
    }
  }

  const actorName = getActorName(actorDraft)
  const content = buildNotificationContent(payload, actorName, recipientDraft)
  const result = await getFirebaseAdminMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: content.title,
      body: content.body,
    },
    data: {
      type: "match-activity",
      category: content.category,
      matchId: payload.matchId,
      actorUserId: payload.actorUserId,
    },
    webpush: {
      fcmOptions: {
        link: content.link,
      },
    },
  })

  const prunedTokens = getFailedTokensToPrune(tokens, result)
  if (prunedTokens.length) {
    await pruneProfileTokens(payload.recipientUserId, prunedTokens)
  }

  const successCount = result.responses.filter((response) => response.success).length
  if (successCount > 0) {
    await db.collection("reminderDispatches").add({
      userId: payload.recipientUserId,
      category: content.category,
      title: content.title,
      body: content.body,
      sentAt: FieldValue.serverTimestamp(),
      matchId: payload.matchId,
      actorUserId: payload.actorUserId,
      source: "match-activity",
    })
  }

  return {
    sent: successCount,
    failed: result.responses.length - successCount,
    pruned: prunedTokens.length,
  }
}

export function shouldNotifyOnStatusChange(status: MatchStatus) {
  return status === "approved"
}
