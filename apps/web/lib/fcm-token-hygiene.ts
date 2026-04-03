import "server-only"

import { FieldValue } from "firebase-admin/firestore"
import type { BatchResponse, SendResponse } from "firebase-admin/messaging"

import { getFirebaseAdminDb } from "@/lib/firebase-admin"

function shouldPruneToken(response: SendResponse) {
  if (response.success || !response.error) return false

  return (
    response.error.code === "messaging/registration-token-not-registered" ||
    response.error.code === "messaging/invalid-registration-token" ||
    response.error.code === "messaging/invalid-argument"
  )
}

export function getFailedTokensToPrune(tokens: string[], result: BatchResponse) {
  return result.responses
    .map((response, index) => (shouldPruneToken(response) ? tokens[index] : null))
    .filter((token): token is string => Boolean(token))
}

export async function pruneProfileTokens(userId: string, tokens: string[]) {
  if (!tokens.length) return

  await getFirebaseAdminDb()
    .collection("profiles")
    .doc(userId)
    .set(
      {
        fcmTokens: FieldValue.arrayRemove(...tokens),
      },
      { merge: true },
    )
}
