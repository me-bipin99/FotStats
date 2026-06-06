from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_predict_match_basic():
    res = client.post("/predict-match", json={
        "matchId": "test_match",
        "votes": [
            {"userId": "u1", "outcome": "home_win", "reputation": 100},
            {"userId": "u2", "outcome": "away_win", "reputation": 50},
        ]
    })
    assert res.status_code == 200
    body = res.json()
    assert abs(body["prediction"]["homeWinProb"] - 2/3) < 0.01
    assert body["confidence"] > 0
