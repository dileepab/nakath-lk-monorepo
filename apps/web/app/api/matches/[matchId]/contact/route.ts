import { NextRequest, NextResponse } from "next/server"

import { authenticateRequest, isAuthenticatedResult, loadAuthorizedMatch } from "@/lib/api-auth"
import { getFirebaseAdminDb } from "@/lib/firebase-admin"
import { mergeProfileDraft, type ProfileDraft } from "@acme/core"

type ContactRevealResponse = {
  revealed: boolean
  mode: "none" | "personal" | "family"
  displayName: string
  fields: Array<{ label: string; value: string }>
  message: string
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> },
) {
  const authResult = await authenticateRequest(req)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  try {
    const { matchId } = await context.params
    const matchResult = await loadAuthorizedMatch(matchId, authResult.decoded.uid, {
      requireApproved: true,
    })

    if ("response" in matchResult) {
      return matchResult.response
    }

    const otherUserId =
      matchResult.match.senderId === authResult.decoded.uid ? matchResult.match.receiverId : matchResult.match.senderId

    const [profileSnapshot, privateSnapshot] = await Promise.all([
      getFirebaseAdminDb().collection("profiles").doc(otherUserId).get(),
      getFirebaseAdminDb().collection("privateProfiles").doc(otherUserId).get(),
    ])

    if (!profileSnapshot.exists) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 })
    }

    const publicDraft = mergeProfileDraft((profileSnapshot.data()?.draft ?? {}) as Partial<ProfileDraft>)
    const privateContact = (privateSnapshot.data()?.contact ?? {}) as Partial<ProfileDraft["contact"]>
    const displayName = `${publicDraft.basics.firstName} ${publicDraft.basics.lastName}`.trim() || "Your match"

    let payload: ContactRevealResponse

    if (publicDraft.privacy.contactVisibility === "hidden") {
      payload = {
        revealed: false,
        mode: "none",
        displayName,
        fields: [],
        message: "This introduction keeps direct contact inside the app for now.",
      }
    } else if (publicDraft.privacy.contactVisibility === "family-request") {
      if (!publicDraft.verification.familyContactAllowed) {
        payload = {
          revealed: false,
          mode: "family",
          displayName,
          fields: [],
          message: "Family contact sharing is not enabled for this introduction.",
        }
        return NextResponse.json(payload)
      }

      const fields = [
        privateContact.familyContactName ? { label: "Family contact", value: privateContact.familyContactName } : null,
        privateContact.familyContactPhone ? { label: "Family phone", value: privateContact.familyContactPhone } : null,
      ].filter(Boolean) as Array<{ label: string; value: string }>

      payload = {
        revealed: fields.length > 0,
        mode: "family",
        displayName,
        fields,
        message:
          fields.length > 0
            ? "Family contact details are available for this approved introduction."
            : "Family contact details have not been added yet.",
      }
    } else {
      const fields = [
        privateContact.personalPhone ? { label: "Phone", value: privateContact.personalPhone } : null,
        privateContact.whatsappNumber ? { label: "WhatsApp", value: privateContact.whatsappNumber } : null,
      ].filter(Boolean) as Array<{ label: string; value: string }>

      payload = {
        revealed: fields.length > 0,
        mode: "personal",
        displayName,
        fields,
        message:
          fields.length > 0
            ? "Direct contact details are available for this approved introduction."
            : "Direct contact details have not been added yet.",
      }
    }

    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ error: "Could not load contact details." }, { status: 500 })
  }
}
