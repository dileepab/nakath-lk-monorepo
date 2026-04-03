import { NextResponse } from "next/server"

import { authenticateRequest, isAuthenticatedResult } from "@/lib/api-auth"
import {
  createFamilyShareLink,
  getCurrentFamilyShareLink,
  revokeFamilyShareLinks,
} from "@/lib/family-share-links"
import { getFirebaseAdminDb } from "@/lib/firebase-admin"
import { mergeProfileDraft, type ProfileDraft } from "@acme/core"

type ReminderHistoryRecord = {
  category: "rahu" | "poya" | "avurudu" | "test" | "match-request" | "match-approved" | "match-message"
  title: string
  body: string
  sentAt?: {
    toDate?: () => Date
  } | null
}

function isShareLinkRequest(request: Request) {
  return new URL(request.url).searchParams.get("resource") === "share-link"
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null
}

function originFromRequest(request: Request) {
  const configuredOrigin = process.env.APP_PUBLIC_ORIGIN?.trim().replace(/\/+$/, "")
  if (configuredOrigin) {
    return configuredOrigin
  }

  const originHeader = firstHeaderValue(request.headers.get("origin"))
  if (originHeader?.startsWith("http://") || originHeader?.startsWith("https://")) {
    return originHeader.replace(/\/+$/, "")
  }

  const forwardedHost =
    firstHeaderValue(request.headers.get("x-fh-requested-host")) ||
    firstHeaderValue(request.headers.get("x-forwarded-host")) ||
    firstHeaderValue(request.headers.get("host"))
  const forwardedProto =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ||
    firstHeaderValue(request.headers.get("x-forwarded-protocol"))

  if (forwardedHost && forwardedHost !== "0.0.0.0" && forwardedHost !== "0.0.0.0:8080") {
    const protocol =
      forwardedProto ||
      (forwardedHost.startsWith("localhost") || forwardedHost.startsWith("127.0.0.1") ? "http" : "https")

    return `${protocol}://${forwardedHost}`
  }

  return new URL(request.url).origin
}

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  if (isShareLinkRequest(request)) {
    const link = await getCurrentFamilyShareLink(authResult.decoded.uid, originFromRequest(request))
    return NextResponse.json({ link })
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("reminderDispatches")
    .where("userId", "==", authResult.decoded.uid)
    .get()

  const reminders = snapshot.docs
    .map((document) => {
      const record = document.data() as ReminderHistoryRecord
      return {
        id: document.id,
        category: record.category,
        title: record.title,
        body: record.body,
        sentAt: record.sentAt?.toDate ? record.sentAt.toDate().toISOString() : null,
      }
    })
    .sort((left, right) => {
      const leftTime = left.sentAt ? new Date(left.sentAt).getTime() : 0
      const rightTime = right.sentAt ? new Date(right.sentAt).getTime() : 0
      return rightTime - leftTime
    })
    .slice(0, 6)

  return NextResponse.json({ reminders })
}

export async function POST(request: Request) {
  const authResult = await authenticateRequest(request)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  if (!isShareLinkRequest(request)) {
    return NextResponse.json({ error: "Unsupported notifications action." }, { status: 405 })
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

  if (!isShareLinkRequest(request)) {
    return NextResponse.json({ error: "Unsupported notifications action." }, { status: 405 })
  }

  const result = await revokeFamilyShareLinks(authResult.decoded.uid)
  return NextResponse.json({
    revoked: result.revokedCount > 0,
    revokedCount: result.revokedCount,
  })
}
