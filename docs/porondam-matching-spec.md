# Porondam Matching Spec

This document defines the next implementation phase for Porondam matching in the current Nakath.lk codebase.

The goal is not to replace the existing matrimony product with a pure astrology tool. The goal is to strengthen the current matching experience with a more credible, Sri-Lankan-relevant compatibility layer built on deterministic astrology calculations and clear human-readable explanations.

## Why This Matters

The current app already has:

- biodata capture
- horoscope-related inputs
- a launch-stage compatibility preview
- family-safe sharing
- shortlist, notes, and reviewer flows

That means Porondam is not a brand-new feature area. It is the next serious upgrade to an existing matching surface.

## Current State In The Repo

There is already a launch-stage Porondam preview in:

- [packages/core/src/porondam.ts](/Users/Dileepa/Personal/Marriage%20Platform/b_sA1vTdFYTQP-1774524967030/packages/core/src/porondam.ts)
- [packages/core/src/horoscope-rules.ts](/Users/Dileepa/Personal/Marriage%20Platform/b_sA1vTdFYTQP-1774524967030/packages/core/src/horoscope-rules.ts)
- [packages/core/src/horoscope-config.ts](/Users/Dileepa/Personal/Marriage%20Platform/b_sA1vTdFYTQP-1774524967030/packages/core/src/horoscope-config.ts)

It currently combines:

- horoscope completeness
- nakath distance
- lagna element compatibility
- age fit
- values and lifestyle fit
- location and trust readiness

This is useful for launch, but it is still a heuristic preview rather than a traditional Porondam engine.

## Product Decision

Porondam should stay inside the same app.

We do not need a separate app yet.

We should keep one platform with distinct modules:

- Matrimony core
- Astrology and timing
- Family and future expansion areas

Porondam belongs directly inside the matrimony core.

## Primary Goal

Build a `swisseph`-backed compatibility engine that:

- calculates astrology factors from birth data
- supports traditional Sri Lankan matrimony expectations
- produces a structured compatibility result
- explains the result in simple human language
- still keeps practical fit and trust signals alongside astrology

## Non-Goals For This Phase

- full parenting product expansion
- home construction or aya-waya tools
- business-partner compatibility
- expert marketplace
- fully interactive handahana UI
- spiritually prescriptive remedy engine

## Technical Direction

Yes, we can and should use `swisseph` in Node.js for this.

Recommended use:

- server-side only
- deterministic calculation service
- cached result snapshots
- no client-side ephemeris logic

`swisseph` should be responsible for the astronomy and chart math.

Our app should be responsible for:

- input validation
- compatibility rules
- explanation generation
- UI presentation
- caching and confidence handling

## Data We Already Have

The current profile model already captures the key first inputs in:

- [packages/core/src/profile.ts](/Users/Dileepa/Personal/Marriage%20Platform/b_sA1vTdFYTQP-1774524967030/packages/core/src/profile.ts)

Current fields:

- `horoscope.birthDate`
- `horoscope.birthTime`
- `horoscope.birthPlace`
- `horoscope.nakath`
- `horoscope.lagna`

This is enough to start, but not enough for a rigorous engine.

## Data We Should Add

### Birth accuracy

Add a confidence indicator for birth data:

- `exact`
- `approximate`
- `unknown-time`

This matters because traditional Porondam results should not pretend to be high-confidence when birth time is weak.

### Place normalization

`birthPlace` should remain user-friendly, but we should also store a normalized geography result:

- `latitude`
- `longitude`
- `timeZone`
- `normalizedPlaceName`

### Computed horoscope snapshot

We should add a server-computed snapshot derived from `swisseph`, for example:

- `ayanamsa`
- `moonLongitude`
- `nakshatra`
- `pada`
- `rashi`
- `lagna`
- `houseSystem`
- `computedAt`
- `inputConfidence`

This should be treated as generated data, not hand-edited user input.

## Proposed Data Model Additions

### Profile-level computed section

Suggested addition to the stored profile shape:

- `horoscopeComputed`
  - `version`
  - `ayanamsa`
  - `confidence`
  - `nakshatra`
  - `pada`
  - `rashi`
  - `lagna`
  - `moonLongitude`
  - `latitude`
  - `longitude`
  - `timeZone`
  - `computedAt`

### Match-level cached result

Suggested addition to match or comparison results:

- `porondam`
  - `version`
  - `score`
  - `maxScore`
  - `confidence`
  - `summary`
  - `factors`
  - `computedAt`

This lets us cache compatibility instead of recalculating it on every page load.

## Matching Model

We should keep a two-layer result model.

### Layer 1: Traditional astrology compatibility

This is the real Porondam engine.

### Layer 2: Practical relationship fit

This is the modern product layer we already have:

- age preference fit
- district and migration fit
- values and profession fit
- verification and trust readiness

This means the app should show:

- `Traditional Porondam`
- `Practical fit`
- `Overall match overview`

That is stronger than replacing everything with a single astrology number.

## Recommended Traditional Factor Set

Exact factor traditions vary between families and astrologers. So the rule engine should be configurable.

### Phase 1: Core traditional factor set

Start with a smaller, credible factor set:

- Dina or Nakath compatibility
- Gana
- Mahendra
- Sthree Deerga
- Yoni
- Rashi
- Rashi Adhipathi
- Rajju
- Vasya
- Vedha

### Phase 2: Expanded factor set

Once the core engine is trusted, extend toward the broader 20-porondam tradition where needed.

The important point is:

- do not hardcode one family tradition as the only truth forever
- do not overpromise exactness before we validate the rule set

## Confidence Model

Every compatibility result should include confidence.

