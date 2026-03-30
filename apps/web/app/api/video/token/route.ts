import { NextRequest, NextResponse } from "next/server"
import { AccessToken } from "livekit-server-sdk"

import { authenticateRequest, isAuthenticatedResult, loadAuthorizedMatch } from "@/lib/api-auth"

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  try {
    const { matchId } = await req.json()
    const userId = authResult.decoded.uid

    if (!matchId) {
      return NextResponse.json({ error: "Missing matchId for Video Room" }, { status: 400 })
    }

    const mockMode = process.env.MOCK_AI_VERIFICATION === "true"
    const matchResult = await loadAuthorizedMatch(matchId, userId, {
      requireApproved: true,
    })
    if ("response" in matchResult) {
      return matchResult.response
    }

    if (mockMode) {
      // In mock mode, we just return a fake token because the frontend video room is mocked.
      return NextResponse.json({ 
         token: "mock-livekit-token-for-dev", 
         url: "wss://mock-nakath-server.livekit.cloud" 
      })
    }

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_URL) {
      return NextResponse.json({ error: "LiveKit is not configured." }, { status: 503 })
    }

    // Production: Mint a 30-minute key for the highly secure LiveKit backend
    const roomName = `family-room-${matchResult.match.id}`
    const participantName = "participant"

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY, 
      process.env.LIVEKIT_API_SECRET, 
      {
        identity: userId,
        name: participantName,
        ttl: "30m",
      }
    )

    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true })
    const token = await at.toJwt()

    return NextResponse.json({ 
       token, 
       url: process.env.LIVEKIT_URL 
    })

  } catch (error: any) {
    console.error("LiveKit Token Error:", error.message)
    return NextResponse.json({ error: "Failed to allocate video server keys." }, { status: 500 })
  }
}
