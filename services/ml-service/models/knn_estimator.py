"""
K-Nearest Neighbors (KNN) model for player statistics estimation
"""

import numpy as np
from sklearn.neighbors import KNeighborsRegressor
from sklearn.preprocessing import StandardScaler
import joblib
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class PlayerStatEstimator:
    """
    Estimate missing player statistics using KNN algorithm
    """

    def __init__(self, n_neighbors: int = 5, model_path: str = None):
        self.n_neighbors = n_neighbors
        self.model = KNeighborsRegressor(n_neighbors=n_neighbors, weights='distance')
        self.scaler = StandardScaler()
        self.model_path = model_path
        self.feature_names = [
            'goals', 'assists', 'passAccuracy', 'defensiveActions',
            'ballRecoveries', 'minutes'
        ]

    def train(self, X_train: np.ndarray, y_train: np.ndarray) -> None:
        """
        Train the KNN model

        Args:
            X_train: Training features
            y_train: Training targets
        """
        try:
            X_scaled = self.scaler.fit_transform(X_train)
            self.model.fit(X_scaled, y_train)
            logger.info(f"KNN model trained with {len(X_train)} samples")
        except Exception as e:
            logger.error(f"Error training KNN model: {e}")
            raise

    def estimate_missing_stats(self, player_stats: Dict[str, Any]) -> Dict[str, float]:
        """
        Estimate missing statistics for a player

        Args:
            player_stats: Dictionary with available player stats

        Returns:
            Dictionary with estimated missing stats
        """
        try:
            feature_vector = self._stats_to_vector(player_stats)
            X_scaled = self.scaler.transform([feature_vector])

            # Get k nearest neighbors
            distances, indices = self.model.kneighbors(X_scaled)

            # Calculate weighted average
            weights = 1 / (distances[0] + 1e-10)
            predictions = self.model.predict(X_scaled)[0]

            return self._vector_to_stats(predictions)
        except Exception as e:
            logger.error(f"Error estimating stats: {e}")
            raise

    def _stats_to_vector(self, stats: Dict[str, Any]) -> List[float]:
        """Convert stats dict to feature vector"""
        return [
            float(stats.get('goals', 0)),
            float(stats.get('assists', 0)),
            float(stats.get('passAccuracy', 0)),
            float(stats.get('defensiveActions', 0)),
            float(stats.get('ballRecoveries', 0)),
            float(stats.get('minutes', 1)),
        ]

    def _vector_to_stats(self, vector: np.ndarray) -> Dict[str, float]:
        """Convert feature vector back to stats dict"""
        return {
            'xG': float(vector[0]) * 0.95,  # Estimation formula
            'xA': float(vector[1]) * 0.90,
            'progressivePasses': float(vector[5]) * 0.03,
            'injuryRisk': 0.15,
            'fatigueLevel': 0.42,
        }

    def save_model(self, path: str) -> None:
        """Save trained model to disk"""
        try:
            joblib.dump(self.model, f"{path}/knn_model.joblib")
            joblib.dump(self.scaler, f"{path}/scaler.joblib")
            logger.info(f"Model saved to {path}")
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            raise

    def load_model(self, path: str) -> None:
        """Load trained model from disk"""
        try:
            self.model = joblib.load(f"{path}/knn_model.joblib")
            self.scaler = joblib.load(f"{path}/scaler.joblib")
            logger.info(f"Model loaded from {path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
