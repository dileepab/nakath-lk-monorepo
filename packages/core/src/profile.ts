export type PhotoVisibility = "blurred" | "mutual" | "family"
export type ContactVisibility = "hidden" | "mutual" | "family-request"
export type BiodataShareMode = "pdf" | "whatsapp" | "family-review"
export type VerificationState = "not-submitted" | "submitted" | "verified"
export type Gender = "Female" | "Male" | "Other"
export type VerificationAsset = "nic" | "selfie"
export type ReminderLanguage = "en" | "si" | "ta"
export type BirthTimeAccuracy = "exact" | "approximate" | "unknown-time"
export type HoroscopeConfidence = "low" | "medium" | "high"

export interface HoroscopePlaceNormalization {
  normalizedPlaceName: string
  latitude: number | null
  longitude: number | null
  timeZone: string
}

export interface HoroscopeComputedSnapshot {
  version: string
  ayanamsa: string
  confidence: HoroscopeConfidence
  nakath: string
  pada: string
  rashi: string
  lagna: string
  moonLongitude: number | null
  place: HoroscopePlaceNormalization
  computedAt: number | null
}

export const PROFILE_DRAFT_STORAGE_KEY = "nakath-lk-profile-draft"

export interface ProfileDraft {
  basics: {
    firstName: string
    lastName: string
    gender: Gender | ""
    age: string
    heightCm: string
    profession: string
    district: string
    religion: string
    language: string
  }
  horoscope: {
    birthDate: string
    nakath: string
    lagna: string
    birthTime: string
    birthTimeAccuracy: BirthTimeAccuracy
    birthPlace: string
    normalizedBirthPlace: string
    birthLatitude: number | null
    birthLongitude: number | null
    birthTimeZone: string
  }
  horoscopeComputed: HoroscopeComputedSnapshot | null
  family: {
    education: string
    fatherOccupation: string
    motherOccupation: string
    siblings: string
    summary: string
  }
  preferences: {
    ageMin: string
    ageMax: string
    preferredDistrict: string
    religionPreference: string
    professionPreference: string
    willingToMigrate: boolean
    expectedFamilySetup: string
    spouseCareerExpectation: string
  }
  privacy: {
    photoVisibility: PhotoVisibility
    contactVisibility: ContactVisibility
    biodataShareMode: BiodataShareMode
  }
  alerts: {
    rahuKalaya: boolean
    poyaDays: boolean
    avuruduNekath: boolean
    matchActivity: boolean
    language: ReminderLanguage
  }
  verification: {
    nicStatus: VerificationState
    selfieStatus: VerificationState
    familyContactAllowed: boolean
  }
  contact: {
    personalPhone: string
    whatsappNumber: string
    familyContactName: string
    familyContactPhone: string
  }
  media: {
    profilePhotoUrl: string
    profilePhotoPath: string
    nicFrontUrl: string
    nicFrontPath: string
    nicBackUrl: string
    nicBackPath: string
    selfieUrl: string
    selfiePath: string
  }
}

export const districtOptions = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Galle",
  "Kurunegala",
  "Matara",
  "Jaffna",
]

export const genderOptions: Gender[] = ["Female", "Male", "Other"]

export const religionOptions = [
  "Buddhist",
  "Hindu",
  "Catholic",
  "Christian",
  "Islam",
  "Other",
]

export const languageOptions = ["Sinhala", "Tamil", "English"]
export const birthTimeAccuracyOptions: BirthTimeAccuracy[] = ["exact", "approximate", "unknown-time"]

export const educationOptions = [
  "A/L qualified",
  "Diploma",
  "Bachelor's degree",
  "Master's degree",
  "Doctorate",
  "Professional qualification",
]

export const professionOptions = [
  "Architect",
  "Engineer",
  "Doctor",
  "Software professional",
  "Teacher",
  "Finance professional",
  "Business owner",
  "Government service",
]

