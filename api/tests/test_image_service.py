from io import BytesIO
from fastapi import UploadFile
from app.services import image_service


def make_upload(name="cover.jpg"):
    return UploadFile(filename=name, file=BytesIO(b"fake-bytes"))


def test_upload_image_returns_mock_url_when_no_api_key(monkeypatch):
    monkeypatch.setattr(image_service, "IMGBB_API_KEY", None)
    file = make_upload()

    url = image_service.upload_image_to_imgbb(file)

    assert url == "https://fake.imgbb.com/cover.jpg"


def test_upload_image_success(monkeypatch):
    monkeypatch.setattr(image_service, "IMGBB_API_KEY", "secret-key")

    captured = {}

    def fake_post(url, data):
        captured["url"] = url
        captured["data"] = data

        class FakeResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"data": {"url": "https://imgbb.com/img123.jpg"}}

        return FakeResponse()

    monkeypatch.setattr("app.services.image_service.requests.post", fake_post)

    file = make_upload("point.png")
    result = image_service.upload_image_to_imgbb(file)

    assert result == "https://imgbb.com/img123.jpg"
    assert "image" in captured["data"]
    assert captured["url"].endswith("/upload")
