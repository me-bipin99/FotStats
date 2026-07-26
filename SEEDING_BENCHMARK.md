# FotNep — Data Seeding Benchmark

> **Purpose:** Reference for what gets populated automatically when you run the seed script, what requires manual input, and what is predicted at runtime by the ML service.
>
> **Seed command:**
> ```bash
> cd services/ml-service && source venv/bin/activate
> python scripts/seed_db.py
> ```

---

## Quick Status Legend

| Symbol | Meaning |
| --- | --- |
| ✅ Auto | Filled automatically by the seed script from CSV data |
| 🧮 Derived | Computed by a deterministic algorithm inside the seed script |
| 🤖 ML | Predicted by ML — either at seed time (Algorithm 4) or at request-time (Algorithms 1–3) |
| ✍️ Manual | Must be entered by hand (fixture data, credentials, etc.) |
| ❌ Missing | Not available in current CSV — shows `—` in UI |

---

## Players Collection

### Nepali Players (`source: "nepali"`)

Source files:
- `data/raw/nepali player stats with role and gender.csv` — 100 players (base stats)
- `data/raw/nepalisquad.csv` — 12 squad players (age, caps, club, cards, market value) used to enrich matching rows above

| Field | Status | How it's filled |
| --- | --- | --- |
| `name` | ✅ Auto | "Player Name" column |
| `position` (GK/DF/MF/FW) | ✅ Auto | "Position" column |
| `nationality` | ✅ Auto | Always `"Nepali"` |
| `age` | ✅ Auto | "Age" from squad CSV; default `24` if not in squad |
| `gender` | ✅ Auto | "Gender" column (`M`/`F`) |
| `currentClub` | ✅ Auto | "Current Club" from squad CSV; `"Nepal"` if not in squad |
| `nslTeam` | ✅ Auto | "NSL Team" from squad CSV; `null` if not in squad |
| `careerStats.appearances` | ✅ Auto | "Caps" (squad CSV) or "Matches Played" |
| `careerStats.goals` | ✅ Auto | "Goals" column |
| `careerStats.assists` | ✅ Auto | "Assists" column |
| `careerStats.yellowCards` | ✅ Auto | "Yellow Cards" from squad CSV; `0` if not in squad |
| `careerStats.redCards` | ✅ Auto | "Red Cards" from squad CSV; `0` if not in squad |
| `stats.pace` | 🧮 Derived | Role-template lookup (`ROLE_STATS`) → performance boost |
| `stats.shooting` | 🧮 Derived | Base + `goals/appearances × 25` boost |
| `stats.passing` | 🧮 Derived | Base + `assists/appearances × 20` boost |
| `stats.dribbling` | 🧮 Derived | Role-template only |
| `stats.defending` | 🧮 Derived | Role-template only |
| `stats.physical` | 🧮 Derived | Role-template only |
| `eloRating` | 🧮 Derived | `1600 + (avg_attr − 50) × 4` |
| `team` (ObjectId ref) | 🧮 Derived | Fuzzy-matched: nslTeam → currentClub → national team (see below) |
| `height` | 🧮 Derived | `impute_height("Nepali", position)` — nationality+position lookup table |
| `weight` | 🧮 Derived | `impute_weight(height, position)` — BMI formula |
| `preferredFoot` | 🧮 Derived | `impute_preferred_foot(name, position)` — position-weighted, MD5-seeded |
| `marketValue` | 🤖 ML | CSV market value if present and non-zero; else `impute_market_value()` — CatBoost regressor (trained separately via `train_imputer.py`); always ML-imputed at seed time; **South Asian sources (`nepali`, `india`, `bhutan`, `bangladesh`, `pakistan`) get the raw prediction × 1/3** to reflect weaker league market value vs. Europe — see [ALGORITHMS.md § 4d](./ALGORITHMS.md#4d-market-value--catboost-regressor) |

### World-Class Players (`source: "european"`)

Source: hand-curated real-player table `WORLD_CLASS_PLAYERS` in `seed_db.py` (not a CSV) —
~225 real footballers from the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, plus
the Saudi Pro League and MLS, seeded by `seed_world_class_players()`. Replaced the old fully-
synthetic 600-player generator (`seed_european_generated()`, removed 2026-07-26) which produced
fake names like "Pablo García" — this pool now backs Algorithm 2 (Player Comparison) with real
names, positions, nationalities and clubs (Messi, Haaland, Mbappé, Ronaldo, Bellingham, etc.).
Squads reflect the 2025-26 season to the best of available knowledge (spot-checked via web
search for major 2025 transfers); ages and per-stat attributes are approximated, not scraped —
treat this as a hobby comparison pool, not a live roster feed.

| Field | Status | How it's filled |
| --- | --- | --- |
| `name` | ✅ Auto | Hand-curated, real player |
| `position` (GK/DF/MF/FW) | ✅ Auto | Hand-curated |
| `nationality` | ✅ Auto | Hand-curated (e.g. `"fra FRANCE"`) |
| `age` | ✍️ Manual (approx.) | Hand-curated estimate, not exact birthdate |
| `gender` | ✅ Auto | Always `"M"` (no women's-league entries yet) |
| `currentClub` / `competition` | ✅ Auto | Hand-curated (e.g. `"Real Madrid"` / `"La Liga"`) |
| `careerStats.*` | 🧮 Derived | Randomized within a plausible range for the player's `quality` tier — not real season stats |
| `stats.*` (all 6) | 🧮 Derived | Position-template (`POS_STATS`) + `quality`-tier modifier + `±6` random variance |
| `eloRating` | 🧮 Derived | `1600 + (avg_attr − 50) × 4` |
| `team` (ObjectId ref) | ❌ Missing | These clubs are not in our Teams collection — `currentClub` text used for display |
| `height` | 🧮 Derived | `impute_height(nationality, position)` |
| `weight` | 🧮 Derived | `impute_weight(height, position)` — BMI formula |
| `preferredFoot` | 🧮 Derived | `impute_preferred_foot(name, position)` — position-weighted, MD5-seeded |
| `marketValue` | 🤖 ML | `impute_market_value()` — CatBoost regressor; unscaled (no regional ratio applied) |

### Real SAFF Opponent Internationals (`source: "india" \| "bangladesh" \| "pakistan" \| "bhutan"`)

Source: hand-curated `SAFF_REAL_PLAYERS` table in `seed_db.py` — a **deliberately conservative**
list of real internationals per opponent (13 for India, 7 for India Women, 8 Bangladesh,
5 Pakistan, 3 Bhutan) seeded by `seed_real_saff_players()`, assigned directly to their national
team. Each squad is then topped up to `TARGET_SQUAD` (20) with `seed_generated_players()`'s
existing name-pool generator, so the rest of the squad is still synthetic — this list only
covers players confidently known to be real, to avoid inventing international caps.

---

## Team Assignment Logic

`seed_real_nepal_players()` runs `_find_team_id()` for every real Nepali player in this
priority order:

```
1. nslTeam  →  fuzzy match against DB teams
2. currentClub  →  fuzzy match against DB teams
3. No match  →  team field omitted at insert time
```

Players left without a `team` (most of the ~100 — only the 12 rows in `nepalisquad.csv`
carry an explicit club) are then picked up by `_distribute_unassigned_players()`, which
round-robins them across all 21 Nepal teams by position, highest `eloRating` first. So a
real player with no club data lands on some Nepal club/national squad, not necessarily the
national team.

**Fuzzy matching rules:**
- Case-insensitive exact match first
- Strips common words (`FC`, `Club`, `SC`, `AC`, `Team`) before matching
- Substring containment check as last resort

**Currently seeded DB teams and their likeliest match sources:**

| DB Team | Likely matched from CSV |
| --- | --- |
| Nepal National Team | Squad players (M) with no club match |
| Nepal Women's National Team | Squad players (F) with no club match |
| Machhindra FC | nslTeam / currentClub = "Machhindra FC" |
| Manang Marshyangdi Club | nslTeam containing "Manang" |
| Three Star Club | nslTeam / currentClub = "Three Star Club" |
| Tribhuvan Army Club | nslTeam / currentClub = "Tribhuvan Army" |
| New Road Team | currentClub = "New Road Team" |
| APF FC | nslTeam / currentClub = "APF FC" |
| Kathmandu Rayzrs | nslTeam = "Kathmandu Rayzrs" |
| Pokhara Thunders | nslTeam = "Pokhara Thunders" |
| FC Chitwan | nslTeam = "FC Chitwan" |
| Butwal Lumbini FC | nslTeam = "Butwal Lumbini FC" |
| Dhangadi FC | nslTeam = "Dhangadi FC" |
| Jhapa FC | nslTeam = "Jhapa FC" |
| Lalitpur City FC | nslTeam = "Lalitpur City FC" |

The 7 rows above are the **NSL (Nepal Super League) franchise clubs**, added alongside the existing Martyr's Memorial A-Division clubs — same "domestic club" tier, different competition. As of 2026-07-26 `__main__` calls `seed_real_nepal_players()` before `seed_generated_players(db, drop=False)`, so real CSV-linked players (via the fuzzy-match column, or distributed if unmatched) fill the first slots of every team above, and `seed_generated_players()` only tops each squad up to 20 — previously this was a pre-existing gap where `seed_players()` was never called and every squad was 100% synthetic.

---

## Teams Collection

| Field | Status | How it's filled |
| --- | --- | --- |
| `name` | ✅ Auto | Hardcoded in `seed_teams()` |
| `country` | ✅ Auto | Hardcoded |
| `color` (hex) | ✅ Auto | Hardcoded brand color |
| `stadium` | ✅ Auto | Hardcoded (blank `""` for the 7 NSL clubs — unverified, UI falls back to `—`) |
| `coach` | ✅ Auto | Hardcoded, real coaches as of 2025 (blank `""` for the 7 NSL clubs — unverified, UI falls back to `—`) |
| `formation` | ✅ Auto | Hardcoded default |
| `founded` | ✅ Auto | Hardcoded (NSL clubs use `2021`, the league's launch year) |
| `logo` | ✅ Auto | Hardcoded — `media.api-sports.io` URL for most clubs; the 7 NSL clubs use a local `/logos/<file>` path served from `frontend/public/logos/` (source files in `data/logos/`) |
| `players` | ✅ Auto | Empty `[]` at seed time — populated via player `team` refs |

---

## Matches Collection

All 8 fixtures are hardcoded in `seed_matches()`. Run the seed again to reset to these defaults.

| Field | Status | Value |
| --- | --- | --- |
| `homeTeam` / `awayTeam` | ✅ Auto | Resolved from seeded team names → ObjectIds |
| `date` | ✅ Auto | `now ± N days` relative to seed time |
| `competition` | ✅ Auto | Hardcoded (SAFF Championship, A-Division League, etc.) |
| `status` | ✅ Auto | `upcoming` or `completed` |
| `venue` | ✅ Auto | Hardcoded stadium name |
| `homeFormation` / `awayFormation` | ✅ Auto | Hardcoded per match |
| `result` | ✅ Auto | Hardcoded for completed matches only |
| `homeLineup` / `awayLineup` | ❌ Missing | Empty `[]` at seed — filled at request time via Algorithm 3 (GET /matches/:id populates predicted lineup for upcoming matches) |
| Match prediction | 🤖 ML | Computed on demand via `POST /predict-match` (Algorithm 1) |

---

## Users Collection

| Field | Status | Value |
| --- | --- | --- |
| `email` | ✅ Auto | `admin@fotnep.com`, `demo@fotnep.com` |
| `passwordHash` | ✅ Auto | bcrypt of `fotnep2025` |
| `name` | ✅ Auto | "Admin" / "Demo User" |
| `reputation` | ✅ Auto | `80` (admin), `50` (demo) |
| `predictionsCorrect` / `predictionsTotal` | ✅ Auto | Hardcoded demo values |

> ⚠️ Remove demo credentials before deploying to production.

---

## What the ML Service Predicts at Runtime

These are **never stored by the seed script** — they are computed on demand.

| Feature | Algorithm | Endpoint | Trigger |
| --- | --- | --- | --- |
| Match outcome probability (home/draw/away %) | 1 — Crowd Consensus | `POST /predict-match` | User clicks "Run Prediction" in MatchDetails |
| Prediction confidence score | 1 — Crowd Consensus | `POST /predict-match` | Same as above |
| Player similarity score (0–100) | 2 — Cosine Similarity | `POST /compare-players` | Both players selected in Compare tab |
| Per-attribute winner breakdown | 2 — Cosine Similarity | `POST /compare-players` | Same as above |
| Optimal starting XI | 3 — ELO Greedy + GA stub | `POST /optimize-squad` | User clicks "Optimize" in Lineups tab |
| Bench recommendations | 3 — ELO Greedy + GA stub | `POST /optimize-squad` | Same as above |
| Tactical insights text | 3 — ELO Greedy + GA stub | `POST /optimize-squad` | Same as above |

---

## Re-seeding Checklist

Run this after any CSV data update or schema change:

```bash
# 1. Activate ML service virtualenv
cd services/ml-service && source venv/bin/activate

# 2. Train CatBoost market value model (only needed once, or after CSV data changes)
python scripts/train_imputer.py
# Output: trained_models/market_value_catboost.pkl

# 3. Run seed (drops and re-creates players, teams, matches, users)
#    Populates height, weight, preferredFoot, marketValue via Algorithm 4
python scripts/seed_db.py

# 3. Verify counts (after seed_db.py + seed_missing_players.py)
# Expected output:
#   Players : ~745  (420 nepali [100 real + 320 generated] + 225 world-class + 100 SAFF opponents [36 real + 64 generated])
#   Teams   : 26  (21 Nepal clubs + 5 international opponents)
#   Matches : 24
#   Users   : 2

# 4. Spot-check team assignment
# In mongo shell:
#   db.players.countDocuments({ source: "nepali", team: { $exists: true } })
#   Expected: most national squad players + NSL club matches

# 5. Restart all services to clear any cached data
npm run dev   # from repo root
```

### One-time fix: South Asian market value ratio (already applied)

`scripts/rescale_south_asian_market_values.py` was run once (2026-06-12) to apply the 1/3
regional ratio to the 380 already-seeded South Asian players. **Do not re-run it** — it is
not idempotent (repeated runs compound the ratio). A fresh `seed_db.py` run already bakes
the ratio in via `impute_market_value(..., source=...)`, so this script is only needed if
restoring from a pre-2026-06-12 database dump.

### Fields that will NOT be reset by re-seeding

The seed script does **not** touch the `votes` or `predictions` collections. Cast votes and stored predictions survive a re-seed. To fully reset:

```bash
# In mongo shell (fotnep1 db):
db.votes.drop()
db.predictions.drop()
```

---

## Adding New Fields to Players

To add a new player field:

1. Add the column to the source CSV (or add imputation logic to `models/attribute_imputer.py`)
2. Read/compute it in `seed_real_nepal_players()` (real Nepali CSV data) or `WORLD_CLASS_PLAYERS`/`seed_world_class_players()` (curated real world players), whichever pool the field applies to, inside `seed_db.py`
3. Add it to the player document dict
4. Add the field to `backend/src/models/Player.ts` (Mongoose schema)
5. Add it to `ApiPlayer` interface in `frontend/src/services/api.ts`
6. Map it in `adaptPlayer()` if the frontend `Player` type needs it
7. Update this file with the new field's status row

---

**Last Updated:** 2026-07-26
**Seed produces:** 745 players — 420 nepali (100 real from CSV + 320 generated fill-in), 225 world-class (real, curated, top-5-league + Saudi Pro League + MLS players), 100 SAFF opponents (36 real internationals + 64 generated fill-in) · 26 teams (21 Nepal clubs, incl. the 7 NSL franchise clubs added 2026-07-26, + 5 international opponents) · 24 matches · 2 users. Every Nepal club and SAFF opponent squad is now real-players-first, generated-fill-in-second (previously 100% synthetic — see "Team Assignment Logic" above). Market values are ML-imputed at seed time for all players; run `backfill_market_values.py` once to fix any existing players with `marketValue == 0`.
**Current avg marketValue by source:** european €199,927 · nepali €64,610 · india €67,364 · pakistan €63,857 · bangladesh €62,414 · bhutan €60,338 (South Asian sources = 1/3 of CatBoost prediction, per Algorithm 4d).
