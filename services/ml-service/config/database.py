import os
from urllib.parse import urlparse
from pymongo import MongoClient

_client: MongoClient | None = None
_db_name: str | None = None


def get_db():
    global _client, _db_name
    if _client is None:
        uri = os.environ.get("MONGO_URI")
        if not uri:
            raise RuntimeError("MONGO_URI environment variable not set")
        _client = MongoClient(uri)
        _db_name = urlparse(uri).path.lstrip("/") or "fotnep"
    return _client[_db_name]
