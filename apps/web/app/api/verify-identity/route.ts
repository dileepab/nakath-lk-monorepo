import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { RekognitionClient, CompareFacesCommand } from "@aws-sdk/client-rekognition"

import { authenticateRequest, isAuthenticatedResult } from "@/lib/api-auth"
import { getFirebaseAdminDb, getFirebaseAdminStorage } from "@/lib/firebase-admin"

// Optional credentials (only required if MOCK_AI_VERIFICATION is not true)
const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy",
  },
})

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  try {
    await req.json().catch(() => null)

    const userId = authResult.decoded.uid
    const profileRef = getFirebaseAdminDb().collection("profiles").doc(userId)
    const profileSnapshot = await profileRef.get()

    if (!profileSnapshot.exists) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 })
    }

    const profileData = profileSnapshot.data() ?? {}
    const nicFrontPath = profileData.draft?.media?.nicFrontPath as string | undefined
    const nicBackPath = profileData.draft?.media?.nicBackPath as string | undefined
    const selfiePath = profileData.draft?.media?.selfiePath as string | undefined

    if (!nicFrontPath || !nicBackPath || !selfiePath) {
      return NextResponse.json(
        { error: "NIC front, NIC back, and selfie uploads are required before verification can run." },
        { status: 400 },
      )
    }

    const mockMode = process.env.MOCK_AI_VERIFICATION === "true"
    let confidence = 0

    if (mockMode) {
      // Fast-pass the verification for local mock testing
      await new Promise(resolve => setTimeout(resolve, 1500))
      confidence = 95.8
    } else {
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        return NextResponse.json({ error: "AWS Rekognition is not configured." }, { status: 503 })
      }

      const bucket = getFirebaseAdminStorage().bucket()
      const [nicFrontBuffer, selfieBuffer] = await Promise.all([
        bucket.file(nicFrontPath).download(),
        bucket.file(selfiePath).download(),
      ])

      // Use the NIC front for face comparison and require the NIC back as part of the completeness gate.
      const command = new CompareFacesCommand({
        SourceImage: { Bytes: nicFrontBuffer[0] },
        TargetImage: { Bytes: selfieBuffer[0] },
        SimilarityThreshold: 85, // Only return matches better than 85%
      })

      const response = await rekognition.send(command)

      if (response.FaceMatches && response.FaceMatches.length > 0) {
        confidence = response.FaceMatches[0].Similarity || 0
      }
    }

    // 3. Evaluate Match
    if (confidence > 85) {
      await profileRef.update({
        "draft.verification.nicStatus": "verified",
        "draft.verification.selfieStatus": "verified",
        isVerified: true,
        verificationStatus: "verified:verified",
        updatedAt: FieldValue.serverTimestamp(),
      })

      return NextResponse.json({ verified: true, confidence, message: "AI Auto-approval successful!" })
    } else {
      // If AI isn't absolutely confident, it falls back to the manual review queue inherently.
      return NextResponse.json({ verified: false, confidence, message: "Confidence too low for auto-approval. Flagged for manual review." })
    }

  } catch (error: any) {
    console.error("Verification AI Error:", error.message)
    return NextResponse.json({ error: "Internal verification pipeline failure." }, { status: 500 })
  }
}
