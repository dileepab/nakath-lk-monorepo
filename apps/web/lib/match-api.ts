import { collection, doc, setDoc, getDocs, query, where, updateDoc } from "firebase/firestore"
import { getFirebaseDb, isFirebaseConfigured } from "./firebase-client"
import { type MatchRequest, type MatchStatus } from "@acme/core"

export async function sendMatchRequest(senderId: string, receiverId: string): Promise<MatchRequest> {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")
  
  const db = getFirebaseDb()
  const customId = `${senderId}_${receiverId}`
  const docRef = doc(collection(db, "matches"), customId)
  
  const request: MatchRequest = {
    id: customId,
    senderId,
    receiverId,
    status: "pending",
    createdAt: Date.now(),
  }

  await setDoc(docRef, request, { merge: true })
  return request
}

export async function updateMatchStatus(matchId: string, newStatus: MatchStatus): Promise<void> {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")
  
  const db = getFirebaseDb()
  const docRef = doc(db, "matches", matchId)
  
  await updateDoc(docRef, {
    status: newStatus,
    updatedAt: Date.now()
  })
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
