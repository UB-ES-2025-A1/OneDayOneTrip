import pytest
from fastapi import status


@pytest.mark.usefixtures("client")
class TestUsersEndpoints:
    # 🔸 Estos dos los quitamos temporalmente porque dependen de Firebase Auth
    # def test_register_user(self, client):
    #     payload = {
    #         "fullname": "Test User",
    #         "username": "testuser",
    #         "mail": "test@example.com",
    #     }
    #     response = client.post("/users/register", json=payload)
    #     assert response.status_code == status.HTTP_200_OK, response.text
    #     data = response.json()
    #     assert "user" in data
    #     assert data["user"]["username"] == "testuser"

    def test_get_all_users(self, client):
        response = client.get("/users/")
        assert response.status_code == status.HTTP_200_OK, response.text
        users_list = response.json()
        assert isinstance(users_list, list)
        assert all("uid" in u for u in users_list)

    # def test_get_current_user(self, client):
    #     response = client.get("/users/me")
    #     assert response.status_code in [
    #         status.HTTP_200_OK,
    #         status.HTTP_404_NOT_FOUND,
    #     ], response.text

    def test_get_user_by_id(self, client):
        response = client.get("/users/fake_uid")
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
        ], response.text