export const nakathOptions = [
  "Ashwini",
  "Bharani",
  "Karthika",
  "Rohini",
  "Muwasirasa",
  "Ada",
  "Punarvasu",
  "Pushya",
  "Aslisa",
  "Ma",
  "Puwapal",
  "Utrapal",
  "Hatha",
  "Chitra",
  "Swathi",
  "Visakha",
  "Anuradha",
  "Deta",
  "Mula",
  "Puwasala",
  "Utrasala",
  "Suwana",
  "Denata",
  "Siyawasa",
  "Puwaputup",
  "Uttraputup",
  "Revathi",
]

export const lagnaOptions = [
  "Mesha",
  "Vrushabha",
  "Mithuna",
  "Kataka",
  "Simha",
  "Kanya",
  "Thula",
  "Vrushchika",
  "Dhanu",
  "Makara",
  "Kumbha",
  "Meena",
]

export const siblingOptions = ["Only child", "1 sibling", "2 siblings", "3+ siblings"]
export const familySetupOptions = ["Joint Family", "Nuclear Family", "Flexible"]
export const spouseCareerOptions = ["Working", "Non-working", "Flexible"]

export const initialProfileDraft: ProfileDraft = {
  basics: {
    firstName: "",
    lastName: "",
    gender: "",
    age: "",
    heightCm: "",
    profession: "",
    district: "",
    religion: "",
    language: "",
  },
  horoscope: {
    birthDate: "",
    nakath: "",
    lagna: "",
    birthTime: "",
    birthTimeAccuracy: "exact",
    birthPlace: "",
    normalizedBirthPlace: "",
    birthLatitude: null,
    birthLongitude: null,
    birthTimeZone: "Asia/Colombo",
  },
  horoscopeComputed: null,
  family: {
    education: "",
    fatherOccupation: "",
    motherOccupation: "",
    siblings: "",
    summary: "",
  },
  preferences: {
    ageMin: "",
    ageMax: "",
    preferredDistrict: "",
    religionPreference: "",
    professionPreference: "",
    willingToMigrate: false,
    expectedFamilySetup: "",
    spouseCareerExpectation: "",
  },
  privacy: {
    photoVisibility: "blurred",
    contactVisibility: "mutual",
    biodataShareMode: "pdf",
  },
  alerts: {
    rahuKalaya: false,
    poyaDays: true,
    avuruduNekath: true,
    matchActivity: true,
    language: "en",
  },
  verification: {
    nicStatus: "not-submitted",
    selfieStatus: "not-submitted",
    familyContactAllowed: true,
  },
  contact: {
    personalPhone: "",
    whatsappNumber: "",
    familyContactName: "",
    familyContactPhone: "",
  },
  media: {
    profilePhotoUrl: "",
    profilePhotoPath: "",
    nicFrontUrl: "",
    nicFrontPath: "",
    nicBackUrl: "",
    nicBackPath: "",
    selfieUrl: "",
    selfiePath: "",
  },
}

export function mergeProfileDraft(candidate?: Partial<ProfileDraft> | null): ProfileDraft {
  return {
    basics: {
      ...initialProfileDraft.basics,
      ...(candidate?.basics ?? {}),
    },
    horoscope: {
      ...initialProfileDraft.horoscope,
      ...(candidate?.horoscope ?? {}),
    },
    horoscopeComputed: candidate?.horoscopeComputed
      ? {
          ...candidate.horoscopeComputed,
          place: {
            ...initialProfileDraft.horoscopeComputed?.place,
            ...(candidate.horoscopeComputed.place ?? {}),
          },
        }
      : initialProfileDraft.horoscopeComputed,
    family: {
      ...initialProfileDraft.family,
      ...(candidate?.family ?? {}),
    },
    preferences: {
      ...initialProfileDraft.preferences,
      ...(candidate?.preferences ?? {}),
    },
    privacy: {
      ...initialProfileDraft.privacy,
      ...(candidate?.privacy ?? {}),
    },
    alerts: {
      ...initialProfileDraft.alerts,
      ...(candidate?.alerts ?? {}),
    },
    verification: {
      ...initialProfileDraft.verification,
      ...(candidate?.verification ?? {}),
    },
    contact: {
      ...initialProfileDraft.contact,
      ...(candidate?.contact ?? {}),
    },
    media: {
      ...initialProfileDraft.media,
      ...(candidate?.media ?? {}),
    },
  }
}

