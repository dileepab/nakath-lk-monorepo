import "server-only"

import type { DecodedIdToken } from "firebase-admin/auth"

export type ReviewerRole = "user" | "reviewer" | "admin"

function parseEmailList(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  )
}

const reviewerEmails = parseEmailList(process.env.REVIEWER_EMAILS)
const adminEmails = parseEmailList(process.env.ADMIN_EMAILS)

export function resolveReviewerRole(decodedToken: DecodedIdToken): ReviewerRole {
  const claimRole = typeof decodedToken.role === "string" ? decodedToken.role : null
  if (claimRole === "admin" || claimRole === "reviewer") {
    return claimRole
  }

  const email = decodedToken.email?.toLowerCase()
  if (!email) return "user"

  if (adminEmails.has(email)) return "admin"
  if (reviewerEmails.has(email)) return "reviewer"
  return "user"
}

export function hasReviewerAccess(role: ReviewerRole) {
  return role === "reviewer" || role === "admin"
}
