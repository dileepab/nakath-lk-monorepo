import { collection, doc, setDoc, query, orderBy, onSnapshot } from "firebase/firestore"
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

export async function sendMessage(matchId: string, senderId: string, text: string) {
  if (!isFirebaseConfigured() || !text.trim()) return

  const db = getFirebaseDb()
  const msgRef = doc(collection(db, "matches", matchId, "messages"))
  const message: ChatMessage = {
    id: msgRef.id,
    matchId,
    senderId,
    text: text.trim(),
    createdAt: Date.now()
  }
  
  await setDoc(msgRef, message)
}
