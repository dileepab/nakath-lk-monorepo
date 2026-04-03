import { NextResponse } from "next/server"

import { authenticateRequest, isAuthenticatedResult } from "@/lib/api-auth"
import {
  createFamilyShareLink,
  getCurrentFamilyShareLink,
  revokeFamilyShareLinks,
} from "@/lib/family-share-links"
import { mergeProfileDraft, type ProfileDraft } from "@acme/core"

function originFromRequest(request: Request) {
  return new URL(request.url).origin
}

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  const link = await getCurrentFamilyShareLink(authResult.decoded.uid, originFromRequest(request))
  return NextResponse.json({ link })
}

export async function POST(request: Request) {
  const authResult = await authenticateRequest(request)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  const payload = (await request.json().catch(() => null)) as { draft?: Partial<ProfileDraft> } | null
  const draft = mergeProfileDraft(payload?.draft)
  const link = await createFamilyShareLink({
    ownerId: authResult.decoded.uid,
    draft,
    origin: originFromRequest(request),
  })

  return NextResponse.json({ link })
}

export async function DELETE(request: Request) {
  const authResult = await authenticateRequest(request)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  const result = await revokeFamilyShareLinks(authResult.decoded.uid)
  return NextResponse.json({
    revoked: result.revokedCount > 0,
    revokedCount: result.revokedCount,
  })
}
