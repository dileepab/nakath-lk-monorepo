import { ageFromBirthDate, type ProfileDraft } from "@acme/core"

export function getProfileDisplayName(draft: ProfileDraft | null, fallback = "New introduction") {
  if (!draft) return fallback

  const fullName = `${draft.basics.firstName} ${draft.basics.lastName}`.trim()
  return fullName || fallback
}

export function getProfileSummaryLine(draft: ProfileDraft | null, fallback = "Profile shared") {
  if (!draft) return fallback

  const age = ageFromBirthDate(draft.horoscope.birthDate) ?? draft.basics.age
  const summary = [age ? `${age} years` : "", draft.basics.profession, draft.basics.district]
    .filter(Boolean)
    .join(" • ")

  return summary || fallback
}
