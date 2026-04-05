import "server-only"

import {
  getHoroscopeInputConfidence,
  mergeProfileDraft,
  type HoroscopeComputedSnapshot,
  type ProfileDraft,
} from "@acme/core"

import { normalizeSriLankaBirthPlace } from "./place-normalization"

export const HOROSCOPE_SNAPSHOT_VERSION = "stub-v1"

export function buildHoroscopeSnapshot(draft: ProfileDraft): HoroscopeComputedSnapshot | null {
  if (!draft.horoscope.birthDate.trim() || !draft.horoscope.birthPlace.trim()) {
    return null
  }

  const normalizedPlace = normalizeSriLankaBirthPlace(draft.horoscope.birthPlace)

  return {
    version: HOROSCOPE_SNAPSHOT_VERSION,
    ayanamsa: "lahiri-pending",
    confidence: getHoroscopeInputConfidence(draft),
    nakath: draft.horoscope.nakath,
    pada: "",
    rashi: "",
    lagna: draft.horoscope.lagna,
    moonLongitude: null,
    place: normalizedPlace,
    computedAt: Date.now(),
  }
}

export function applyHoroscopeSnapshotToDraft(draft: ProfileDraft): ProfileDraft {
  const merged = mergeProfileDraft(draft)
  const normalizedPlace = normalizeSriLankaBirthPlace(merged.horoscope.birthPlace)
  const snapshot = buildHoroscopeSnapshot(merged)

  return {
    ...merged,
    horoscope: {
      ...merged.horoscope,
      normalizedBirthPlace: normalizedPlace.normalizedPlaceName,
      birthLatitude: normalizedPlace.latitude,
      birthLongitude: normalizedPlace.longitude,
      birthTimeZone: normalizedPlace.timeZone,
    },
    horoscopeComputed: snapshot,
  }
}
