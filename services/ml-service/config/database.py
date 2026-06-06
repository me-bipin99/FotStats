import os
from pymongo import MongoClient

_client: MongoClient | None = None


def get_db():
    global _client
    if _client is None:
        uri = os.environ.get("MONGO_URI")
        if not uri:
            raise RuntimeError("MONGO_URI environment variable not set")
        _client = MongoClient(uri)
    return _client["fotnep"]
