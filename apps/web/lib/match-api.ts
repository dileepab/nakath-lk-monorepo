import { collection, getDocs, query, where } from "firebase/firestore"
import { getFirebaseDb, isFirebaseConfigured } from "./firebase-client"
import { type MatchRequest, type MatchStatus } from "@acme/core"

export async function sendMatchRequest(idToken: string, receiverId: string): Promise<MatchRequest> {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")

  const response = await fetch("/api/matches", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ receiverId }),
  })

  if (!response.ok) {
    throw new Error("Could not send match request.")
  }

  const payload = (await response.json()) as { match: MatchRequest }
  return payload.match
}

export async function updateMatchStatus(idToken: string, matchId: string, newStatus: MatchStatus): Promise<void> {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")

  const response = await fetch(`/api/matches/${matchId}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ newStatus }),
  })

  if (!response.ok) {
    throw new Error("Could not update match status.")
  }
}

export async function getReceivedMatches(userId: string): Promise<MatchRequest[]> {
  if (!isFirebaseConfigured()) return []
  
  const db = getFirebaseDb()
  const q = query(
    collection(db, "matches"), 
    where("receiverId", "==", userId)
  )
  
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => doc.data() as MatchRequest)
}

export async function getSentMatches(userId: string): Promise<MatchRequest[]> {
  if (!isFirebaseConfigured()) return []
  
  const db = getFirebaseDb()
  const q = query(
    collection(db, "matches"), 
    where("senderId", "==", userId)
  )
  
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => doc.data() as MatchRequest)
}
