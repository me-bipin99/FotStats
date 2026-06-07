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
- `data/raw/nepali player stats with role and gender.csv` — 102 players (base stats)
- `data/raw/nepalisquad.csv` — 74 national squad players (age, caps, club, cards, market value)

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
| `marketValue` | 🤖 ML | CSV value if non-zero; else `impute_market_value()` — CatBoost regressor |

### European Players (`source: "european"`)

Source file: `data/players_data-2025_2026.csv` — ~2780 players (top 5 European leagues)

| Field | Status | How it's filled |
| --- | --- | --- |
| `name` | ✅ Auto | "Player" column |
| `position` (GK/DF/MF/FW) | ✅ Auto | Mapped from "Pos" (e.g. `"MF,FW"` → `MF`) |
| `nationality` | ✅ Auto | "Nation" column (e.g. `"eng ENG"`, `"us USA"`) |
| `age` | ✅ Auto | "Age" column |
| `gender` | ✅ Auto | Always `"M"` (dataset is men's top-5 leagues) |
| `currentClub` | ✅ Auto | "Squad" column (e.g. `"Bayern Munich"`) |
| `careerStats.appearances` | ✅ Auto | "MP" column |
| `careerStats.goals` | ✅ Auto | "Gls" column |
| `careerStats.assists` | ✅ Auto | "Ast" column |
| `careerStats.yellowCards` | ✅ Auto | "CrdY" column |
| `careerStats.redCards` | ✅ Auto | "CrdR" column |
| `stats.*` (all 6) | 🧮 Derived | Position-template (`POS_STATS`) + performance boost + `±6` random variance |
| `eloRating` | 🧮 Derived | `1600 + (avg_attr − 50) × 4` |
| `team` (ObjectId ref) | ❌ Missing | European clubs are not in our Teams collection — `currentClub` text used for display |
| `height` | 🧮 Derived | `impute_height(nationality, position)` — nationality+position lookup table |
| `weight` | 🧮 Derived | `impute_weight(height, position)` — BMI formula |
| `preferredFoot` | 🧮 Derived | `impute_preferred_foot(name, position)` — position-weighted, MD5-seeded |
| `marketValue` | 🤖 ML | `impute_market_value()` — CatBoost regressor (0 if model not yet trained) |

---

## Team Assignment Logic

The seed script runs `_find_team_id()` for every Nepali player in this priority order:

```
1. nslTeam  →  fuzzy match against DB teams
2. currentClub  →  fuzzy match against DB teams
3. player in nepalisquad.csv + gender M  →  "Nepal National Team"
4. player in nepalisquad.csv + gender F  →  "Nepal Women's National Team"
5. No match  →  team field omitted (club shows via currentClub text)
```

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

---

## Teams Collection

| Field | Status | How it's filled |
| --- | --- | --- |
| `name` | ✅ Auto | Hardcoded in `seed_teams()` |
| `country` | ✅ Auto | Hardcoded |
| `color` (hex) | ✅ Auto | Hardcoded brand color |
| `stadium` | ✅ Auto | Hardcoded |
| `coach` | ✅ Auto | Hardcoded (real coaches as of 2025) |
| `formation` | ✅ Auto | Hardcoded default |
| `founded` | ✅ Auto | Hardcoded |
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
| `voteCounts` | ✅ Auto | Hardcoded demo votes for completed matches |
| `homeLineup` / `awayLineup` | ❌ Missing | Empty `[]` at seed — filled via Algorithm 3 or manually |
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

# 3. Verify counts
# Expected output:
#   Players : 2879+  (102 Nepali + ~2780 European)
#   Teams   : 8
#   Matches : 8
#   Users   : 2

# 4. Spot-check team assignment
# In mongo shell:
#   db.players.countDocuments({ source: "nepali", team: { $exists: true } })
#   Expected: most national squad players + NSL club matches

# 5. Restart all services to clear any cached data
npm run dev   # from repo root
```

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
2. Read/compute it in `seed_players()` inside `seed_db.py`
3. Add it to the player document dict
4. Add the field to `backend/src/models/Player.ts` (Mongoose schema)
5. Add it to `ApiPlayer` interface in `frontend/src/services/api.ts`
6. Map it in `adaptPlayer()` if the frontend `Player` type needs it
7. Update this file with the new field's status row

---

**Last Updated:** 2026-06-07
**Seed produces:** ~2879 players · 8 teams · 8 matches · 2 users
