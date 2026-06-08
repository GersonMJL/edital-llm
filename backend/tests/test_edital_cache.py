import pytest
from app.schemas.pipeline import ExtractedRequirements
from app.services.edital_cache import EditalCache


def _req(**kwargs) -> ExtractedRequirements:
    defaults = dict(criterios=[], prazos=[], formatacao=[], temas_prioritarios=[])
    return ExtractedRequirements(**{**defaults, **kwargs})


def test_miss_returns_none():
    cache = EditalCache(max_size=5)
    assert cache.get("nope") is None


def test_hit_returns_stored_value():
    cache = EditalCache(max_size=5)
    req = _req(criterios=["crit1"])
    cache.set("abc", req)
    assert cache.get("abc") == req


def test_set_same_key_twice_does_not_duplicate():
    cache = EditalCache(max_size=5)
    req = _req(criterios=["x"])
    cache.set("k", req)
    cache.set("k", req)
    assert cache.size() == 1


def test_evicts_oldest_when_full():
    cache = EditalCache(max_size=2)
    cache.set("k1", _req(criterios=["first"]))
    cache.set("k2", _req(criterios=["second"]))
    cache.set("k3", _req(criterios=["third"]))
    assert cache.get("k1") is None
    assert cache.get("k2") is not None
    assert cache.get("k3") is not None


def test_size_reflects_entry_count():
    cache = EditalCache(max_size=10)
    assert cache.size() == 0
    cache.set("k1", _req())
    assert cache.size() == 1
    cache.set("k2", _req())
    assert cache.size() == 2
