import { NextResponse } from "next/server"

import { authenticateRequest, isAuthenticatedResult } from "@/lib/api-auth"
import { dispatchAuspiciousReminders } from "@/lib/reminder-dispatch"
import { hasReviewerAccess, resolveReviewerRole } from "@/lib/reviewer-role"

function hasReminderSecret(request: Request) {
  const expected = process.env.REMINDER_DISPATCH_SECRET
  if (!expected) return false

  const provided = request.headers.get("x-reminder-secret")
  return Boolean(provided && provided === expected)
}

async function authorizeDispatchRequest(request: Request) {
  if (hasReminderSecret(request)) {
    return { access: "secret" as const }
  }

  const authResult = await authenticateRequest(request)
  if (!isAuthenticatedResult(authResult)) {
    return { response: authResult.response }
  }

  const role = resolveReviewerRole(authResult.decoded)
  if (!hasReviewerAccess(role)) {
    return { response: NextResponse.json({ error: "Reviewer access required." }, { status: 403 }) }
  }

  return { access: role }
}

export async function GET(request: Request) {
  const authorized = await authorizeDispatchRequest(request)
  if ("response" in authorized) {
    return authorized.response
  }

  const result = await dispatchAuspiciousReminders({ dryRun: true })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const authorized = await authorizeDispatchRequest(request)
  if ("response" in authorized) {
    return authorized.response
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get("dryRun") === "true"
  const result = await dispatchAuspiciousReminders({ dryRun })

  return NextResponse.json({
    ...result,
    trigger: authorized.access,
  })
}
