# South Asian Market Value Ratio — Design

**Date:** 2026-06-12
**Status:** Approved

## Problem

Algorithm 4d (`impute_market_value`, CatBoost regressor) predicts market values purely from
performance/attribute features (age, position, ELO, stats, career stats) with no notion of
league/competition strength. As a result, South Asian players (Nepal, India, Bhutan,
Bangladesh, Pakistan) are valued almost identically to European top-5-league players for
equivalent stat lines (~€194k–202k avg across all sources currently).

This is unrealistic: a player scoring 15 goals/season in a European top-5 league would
command a far higher transfer value (~€50M) than a player with the same output in a South
Asian league (~€15–25M). The gap reflects league/market strength, not individual skill.

## Goal

Scale down predicted/seeded market values for South Asian players relative to European
players, without retraining the model or changing its relative ranking of players within
a region.

## Decision: Ratio = 1/3

Given the example (EUR 15g/season ≈ €50M, SA equivalent ≈ €15–25M):
- 1/3 → €50M × 1/3 ≈ €16.7M (close to the middle of the €15–25M range)
- 1/2 → €50M × 1/2 = €25M (top edge of the range)

1/3 lands closer to the center of the stated real-world range, so it is the chosen ratio.

## Scope

Applies to all "South Asian" sources currently seeded:

```python
SOUTH_ASIAN_SOURCES = {"nepali", "india", "bhutan", "bangladesh", "pakistan"}
SOUTH_ASIAN_VALUE_RATIO = 1 / 3
```

European players (`source == "european"`) are unaffected.

## Implementation

### 1. `services/ml-service/models/attribute_imputer.py`

- Add `SOUTH_ASIAN_SOURCES` and `SOUTH_ASIAN_VALUE_RATIO` constants near the Algorithm 4d
  section.
- Change `impute_market_value(features: dict, model, source: str | None = None) -> int`:
  after computing `pred` from the model, if `source in SOUTH_ASIAN_SOURCES`, multiply
  `pred` by `SOUTH_ASIAN_VALUE_RATIO` before rounding/clamping.
- Update the `/impute-attributes` endpoint (`ImputeRequest` + `impute_attributes()`) to
  derive `source` from the request (e.g. from `nationality`, mapping "Nepali" → "nepali",
  else pass through as given) and forward it to `impute_market_value`.

### 2. Call-site updates (pass `source` through)

All existing calls to `impute_market_value(features, model)` become
`impute_market_value(features, model, source=<value>)`:

- `scripts/seed_db.py`
  - Nepali player block → `source="nepali"`
  - European player block → `source="european"`
  - Generated international player block → `source=<country code, e.g. "india">`
- `scripts/seed_missing_players.py` → `source=<country.lower()>` (matches the `source`
  field already written to each player doc)
- `scripts/backfill_market_values.py` → fetch `source` field alongside existing projected
  fields and pass it through, so any future zero-value backfill is correct automatically.

### 3. One-time rescale script

New file: `scripts/rescale_south_asian_market_values.py`

- Connects to MongoDB (same pattern as `backfill_market_values.py`).
- For all players where `source in SOUTH_ASIAN_SOURCES`, multiply existing `marketValue`
  by `SOUTH_ASIAN_VALUE_RATIO`, round to int.
- Safe to re-run guard: not idempotent by nature (repeated runs would compound the ratio),
  so the script prints a confirmation prompt / before-after averages and is documented as
  one-time use only.
- Prints per-source before/after average `marketValue` for verification.

### 4. Documentation updates

- `SEEDING_BENCHMARK.md` — update the `marketValue` rows for Nepali/South Asian players to
  note the 1/3 ratio applied relative to European-predicted value.
- `services/ml-service/ML_SERVICE.md` — document Algorithm 4d's region-based ratio
  adjustment.
- `PLAN.md` — add a completed task entry under a new short phase noting this change.

## Out of scope

- Retraining the CatBoost model.
- Changing values for `source == "european"`.
- Sri Lanka / Maldives / other South Asian nations not currently seeded (can be added to
  `SOUTH_ASIAN_SOURCES` later if those sources are introduced).

## Testing

- Run `rescale_south_asian_market_values.py` against the dev DB and confirm:
  - South Asian sources average ≈ 1/3 of their previous value (~€65k from ~€194k for
    `nepali`, proportionally for others).
  - European average (~€200k) unchanged.
- Spot-check `impute_market_value()` directly for a Nepali vs. European player with
  identical feature vectors — Nepali result should be ~1/3 of European result.
