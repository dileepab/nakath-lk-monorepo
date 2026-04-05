import { mergeProfileDraft, type ProfileDraft } from "@acme/core"

type HoroscopeChartResponse = {
  ok: true
  persisted: boolean
  draft: ProfileDraft
  horoscopeComputed: ProfileDraft["horoscopeComputed"]
  placeNormalization: {
    normalizedPlaceName: string
    latitude: number | null
    longitude: number | null
    timeZone: string
  }
}

export async function generateHoroscopeChartSnapshot(idToken: string, draft: ProfileDraft) {
  const response = await fetch("/api/astrology/chart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ draft }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? "Could not generate horoscope snapshot.")
  }

  const payload = (await response.json()) as HoroscopeChartResponse
  return {
    ...payload,
    draft: mergeProfileDraft(payload.draft),
  }
}
