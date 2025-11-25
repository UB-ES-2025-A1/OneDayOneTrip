# tests/test_users_endpoints.py
import asyncio
import json

import pytest
from fastapi import HTTPException, status
from io import BytesIO

from app.routers import users


@pytest.mark.usefixtures("client")
class TestUsersEndpoints:

    def test_get_all_users(self, client):
        """Test GET /users/ returns list of users"""
        response = client.get("/users/")
        assert response.status_code == status.HTTP_200_OK, response.text
        users_list = response.json()
        assert isinstance(users_list, list)
        assert all("uid" in u for u in users_list)

    def test_get_user_by_id_found(self, client, monkeypatch):
        """Test GET /users/{user_id} when user exists"""

        class FakeDoc:
            def __init__(self):
                self.exists = True

            def to_dict(self):
                return {"uid": "user123", "username": "testuser"}

        class FakeRef:
            def get(self):
                return FakeDoc()

        class FakeCollection:
            def document(self, uid):
                return FakeRef()

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())

        response = client.get("/users/user123")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["uid"] == "user123"
        assert data["username"] == "testuser"

    def test_get_user_by_id_not_found(self, client, monkeypatch):
        """Test GET /users/{user_id} when user doesn't exist"""
        class FakeDoc:
            def __init__(self):
                self.exists = False

        class FakeRef:
            def get(self):
                return FakeDoc()

        class FakeCollection:
            def document(self, uid):
                return FakeRef()

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())

        response = client.get("/users/nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "no encontrado" in response.json()["detail"].lower()

    def test_register_user_success(self, monkeypatch):
        """Test POST /users/register creates user with defaults"""
        captured_data = {}

        class FakeDoc:
            def set(self, data, merge=False):
                captured_data.update(data)

        class FakeRef:
            def __init__(self):
                self.doc = FakeDoc()

            def document(self, uid):
                return self.doc

        class FakeCollection:
            def __init__(self):
                self.ref = FakeRef()

            def document(self, uid):
                return self.ref.document(uid)

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())

        async def run_test():
            user_data = {"uid": "fake_uid", "email": "test@example.com"}
            data = {"fullname": "Test User", "username": "testuser", "mail": "test@example.com"}
            result = await users.register_user(data, user=user_data)

            assert result["message"] == "Usuario registrado correctamente"
            assert captured_data["uid"] == "fake_uid"
            assert captured_data["username"] == "testuser"
            assert captured_data["role"] == "user"
            assert captured_data["premium"] is False
            assert captured_data["publicacions"] == []

        asyncio.run(run_test())

    def test_register_user_missing_uid(self):
        """Test POST /users/register fails without UID"""
        async def run_test():
            with pytest.raises(HTTPException) as excinfo:
                await users.register_user({}, user={})
            assert excinfo.value.status_code == 400
            assert "UID" in excinfo.value.detail

        asyncio.run(run_test())

    def test_get_current_user_found(self, monkeypatch):
        """Test GET /users/me returns current user"""
        class FakeDoc:
            def __init__(self):
                self.exists = True

            def to_dict(self):
                return {"uid": "fake_uid", "username": "currentuser"}

        class FakeRef:
            def get(self):
                return FakeDoc()

        class FakeCollection:
            def document(self, uid):
                return FakeRef()

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())

        async def run_test():
            user_data = {"uid": "fake_uid", "email": "test@example.com"}
            result = await users.get_current_user(user=user_data)
            assert result["uid"] == "fake_uid"
            assert result["username"] == "currentuser"

        asyncio.run(run_test())

    def test_get_current_user_not_found(self, monkeypatch):
        """Test GET /users/me returns 404 when user doesn't exist"""
        class FakeDoc:
            def __init__(self):
                self.exists = False

        class FakeRef:
            def get(self):
                return FakeDoc()

        class FakeCollection:
            def document(self, uid):
                return FakeRef()

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())

        async def run_test():
            user_data = {"uid": "fake_uid", "email": "test@example.com"}
            with pytest.raises(HTTPException) as excinfo:
                await users.get_current_user(user=user_data)
            assert excinfo.value.status_code == 404

        asyncio.run(run_test())

    def test_update_user_multipart_success(self, monkeypatch):
        """Test PATCH /users/update/{user_id} updates user"""
        captured_update = {}

        class FakeDoc:
            def __init__(self):
                self.exists = True

            def get(self):
                return self

        class FakeRef:
            def __init__(self):
                self.doc = FakeDoc()

            def get(self):
                return self.doc

            def update(self, data):
                captured_update.update(data)

        class FakeCollection:
            def __init__(self):
                self.ref = FakeRef()

            def document(self, uid):
                return self.ref

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())
        monkeypatch.setattr("app.routers.users.upload_image_to_imgbb", lambda f: "https://fake.url/image.jpg")

        async def run_test():
            user_json = json.dumps({"username": "newusername", "nom_i_cognoms": "New Name"})
            result = await users.update_user_multipart(
                user_id="user123",
                user_json=user_json,
                foto_perfil=None,
                foto_panell=None
            )

            assert result["message"] == "Perfil actualitzat correctament"
            assert captured_update["username"] == "newusername"
            assert captured_update["nom_i_cognoms"] == "New Name"

        asyncio.run(run_test())

    def test_update_user_multipart_with_images(self, monkeypatch):
        """Test PATCH /users/update/{user_id} with image uploads"""
        captured_update = {}

        class FakeDoc:
            def __init__(self):
                self.exists = True

            def get(self):
                return self

        class FakeRef:
            def __init__(self):
                self.doc = FakeDoc()

            def get(self):
                return self.doc

            def update(self, data):
                captured_update.update(data)

        class FakeCollection:
            def document(self, uid):
                return FakeRef()

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())
        monkeypatch.setattr("app.routers.users.upload_image_to_imgbb", lambda f: f"https://fake.url/{f.filename if f else 'no_file'}.jpg")

        async def run_test():
            from fastapi import UploadFile

            user_json = json.dumps({"username": "test"})
            fake_file = UploadFile(filename="profile.jpg", file=BytesIO(b"fake"))

            await users.update_user_multipart(
                user_id="user123",
                user_json=user_json,
                foto_perfil=fake_file,
                foto_panell=None
            )

            assert "url_foto_perfil" in captured_update
            assert captured_update["url_foto_perfil"].startswith("https://fake.url/")

        asyncio.run(run_test())

    def test_update_user_multipart_invalid_json(self, monkeypatch):
        """Test PATCH /users/update/{user_id} with invalid JSON"""
        class FakeDB:
            def collection(self, name):
                return type("FakeCollection", (), {"document": lambda self, uid: type("FakeRef", (), {"get": lambda self: type("FakeDoc", (), {"exists": True})()})()})()

        monkeypatch.setattr("app.routers.users.db", FakeDB())

        async def run_test():
            with pytest.raises(HTTPException) as excinfo:
                await users.update_user_multipart(
                    user_id="user123",
                    user_json="invalid json",
                    foto_perfil=None,
                    foto_panell=None
                )
            assert excinfo.value.status_code == 400

        asyncio.run(run_test())

    def test_update_user_multipart_user_not_found(self, monkeypatch):
        """Test PATCH /users/update/{user_id} when user doesn't exist"""
        class FakeDoc:
            def __init__(self):
                self.exists = False
            def get(self):
                return self

        class FakeRef:
            def get(self):
                return FakeDoc()

        class FakeCollection:
            def document(self, uid):
                return FakeRef()

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())

        async def run_test():
            import json
            user_json = json.dumps({"username": "test"})
            with pytest.raises(HTTPException) as excinfo:
                await users.update_user_multipart(
                    user_id="nonexistent",
                    user_json=user_json,
                    foto_perfil=None,
                    foto_panell=None
                )
            assert excinfo.value.status_code == 404

        asyncio.run(run_test())

    def test_update_user_multipart_no_data(self, monkeypatch):
        """Test PATCH /users/update/{user_id} with no update data"""
        class FakeDoc:
            def __init__(self):
                self.exists = True

            def get(self):
                return self

        class FakeRef:
            def get(self):
                return FakeDoc()

        class FakeCollection:
            def document(self, uid):
                return FakeRef()

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())

        async def run_test():
            import json
            user_json = json.dumps({})
            with pytest.raises(HTTPException) as excinfo:
                await users.update_user_multipart(
                    user_id="user123",
                    user_json=user_json,
                    foto_perfil=None,
                    foto_panell=None
                )
            assert excinfo.value.status_code == 400

        asyncio.run(run_test())

    def test_follow_user_success(self, monkeypatch):
        """Test POST /users/follow/{user_id}/{target_id} succeeds"""
        captured_updates = []

        class FakeRef:
            def __init__(self, uid):
                self.uid = uid

            def get(self):
                return type("FakeDoc", (), {"exists": True})()

            def update(self, data):
                captured_updates.append((self.uid, data))

        class FakeCollection:
            def __init__(self):
                self.refs = {}

            def document(self, uid):
                if uid not in self.refs:
                    self.refs[uid] = FakeRef(uid)
                return self.refs[uid]

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())

        async def run_test():
            result = await users.follow_user("user1", "user2")
            assert result["message"] == "Usuari seguit correctament"
            assert len(captured_updates) == 2

        asyncio.run(run_test())

    def test_follow_user_self_follow(self):
        """Test POST /users/follow/{user_id}/{target_id} fails when following self"""
        async def run_test():
            with pytest.raises(HTTPException) as excinfo:
                await users.follow_user("user1", "user1")
            assert excinfo.value.status_code == 400
            assert "No et pots seguir" in excinfo.value.detail

        asyncio.run(run_test())

    def test_follow_user_target_not_found(self, monkeypatch):
        """Test POST /users/follow/{user_id}/{target_id} fails when target doesn't exist"""
        class FakeRef:
            def get(self):
                return type("FakeDoc", (), {"exists": False})()

        class FakeCollection:
            def document(self, uid):
                return FakeRef()

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())

        async def run_test():
            with pytest.raises(HTTPException) as excinfo:
                await users.follow_user("user1", "nonexistent")
            assert excinfo.value.status_code == 404

        asyncio.run(run_test())

    def test_unfollow_user_success(self, monkeypatch):
        """Test POST /users/unfollow/{user_id}/{target_id} succeeds"""
        captured_updates = []

        class FakeRef:
            def __init__(self, uid):
                self.uid = uid

            def get(self):
                return type("FakeDoc", (), {"exists": True})()

            def update(self, data):
                captured_updates.append((self.uid, data))

        class FakeCollection:
            def __init__(self):
                self.refs = {}

            def document(self, uid):
                if uid not in self.refs:
                    self.refs[uid] = FakeRef(uid)
                return self.refs[uid]

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())

        async def run_test():
            result = await users.unfollow_user("user1", "user2")
            assert result["message"] == "Has deixat de seguir l'usuari correctament"
            assert len(captured_updates) == 2

        asyncio.run(run_test())

    def test_unfollow_user_user_not_found(self, monkeypatch):
        """Test POST /users/unfollow/{user_id}/{target_id} fails when user doesn't exist"""
        class FakeRef:
            def get(self):
                return type("FakeDoc", (), {"exists": False})()

        class FakeCollection:
            def document(self, uid):
                return FakeRef()

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())

        async def run_test():
            with pytest.raises(HTTPException) as excinfo:
                await users.unfollow_user("nonexistent", "user2")
            assert excinfo.value.status_code == 404

        asyncio.run(run_test())

    def test_unfollow_user_target_not_found(self, monkeypatch):
        """Test POST /users/unfollow/{user_id}/{target_id} fails when target doesn't exist"""
        call_count = 0

        class FakeRef:
            def get(self):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return type("FakeDoc", (), {"exists": True})()
                return type("FakeDoc", (), {"exists": False})()

        class FakeCollection:
            def document(self, uid):
                return FakeRef()

        class FakeDB:
            def collection(self, name):
                return FakeCollection()

        monkeypatch.setattr("app.routers.users.db", FakeDB())

        async def run_test():
            with pytest.raises(HTTPException) as excinfo:
                await users.unfollow_user("user1", "nonexistent")
            assert excinfo.value.status_code == 404

        asyncio.run(run_test())
