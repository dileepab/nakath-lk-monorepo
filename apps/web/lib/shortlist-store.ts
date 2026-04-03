import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"

import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase-client"

export type ShortlistEntry = {
  profileId: string
  savedAt: number | null
}

function shortlistCollection(userId: string) {
  return collection(getFirebaseDb(), "privateProfiles", userId, "shortlist")
}

function toMillis(value: unknown) {
  if (!value || typeof value !== "object") return null
  const candidate = value as { toMillis?: () => number }
  return typeof candidate.toMillis === "function" ? candidate.toMillis() : null
}

export async function listShortlistEntries(userId: string): Promise<ShortlistEntry[]> {
  if (!isFirebaseConfigured()) return []

  const snapshot = await getDocs(shortlistCollection(userId))

  return snapshot.docs
    .map((document) => ({
      profileId: document.id,
      savedAt: toMillis(document.data().savedAt),
    }))
    .sort((left, right) => (right.savedAt ?? 0) - (left.savedAt ?? 0))
}

export async function saveProfileToShortlist(userId: string, profileId: string) {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")

  await setDoc(
    doc(shortlistCollection(userId), profileId),
    {
      profileId,
      savedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function removeProfileFromShortlist(userId: string, profileId: string) {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")

  await deleteDoc(doc(shortlistCollection(userId), profileId))
}
