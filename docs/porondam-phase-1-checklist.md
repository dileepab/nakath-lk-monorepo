# Porondam Phase 1 Checklist

This checklist translates [porondam-matching-spec.md](/Users/Dileepa/Personal/Marriage%20Platform/b_sA1vTdFYTQP-1774524967030/docs/porondam-matching-spec.md) into the first implementation pass for the existing app.

The purpose of Phase 1 is not to install `swisseph` yet. The purpose is to make the current compatibility layer clearer, more stable, and ready for a real astrology engine.

## Phase 1 Goal

Turn the current launch-stage Porondam preview into a cleaner product contract with:

- explicit `traditional fit`
- explicit `practical fit`
- explicit `confidence`
- stable result shape for future server-calculated astrology

## Current Phase 1 Scope

### 1. Lock the factor set

- Keep one traditional preview factor for now:
  - horoscope rules
- Keep current practical factors:
  - age fit
  - values and lifestyle
  - location and future plans
  - trust readiness

This is intentionally not the final traditional factor set. It is the bridge between the launch heuristic and the real Porondam engine.

### 2. Lock the output contract

The shared result should expose:

- overall total
- overall label
- confidence
- confidence note
- traditional score and max
- practical score and max
- section summaries
- factor list with `group`

### 3. Update the primary UI surfaces

- profile detail
- browse cards
- reviewer comparison view

### 4. Keep terminology stable

Use these terms consistently:

- `Traditional fit`
- `Practical fit`
- `Confidence`
- `Porondam preview`

Avoid presenting the current result as a final astrology verdict.

## Phase 1 Deliverables

### Done in this pass

- shared Porondam result shape updated
- confidence surfaced in the result model
- factors grouped into `traditional` and `practical`
- profile detail UI updated
- browse-card summary updated
- reviewer comparison UI updated

## Remaining Phase 1 Tasks

### Product and data tasks

- add birth-data accuracy field
  - exact
  - approximate
  - unknown-time
- make `Porondam ready` status clearer in biodata builder
- decide first visible confidence wording for public and family views

### UI polish tasks

- show better confidence color treatment
- add a small explanation tooltip for `traditional` vs `practical`
- make factor ordering deterministic and deliberate in all views

### Technical tasks before `swisseph`

- define computed horoscope snapshot type
- define compatibility cache record type
- define version field for Porondam engine outputs
- define invalidation rule when birth data changes

## Phase 2 Entry Criteria

Do not start `swisseph` integration until all of these are true:

- UI copy is stable enough to keep
- confidence model is accepted
- output shape is accepted
- we know exactly which inputs are required
- we have a clear place to store computed horoscope snapshots

## Phase 2 Preview

Phase 2 will introduce:

- server-side `swisseph`
- normalized birth-place handling
- computed horoscope snapshots
- first real traditional-factor engine

## Decision Notes

- Keep one-platform architecture
- Keep Porondam inside matrimony, not as a separate app
- Keep practical fit visible beside astrology
- Treat the current preview as a structured bridge, not a dead-end implementation
