# ML Service Documentation

**Location:** `/services/ml-service/`  
**Port:** 8000  
**Framework:** FastAPI + Python 3.8+  
**Algorithms:** KNN, K-Means, Naive Bayes, ELO, Genetic Algorithm

## Quick Start

```bash
cd services/ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Visit: http://localhost:8000/docs (interactive Swagger UI)

## Architecture

```
ml-service/
├── main.py                    # FastAPI app & route definitions
├── models/
│   ├── __init__.py
│   ├── consensus.py          # Algorithm 1: Crowd Consensus Prediction
│   ├── player_estimator.py   # Algorithm 2: Player Performance Estimator
│   ├── squad_optimizer.py    # Algorithm 3: Optimal Squad Generator
│   ├── attribute_imputer.py  # Algorithm 4: Player Attribute Imputer (height/weight/foot/marketValue)
│   ├── knn_model.py          # KNN implementation (used by Algorithm 2)
│   ├── kmeans_model.py       # K-Means implementation (clustering)
│   ├── naive_bayes_model.py  # Naive Bayes implementation
│   ├── elo_model.py          # ELO rating system
│   └── genetic_algorithm.py  # Genetic algorithm for lineups
├── scripts/
│   ├── __init__.py
│   ├── seed_db.py            # MongoDB seeding script (calls all 4 attribute imputers)
│   ├── train_imputer.py      # Train CatBoost market value model from CSVs → trained_models/market_value_catboost.pkl
│   ├── train_models.py       # Train ML models on player data
│   └── data_processor.py     # Load and process CSV data
├── config/
│   ├── __init__.py
│   ├── settings.py           # Environment variables & config
│   ├── database.py           # MongoDB connection
│   └── model_loader.py       # Singleton model caching
├── utils/
│   ├── __init__.py
│   ├── validators.py         # Input validation
│   ├── formatters.py         # Response formatting
│   └── logger.py             # Logging setup
├── requirements.txt          # Python dependencies
├── .env                       # Environment variables
└── tests/                     # Unit tests (pytest)
    ├── test_consensus.py
    ├── test_player_estimator.py
    └── test_squad_optimizer.py
```

## API Endpoints

All endpoints require valid request JSON. See `backend/openapi.yaml` for full spec.

### POST /impute-attributes
**Algorithm 4: Player Attribute Imputer**

On-demand imputation of missing player attributes. Primary use is at seed time via `seed_db.py`; this endpoint enables single-player on-demand prediction.

Input:
```json
{
  "name": "Tej Tamang",
  "nationality": "Nepali",
  "position": "MF",
  "age": 27,
  "eloRating": 1612,
  "appearances": 27,
  "goals": 1,
  "assists": 2,
  "stats": { "pace": 65, "shooting": 58, "passing": 72, "dribbling": 67, "defending": 58, "physical": 62 }
}
```

Output:
```json
{
  "height": 171,
  "weight": 71,
  "preferredFoot": "Right",
  "marketValue": 18400
}
```

### POST /predict-match
**Algorithm 1: Crowd Consensus Prediction**

Input:
```json
{
  "matchId": "match_123",
  "votes": [
    { "userId": "user_1", "outcome": "home_win", "reputation": 85 },
    { "userId": "user_2", "outcome": "draw", "reputation": 65 },
    { "userId": "user_3", "outcome": "home_win", "reputation": 92 }
  ]
}
```

Logic (consensus.py):
```
1. For each outcome (home_win, draw, away_win):
   - Sum reputation of users voting for that outcome
   - Divide by total reputation across all votes
