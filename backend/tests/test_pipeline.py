import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import app
from app.services.llm_client import LLMClient

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


def test_llm_client_raises_without_key_in_live_mode() -> None:
    settings = Settings(llm_mock=False, openai_api_key="")
    with pytest.raises(RuntimeError, match="OPENAI_API_KEY"):
        LLMClient(settings)


def test_llm_client_ok_in_mock_mode_without_key() -> None:
    settings = Settings(llm_mock=True, openai_api_key="")
    llm = LLMClient(settings)
    assert llm.client is None