### High confidence

- both sides have exact birth date
- exact birth time
- place is normalized successfully
- chart calculation succeeded cleanly

### Medium confidence

- both sides have birth date and place
- one or both times are approximate
- only some factors can be trusted fully

### Low confidence

- birth time is missing or unreliable
- lagna or house-sensitive factors are not dependable
- result should remain a limited preview only

This confidence must be visible in the UI.

## Missing Birth Time Strategy

This is important and should be explicit.

If birth time is missing:

- do not block the user entirely
- compute only the factors that can still be defended
- clearly label the result as partial or low confidence

Recommended behavior:

- still compute Moon-based and date-based factors where appropriate
- do not overstate lagna-based or house-based conclusions
- prompt the user to improve birth-time accuracy for a better result

## User Experience Surfaces

### Profile detail page

On [apps/web/components/profile-detail-page.tsx](/Users/Dileepa/Personal/Marriage%20Platform/b_sA1vTdFYTQP-1774524967030/apps/web/components/profile-detail-page.tsx):

- replace or evolve the current launch-stage compatibility block
- show:
  - overall result
  - astrology confidence
  - top factor explanations
  - practical fit summary

### Saved profiles

On [apps/web/app/saved/page.tsx](/Users/Dileepa/Personal/Marriage%20Platform/b_sA1vTdFYTQP-1774524967030/apps/web/app/saved/page.tsx):

- show a shortlist-friendly compatibility summary
- allow a `recalculate` action if one side updated birth details
- pair well with family notes and share flows

### Biodata builder

On [apps/web/components/biodata-builder.tsx](/Users/Dileepa/Personal/Marriage%20Platform/b_sA1vTdFYTQP-1774524967030/apps/web/components/biodata-builder.tsx):

- make birth-data completeness clearer
- show when the profile is `Porondam ready`
- ask for exact time gently, not aggressively

### Reviewer tools

Reviewer or admin users do not need to manually compute results, but they should be able to:

- inspect calculation confidence
- see whether data is missing
- verify that explanations are consistent

## Service Architecture

### Suggested server modules

- `apps/web/lib/astrology/swisseph-client.ts`
  - thin wrapper around `swisseph`
- `apps/web/lib/astrology/chart-calculator.ts`
  - converts birth input into normalized chart snapshot
- `apps/web/lib/astrology/porondam-engine.ts`
  - applies traditional compatibility rules to two chart snapshots
- `apps/web/lib/astrology/porondam-explainer.ts`
  - converts factor outputs into simple user-facing language

### Suggested APIs

- `POST /api/astrology/chart`
  - compute or refresh one profile’s horoscope snapshot
- `POST /api/porondam/compare`
  - compare two profile snapshots
- `POST /api/porondam/recalculate`
  - force refresh a cached result when birth data changes

## Caching Strategy

Do not run `swisseph` fresh on every profile view.

Recommended:

- compute profile snapshot when horoscope inputs change
- cache compatibility for each pair
- invalidate cached compatibility when either profile’s horoscope inputs change

Suggested cache key:

- `profileA horoscope hash`
- `profileB horoscope hash`
- `rule version`

## Rule Versioning

This matters from day one.

We should version:

- astrology calculation assumptions
- compatibility factor set
- weight distribution
- explanation templates

Suggested field:

- `porondam.version`

That prevents confusing result drift later.

## UI Principles

- Do not frame Porondam as a hard pass/fail marriage verdict.
- Use `strong`, `promising`, `mixed`, `needs more context` style language.
- Keep the explanation calm and family-friendly.
- Show both astrology and practical-fit context.
- Always show confidence.

## Suggested Output Shape

Example:

- `overallScore`
- `overallLabel`
- `confidence`
- `traditionalScore`
- `practicalScore`
- `factors[]`
  - `key`
  - `label`
  - `status`
  - `score`
  - `note`
- `summary`
- `recommendations[]`

## Rollout Plan

### Phase 1

Upgrade the current preview without `swisseph` yet:

- tighten factor labels
- separate astrology score from practical score
- add confidence display

### Phase 2

Introduce `swisseph` and computed horoscope snapshots:

- server calculation pipeline
- normalized place/time handling
- cache profile snapshots

### Phase 3

Replace the current heuristic astrology block with real traditional factors:

- core factor set
- better explanations
- pair-level cache

### Phase 4

Add admin or reviewer diagnostics:

- factor inspection
- confidence audit
- version visibility

## Risks And Decisions To Lock Early

### Tradition variance

Different astrologers and families prioritize different Porondam sets.

Decision:

- make rules configurable
- do not present one rule set as universal truth

### Missing or weak birth time

Decision:

- support partial results
- expose confidence clearly

### Over-astrologizing the app

Decision:

- keep practical fit and trust visible beside Porondam
- do not let astrology erase the current trust-first product identity

## Acceptance Criteria For V1

- users can see a clearer compatibility result on profile detail
- the app distinguishes `traditional` and `practical` fit
- confidence is shown explicitly
- cached results update when horoscope inputs change
- missing birth time does not break the flow
- explanations are understandable to non-technical family users

## Immediate Next Implementation Step

Start with a design-and-data pass, not a package install.

1. finalize the factor set for `Phase 1`
2. define the output shape and confidence model in code
3. update the current compatibility UI to match the new model
4. only then wire in `swisseph`

That keeps the rollout stable and prevents us from adding heavy astrology infrastructure before the product contract is clear.

See also:

- [porondam-phase-1-checklist.md](/Users/Dileepa/Personal/Marriage%20Platform/b_sA1vTdFYTQP-1774524967030/docs/porondam-phase-1-checklist.md)
