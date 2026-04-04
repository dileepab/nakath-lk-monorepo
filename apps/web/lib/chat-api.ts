import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore"
import { getFirebaseDb, isFirebaseConfigured } from "./firebase-client"
import { type ChatMessage, type MatchRequest } from "@acme/core"

export function subscribeToMessages(matchId: string, callback: (messages: ChatMessage[]) => void) {
  if (!isFirebaseConfigured()) return () => {}

  const db = getFirebaseDb()
  const q = query(
    collection(db, "matches", matchId, "messages"),
    orderBy("createdAt", "asc")
  )

  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(doc => doc.data() as ChatMessage)
    callback(msgs)
  })
}

export function subscribeToMatch(matchId: string, callback: (match: MatchRequest | null) => void) {
  if (!isFirebaseConfigured()) return () => {}

  return onSnapshot(doc(getFirebaseDb(), "matches", matchId), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as MatchRequest) : null)
  })
}

export async function sendMessage(idToken: string, matchId: string, text: string) {
  if (!isFirebaseConfigured() || !text.trim()) return

  const response = await fetch(`/api/matches/${matchId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      text: text.trim(),
    }),
  })

  if (!response.ok) {
    throw new Error("Could not send message.")
  }
}

export async function markMatchRead(idToken: string, matchId: string, lastReadAt: number) {
  if (!isFirebaseConfigured()) return

  const response = await fetch(`/api/matches/${matchId}/read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ lastReadAt }),
  })

  if (!response.ok) {
    throw new Error("Could not update read status.")
  }
}
