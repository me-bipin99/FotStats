import pickle
import os
from pathlib import Path

MODELS_DIR = Path(__file__).parent.parent / "trained_models"


class ModelLoader:
    """Singleton that loads all pickle models once on first access."""

    _instance = None
    _models: dict = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load()
        return cls._instance

    def _load(self):
        if not MODELS_DIR.exists():
            return  # Models not trained yet
        for pkl in MODELS_DIR.glob("*.pkl"):
            with open(pkl, "rb") as f:
                self._models[pkl.stem] = pickle.load(f)

    def get(self, name: str):
        return self._models.get(name)

    def has(self, name: str) -> bool:
        return name in self._models
