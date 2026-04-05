import "server-only"

import {
  getHoroscopeInputConfidence,
  mergeProfileDraft,
  type HoroscopeComputedSnapshot,
  type ProfileDraft,
} from "@acme/core"

import { normalizeSriLankaBirthPlace } from "./place-normalization"
import {
  swissephJulianDayUtc,
  swissephLahiriAyanamsa,
  swissephSiderealAscendant,
  swissephSiderealMoon,
} from "./swisseph-client"

export const HOROSCOPE_SNAPSHOT_VERSION = "swisseph-v1"

const zodiacSigns = [
  "Mesha",
  "Vrushabha",
  "Mithuna",
  "Kataka",
  "Simha",
  "Kanya",
  "Thula",
  "Vrushchika",
  "Dhanu",
  "Makara",
  "Kumbha",
  "Meena",
] as const

const nakathSequence = [
  "Ashwini",
  "Bharani",
  "Karthika",
  "Rohini",
  "Muwasirasa",
  "Ada",
  "Punarvasu",
  "Pushya",
  "Aslisa",
  "Ma",
  "Puwapal",
  "Utrapal",
  "Hatha",
  "Chitra",
  "Swathi",
  "Visakha",
  "Anuradha",
  "Deta",
  "Mula",
  "Puwasala",
  "Utrasala",
  "Suwana",
  "Denata",
  "Siyawasa",
  "Puwaputup",
  "Uttraputup",
  "Revathi",
] as const

const NAKATH_ARC = 360 / nakathSequence.length
const PADA_ARC = NAKATH_ARC / 4
const SRI_LANKA_UTC_OFFSET_MINUTES = 5 * 60 + 30

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360
}

function roundTo(value: number, decimals: number) {
  return Number(value.toFixed(decimals))
}

function signFromLongitude(longitude: number) {
  const normalized = normalizeDegrees(longitude)
  return zodiacSigns[Math.floor(normalized / 30)] ?? ""
}

function nakathFromLongitude(longitude: number) {
  const normalized = normalizeDegrees(longitude)
  const nakathIndex = Math.floor(normalized / NAKATH_ARC)
  const padaIndex = Math.floor((normalized - nakathIndex * NAKATH_ARC) / PADA_ARC) + 1

  return {
    nakath: nakathSequence[nakathIndex] ?? "",
    pada: String(Math.min(4, Math.max(1, padaIndex))),
  }
}

function parseBirthDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) {
    return null
  }

  return { year, month, day }
}

function parseBirthTime(value: string) {
  const [hour, minute] = value.split(":").map(Number)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null
  }

  return { hour, minute }
}

function utcPartsFromSriLankaLocal(input: { year: number; month: number; day: number; hour: number; minute: number }) {
  const utcTimestamp =
    Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, 0, 0) -
    SRI_LANKA_UTC_OFFSET_MINUTES * 60 * 1000
  const utcDate = new Date(utcTimestamp)

  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    hour: utcDate.getUTCHours(),
    minute: utcDate.getUTCMinutes(),
    second: utcDate.getUTCSeconds(),
  }
}

function resolveBirthTime(draft: ProfileDraft) {
  const parsedTime = parseBirthTime(draft.horoscope.birthTime)
  const hasReliableBirthTime = Boolean(parsedTime) && draft.horoscope.birthTimeAccuracy !== "unknown-time"

  if (hasReliableBirthTime && parsedTime) {
    return {
      hour: parsedTime.hour,
      minute: parsedTime.minute,
      usedFallbackTime: false,
    }
  }

  return {
    hour: 12,
    minute: 0,
    usedFallbackTime: true,
  }
}

export function buildHoroscopeSnapshot(draft: ProfileDraft): HoroscopeComputedSnapshot | null {
  if (!draft.horoscope.birthDate.trim() || !draft.horoscope.birthPlace.trim()) {
    return null
  }

  const normalizedPlace = normalizeSriLankaBirthPlace(draft.horoscope.birthPlace)
  const birthDate = parseBirthDate(draft.horoscope.birthDate)

  if (!birthDate) {
    return null
  }

  const birthTime = resolveBirthTime(draft)
  const utcParts = utcPartsFromSriLankaLocal({
    ...birthDate,
    hour: birthTime.hour,
    minute: birthTime.minute,
  })
  const julianDay = swissephJulianDayUtc(utcParts)
  const ayanamsa = swissephLahiriAyanamsa(julianDay.julianDayET)
  const moon = swissephSiderealMoon(julianDay.julianDayUT)
  const moonLongitude = normalizeDegrees(moon.longitude)
  const moonNakath = nakathFromLongitude(moonLongitude)

  let lagna = ""
  const latitude = normalizedPlace.latitude
  const longitude = normalizedPlace.longitude
  const canComputeLagna =
    !birthTime.usedFallbackTime &&
    typeof latitude === "number" &&
    typeof longitude === "number"

  if (canComputeLagna) {
    const ascendant = swissephSiderealAscendant(julianDay.julianDayUT, latitude, longitude)
    lagna = signFromLongitude(ascendant)
  }

  return {
    version: HOROSCOPE_SNAPSHOT_VERSION,
    ayanamsa: `Lahiri ${roundTo(ayanamsa, 4)}°`,
    confidence: getHoroscopeInputConfidence(draft),
    nakath: moonNakath.nakath,
    pada: moonNakath.pada,
    rashi: signFromLongitude(moonLongitude),
    lagna,
    moonLongitude: roundTo(moonLongitude, 6),
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
      nakath: snapshot?.nakath ?? "",
      lagna: snapshot?.lagna ?? "",
      normalizedBirthPlace: normalizedPlace.normalizedPlaceName,
      birthLatitude: normalizedPlace.latitude,
      birthLongitude: normalizedPlace.longitude,
      birthTimeZone: normalizedPlace.timeZone,
    },
    horoscopeComputed: snapshot,
  }
}
