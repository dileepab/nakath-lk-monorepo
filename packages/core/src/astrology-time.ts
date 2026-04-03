export type TimeWindow = {
  start: Date
  end: Date
}

export type AuspiciousStatus = "auspicious" | "inauspicious" | "neutral"

export const SRI_LANKA_TIME_ZONE = "Asia/Colombo"
export const SRI_LANKA_UTC_OFFSET_MINUTES = 5.5 * 60
const SRI_LANKA_UTC_OFFSET_MS = SRI_LANKA_UTC_OFFSET_MINUTES * 60 * 1000

// Sri Lankan standard Rahu Kaalaya (Daytime simplified approximations)
const rahuKaalayaRules = [
  { day: 0, startHour: 16, startMinute: 30, endHour: 18, endMinute: 0 }, // Sunday
  { day: 1, startHour: 7, startMinute: 30, endHour: 9, endMinute: 0 },   // Monday
  { day: 2, startHour: 15, startMinute: 0, endHour: 16, endMinute: 30 }, // Tuesday
  { day: 3, startHour: 12, startMinute: 0, endHour: 13, endMinute: 30 }, // Wednesday
  { day: 4, startHour: 13, startMinute: 30, endHour: 15, endMinute: 0 }, // Thursday
  { day: 5, startHour: 10, startMinute: 30, endHour: 12, endMinute: 0 }, // Friday
  { day: 6, startHour: 9, startMinute: 0, endHour: 10, endMinute: 30 },  // Saturday
]

export function toSriLankaWallClock(date: Date) {
  return new Date(date.getTime() + SRI_LANKA_UTC_OFFSET_MS)
}

export function getSriLankaDateParts(date: Date) {
  const wallClock = toSriLankaWallClock(date)

  return {
    year: wallClock.getUTCFullYear(),
    monthIndex: wallClock.getUTCMonth(),
    day: wallClock.getUTCDate(),
    weekday: wallClock.getUTCDay(),
    hour: wallClock.getUTCHours(),
    minute: wallClock.getUTCMinutes(),
  }
}

export function createSriLankaDate(
  year: number,
  monthIndex: number,
  day: number,
  hour = 0,
  minute = 0,
) {
  return new Date(Date.UTC(year, monthIndex, day, hour, minute, 0, 0) - SRI_LANKA_UTC_OFFSET_MS)
}

export function getRahuKaalayaForDate(date: Date): TimeWindow {
  const parts = getSriLankaDateParts(date)
  const rule = rahuKaalayaRules.find((r) => r.day === parts.weekday)

  if (!rule) {
    // Should never reach here due to modulo 7, but fallback to 12PM for safety
    return {
      start: createSriLankaDate(parts.year, parts.monthIndex, parts.day, 12, 0),
      end: createSriLankaDate(parts.year, parts.monthIndex, parts.day, 13, 30),
    }
  }

  const start = createSriLankaDate(parts.year, parts.monthIndex, parts.day, rule.startHour, rule.startMinute)
  const end = createSriLankaDate(parts.year, parts.monthIndex, parts.day, rule.endHour, rule.endMinute)

  return { start, end }
}

export function getRahuKaalayaForToday(): TimeWindow {
  return getRahuKaalayaForDate(new Date())
}

export function getCurrentAuspiciousStatus(): {
  status: AuspiciousStatus
  message: string
  nextTransition: Date | null
} {
  const now = new Date()
  const rahu = getRahuKaalayaForToday()

  // During Rahu Kaalaya
  if (now >= rahu.start && now < rahu.end) {
    return {
      status: "inauspicious",
      message: "Currently in Rahu Kaalaya. Avoid starting important match interactions.",
      nextTransition: rahu.end,
    }
  }

  // Pre-Rahu Kaalaya (Neutral/Auspicious but approaching Rahu)
  if (now < rahu.start) {
    return {
      status: "auspicious",
      message: "Currently Auspicious. Next Rahu Kaalaya will begin later today.",
      nextTransition: rahu.start,
    }
  }

  // Post-Rahu Kaalaya
  return {
    status: "neutral",
    message: "Rahu Kaalaya has passed for today. Time is clear for interactions.",
    nextTransition: null, // Next is tomorrow
  }
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString("en-LK", {
    timeZone: SRI_LANKA_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}
