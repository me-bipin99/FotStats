"""
Model loader singleton — initializes all ML models once at startup.
Fit KNN, train K-Means, load Naive Bayes, and initialize Genetic Algorithm.
"""

import logging
from pathlib import Path
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

# Singleton instances
_comparator = None
_clusterer = None
_predictor = None
_optimizer = None

# Module-level imports (lazy — only import when needed)
def _ensure_models_available():
    """Ensure all model modules can be imported"""
    try:
        global _comparator, _clusterer, _predictor, _optimizer
        if _comparator is None:
            from models.knn_comparator import NepaliPlayerComparator
            from models.player_clusterer import PlayerClusterer
            from models.match_predictor import MatchPredictor
            from models.genetic_optimizer import SquadOptimizer
    except ImportError as e:
        logger.error(f"Failed to import model modules: {e}")
        raise


def init_models():
    """
    Initialize all ML models at startup.
    Call this once in main.py lifespan startup block.
    Estimated time: 3-5 seconds (mainly loading EUR CSV and fitting KNN).
    """
    global _comparator, _clusterer, _predictor, _optimizer

    try:
        logger.info("Initializing ML models...")

        # Import model classes
        from models.knn_comparator import NepaliPlayerComparator
        from models.player_clusterer import PlayerClusterer
        from models.match_predictor import MatchPredictor
        from models.genetic_optimizer import SquadOptimizer

        # Get data directory
        PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
        DATA_DIR = PROJECT_ROOT / "data"
        EUR_CSV = DATA_DIR / "players_data-2025_2026.csv"

        # 1. Initialize KNN Comparator (fit on European CSV)
        logger.info("Loading and fitting KNN Comparator on European player data...")
        eur_df = pd.read_csv(EUR_CSV, low_memory=False)
        eur_df = eur_df.loc[:, ~eur_df.columns.duplicated()]  # Remove duplicate columns

        _comparator = NepaliPlayerComparator()
        _comparator.fit(eur_df)
        logger.info(f"✓ KNN Comparator fitted on {len(eur_df)} European players")

        # 2. Initialize K-Means Clusterer (train on European CSV)
        logger.info("Training K-Means Clusterer...")
        _clusterer = PlayerClusterer()

        # Feature columns for clustering
        feature_cols = ["Gls", "Ast", "Min", "Sh", "SoT", "CrdY", "CrdR"]
        features = []
        for idx, row in eur_df.iterrows():
            feature_vec = [
                float(row.get("Gls", 0) or 0),
                float(row.get("Ast", 0) or 0),
                float(row.get("Min", 0) or 0),
                float(row.get("Sh", 0) or 0),
                float(row.get("SoT", 0) or 0),
                float(row.get("CrdY", 0) or 0),
                float(row.get("CrdR", 0) or 0),
            ]
            features.append(feature_vec)

        _clusterer.train(features)
        logger.info("✓ K-Means Clusterer trained on 6 clusters")

        # 3. Initialize Naive Bayes Predictor
        logger.info("Initializing Naive Bayes Match Predictor...")
        _predictor = MatchPredictor()
        logger.info("✓ Naive Bayes Predictor ready")

        # 4. Initialize Genetic Algorithm Optimizer
        logger.info("Initializing Genetic Algorithm Optimizer...")
        _optimizer = SquadOptimizer(population_size=100, generations=50, mutation_rate=0.1)
        logger.info("✓ Genetic Algorithm Optimizer ready")

        logger.info("✅ All ML models initialized successfully!")

    except Exception as e:
        logger.error(f"❌ Failed to initialize models: {e}")
        raise


def get_comparator():
    """Get KNN Comparator singleton"""
    if _comparator is None:
        raise RuntimeError("KNN Comparator not initialized. Call init_models() first.")
    return _comparator


def get_clusterer():
    """Get K-Means Clusterer singleton"""
    if _clusterer is None:
        raise RuntimeError("K-Means Clusterer not initialized. Call init_models() first.")
    return _clusterer


def get_predictor():
    """Get Naive Bayes Predictor singleton"""
    if _predictor is None:
        raise RuntimeError("Naive Bayes Predictor not initialized. Call init_models() first.")
    return _predictor


def get_optimizer():
    """Get Genetic Algorithm Optimizer singleton"""
    if _optimizer is None:
        raise RuntimeError("Genetic Algorithm Optimizer not initialized. Call init_models() first.")
    return _optimizer
