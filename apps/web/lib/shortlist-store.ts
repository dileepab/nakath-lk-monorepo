import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"

import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase-client"

export const SHORTLIST_NOTE_TAGS = [
  "Family liked",
  "Need horoscope check",
  "Revisit later",
  "Spoken to family",
] as const

export type ShortlistNoteTag = (typeof SHORTLIST_NOTE_TAGS)[number]

export type ShortlistEntry = {
  profileId: string
  savedAt: number | null
  updatedAt: number | null
  note: string
  tags: ShortlistNoteTag[]
}

function shortlistCollection(userId: string) {
  return collection(getFirebaseDb(), "privateProfiles", userId, "shortlist")
}

function toMillis(value: unknown) {
  if (!value || typeof value !== "object") return null
  const candidate = value as { toMillis?: () => number }
  return typeof candidate.toMillis === "function" ? candidate.toMillis() : null
}

function normalizeShortlistNote(note: string) {
  return note.trim().slice(0, 320)
}

function normalizeShortlistTags(tags: string[]) {
  const allowedTags = new Set<string>(SHORTLIST_NOTE_TAGS)
  const uniqueTags = Array.from(
    new Set(tags.map((tag) => tag.trim()).filter((tag) => allowedTags.has(tag))),
  )

  return SHORTLIST_NOTE_TAGS.filter((tag) => uniqueTags.includes(tag))
}

export async function listShortlistEntries(userId: string): Promise<ShortlistEntry[]> {
  if (!isFirebaseConfigured()) return []

  const snapshot = await getDocs(shortlistCollection(userId))

  return snapshot.docs
    .map((document) => ({
      profileId: document.id,
      savedAt: toMillis(document.data().savedAt),
      updatedAt: toMillis(document.data().updatedAt),
      note: typeof document.data().note === "string" ? document.data().note : "",
      tags: Array.isArray(document.data().tags) ? normalizeShortlistTags(document.data().tags) : [],
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

export async function updateShortlistEntry(
  userId: string,
  profileId: string,
  input: { note: string; tags: string[] },
) {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")

  await setDoc(
    doc(shortlistCollection(userId), profileId),
    {
      profileId,
      note: normalizeShortlistNote(input.note),
      tags: normalizeShortlistTags(input.tags),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function removeProfileFromShortlist(userId: string, profileId: string) {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured")

  await deleteDoc(doc(shortlistCollection(userId), profileId))
}
