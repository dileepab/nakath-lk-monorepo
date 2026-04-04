import { type ProfileDraft } from "@acme/core"

export type GuidedStarter = {
  id: string
  label: string
  description: string
  text: string
}

function safeFirstName(profile: ProfileDraft | null | undefined) {
  return profile?.basics.firstName?.trim() || "there"
}

function safeProfession(profile: ProfileDraft | null | undefined) {
  return profile?.basics.profession?.trim() || "your work"
}

function safeDistrict(profile: ProfileDraft | null | undefined) {
  return profile?.basics.district?.trim() || "your area"
}

export function buildGuidedStarters(profile: ProfileDraft | null | undefined): GuidedStarter[] {
  const firstName = safeFirstName(profile)
  const profession = safeProfession(profile)
  const district = safeDistrict(profile)

  return [
    {
      id: "gentle-intro",
      label: "Warm hello",
      description: "A simple respectful start that feels natural.",
      text: `Ayubowan ${firstName}, I'm glad our introduction was approved. I hope your day is going well.`,
    },
    {
      id: "shared-context",
      label: "Profile-based opener",
      description: "Uses a small detail from their profile to make the first note feel more personal.",
      text: `Ayubowan ${firstName}, I noticed you're based in ${district} and working in ${profession}. How has your week been so far?`,
    },
    {
      id: "family-paced",
      label: "Family-friendly tone",
      description: "A slower, thoughtful opening when both sides prefer a careful start.",
      text: `Ayubowan ${firstName}, thank you for accepting the introduction. I'm happy to begin this conversation in a respectful way and get to know what matters most to you and your family.`,
    },
  ]
}
