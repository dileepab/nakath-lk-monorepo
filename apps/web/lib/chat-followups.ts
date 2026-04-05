import { type ChatMessage, type ProfileDraft } from "@acme/core"

export type GuidedFollowUp = {
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

export function shouldShowGuidedFollowUps(messages: ChatMessage[], currentUserId: string) {
  if (messages.length === 0 || messages.length > 8) return false
  return messages.some((message) => message.senderId !== currentUserId)
}

export function buildGuidedFollowUps(
  profile: ProfileDraft | null | undefined,
  messages: ChatMessage[],
  currentUserId: string,
): GuidedFollowUp[] {
  if (!shouldShowGuidedFollowUps(messages, currentUserId)) {
    return []
  }

  const firstName = safeFirstName(profile)
  const profession = safeProfession(profile)
  const district = safeDistrict(profile)
  const latestIncoming = [...messages].reverse().find((message) => message.senderId !== currentUserId)
  const latestIncomingText = latestIncoming?.text?.trim()
  const referencedReply =
    latestIncomingText && latestIncomingText.length <= 90 ? `"${latestIncomingText}"` : "what you shared"

  return [
    {
      id: "deepen-reply",
      label: "Go a little deeper",
      description: "Build gently on their last reply without sounding too formal.",
      text: `Thanks for sharing ${referencedReply}. I'd love to hear a little more about what matters most to you at this stage in life.`,
    },
    {
      id: "daily-rhythm",
      label: "Ask about day-to-day life",
      description: "A calm follow-up that keeps the conversation grounded and natural.",
      text: `It's nice hearing from you, ${firstName}. Between your work in ${profession} and life around ${district}, what does a comfortable week usually look like for you?`,
    },
    {
      id: "family-comfort",
      label: "Bring in family context",
      description: "Helpful when both sides prefer a thoughtful, family-aware pace.",
      text: `Thank you for the thoughtful reply, ${firstName}. As we continue, I'd be happy to hear what kind of family rhythm and future home environment would feel most comfortable for you.`,
    },
  ]
}
