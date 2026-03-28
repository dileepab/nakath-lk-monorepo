import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"

import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase-client"
import { mergeProfileDraft, syncVerificationState, type ProfileDraft } from "@acme/core"

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
  media?: Partial<ProfileDraft["media"]>
  draft?: Partial<ProfileDraft>
}

function numericOrNull(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function toFirestoreProfileRecord(draft: ProfileDraft, isNew: boolean) {
  const syncedDraft = syncVerificationState(draft)

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
    media: syncedDraft.media,
    draft: syncedDraft,
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
        record.gender === "male" ? "Male" : record.gender === "other" ? "Other" : "Female",
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
      nicDocumentUrl: record.media?.nicDocumentUrl ?? "",
      nicDocumentPath: record.media?.nicDocumentPath ?? "",
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

  await setDoc(doc(collection(db, "profiles"), userId), record, { merge: true })
}

export async function loadProfileDraftFromBackend(userId: string) {
  const db = getFirebaseDb()
  const snapshot = await getDoc(doc(collection(db, "profiles"), userId))

  if (!snapshot.exists()) return null

  return fromFirestoreProfileRecord(snapshot.data() as FirestoreProfileRecord)
}

export { isFirebaseConfigured }
