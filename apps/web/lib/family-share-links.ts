import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { FieldValue, Timestamp } from "firebase-admin/firestore"

import { getFirebaseAdminDb } from "@/lib/firebase-admin"
import { initialProfileDraft, mergeProfileDraft, type BiodataShareMode, type ProfileDraft } from "@acme/core"

const FAMILY_SHARE_LINK_TTL_DAYS = 14

type FirestoreShareLinkRecord = {
  ownerId: string
  token: string
  shareMode: BiodataShareMode
  draft?: Partial<ProfileDraft>
  createdAt?: Timestamp
  updatedAt?: Timestamp
  expiresAt?: Timestamp
  revokedAt?: Timestamp | null
  viewCount?: number
  lastViewedAt?: Timestamp | null
}

export type FamilyShareLinkSummary = {
  url: string
  shareMode: BiodataShareMode
  createdAt: string | null
  expiresAt: string | null
  lastViewedAt: string | null
  viewCount: number
}

export type FamilySharePublicResult =
  | {
      status: "ready"
      draft: ProfileDraft
      shareMode: BiodataShareMode
      expiresAt: string | null
      viewCount: number
      lastViewedAt: string | null
    }
  | {
      status: "not-found" | "expired" | "revoked"
    }

function hashFamilyShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function addDays(value: Date, days: number) {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

function sanitizeDraftForFamilyShare(draft: ProfileDraft): ProfileDraft {
  return mergeProfileDraft({
    ...draft,
    contact: {
      ...initialProfileDraft.contact,
    },
    media: {
      ...initialProfileDraft.media,
    },
  })
}

function formatTimestamp(value?: Timestamp | null) {
  return value ? value.toDate().toISOString() : null
}

function isLinkExpired(record: FirestoreShareLinkRecord, now = new Date()) {
  return Boolean(record.expiresAt && record.expiresAt.toDate().getTime() <= now.getTime())
}

function isLinkActive(record: FirestoreShareLinkRecord, now = new Date()) {
  return !record.revokedAt && !isLinkExpired(record, now)
}

function summarizeLink(record: FirestoreShareLinkRecord, origin: string): FamilyShareLinkSummary {
  const shareToken = encodeURIComponent(record.token)
  return {
    url: `${origin}/biodata/document?shareToken=${shareToken}`,
    shareMode: record.shareMode,
    createdAt: formatTimestamp(record.createdAt),
    expiresAt: formatTimestamp(record.expiresAt),
    lastViewedAt: formatTimestamp(record.lastViewedAt),
    viewCount: record.viewCount ?? 0,
  }
}

async function loadOwnerShareLinks(ownerId: string) {
  const snapshot = await getFirebaseAdminDb().collection("shareLinks").where("ownerId", "==", ownerId).get()

  return snapshot.docs
    .map((document) => ({
      id: document.id,
      record: document.data() as FirestoreShareLinkRecord,
    }))
    .sort((left, right) => {
      const leftDate = left.record.createdAt?.toMillis() ?? 0
      const rightDate = right.record.createdAt?.toMillis() ?? 0
      return rightDate - leftDate
    })
}

async function revokeActiveLinks(ownerId: string) {
  const db = getFirebaseAdminDb()
  const links = await loadOwnerShareLinks(ownerId)
  const activeLinks = links.filter(({ record }) => isLinkActive(record))
  const now = Timestamp.fromDate(new Date())

  if (!activeLinks.length) return 0

  const batch = db.batch()
  activeLinks.forEach(({ id }) => {
    batch.set(
      db.collection("shareLinks").doc(id),
      {
        revokedAt: now,
        updatedAt: now,
      },
      { merge: true },
    )
  })

  await batch.commit()
  return activeLinks.length
}

export async function getCurrentFamilyShareLink(ownerId: string, origin: string) {
  const links = await loadOwnerShareLinks(ownerId)
  const active = links.find(({ record }) => isLinkActive(record))

  return active ? summarizeLink(active.record, origin) : null
}

export async function createFamilyShareLink({
  ownerId,
  draft,
  origin,
}: {
  ownerId: string
  draft: ProfileDraft
  origin: string
}) {
  const db = getFirebaseAdminDb()

  await revokeActiveLinks(ownerId)

  const token = randomBytes(18).toString("base64url")
  const tokenHash = hashFamilyShareToken(token)
  const now = Timestamp.fromDate(new Date())
  const expiresAt = Timestamp.fromDate(addDays(new Date(), FAMILY_SHARE_LINK_TTL_DAYS))
  const sanitizedDraft = sanitizeDraftForFamilyShare(draft)

  await db.collection("shareLinks").doc(tokenHash).set({
    ownerId,
    token,
    shareMode: sanitizedDraft.privacy.biodataShareMode,
    draft: sanitizedDraft,
    createdAt: now,
    updatedAt: now,
    expiresAt,
    revokedAt: null,
    viewCount: 0,
    lastViewedAt: null,
  })

  const created = await db.collection("shareLinks").doc(tokenHash).get()
  return summarizeLink(created.data() as FirestoreShareLinkRecord, origin)
}

export async function revokeFamilyShareLinks(ownerId: string) {
  const revokedCount = await revokeActiveLinks(ownerId)
  return { revokedCount }
}

export async function loadPublicFamilyShare(token: string): Promise<FamilySharePublicResult> {
  const db = getFirebaseAdminDb()
  const snapshot = await db.collection("shareLinks").doc(hashFamilyShareToken(token)).get()

  if (!snapshot.exists) {
    return { status: "not-found" }
  }

  const record = snapshot.data() as FirestoreShareLinkRecord

  if (record.revokedAt) {
    return { status: "revoked" }
  }

  if (isLinkExpired(record)) {
    return { status: "expired" }
  }

  const now = Timestamp.fromDate(new Date())

  await snapshot.ref.set(
    {
      viewCount: FieldValue.increment(1),
      lastViewedAt: now,
      updatedAt: now,
    },
    { merge: true },
  )

  return {
    status: "ready",
    draft: mergeProfileDraft(record.draft),
    shareMode: record.shareMode,
    expiresAt: formatTimestamp(record.expiresAt),
    viewCount: (record.viewCount ?? 0) + 1,
    lastViewedAt: formatTimestamp(record.lastViewedAt),
  }
}