export function getHoroscopeInputConfidence(draft: ProfileDraft): HoroscopeConfidence {
  if (draft.horoscopeComputed?.confidence) {
    return draft.horoscopeComputed.confidence
  }

  const hasBirthDate = draft.horoscope.birthDate.trim().length > 0
  const hasBirthPlace = draft.horoscope.birthPlace.trim().length > 0
  const hasBirthTime = draft.horoscope.birthTime.trim().length > 0

  if (hasBirthDate && hasBirthPlace && hasBirthTime && draft.horoscope.birthTimeAccuracy === "exact") {
    return "high"
  }

  if (
    hasBirthDate &&
    hasBirthPlace &&
    hasBirthTime
  ) {
    return "medium"
  }

  return "low"
}

export function getHoroscopeInputSummary(draft: ProfileDraft) {
  const confidence = getHoroscopeInputConfidence(draft)

  if (confidence === "high") {
    return `Birth date ${draft.horoscope.birthDate}, ${draft.horoscope.birthTime} birth time, and place details are ready for a higher-confidence Porondam pass.`
  }

  if (confidence === "medium") {
    return "There is enough horoscope detail for an early Porondam preview, but the birth inputs still need a more precise pass."
  }

  return "Birth details still need one more pass before the traditional compatibility side can be treated confidently."
}

export function parseDateInput(value: string) {
  if (!value) return null

  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return null

  const parsed = new Date(year, month - 1, day)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDateInput(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function ageFromBirthDate(value: string) {
  const birthDate = parseDateInput(value)
  if (!birthDate) return null

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())

  if (!hasHadBirthdayThisYear) age -= 1

  return age >= 0 ? String(age) : null
}

export function birthDateFromAge(ageValue: string, currentBirthDate: string) {
  const parsedAge = Number.parseInt(ageValue, 10)
  if (!Number.isFinite(parsedAge) || parsedAge < 0) return null

  const today = new Date()
  const baseDate = parseDateInput(currentBirthDate) ?? today

  for (const yearAdjustment of [0, -1, 1]) {
    const candidate = new Date(baseDate)
    candidate.setFullYear(today.getFullYear() - parsedAge + yearAdjustment)

    const formattedCandidate = formatDateInput(candidate)
    if (ageFromBirthDate(formattedCandidate) === ageValue) {
      return formattedCandidate
    }
  }

  const fallback = new Date(today)
  fallback.setFullYear(today.getFullYear() - parsedAge)
  return formatDateInput(fallback)
}

export function hasUploadedAsset(...values: string[]) {
  return values.some((value) => Boolean(value.trim()))
}

export function getVerificationStatus(draft: ProfileDraft, asset: VerificationAsset): VerificationState {
  const uploaded =
    asset === "nic"
      ? hasUploadedAsset(draft.media.nicFrontPath, draft.media.nicFrontUrl) &&
        hasUploadedAsset(draft.media.nicBackPath, draft.media.nicBackUrl)
      : hasUploadedAsset(draft.media.selfiePath, draft.media.selfieUrl)
  const stored = asset === "nic" ? draft.verification.nicStatus : draft.verification.selfieStatus

  if (!uploaded) return "not-submitted"
  if (stored === "verified") return "verified"
  return "submitted"
}

export function syncVerificationState(draft: ProfileDraft): ProfileDraft {
  return {
    ...draft,
    verification: {
      ...draft.verification,
      nicStatus: getVerificationStatus(draft, "nic"),
      selfieStatus: getVerificationStatus(draft, "selfie"),
    },
  }
}

export function isFullyVerified(draft: ProfileDraft) {
  return (
    getVerificationStatus(draft, "nic") === "verified" &&
    getVerificationStatus(draft, "selfie") === "verified"
  )
}
