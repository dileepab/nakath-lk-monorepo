export type PhotoVisibility = "blurred" | "mutual" | "family"
export type ContactVisibility = "hidden" | "mutual" | "family-request"
export type BiodataShareMode = "pdf" | "whatsapp" | "family-review"
export type VerificationState = "not-submitted" | "submitted" | "verified"
export type Gender = "Female" | "Male" | "Other"
export type VerificationAsset = "nic" | "selfie"

export const PROFILE_DRAFT_STORAGE_KEY = "nakath-lk-profile-draft"

export interface ProfileDraft {
  basics: {
    firstName: string
    lastName: string
    gender: Gender
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
    birthPlace: string
  }
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
  verification: {
    nicStatus: VerificationState
    selfieStatus: VerificationState
    familyContactAllowed: boolean
  }
  media: {
    profilePhotoUrl: string
    profilePhotoPath: string
    nicDocumentUrl: string
    nicDocumentPath: string
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
    firstName: "Nadeesha",
    lastName: "Fernando",
    gender: "Female",
    age: "29",
    heightCm: "165",
    profession: "Architect",
    district: "Colombo",
    religion: "Buddhist",
    language: "Sinhala",
  },
  horoscope: {
    birthDate: "1996-05-15",
    nakath: "Rohini",
    lagna: "Kanya",
    birthTime: "05:42",
    birthPlace: "Colombo",
  },
  family: {
    education: "Bachelor's degree",
    fatherOccupation: "Retired banker",
    motherOccupation: "Teacher",
    siblings: "1 sibling",
    summary:
      "Warm, grounded, and family-oriented. Looking for a serious introduction that can begin respectfully and move at a thoughtful pace.",
  },
  preferences: {
    ageMin: "27",
    ageMax: "33",
    preferredDistrict: "Colombo",
    religionPreference: "Buddhist",
    professionPreference: "Professional or business background",
    willingToMigrate: true,
    expectedFamilySetup: "Flexible",
    spouseCareerExpectation: "Working",
  },
  privacy: {
    photoVisibility: "blurred",
    contactVisibility: "mutual",
    biodataShareMode: "pdf",
  },
  verification: {
    nicStatus: "not-submitted",
    selfieStatus: "not-submitted",
    familyContactAllowed: true,
  },
  media: {
    profilePhotoUrl: "",
    profilePhotoPath: "",
    nicDocumentUrl: "",
    nicDocumentPath: "",
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
    verification: {
      ...initialProfileDraft.verification,
      ...(candidate?.verification ?? {}),
    },
    media: {
      ...initialProfileDraft.media,
      ...(candidate?.media ?? {}),
    },
  }
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

function hasUploadedAsset(value: string) {
  return Boolean(value.trim())
}

export function getVerificationStatus(draft: ProfileDraft, asset: VerificationAsset): VerificationState {
  const uploaded =
    asset === "nic" ? hasUploadedAsset(draft.media.nicDocumentUrl) : hasUploadedAsset(draft.media.selfieUrl)
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
