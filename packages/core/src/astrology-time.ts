export type TimeWindow = {
  start: Date
  end: Date
}

export type AuspiciousStatus = "auspicious" | "inauspicious" | "neutral"

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

export function getRahuKaalayaForToday(): TimeWindow {
  const now = new Date()
  const rule = rahuKaalayaRules.find((r) => r.day === now.getDay())

  if (!rule) {
    // Should never reach here due to modulo 7, but fallback to 12PM for safety
    return {
      start: new Date(now.setHours(12, 0, 0, 0)),
      end: new Date(now.setHours(13, 30, 0, 0)),
    }
  }

  const start = new Date(now)
  start.setHours(rule.startHour, rule.startMinute, 0, 0)

  const end = new Date(now)
  end.setHours(rule.endHour, rule.endMinute, 0, 0)

  return { start, end }
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
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
}
