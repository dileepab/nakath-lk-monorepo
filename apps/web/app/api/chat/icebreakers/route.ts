import { NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

import { authenticateRequest, isAuthenticatedResult, loadAuthorizedMatch } from "@/lib/api-auth"
import { getFirebaseAdminDb } from "@/lib/firebase-admin"

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  try {
    const { matchId } = await req.json()

    if (!matchId) {
      return NextResponse.json({ error: "Missing matchId" }, { status: 400 })
    }

    const matchResult = await loadAuthorizedMatch(matchId, authResult.decoded.uid, {
      requireApproved: true,
    })
    if ("response" in matchResult) {
      return matchResult.response
    }

    const mockMode = process.env.MOCK_AI_VERIFICATION === "true"

    if (mockMode) {
      // Fast-pass the Icebreakers to avoid requiring OpenAI API Keys during testing
      await new Promise(resolve => setTimeout(resolve, 1500))
      return NextResponse.json({
         icebreakers: [
           "Ayubowan! I noticed we both prefer a nuclear family setup. How's your weekend going?",
           "It looks like we both studied in Colombo! Do you still visit the city often?",
           "Hi! I see you're also open to migrating down the line. What countries are on your radar?"
         ]
      })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI is not configured." }, { status: 503 })
    }

    const matchData = matchResult.match
    const db = getFirebaseAdminDb()

    // 2. Fetch both Profile Drafts
    const [senderDoc, receiverDoc] = await Promise.all([
      db.collection("profiles").doc(matchData.senderId).get(),
      db.collection("profiles").doc(matchData.receiverId).get()
    ])

    const senderDraft = senderDoc.data()?.draft
    const receiverDraft = receiverDoc.data()?.draft

    if (!senderDraft || !receiverDraft) {
      throw new Error("Missing profile data to generate icebreakers")
    }

    // 3. Ping the LLM to write 3 contextual hooks
    const { object } = await generateObject({
      model: openai("gpt-4-turbo"),
      schema: z.object({
        icebreakers: z.array(z.string()).length(3)
      }),
      prompt: `
        You are a high-end Sri Lankan matchmaking assistant. 
        Write 3 casual, culturally polite conversation starters (icebreakers) for two matched individuals.
        They should be short (1-2 sentences max). 
        Profile 1: Birth date ${senderDraft.horoscope?.birthDate}, Religion ${senderDraft.basics?.religion}, Job ${senderDraft.basics?.profession}, Family Setup ${senderDraft.preferences?.expectedFamilySetup}
        Profile 2: Birth date ${receiverDraft.horoscope?.birthDate}, Religion ${receiverDraft.basics?.religion}, Job ${receiverDraft.basics?.profession}, Family Setup ${receiverDraft.preferences?.expectedFamilySetup}
      `
    })

    return NextResponse.json({ icebreakers: object.icebreakers })

  } catch (error: any) {
    console.error("AI Icebreaker Error:", error.message)
    return NextResponse.json({ error: "Failed to generate AI icebreakers." }, { status: 500 })
  }
}
