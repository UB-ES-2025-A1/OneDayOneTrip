from app.routers import trips


def make_response(status_code=200, payload=None):
    class FakeResponse:
        def __init__(self):
            self.status_code = status_code

        def raise_for_status(self):
            if self.status_code >= 400:
                raise RuntimeError("error")

        def json(self):
            return payload or {}

    return FakeResponse()


def test_get_location_name_success(monkeypatch):
    calls = {}

    def fake_get(url, params, headers, timeout):
        calls["url"] = url
        calls["params"] = params
        calls["headers"] = headers
        calls["timeout"] = timeout
        return make_response(
            payload={
                "display_name": "Barcelona, Catalunya, España",
                "address": {"city": "Barcelona", "country": "España"},
            }
        )

    monkeypatch.setattr("app.routers.trips.requests.get", fake_get)

    result = trips.get_location_name(41.387, 2.17)

    assert result == "Barcelona, Catalunya, España"
    assert calls["url"].endswith("/reverse")
    assert calls["params"]["lat"] == 41.387
    assert calls["params"]["lon"] == 2.17
    assert "User-Agent" in calls["headers"]
    assert calls["timeout"] == 8


def test_get_location_name_handles_error(monkeypatch):
    def fake_get(*args, **kwargs):
        raise TimeoutError("boom")

    monkeypatch.setattr("app.routers.trips.requests.get", fake_get)

    result = trips.get_location_name(0, 0)
    assert result == "Ubicación desconocida"
