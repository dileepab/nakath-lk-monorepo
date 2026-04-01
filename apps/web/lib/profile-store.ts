import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore"

import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase-client"
import { initialProfileDraft, mergeProfileDraft, syncVerificationState, type ProfileDraft } from "@acme/core"

type FirestoreProfileRecord = {
  displayName?: string
  gender?: string
  dob?: string
  pob?: string
  tob?: string
  isVerified?: boolean
  verificationStatus?: string
  horoscope?: {
    nakshatra?: string
    lagna?: string
  }
  preferences?: {
    minAge?: number | null
    maxAge?: number | null
    willingToMigrate?: boolean
    expectedFamilySetup?: string
    spouseCareerExpectation?: string
  }
  privacy?: {
    photoBlur?: boolean
    showContact?: boolean
  }
  media?: Partial<
    ProfileDraft["media"] & {
      nicDocumentUrl?: string
      nicDocumentPath?: string
    }
  >
  draft?: Partial<ProfileDraft>
}

type FirestorePrivateProfileRecord = {
  contact?: Partial<ProfileDraft["contact"]>
}

function numericOrNull(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function stripPrivateContact(draft: ProfileDraft): ProfileDraft {
  return {
    ...draft,
    contact: {
      ...initialProfileDraft.contact,
    },
  }
}

function toFirestoreProfileRecord(draft: ProfileDraft, isNew: boolean) {
  const syncedDraft = stripPrivateContact(syncVerificationState(draft))
  const persistedMedia = {
    profilePhotoPath: syncedDraft.media.profilePhotoPath,
    profilePhotoUrl: syncedDraft.media.profilePhotoPath ? "" : syncedDraft.media.profilePhotoUrl,
    nicFrontPath: syncedDraft.media.nicFrontPath,
    nicFrontUrl: syncedDraft.media.nicFrontPath ? "" : syncedDraft.media.nicFrontUrl,
    nicBackPath: syncedDraft.media.nicBackPath,
    nicBackUrl: syncedDraft.media.nicBackPath ? "" : syncedDraft.media.nicBackUrl,
    selfiePath: syncedDraft.media.selfiePath,
    selfieUrl: syncedDraft.media.selfiePath ? "" : syncedDraft.media.selfieUrl,
  }
  const persistedDraft = {
    ...syncedDraft,
    media: persistedMedia,
  }

  return {
    displayName: `${syncedDraft.basics.firstName} ${syncedDraft.basics.lastName}`.trim(),
    gender: syncedDraft.basics.gender.toLowerCase(),
    dob: syncedDraft.horoscope.birthDate ? `${syncedDraft.horoscope.birthDate}T00:00:00.000Z` : null,
    pob: syncedDraft.horoscope.birthPlace,
    tob: syncedDraft.horoscope.birthTime,
    isVerified:
      syncedDraft.verification.nicStatus === "verified" &&
      syncedDraft.verification.selfieStatus === "verified",
    verificationStatus: `${syncedDraft.verification.nicStatus}:${syncedDraft.verification.selfieStatus}`,
    horoscope: {
      nakshatra: syncedDraft.horoscope.nakath,
      lagna: syncedDraft.horoscope.lagna,
    },
    preferences: {
      minAge: numericOrNull(syncedDraft.preferences.ageMin),
      maxAge: numericOrNull(syncedDraft.preferences.ageMax),
      willingToMigrate: syncedDraft.preferences.willingToMigrate,
      expectedFamilySetup: syncedDraft.preferences.expectedFamilySetup,
      spouseCareerExpectation: syncedDraft.preferences.spouseCareerExpectation,
    },
    privacy: {
      photoBlur: syncedDraft.privacy.photoVisibility === "blurred",
      showContact: syncedDraft.privacy.contactVisibility !== "hidden",
    },
    media: persistedMedia,
    draft: persistedDraft,
    updatedAt: serverTimestamp(),
    ...(isNew ? { createdAt: serverTimestamp() } : {}),
  }
}

function fromFirestoreProfileRecord(record: FirestoreProfileRecord | undefined) {
  if (!record) return null

  if (record.draft) {
    return syncVerificationState(mergeProfileDraft(record.draft))
  }

  return syncVerificationState(
    mergeProfileDraft({
    basics: {
      firstName: record.displayName?.split(" ")[0] ?? "",
      lastName: record.displayName?.split(" ").slice(1).join(" ") ?? "",
      gender:
        record.gender === "male" ? "Male" : record.gender === "female" ? "Female" : record.gender === "other" ? "Other" : "",
    },
    horoscope: {
      birthDate: record.dob?.slice(0, 10) ?? "",
      birthPlace: record.pob ?? "",
      birthTime: record.tob ?? "",
      nakath: record.horoscope?.nakshatra ?? "",
      lagna: record.horoscope?.lagna ?? "",
    },
    preferences: {
      ageMin: record.preferences?.minAge ? String(record.preferences.minAge) : "",
      ageMax: record.preferences?.maxAge ? String(record.preferences.maxAge) : "",
      willingToMigrate: record.preferences?.willingToMigrate ?? false,
      expectedFamilySetup: record.preferences?.expectedFamilySetup ?? "",
      spouseCareerExpectation: record.preferences?.spouseCareerExpectation ?? "",
    },
    privacy: {
      photoVisibility: record.privacy?.photoBlur ? "blurred" : "mutual",
      contactVisibility: record.privacy?.showContact ? "mutual" : "hidden",
    },
    media: {
      profilePhotoUrl: record.media?.profilePhotoUrl ?? "",
      profilePhotoPath: record.media?.profilePhotoPath ?? "",
      nicFrontUrl: record.media?.nicFrontUrl ?? record.media?.nicDocumentUrl ?? "",
      nicFrontPath: record.media?.nicFrontPath ?? record.media?.nicDocumentPath ?? "",
      nicBackUrl: record.media?.nicBackUrl ?? "",
      nicBackPath: record.media?.nicBackPath ?? "",
      selfieUrl: record.media?.selfieUrl ?? "",
      selfiePath: record.media?.selfiePath ?? "",
    },
    } as any),
  )
}

export async function saveProfileDraftToBackend(userId: string, draft: ProfileDraft) {
  const db = getFirebaseDb()
  const existing = await getDoc(doc(collection(db, "profiles"), userId))
  const record = toFirestoreProfileRecord(draft, !existing.exists())

  await Promise.all([
    setDoc(doc(collection(db, "profiles"), userId), record, { merge: true }),
    setDoc(
      doc(collection(db, "privateProfiles"), userId),
      {
        contact: draft.contact,
        updatedAt: serverTimestamp(),
        ...(!existing.exists() ? { createdAt: serverTimestamp() } : {}),
      },
      { merge: true },
    ),
  ])
}

export async function loadPublicProfileDraftFromBackend(userId: string) {
  const db = getFirebaseDb()
  const snapshot = await getDoc(doc(collection(db, "profiles"), userId))

  if (!snapshot.exists()) return null

  return fromFirestoreProfileRecord(snapshot.data() as FirestoreProfileRecord)
}

export async function listPublicProfileDraftsFromBackend() {
  const db = getFirebaseDb()
  const snapshot = await getDocs(collection(db, "profiles"))

  return snapshot.docs
    .map((document) => {
      const draft = fromFirestoreProfileRecord(document.data() as FirestoreProfileRecord)
      if (!draft) return null

      return {
        id: document.id,
        draft,
      }
    })
    .filter((profile): profile is { id: string; draft: ProfileDraft } => Boolean(profile))
}

export async function loadOwnProfileDraftFromBackend(userId: string) {
  const db = getFirebaseDb()
  const [publicSnapshot, privateSnapshot] = await Promise.all([
    getDoc(doc(collection(db, "profiles"), userId)),
    getDoc(doc(collection(db, "privateProfiles"), userId)),
  ])

  if (!publicSnapshot.exists()) return null

  const publicDraft = fromFirestoreProfileRecord(publicSnapshot.data() as FirestoreProfileRecord)
  if (!publicDraft) return null

  const privateRecord = privateSnapshot.exists()
    ? (privateSnapshot.data() as FirestorePrivateProfileRecord)
    : null

  return mergeProfileDraft({
    ...publicDraft,
    contact: {
      ...publicDraft.contact,
      ...(privateRecord?.contact ?? {}),
    },
  })
}

export const loadProfileDraftFromBackend = loadPublicProfileDraftFromBackend

export { isFirebaseConfigured }
