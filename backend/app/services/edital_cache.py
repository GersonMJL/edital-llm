from app.schemas.pipeline import ExtractedRequirements


class EditalCache:
    def __init__(self, max_size: int = 50) -> None:
        self._store: dict[str, ExtractedRequirements] = {}
        self._order: list[str] = []
        self._max_size = max_size

    def get(self, content_hash: str) -> ExtractedRequirements | None:
        return self._store.get(content_hash)

    def set(self, content_hash: str, result: ExtractedRequirements) -> None:
        if content_hash in self._store:
            return
        if len(self._store) >= self._max_size:
            oldest = self._order.pop(0)
            del self._store[oldest]
        self._store[content_hash] = result
        self._order.append(content_hash)

    def size(self) -> int:
        return len(self._store)


def _make_cache() -> EditalCache:
    from app.config import get_settings
    return EditalCache(max_size=get_settings().edital_cache_size)


edital_cache: EditalCache = _make_cache()
