export type LagnaElement = "fire" | "earth" | "air" | "water"

export const horoscopeRuleConfig = {
  maxScore: 5,
  completeness: {
    highThreshold: 5,
    mediumThreshold: 3,
    scores: {
      high: 2,
      medium: 1,
      low: 0,
    },
  },
  nakath: {
    defaultScore: 0,
    distanceScores: {
      0: {
        score: 1,
        note: "The nakath pair lands on the same point, which usually means similarity more than complement.",
      },
      2: {
        score: 1,
        note: "The nakath pair shows some useful contrast, but not the strongest complement in this launch rule set.",
      },
      3: {
        score: 2,
        note: "The nakath pair lands on a balanced separation in this rule set, which we treat as a stronger complement.",
      },
      4: {
        score: 2,
        note: "The nakath pair lands on a balanced separation in this rule set, which we treat as a stronger complement.",
      },
    } satisfies Record<number, { score: number; note: string }>,
    fallbackNote: "The nakath pair sits either too close or too unevenly spaced for a strong preview score here.",
  },
  lagna: {
    sameElementScore: 1,
    sameElementNote:
      "Both lagna signs fall into the same element group, which supports a steadier reading in this heuristic.",
    compatibleElementScore: 1,
    compatibleElementNote: "The lagna elements support each other in this launch rule set.",
    fallbackNote: "The lagna elements do not reinforce each other strongly in this rule set.",
    elementMap: {
      Mesha: "fire",
      Simha: "fire",
      Dhanu: "fire",
      Vrushabha: "earth",
      Kanya: "earth",
      Makara: "earth",
      Mithuna: "air",
      Thula: "air",
      Kumbha: "air",
      Kataka: "water",
      Vrushchika: "water",
      Meena: "water",
    } satisfies Record<string, LagnaElement>,
    compatiblePairs: ["fire-air", "air-fire", "earth-water", "water-earth"],
  },
} as const
