import { NextRequest, NextResponse } from "next/server"

import { authenticateRequest, isAuthenticatedResult } from "@/lib/api-auth"
import { getFirebaseAdminStorage } from "@/lib/firebase-admin"
import { hasReviewerAccess, resolveReviewerRole } from "@/lib/reviewer-role"

function resolvePathOwner(path: string) {
  const [root, userId] = path.split("/")
  if (root !== "profiles" || !userId) return null
  return userId
}

export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  const path = req.nextUrl.searchParams.get("path")?.trim() ?? ""
  if (!path) {
    return NextResponse.json({ error: "Missing media path." }, { status: 400 })
  }

  const ownerId = resolvePathOwner(path)
  if (!ownerId) {
    return NextResponse.json({ error: "Unsupported media path." }, { status: 400 })
  }

  const role = resolveReviewerRole(authResult.decoded)
  const isOwner = authResult.decoded.uid === ownerId
  const canReview = hasReviewerAccess(role)

  if (!isOwner && !canReview) {
    return NextResponse.json({ error: "Media access denied." }, { status: 403 })
  }

  try {
    const file = getFirebaseAdminStorage().bucket().file(path)
    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json({ error: "Media file not found." }, { status: 404 })
    }

    const [metadata] = await file.getMetadata()
    const [buffer] = await file.download()

    return new NextResponse(buffer, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `inline; filename="${metadata.name?.split("/").pop() ?? "media-file"}"`,
        "Content-Type": metadata.contentType ?? "application/octet-stream",
      },
    })
  } catch {
    return NextResponse.json({ error: "Could not load media file." }, { status: 500 })
  }
}