2. Calculate confidence as inverse of variance in vote distribution
3. Return probabilities + confidence + vote breakdown
```

Output:
```json
{
  "matchId": "match_123",
  "prediction": {
    "homeWinProb": 0.58,
    "drawProb": 0.22,
    "awayWinProb": 0.20
  },
  "confidence": 78,
  "voteBreakdown": {
    "homeWin": 2,
    "draw": 1,
    "awayWin": 0
  }
}
```

### POST /compare-players
**Algorithm 2: Player Performance Estimator**

Input:
```json
{
  "playerAId": "player_1",
  "playerBId": "player_2"
}
```

Logic (player_estimator.py):
```
1. Load Player A and B stats from MongoDB
2. Use KNN (k=5) on player dataset to find similar players
3. Fill missing stats with benchmark averages from similar players
4. Normalize stats across competitions/time periods (zscore)
5. Calculate similarity score (0-100) using cosine similarity
6. Attribute-by-attribute comparison
7. Generate tactical pairing insights (if similar positions)
```

Output:
```json
{
  "playerA": { "id": "player_1", "name": "...", "stats": {...} },
  "playerB": { "id": "player_2", "name": "...", "stats": {...} },
  "similarityScore": 78,
  "attributeComparison": {
    "pace": { "playerA": 88, "playerB": 82 },
    "shooting": { "playerA": 92, "playerB": 88 },
    ...
  },
  "tacticalPairing": "Both strong wingers, excellent chemistry on right flank",
  "strengths": {
    "playerA": ["Pace", "Dribbling"],
    "playerB": ["Passing", "Defending"]
  }
}
```

### POST /optimize-squad
**Algorithm 3: Optimal Squad Generator**

Input:
```json
{
  "teamId": "team_1",
  "availablePlayerIds": ["player_1", "player_2", ..., "player_23"],
  "formationPreference": "4-3-3",
  "constraints": {
    "injured": ["player_10"],
    "suspended": ["player_5"]
  }
}
```

Logic (squad_optimizer.py):
```
1. Filter available players (remove injured/suspended)
2. Load team's recent match lineups from MongoDB
3. Use K-Means clustering to group players by position/role
4. Use Genetic Algorithm to evolve lineups:
   - Population: 100 random valid lineups
   - Fitness: 
     * Historical win rate with this XI
     * Player chemistry (players who've played together)
     * Formation constraint satisfaction
     * ELO rating strength (higher = better)
   - Crossover: Mix high-fitness lineups
   - Mutation: Swap players
   - Iterations: 50-100 generations
5. Return top lineup with confidence (fitness score normalized)
6. If formation preference not provided, suggest best formation
7. Generate tactical insights (key combinations, chemistry notes)
```

Output:
```json
{
  "teamId": "team_1",
  "startingXI": [
    { "playerId": "player_1", "playerName": "X", "position": "GK", "shirtNumber": 1, "bench": false },
    { "playerId": "player_2", "playerName": "Y", "position": "DF", "shirtNumber": 2, "bench": false },
    ...
  ],
  "bench": [
    { "playerId": "player_20", "playerName": "Z", "position": "FW", "shirtNumber": 20, "bench": true },
    ...
  ],
  "formation": "4-3-3",
  "confidence": 87,
  "tacticalInsights": [
    "Players 2 and 3 have 156 minutes together with 100% win rate",
    "Formation 4-3-3 successful in 8/10 recent matches",
    "FW partnership offers strong balance of pace and technical ability"
  ],
  "keyMissingPlayers": [
    { "playerId": "player_10", "playerName": "Star Striker", "reason": "injured" }
  ]
}
```

## Data Models

### Player Data Requirements

From `/data/raw/nepali_players.csv`:
```csv
name,position,age,nationality,gender,team,height,weight,marketValue,appearances,goals,assists,pace,shooting,passing,dribbling,defending,physical
Ronaldo,FW,37,Portugal,M,Manchester United,187,84,2000000,150,140,42,88,92,82,87,35,78
```

**Notes:**
- `pace, shooting, passing, dribbling, defending, physical` are 0-100 scores
- If missing, ML models predict using KNN/benchmarks
- `gender` used for fair comparison (don't compare M vs F directly without noting)

### Data Processing (data_processor.py)

```python
class DataProcessor:
    def load_nepali_players(path: str) -> List[Player]:
        """Load Nepali players from /data/raw"""
        
    def load_european_players(path: str) -> List[Player]:
        """Load European comparison dataset"""
        
    def normalize_stats(stats: Dict) -> Dict:
        """Z-score normalization (mean=0, std=1)"""
        
    def fill_missing_stats(player: Player) -> Player:
        """Use KNN to predict missing attributes"""
```

### Model Training (train_models.py)

```python
# KNN Model
from sklearn.neighbors import KNeighborsRegressor
knn = KNeighborsRegressor(n_neighbors=5)
knn.fit(X_train, y_train)  # Trained on player stats

# K-Means Clustering
from sklearn.cluster import KMeans
kmeans = KMeans(n_clusters=6)  # 6 role clusters (GK, CB, LB/RB, CM, LW/RW, ST)
kmeans.fit(X)

# Naive Bayes
from sklearn.naive_bayes import GaussianNB
nb = GaussianNB()
nb.fit(X_train, y_train)  # Predict match outcomes

# Models saved to pickle files for quick loading
pickle.dump(knn, open('models/knn.pkl', 'wb'))
```

### Model Loader (config/model_loader.py)

Singleton pattern for efficient model caching:
```python
class ModelLoader:
    _instance = None
    _models = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_models()
        return cls._instance
    
    def _load_models(self):
        """Load all pickle files on first use"""
        self._models['knn'] = pickle.load(open('models/knn.pkl', 'rb'))
        self._models['kmeans'] = pickle.load(open('models/kmeans.pkl', 'rb'))
        # etc.
    
    def get(self, name: str):
        return self._models.get(name)

# Usage in routes
loader = ModelLoader()
knn_model = loader.get('knn')
```

## Algorithms in Detail

### Algorithm 1: Consensus.py

```python
def predict_match(match_id: str, votes: List[Vote]) -> MatchPrediction:
    """
    Reputation-weighted voting aggregation
    """
    total_rep = sum(v['reputation'] for v in votes)
    
    home_win_prob = sum(v['reputation'] for v in votes if v['outcome'] == 'home_win') / total_rep
    draw_prob = sum(v['reputation'] for v in votes if v['outcome'] == 'draw') / total_rep
    away_win_prob = sum(v['reputation'] for v in votes if v['outcome'] == 'away_win') / total_rep
    
    # Confidence = inverse of variance (tight consensus = high confidence)
    votes_array = [home_win_prob, draw_prob, away_win_prob]
    variance = np.var(votes_array)
    confidence = max(0, min(100, (1 - variance) * 100))
    
    return {
        'prediction': {
            'homeWinProb': home_win_prob,
            'drawProb': draw_prob,
            'awayWinProb': away_win_prob
        },
        'confidence': confidence,
        'voteBreakdown': {
            'homeWin': len([v for v in votes if v['outcome'] == 'home_win']),
            'draw': len([v for v in votes if v['outcome'] == 'draw']),
            'awayWin': len([v for v in votes if v['outcome'] == 'away_win'])
        }
    }
```

### Algorithm 2: player_estimator.py

```python
def compare_players(player_a_id: str, player_b_id: str) -> PlayerComparison:
    """
    KNN-based player similarity comparison
    """
    # Fetch players from DB
    player_a = db.players.findOne({'_id': player_a_id})
    player_b = db.players.findOne({'_id': player_b_id})
    
    # Fill missing stats using KNN
    knn = loader.get('knn')
    stats_a = fill_stats(player_a, knn)
    stats_b = fill_stats(player_b, knn)
    
    # Normalize
    stats_a_norm = normalize_stats(stats_a)
    stats_b_norm = normalize_stats(stats_b)
    
    # Cosine similarity
    similarity = cosine_similarity(stats_a_norm, stats_b_norm) * 100
    
    # Attribute comparison
    attributes = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical']
    comparison = {attr: {'playerA': stats_a[attr], 'playerB': stats_b[attr]} for attr in attributes}
    
    return {
        'playerA': player_a,
        'playerB': player_b,
        'similarityScore': similarity,
        'attributeComparison': comparison,
        'tacticalPairing': generate_insights(player_a, player_b, similarity),
        'strengths': analyze_strengths(stats_a_norm, stats_b_norm)
    }
```

### Algorithm 3: squad_optimizer.py (Genetic Algorithm)

```python
def optimize_squad(team_id: str, available_players: List[str], 
                  formation: str, constraints: Dict) -> SquadOptimization:
    """
    Genetic algorithm for lineup optimization
    """
    # Filter constraints
    available = [p for p in available_players if p not in constraints['injured'] + constraints['suspended']]
    
    # K-Means position clustering
    kmeans = loader.get('kmeans')
    position_clusters = kmeans.predict(player_stats)  # 0=GK, 1=CB, 2=LB/RB, etc.
    
    # Genetic Algorithm
    population_size = 100
    population = [generate_random_lineup(available, formation, position_clusters) for _ in range(population_size)]
    
    for generation in range(50):  # 50 iterations
        # Evaluate fitness
        fitness_scores = [
            calculate_fitness(lineup, team_id, available_players)
            for lineup in population
        ]
        
        # Select top 50% (tournament selection)
        top_individuals = sorted(zip(population, fitness_scores), key=lambda x: x[1], reverse=True)[:50]
        
        # Crossover (breed top lineups)
        offspring = []
        for i in range(25):
            parent1, parent2 = top_individuals[i][0], top_individuals[(i+1) % 50][0]
            child = crossover(parent1, parent2)
            offspring.append(child)
        
        # Mutation (random player swaps)
        for child in offspring:
            if random.random() < 0.2:  # 20% mutation rate
                mutate(child, available, position_clusters)
        
        # New population
        population = [p[0] for p in top_individuals] + offspring
    
    # Best lineup
    best_lineup = max(population, key=lambda l: calculate_fitness(l, team_id, available_players))
    best_fitness = calculate_fitness(best_lineup, team_id, available_players)
    confidence = (best_fitness / 100) * 100  # Normalize to 0-100
    
    return {
        'startingXI': format_lineup(best_lineup, 'XI'),
        'bench': format_lineup(best_lineup, 'bench'),
        'formation': formation,
        'confidence': confidence,
        'tacticalInsights': generate_insights_for_lineup(best_lineup, team_id),
        'keyMissingPlayers': list_unavailable(team_id, constraints)
    }

def calculate_fitness(lineup: List[str], team_id: str, all_players: List[str]) -> float:
    """
    Fitness = historical win rate + chemistry bonus + formation fit + strength
    """
    # Historical: Did this XI win last time?
    history_matches = db.matches.find({'homeLineup': lineup, 'status': 'completed'})
    win_rate = len([m for m in history_matches if m['result']['homeScore'] > m['result']['awayScore']]) / len(history_matches)
    
    # Chemistry: Players who've played together
    chemistry_bonus = 0
    for i, p1 in enumerate(lineup):
        for p2 in lineup[i+1:]:
            together_matches = db.matches.find({
                'homeLineup': {'$all': [p1, p2]},
                'status': 'completed'
            })
            if together_matches:
                chemistry_bonus += 0.1  # Small bonus per partnership
    
    # Strength: Sum of ELO ratings
    strength = sum(db.players.findOne({'_id': p})['eloRating'] for p in lineup)
    strength_normalized = strength / (11 * 2400)  # Normalize by max ELO
    
    # Formation fit: Does this formation suit the team historically?
    formation_success = db.matches.find({
        'homeTeam': team_id,
        'homeFormation': get_formation(lineup),
        'status': 'completed'
    })
    # (calculate win rate with this formation)
    
    return 0.4 * win_rate + 0.2 * chemistry_bonus + 0.2 * strength_normalized + 0.2 * formation_fit
```

## Seeding Script (scripts/seed_db.py)

Run order: `seed_teams` → build `team_lookup` → `seed_players(team_lookup)` → `seed_demo_users` → `seed_matches` → `seed_indexes`.

**What is auto-filled at seed time** (see `SEEDING_BENCHMARK.md` at repo root for full table):

| Field | Source |
|---|---|
| name, position, nationality, age, gender | Raw CSV columns |
| 6 attributes (pace/shooting/…/physical) | `_stats_from_role()` — role-template lookup + `_apply_performance_boost()` from goals/assists/appearances |
| eloRating | `_elo_from_stats()` — avg attribute score mapped to 1600 base |
| careerStats (appearances/goals/assists/cards) | CSV columns |
| currentClub | CSV "Current Club" / "Squad" column (stored as plain text for display fallback) |
| team (ObjectId ref) | `_find_team_id()` — fuzzy-matches nslTeam → currentClub → national team for squad members |

**Team assignment logic** (`_find_team_id`):
1. Try `nslTeam` → DB team (exact then partial match, strips FC/Club/Team suffixes)
2. Try `currentClub` → DB team
3. If player is in `nepalisquad.csv` and no club matched → assign to "Nepal National Team" (M) or "Nepal Women's National Team" (F)
4. European players: no `team` ref (not in our DB); `currentClub` text used for display only

```bash
cd services/ml-service && source venv/bin/activate
# First time: train CatBoost model, then seed
python scripts/train_imputer.py   # writes trained_models/market_value_catboost.pkl
python scripts/seed_db.py         # seeds all players with height/weight/preferredFoot/marketValue
```

## Environment Variables (.env)

```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/fotnep
PYTHONUNBUFFERED=1
LOG_LEVEL=INFO
```

## Testing

```bash
python -m pytest                    # Run all tests
python -m pytest -v                 # Verbose
python -m pytest --cov=models       # Coverage report
python -m pytest tests/test_consensus.py  # Single test file
```

Example test:
```python
def test_predict_match():
    votes = [
        {'userId': 'u1', 'outcome': 'home_win', 'reputation': 100},
        {'userId': 'u2', 'outcome': 'away_win', 'reputation': 50}
    ]
    result = predict_match('match_1', votes)
    
    assert result['prediction']['homeWinProb'] == pytest.approx(2/3, 0.01)
    assert result['confidence'] > 0
```

## Common Development Tasks

### Seed database
```bash
python scripts/seed_db.py
```

### Train models (on real data)
```bash
python scripts/train_models.py
```

### Run tests
```bash
python -m pytest
```

### Code formatting
```bash
python -m black .
python -m flake8 .
```

## Deployment

1. Set production `.env`
2. Run: `python -m uvicorn main:app --port 8000 --workers 4`
3. Or Docker: `docker build -t fotnep-ml .`

## Integration with Backend

The backend calls this service via HTTP:
```python
# backend/src/services/mlIntegration.ts
async function callML(endpoint: string, payload: any) {
  const response = await fetch(`http://localhost:8000${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`ML service error: ${response.statusText}`);
  return response.json();
}
```

---

**Status:** To be implemented  
**Priority:** High - Algorithms are core to the platform
