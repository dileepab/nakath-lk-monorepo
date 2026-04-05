import "server-only"

import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

type JulianDayResult = {
  julianDayET: number
  julianDayUT: number
}

type PlanetResult = {
  longitude: number
  latitude: number
  distance: number
  longitudeSpeed: number
  latitudeSpeed: number
  distanceSpeed: number
  rflag: number
  error?: string
}

type HousesResult = {
  house: number[]
  ascendant: number
  mc: number
  armc: number
  vertex: number
  equatorialAscendant: number
  kochCoAscendant: number
  munkaseyCoAscendant: number
  munkaseyPolarAscendant: number
  error?: string
}

type SwissephModule = {
  SE_GREG_CAL: number
  SE_MOON: number
  SE_SIDM_LAHIRI: number
  SEFLG_MOSEPH: number
  SEFLG_SIDEREAL: number
  swe_set_ephe_path: (value: string) => void
  swe_set_sid_mode: (sidMode: number, t0: number, ayanT0: number) => void
  swe_utc_to_jd: (
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    gregFlag: number,
  ) => JulianDayResult
  swe_calc_ut: (julianDayUT: number, planet: number, flags: number) => PlanetResult
  swe_houses_ex: (
    julianDayUT: number,
    flags: number,
    latitude: number,
    longitude: number,
    houseSystem: string,
  ) => HousesResult
  swe_get_ayanamsa: (julianDayET: number) => number
}

const swisseph = require("swisseph-v2") as SwissephModule

let configured = false

function ensureConfigured() {
  if (configured) return

  const packageRoot = path.dirname(require.resolve("swisseph-v2/package.json"))
  swisseph.swe_set_ephe_path(path.join(packageRoot, "ephe"))
  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0)
  configured = true
}

function assertFiniteNumber(value: number, message: string) {
  if (!Number.isFinite(value)) {
    throw new Error(message)
  }
}

export function swissephJulianDayUtc(input: {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second?: number
}) {
  ensureConfigured()

  const result = swisseph.swe_utc_to_jd(
    input.year,
    input.month,
    input.day,
    input.hour,
    input.minute,
    input.second ?? 0,
    swisseph.SE_GREG_CAL,
  )

  assertFiniteNumber(result.julianDayET, "Swiss Ephemeris did not return a valid ET Julian day.")
  assertFiniteNumber(result.julianDayUT, "Swiss Ephemeris did not return a valid UT Julian day.")

  return result
}

export function swissephSiderealMoon(julianDayUT: number) {
  ensureConfigured()

  const result = swisseph.swe_calc_ut(
    julianDayUT,
    swisseph.SE_MOON,
    swisseph.SEFLG_MOSEPH | swisseph.SEFLG_SIDEREAL,
  )

  if (result.error) {
    throw new Error(result.error)
  }

  assertFiniteNumber(result.longitude, "Swiss Ephemeris did not return a valid Moon longitude.")

  return result
}

export function swissephSiderealAscendant(julianDayUT: number, latitude: number, longitude: number) {
  ensureConfigured()

  const result = swisseph.swe_houses_ex(
    julianDayUT,
    swisseph.SEFLG_SIDEREAL,
    latitude,
    longitude,
    "P",
  )

  if (result.error) {
    throw new Error(result.error)
  }

  assertFiniteNumber(result.ascendant, "Swiss Ephemeris did not return a valid ascendant.")

  return result.ascendant
}

export function swissephLahiriAyanamsa(julianDayET: number) {
  ensureConfigured()

  const result = swisseph.swe_get_ayanamsa(julianDayET)
  assertFiniteNumber(result, "Swiss Ephemeris did not return a valid ayanamsa.")
  return result
}
