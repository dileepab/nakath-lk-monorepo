import { ageFromBirthDate, getVerificationStatus, isFullyVerified, type ProfileDraft } from "./profile"
import { evaluateHoroscopeRules } from "./horoscope-rules"

export type PorondamFactor = {
  key: "horoscope" | "age" | "values" | "location" | "trust"
  label: string
  score: number
  max: number
  note: string
}

export type PorondamPreview = {
  total: number
  max: number
  astrologicalScore: number
  astrologicalMax: number
  lifestylePercentage: number
  label: string
  summary: string
  factors: PorondamFactor[]
}

function profileAge(profile: ProfileDraft) {
  return Number.parseInt(ageFromBirthDate(profile.horoscope.birthDate) ?? profile.basics.age, 10)
}

function withinRange(age: number, min: string, max: string) {
  const minValue = Number.parseInt(min, 10)
  const maxValue = Number.parseInt(max, 10)

  if (!Number.isFinite(age) || !Number.isFinite(minValue) || !Number.isFinite(maxValue)) return false
  return age >= minValue && age <= maxValue
}

function professionMatches(preference: string, profession: string) {
  const normalizedPreference = preference.toLowerCase()
  const normalizedProfession = profession.toLowerCase()

  if (!normalizedPreference.trim()) return false
  if (
    normalizedPreference.includes("professional") &&
    ["engineer", "doctor", "architect", "teacher", "finance", "software"].some((keyword) =>
      normalizedProfession.includes(keyword),
    )
  ) {
    return true
  }

  if (normalizedPreference.includes("business") && normalizedProfession.includes("business")) {
    return true
  }

  return normalizedPreference.includes(normalizedProfession) || normalizedProfession.includes(normalizedPreference)
}

function factorLabel(total: number) {
  if (total >= 17) return "Strong preview"
  if (total >= 13) return "Promising preview"
  if (total >= 9) return "Possible fit"
  return "Early-stage fit"
}

export function calculatePorondamPreview(reference: ProfileDraft, candidate: ProfileDraft): PorondamPreview {
  const horoscopeRules = evaluateHoroscopeRules(reference, candidate)

  const candidateAge = profileAge(candidate)
  const referenceAge = profileAge(reference)
  const candidateFitsReference = withinRange(candidateAge, reference.preferences.ageMin, reference.preferences.ageMax)
  const referenceFitsCandidate = withinRange(referenceAge, candidate.preferences.ageMin, candidate.preferences.ageMax)
  const ageScore = (candidateFitsReference ? 2 : 0) + (referenceFitsCandidate ? 2 : 0)

  let valuesScore = 0
  if (
    reference.preferences.religionPreference &&
    reference.preferences.religionPreference.toLowerCase() === candidate.basics.religion.toLowerCase()
  ) {
    valuesScore += 2
  }
  if (reference.basics.language === candidate.basics.language) {
    valuesScore += 1
  }
  if (professionMatches(reference.preferences.professionPreference, candidate.basics.profession)) {
    valuesScore += 1
  }

  let locationScore = 0
  if (reference.preferences.preferredDistrict === candidate.basics.district) {
    locationScore += 2
  } else if (reference.basics.district === candidate.basics.district) {
    locationScore += 1
  }
  if (candidate.preferences.preferredDistrict === reference.basics.district) {
    locationScore += 1
  }
  if (reference.preferences.willingToMigrate === candidate.preferences.willingToMigrate) {
    locationScore += 1
  }
  locationScore = Math.min(4, locationScore)

  let trustScore = 0
  if (isFullyVerified(candidate)) {
    trustScore += 2
  } else if (
    getVerificationStatus(candidate, "nic") !== "not-submitted" &&
    getVerificationStatus(candidate, "selfie") !== "not-submitted"
  ) {
    trustScore += 1
  }
  if (candidate.privacy.photoVisibility !== "family") {
    trustScore += 1
  }
  if (reference.verification.familyContactAllowed === candidate.verification.familyContactAllowed) {
    trustScore += 1
  }
  trustScore = Math.min(3, trustScore)

  const factors: PorondamFactor[] = [
    {
      key: "horoscope",
      label: "Horoscope rules",
      score: horoscopeRules.score,
      max: 5,
      note: `${horoscopeRules.note} Confidence: ${horoscopeRules.confidence}.`,
    },
    {
      key: "age",
      label: "Age fit",
      score: ageScore,
      max: 4,
      note:
        ageScore === 4
          ? "Each profile lands inside the other's preferred age range."
          : ageScore >= 2
            ? "One side fits the stated age preference clearly, but the range is not fully mutual yet."
            : "Age preferences still need closer alignment.",
    },
    {
      key: "values",
      label: "Values and lifestyle",
      score: valuesScore,
      max: 4,
      note:
        valuesScore >= 3
          ? "Religion, language, and profession expectations are aligning well."
          : valuesScore >= 2
            ? "There is some shared ground here, but not yet a strong practical overlap."
            : "Religion, language, or profession preferences are not lining up strongly yet.",
    },
    {
      key: "location",
      label: "Location and future plans",
      score: locationScore,
      max: 4,
      note:
        locationScore >= 3
          ? "District expectations and long-term location plans look compatible."
          : locationScore >= 2
            ? "There is enough overlap to explore, but location may still need discussion."
            : "District preference and future location plans are still some distance apart.",
    },
    {
      key: "trust",
      label: "Trust readiness",
      score: trustScore,
      max: 3,
      note:
        trustScore >= 3
          ? "Verification and intro style support a calmer first conversation."
          : trustScore >= 2
            ? "Trust signals are present, but the profile is not yet at its strongest state."
            : "Verification or introduction settings still need work before this feels high-confidence.",
    },
  ]

  const total = factors.reduce((sum, factor) => sum + factor.score, 0)

  // Calculate Lifestyle Alignment
  let lifestylePoints = 0
  const lifestyleMax = 3

  if (reference.preferences.willingToMigrate === candidate.preferences.willingToMigrate) {
    lifestylePoints += 1
  }
  if (
    reference.preferences.expectedFamilySetup === candidate.preferences.expectedFamilySetup ||
    reference.preferences.expectedFamilySetup === "Flexible" ||
    candidate.preferences.expectedFamilySetup === "Flexible"
  ) {
    lifestylePoints += 1
  }
  if (
    reference.preferences.spouseCareerExpectation === candidate.preferences.spouseCareerExpectation ||
    reference.preferences.spouseCareerExpectation === "Flexible" ||
    candidate.preferences.spouseCareerExpectation === "Flexible"
  ) {
    lifestylePoints += 1
  }

  const lifestylePercentage = Math.round((lifestylePoints / lifestyleMax) * 100)

  return {
    total,
    max: 20,
    astrologicalScore: horoscopeRules.score,
    astrologicalMax: 5,
    lifestylePercentage,
    label: factorLabel(total),
    summary:
      total >= 17
        ? "A strong launch-stage match preview built from horoscope rules, preferences, and trust signals."
        : total >= 13
          ? "A promising preview with enough alignment to justify a closer look."
        : total >= 9
            ? "There is some compatibility here, but the match still needs more context."
            : "This looks early-stage and would need more alignment before moving forward.",
    factors,
  }
}
