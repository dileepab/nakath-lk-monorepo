import "server-only"

import type { DecodedIdToken } from "firebase-admin/auth"
import { NextResponse } from "next/server"

import { getFirebaseAdminAuth, getFirebaseAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase-admin"
import { type MatchRequest } from "@acme/core"

export function extractBearerToken(header: string | null) {
  if (!header?.startsWith("Bearer ")) return null
  return header.slice("Bearer ".length)
}

export async function authenticateRequest(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return {
      response: NextResponse.json({ error: "Firebase Admin SDK is not configured." }, { status: 503 }),
    }
  }

  const token = extractBearerToken(request.headers.get("authorization"))
  if (!token) {
    return {
      response: NextResponse.json({ error: "Missing bearer token." }, { status: 401 }),
    }
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token)
    return { decoded }
  } catch {
    return {
      response: NextResponse.json({ error: "Invalid auth token." }, { status: 401 }),
    }
  }
}

export async function loadAuthorizedMatch(
  matchId: string,
  uid: string,
  options?: { requireApproved?: boolean },
): Promise<{ match: MatchRequest } | { response: NextResponse }> {
  const snapshot = await getFirebaseAdminDb().collection("matches").doc(matchId).get()

  if (!snapshot.exists) {
    return { response: NextResponse.json({ error: "Match not found." }, { status: 404 }) }
  }

  const match = snapshot.data() as MatchRequest
  const isParticipant = match.senderId === uid || match.receiverId === uid

  if (!isParticipant) {
    return { response: NextResponse.json({ error: "Match access denied." }, { status: 403 }) }
  }

  if (options?.requireApproved && match.status !== "approved") {
    return { response: NextResponse.json({ error: "Match is not approved yet." }, { status: 403 }) }
  }

  return { match }
}

export function isAuthenticatedResult(
  value: { decoded: DecodedIdToken } | { response: NextResponse },
): value is { decoded: DecodedIdToken } {
  return "decoded" in value
}
