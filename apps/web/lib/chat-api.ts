import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { getFirebaseDb, isFirebaseConfigured } from "./firebase-client"
import { type ChatMessage } from "@acme/core"

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
