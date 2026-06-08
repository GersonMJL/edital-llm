from fastapi.testclient import TestClient

from app.config import Settings
from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_settings_openai_api_key_field() -> None:
    settings = Settings(openai_api_key="sk-test", llm_mock=True)
    assert settings.openai_api_key == "sk-test"


def test_settings_openai_api_key_defaults_empty() -> None:
    settings = Settings(llm_mock=True)
    assert settings.openai_api_key == ""
