import { horoscopeRuleConfig } from "./horoscope-config"
import { getHoroscopeInputConfidence, lagnaOptions, nakathOptions, type HoroscopeConfidence, type ProfileDraft } from "./profile"

export type HoroscopeRuleResult = {
  score: number
  max: number
  note: string
  confidence: "low" | "medium" | "high"
}

type ResolvedTraditionalInputs = {
  nakath: string
  lagna: string
  confidence: HoroscopeConfidence
  source: "computed" | "manual"
  exactBirthTime: boolean
}

function resolveTraditionalInputs(profile: ProfileDraft): ResolvedTraditionalInputs {
  if (profile.horoscopeComputed) {
    return {
      nakath: profile.horoscopeComputed.nakath.trim(),
      lagna: profile.horoscopeComputed.lagna.trim(),
      confidence: profile.horoscopeComputed.confidence,
      source: "computed",
      exactBirthTime: profile.horoscope.birthTimeAccuracy === "exact" && profile.horoscope.birthTime.trim().length > 0,
    }
  }

  return {
    nakath: profile.horoscope.nakath.trim(),
    lagna: profile.horoscope.lagna.trim(),
    confidence: getHoroscopeInputConfidence(profile),
    source: "manual",
    exactBirthTime: profile.horoscope.birthTimeAccuracy === "exact" && profile.horoscope.birthTime.trim().length > 0,
  }
}

function birthDataCount(profile: ProfileDraft) {
  const resolved = resolveTraditionalInputs(profile)

  return [
    profile.horoscope.birthDate,
    profile.horoscope.birthTime,
    profile.horoscope.birthPlace,
    resolved.nakath,
    resolved.lagna,
  ].filter((value) => value.trim().length > 0).length
}

function completenessScore(reference: ProfileDraft, candidate: ProfileDraft) {
  const referenceInputs = resolveTraditionalInputs(reference)
  const candidateInputs = resolveTraditionalInputs(candidate)
  const sharedCount = Math.min(birthDataCount(reference), birthDataCount(candidate))
  const sharedConfidence: HoroscopeConfidence =
    referenceInputs.confidence === "low" || candidateInputs.confidence === "low"
      ? "low"
      : referenceInputs.confidence === "medium" || candidateInputs.confidence === "medium"
        ? "medium"
        : "high"

  if (sharedCount >= horoscopeRuleConfig.completeness.highThreshold && sharedConfidence === "high") {
    return {
      score: horoscopeRuleConfig.completeness.scores.high,
      confidence: "high" as const,
      note:
        referenceInputs.source === "computed" && candidateInputs.source === "computed"
          ? "Both profiles have chart-backed traditional inputs with exact-enough birth details."
          : "Both profiles include the core birth date, time, place, nakath, and lagna fields with strong confidence.",
    }
  }

  if (sharedCount >= horoscopeRuleConfig.completeness.mediumThreshold && sharedConfidence !== "low") {
    return {
      score: horoscopeRuleConfig.completeness.scores.medium,
      confidence: "medium" as const,
      note:
        referenceInputs.source === "computed" || candidateInputs.source === "computed"
          ? "At least one side has a computed chart snapshot, but the pair still needs cleaner birth inputs for high-confidence matching."
          : "There is enough birth data for a launch-stage horoscope pass, but not enough for high confidence.",
    }
  }

  return {
    score: horoscopeRuleConfig.completeness.scores.low,
    confidence: "low" as const,
    note:
      sharedCount >= horoscopeRuleConfig.completeness.mediumThreshold
        ? "Birth details exist on both sides, but the chart confidence is still too soft for a reliable traditional score."
        : "Too much birth data is missing for the horoscope factor to be treated as reliable.",
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
  const left = resolveTraditionalInputs(reference)
  const right = resolveTraditionalInputs(candidate)
  const distance = cyclicDistance(left.nakath, right.nakath, nakathOptions)

  if (distance === null) {
    return {
      score: horoscopeRuleConfig.nakath.defaultScore,
      note:
        left.source === "computed" || right.source === "computed"
          ? "A chart snapshot exists, but nakath is still incomplete on one side, so this part stays neutral."
          : "Nakath is missing on one side, so this part of the horoscope preview stays neutral.",
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
  const leftInputs = resolveTraditionalInputs(reference)
  const rightInputs = resolveTraditionalInputs(candidate)
  const left = horoscopeRuleConfig.lagna.elementMap[leftInputs.lagna as keyof typeof horoscopeRuleConfig.lagna.elementMap]
  const right = horoscopeRuleConfig.lagna.elementMap[rightInputs.lagna as keyof typeof horoscopeRuleConfig.lagna.elementMap]

  if (!left || !right || !lagnaOptions.includes(leftInputs.lagna) || !lagnaOptions.includes(rightInputs.lagna)) {
    return {
      score: 0,
      note:
        !leftInputs.exactBirthTime || !rightInputs.exactBirthTime
          ? "Lagna needs reliable birth time on both sides, so this part stays neutral for now."
          : "Lagna is missing or outside the current rule map, so this part stays neutral.",
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
