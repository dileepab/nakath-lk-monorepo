import { ageFromBirthDate, type BiodataShareMode, type ProfileDraft } from "@acme/core"

function modeIntro(mode: BiodataShareMode) {
  if (mode === "family-review") {
    return "Sharing this Nakath.lk biodata for a family-first review before moving further."
  }

  if (mode === "whatsapp") {
    return "Sharing this Nakath.lk biodata in a WhatsApp-friendly format for a quick, respectful review."
  }

  return "Sharing this Nakath.lk biodata in a polished format for a thoughtful introduction."
}

function privacyNote(draft: ProfileDraft) {
  if (draft.privacy.contactVisibility === "family-request") {
    return "Direct personal contact is still held back. Family coordination is preferred after approval."
  }

  if (draft.privacy.contactVisibility === "hidden") {
    return "Contact details stay inside the app until the right stage."
  }

  return "Contact details unlock only after the introduction reaches the approved stage."
}

function safeValue(value: string, fallback: string) {
  return value.trim() || fallback
}

export function buildBiodataShareTitle(draft: ProfileDraft) {
  const displayName = `${draft.basics.firstName} ${draft.basics.lastName}`.trim()
  return displayName || "Nakath.lk biodata"
}

export function buildBiodataShareText(draft: ProfileDraft) {
  const age = ageFromBirthDate(draft.horoscope.birthDate) ?? draft.basics.age
  const name = buildBiodataShareTitle(draft)

  return [
    modeIntro(draft.privacy.biodataShareMode),
    "",
    `Name: ${name}`,
    `Age: ${safeValue(age, "Not shared yet")}`,
    `Profession: ${safeValue(draft.basics.profession, "To be updated")}`,
    `District: ${safeValue(draft.basics.district, "To be updated")}`,
    `Religion / Language: ${safeValue(draft.basics.religion, "To be updated")} / ${safeValue(draft.basics.language, "To be updated")}`,
    `Summary: ${safeValue(draft.family.summary, "A fuller biodata summary will be shared once it is complete.")}`,
    "",
    `Privacy note: ${privacyNote(draft)}`,
    "Shared through Nakath.lk",
  ].join("\n")
}
