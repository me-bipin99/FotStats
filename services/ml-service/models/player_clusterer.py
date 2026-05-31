"""
K-Means clustering model for player role classification
"""

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class PlayerClusterer:
    """
    Classify players into roles using K-Means clustering
    """

    def __init__(self, n_clusters: int = 6, random_state: int = 42):
        self.n_clusters = n_clusters
        self.model = KMeans(n_clusters=n_clusters, random_state=random_state)
        self.scaler = StandardScaler()
        self.cluster_labels = {
            0: "Elite Defender",
            1: "Clinical Striker",
            2: "Playmaker Midfielder",
            3: "Box-to-Box Midfielder",
            4: "Fullback Contributor",
            5: "Goalkeeper"
        }
        self.feature_names = [
            'goals', 'assists', 'passAccuracy', 'defensiveActions',
            'ballRecoveries', 'keyPasses', 'minutes'
        ]

    def train(self, X_train: np.ndarray) -> None:
        """
        Train the K-Means clustering model

        Args:
            X_train: Training features
        """
        try:
            X_scaled = self.scaler.fit_transform(X_train)
            self.model.fit(X_scaled)
            logger.info(f"KMeans model trained with {len(X_train)} samples")
        except Exception as e:
            logger.error(f"Error training KMeans model: {e}")
            raise

    def predict_cluster(self, player_stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict cluster/role for a player

        Args:
            player_stats: Dictionary with player stats

        Returns:
            Dictionary with cluster, role, and confidence
        """
        try:
            feature_vector = self._stats_to_vector(player_stats)
            X_scaled = self.scaler.transform([feature_vector])

            cluster = self.model.predict(X_scaled)[0]
            distances = self.model.transform(X_scaled)[0]

            # Calculate confidence as inverse of distance
            confidence = 1.0 / (1.0 + distances[cluster])

            return {
                "cluster": int(cluster),
                "role": self.cluster_labels.get(cluster, "Unknown"),
                "confidence": float(confidence)
            }
        except Exception as e:
            logger.error(f"Error predicting cluster: {e}")
            raise

    def predict_multiple(self, players_stats: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Predict clusters for multiple players

        Args:
            players_stats: List of player stat dictionaries

        Returns:
            List of cluster predictions
        """
        try:
            results = []
            for stats in players_stats:
                result = self.predict_cluster(stats)
                results.append(result)
            return results
        except Exception as e:
            logger.error(f"Error predicting multiple clusters: {e}")
            raise

    def _stats_to_vector(self, stats: Dict[str, Any]) -> List[float]:
        """Convert stats dict to feature vector"""
        return [
            float(stats.get('goals', 0)),
            float(stats.get('assists', 0)),
            float(stats.get('passAccuracy', 0)),
            float(stats.get('defensiveActions', 0)),
            float(stats.get('ballRecoveries', 0)),
            float(stats.get('keyPasses', 0)),
            float(stats.get('minutes', 1)),
        ]

    def save_model(self, path: str) -> None:
        """Save trained model to disk"""
        try:
            joblib.dump(self.model, f"{path}/kmeans_model.joblib")
            joblib.dump(self.scaler, f"{path}/scaler.joblib")
            logger.info(f"Model saved to {path}")
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            raise

    def load_model(self, path: str) -> None:
        """Load trained model from disk"""
        try:
            self.model = joblib.load(f"{path}/kmeans_model.joblib")
            self.scaler = joblib.load(f"{path}/scaler.joblib")
            logger.info(f"Model loaded from {path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
