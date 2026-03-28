import { horoscopeRuleConfig } from "./horoscope-config"
import { lagnaOptions, nakathOptions, type ProfileDraft } from "./profile"

export type HoroscopeRuleResult = {
  score: number
  max: number
  note: string
  confidence: "low" | "medium" | "high"
}

function birthDataCount(profile: ProfileDraft) {
  return [
    profile.horoscope.birthDate,
    profile.horoscope.birthTime,
    profile.horoscope.birthPlace,
    profile.horoscope.nakath,
    profile.horoscope.lagna,
  ].filter((value) => value.trim().length > 0).length
}

function completenessScore(reference: ProfileDraft, candidate: ProfileDraft) {
  const sharedCount = Math.min(birthDataCount(reference), birthDataCount(candidate))

  if (sharedCount >= horoscopeRuleConfig.completeness.highThreshold) {
    return {
      score: horoscopeRuleConfig.completeness.scores.high,
      confidence: "high" as const,
      note: "Both profiles include the core birth date, time, place, nakath, and lagna fields.",
    }
  }

  if (sharedCount >= horoscopeRuleConfig.completeness.mediumThreshold) {
    return {
      score: horoscopeRuleConfig.completeness.scores.medium,
      confidence: "medium" as const,
      note: "There is enough birth data for a launch-stage horoscope pass, but not enough for high confidence.",
    }
  }

  return {
    score: horoscopeRuleConfig.completeness.scores.low,
    confidence: "low" as const,
    note: "Too much birth data is missing for the horoscope factor to be treated as reliable.",
  }
}

function cyclicDistance(left: string, right: string, values: string[]) {
  const leftIndex = values.indexOf(left)
  const rightIndex = values.indexOf(right)

  if (leftIndex === -1 || rightIndex === -1) return null

  const direct = Math.abs(leftIndex - rightIndex)
  return Math.min(direct, values.length - direct)
}

function nakathScore(reference: ProfileDraft, candidate: ProfileDraft) {
  const distance = cyclicDistance(reference.horoscope.nakath, candidate.horoscope.nakath, nakathOptions)

  if (distance === null) {
    return {
      score: horoscopeRuleConfig.nakath.defaultScore,
      note: "Nakath is missing on one side, so this part of the horoscope preview stays neutral.",
    }
  }

  const configuredDistance =
    horoscopeRuleConfig.nakath.distanceScores[
      distance as keyof typeof horoscopeRuleConfig.nakath.distanceScores
    ]

  if (configuredDistance) {
    return {
      score: configuredDistance.score,
      note: configuredDistance.note,
    }
  }

  return {
    score: horoscopeRuleConfig.nakath.defaultScore,
    note: horoscopeRuleConfig.nakath.fallbackNote,
  }
}

function lagnaScore(reference: ProfileDraft, candidate: ProfileDraft) {
  const left = horoscopeRuleConfig.lagna.elementMap[reference.horoscope.lagna as keyof typeof horoscopeRuleConfig.lagna.elementMap]
  const right = horoscopeRuleConfig.lagna.elementMap[candidate.horoscope.lagna as keyof typeof horoscopeRuleConfig.lagna.elementMap]

  if (!left || !right || !lagnaOptions.includes(reference.horoscope.lagna) || !lagnaOptions.includes(candidate.horoscope.lagna)) {
    return {
      score: 0,
      note: "Lagna is missing or outside the current rule map, so this part stays neutral.",
    }
  }

  if (left === right) {
    return {
      score: horoscopeRuleConfig.lagna.sameElementScore,
      note: horoscopeRuleConfig.lagna.sameElementNote,
    }
  }

  const compatiblePairs = new Set<string>(horoscopeRuleConfig.lagna.compatiblePairs)
  if (compatiblePairs.has(`${left}-${right}`)) {
    return {
      score: horoscopeRuleConfig.lagna.compatibleElementScore,
      note: horoscopeRuleConfig.lagna.compatibleElementNote,
    }
  }

  return {
    score: 0,
    note: horoscopeRuleConfig.lagna.fallbackNote,
  }
}

export function evaluateHoroscopeRules(reference: ProfileDraft, candidate: ProfileDraft): HoroscopeRuleResult {
  const completeness = completenessScore(reference, candidate)
  const nakath = nakathScore(reference, candidate)
  const lagna = lagnaScore(reference, candidate)
  const score = completeness.score + nakath.score + lagna.score

  const confidence: HoroscopeRuleResult["confidence"] =
    completeness.confidence === "high"
      ? "high"
      : completeness.confidence === "medium"
        ? "medium"
        : "low"

  const note = [completeness.note, nakath.note, lagna.note].join(" ")

  return {
    score,
    max: horoscopeRuleConfig.maxScore,
    note,
    confidence,
  }
}
