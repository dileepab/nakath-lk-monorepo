import "server-only"

import { type HoroscopePlaceNormalization } from "@acme/core"

const sriLankaPlaceMap: Record<string, { normalizedPlaceName: string; latitude: number; longitude: number }> = {
  colombo: { normalizedPlaceName: "Colombo, Sri Lanka", latitude: 6.9271, longitude: 79.8612 },
  gampaha: { normalizedPlaceName: "Gampaha, Sri Lanka", latitude: 7.0917, longitude: 79.9999 },
  kalutara: { normalizedPlaceName: "Kalutara, Sri Lanka", latitude: 6.5854, longitude: 79.9607 },
  kandy: { normalizedPlaceName: "Kandy, Sri Lanka", latitude: 7.2906, longitude: 80.6337 },
  galle: { normalizedPlaceName: "Galle, Sri Lanka", latitude: 6.0535, longitude: 80.221 },
  kurunegala: { normalizedPlaceName: "Kurunegala, Sri Lanka", latitude: 7.4863, longitude: 80.3623 },
  matara: { normalizedPlaceName: "Matara, Sri Lanka", latitude: 5.9549, longitude: 80.555 },
  jaffna: { normalizedPlaceName: "Jaffna, Sri Lanka", latitude: 9.6615, longitude: 80.0255 },
}

function normalizeLookupKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function toTitleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

export function normalizeSriLankaBirthPlace(value: string): HoroscopePlaceNormalization {
  const key = normalizeLookupKey(value)
  const knownPlace = sriLankaPlaceMap[key]

  if (knownPlace) {
    return {
      normalizedPlaceName: knownPlace.normalizedPlaceName,
      latitude: knownPlace.latitude,
      longitude: knownPlace.longitude,
      timeZone: "Asia/Colombo",
    }
  }

  const normalizedPlaceName = value.trim() ? `${toTitleCase(value)}, Sri Lanka` : ""

  return {
    normalizedPlaceName,
    latitude: null,
    longitude: null,
    timeZone: "Asia/Colombo",
  }
}
