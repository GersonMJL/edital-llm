import json
from typing import Literal

from openai import OpenAI

from app.config import Settings

PipelineStage = Literal["extraction", "generation", "checklist"]


class LLMClient:
    def __init__(self, settings: Settings, api_key: str = ""):
        self.settings = settings
        normalized_key = api_key.strip()
        self.client = OpenAI(api_key=normalized_key) if normalized_key else None

    @staticmethod
    def _estimate_tokens(text: str) -> int:
        # Quick approximation for routing decisions; avoids extra tokenizer deps.
        return max(1, len(text) // 4)

    def _route_model(self, stage: PipelineStage, system_prompt: str, user_prompt: str) -> str:
        total_tokens = self._estimate_tokens(system_prompt) + self._estimate_tokens(user_prompt)
        if total_tokens >= self.settings.llm_context_switch_tokens:
            return self.settings.openai_model

        if stage == "extraction":
            return self.settings.openai_model_extraction
        if stage == "generation":
            return self.settings.openai_model_generation
        return self.settings.openai_model_mini

    def complete_json(self, system_prompt: str, user_prompt: str, stage: PipelineStage) -> dict:
        if self.settings.llm_mock:
            return {}

        if not self.client:
            raise RuntimeError("Chave da OpenAI nao informada.")

        selected_model = self._route_model(stage, system_prompt, user_prompt)

        response = self.client.responses.create(
            model=selected_model,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            text={"format": {"type": "json_object"}},
        )

        output_text = response.output_text
        return json.loads(output_text)
