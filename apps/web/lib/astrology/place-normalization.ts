import "server-only"

import { type HoroscopePlaceNormalization } from "@acme/core"

import {
  normalizeSriLankaLookupKey,
  sriLankaBirthPlaceSuggestions,
  sriLankaPlaces,
  toSriLankaTitleCase,
  type KnownSriLankaPlace,
} from "./sri-lanka-places"

const placeCache = new Map<string, HoroscopePlaceNormalization>()
const knownPlaceMap = buildKnownPlaceMap()

function buildKnownPlaceMap() {
  const map = new Map<string, KnownSriLankaPlace>()

  for (const place of sriLankaPlaces) {
    map.set(normalizeSriLankaLookupKey(place.name), place)

    for (const alias of place.aliases ?? []) {
      map.set(normalizeSriLankaLookupKey(alias), place)
    }
  }

  return map
}

function formatKnownPlace(place: KnownSriLankaPlace): HoroscopePlaceNormalization {
  return {
    normalizedPlaceName: `${place.name}, Sri Lanka`,
    latitude: place.latitude,
    longitude: place.longitude,
    timeZone: "Asia/Colombo",
  }
}

function fallbackPlace(value: string): HoroscopePlaceNormalization {
  const normalizedPlaceName = value.trim() ? `${toSriLankaTitleCase(value)}, Sri Lanka` : ""

  return {
    normalizedPlaceName,
    latitude: null,
    longitude: null,
    timeZone: "Asia/Colombo",
  }
}

function extractPlaceName(result: {
  display_name?: string
  address?: Record<string, string | undefined>
}) {
  const address = result.address ?? {}

  return (
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.suburb ??
    address.county ??
    result.display_name?.split(",")[0] ??
    ""
  )
}

async function lookupSriLankaPlace(value: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", `${value}, Sri Lanka`)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("countrycodes", "lk")
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("limit", "1")

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Nakath.lk Matrimony/1.0 (birth place lookup)",
    },
    next: { revalidate: 60 * 60 * 24 * 30 },
  }).catch(() => null)

  if (!response?.ok) {
    return null
  }

  const payload = (await response.json().catch(() => null)) as
    | Array<{
        lat?: string
        lon?: string
        display_name?: string
        address?: Record<string, string | undefined>
      }>
    | null

  const result = payload?.[0]
  if (!result) {
    return null
  }

  const latitude = Number(result.lat)
  const longitude = Number(result.lon)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  const placeName = extractPlaceName(result)

  return {
    normalizedPlaceName: placeName ? `${toSriLankaTitleCase(placeName)}, Sri Lanka` : `${toSriLankaTitleCase(value)}, Sri Lanka`,
    latitude,
    longitude,
    timeZone: "Asia/Colombo",
  } satisfies HoroscopePlaceNormalization
}

export async function resolveSriLankaBirthPlace(value: string): Promise<HoroscopePlaceNormalization> {
  const key = normalizeSriLankaLookupKey(value)

  if (!key) {
    return fallbackPlace(value)
  }

  const knownPlace = knownPlaceMap.get(key)
  if (knownPlace) {
    return formatKnownPlace(knownPlace)
  }

  const cachedPlace = placeCache.get(key)
  if (cachedPlace) {
    return cachedPlace
  }

  const remotePlace = await lookupSriLankaPlace(value)
  if (remotePlace) {
    placeCache.set(key, remotePlace)
    return remotePlace
  }

  return fallbackPlace(value)
}

export function getSriLankaBirthPlaceSuggestions(query: string) {
  const key = normalizeSriLankaLookupKey(query)
  if (!key) {
    return sriLankaBirthPlaceSuggestions.slice(0, 18)
  }

  return sriLankaBirthPlaceSuggestions
    .filter((place) => normalizeSriLankaLookupKey(place).includes(key))
    .slice(0, 18)
}
