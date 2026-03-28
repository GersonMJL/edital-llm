from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1"
    openai_model_mini: str = "gpt-4.1-mini"
    openai_model_extraction: str = "gpt-4.1-mini"
    openai_model_generation: str = "gpt-4.1"
    llm_context_switch_tokens: int = 20000
    llm_mock: bool = True
    max_upload_mb: int = 10
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
