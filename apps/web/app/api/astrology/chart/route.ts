import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"

import { authenticateRequest, isAuthenticatedResult } from "@/lib/api-auth"
import { applyHoroscopeSnapshotToDraft } from "@/lib/astrology/horoscope-snapshot"
import { getFirebaseAdminDb } from "@/lib/firebase-admin"
import { mergeProfileDraft, type ProfileDraft } from "@acme/core"

type FirestoreProfileRecord = {
  draft?: Partial<ProfileDraft>
  displayName?: string
  dob?: string | null
  pob?: string | null
  tob?: string | null
  birthTimeAccuracy?: ProfileDraft["horoscope"]["birthTimeAccuracy"]
  horoscope?: {
    nakshatra?: string
    lagna?: string
  }
  placeNormalization?: {
    normalizedPlaceName?: string
    latitude?: number | null
    longitude?: number | null
    timeZone?: string
  }
}

function draftFromProfileRecord(record: FirestoreProfileRecord | undefined) {
  if (!record) return mergeProfileDraft()

  if (record.draft) {
    return mergeProfileDraft(record.draft)
  }

  return mergeProfileDraft({
    basics: {
      firstName: record.displayName?.split(" ")[0] ?? "",
      lastName: record.displayName?.split(" ").slice(1).join(" ") ?? "",
      gender: "",
      age: "",
      heightCm: "",
      profession: "",
      district: "",
      religion: "",
      language: "",
    },
    horoscope: {
      birthDate: record.dob?.slice(0, 10) ?? "",
      birthPlace: record.pob ?? "",
      birthTime: record.tob ?? "",
      birthTimeAccuracy: record.birthTimeAccuracy ?? "exact",
      normalizedBirthPlace: record.placeNormalization?.normalizedPlaceName ?? "",
      birthLatitude: typeof record.placeNormalization?.latitude === "number" ? record.placeNormalization.latitude : null,
      birthLongitude: typeof record.placeNormalization?.longitude === "number" ? record.placeNormalization.longitude : null,
      birthTimeZone: record.placeNormalization?.timeZone ?? "Asia/Colombo",
      nakath: record.horoscope?.nakshatra ?? "",
      lagna: record.horoscope?.lagna ?? "",
    },
  })
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  if (!isAuthenticatedResult(authResult)) {
    return authResult.response
  }

  try {
    const body = ((await request.json().catch(() => null)) ?? {}) as {
      draft?: Partial<ProfileDraft>
    }
    const userId = authResult.decoded.uid
    const db = getFirebaseAdminDb()
    const profileRef = db.collection("profiles").doc(userId)
    const snapshot = await profileRef.get()

    const storedDraft = snapshot.exists ? draftFromProfileRecord(snapshot.data() as FirestoreProfileRecord) : mergeProfileDraft()
    const draft = mergeProfileDraft(body.draft ? { ...storedDraft, ...body.draft } : storedDraft)
    const nextDraft = applyHoroscopeSnapshotToDraft(draft)

    if (!nextDraft.horoscopeComputed) {
      return NextResponse.json(
        { error: "Birth date and birth place are required before a horoscope snapshot can be generated." },
        { status: 400 },
      )
    }

    if (snapshot.exists) {
      await profileRef.set(
        {
          dob: nextDraft.horoscope.birthDate ? `${nextDraft.horoscope.birthDate}T00:00:00.000Z` : null,
          pob: nextDraft.horoscope.birthPlace,
          tob: nextDraft.horoscope.birthTime,
          birthTimeAccuracy: nextDraft.horoscope.birthTimeAccuracy,
          horoscope: {
            nakshatra: nextDraft.horoscope.nakath,
            lagna: nextDraft.horoscope.lagna,
          },
          placeNormalization: {
            normalizedPlaceName: nextDraft.horoscope.normalizedBirthPlace,
            latitude: nextDraft.horoscope.birthLatitude,
            longitude: nextDraft.horoscope.birthLongitude,
            timeZone: nextDraft.horoscope.birthTimeZone,
          },
          horoscopeComputed: nextDraft.horoscopeComputed,
          draft: nextDraft,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
    }

    return NextResponse.json({
      ok: true,
      persisted: snapshot.exists,
      draft: nextDraft,
      horoscopeComputed: nextDraft.horoscopeComputed,
      placeNormalization: {
        normalizedPlaceName: nextDraft.horoscope.normalizedBirthPlace,
        latitude: nextDraft.horoscope.birthLatitude,
        longitude: nextDraft.horoscope.birthLongitude,
        timeZone: nextDraft.horoscope.birthTimeZone,
      },
    })
  } catch {
    return NextResponse.json({ error: "Could not generate horoscope snapshot." }, { status: 500 })
  }
}
