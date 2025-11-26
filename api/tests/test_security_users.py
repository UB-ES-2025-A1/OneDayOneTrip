import asyncio
import pytest
from fastapi import HTTPException
from app.routers import users


def test_register_user_requires_uid():
    async def runner():
        with pytest.raises(HTTPException) as excinfo:
            await users.register_user({"fullname": "QA"}, user={})
        assert excinfo.value.status_code == 400
        assert "UID" in excinfo.value.detail

    asyncio.run(runner())


def test_follow_user_cannot_follow_itself():
    async def runner():
        with pytest.raises(HTTPException) as excinfo:
            await users.follow_user("u1", "u1")
        assert excinfo.value.status_code == 400
        assert "No et pots seguir" in excinfo.value.detail

    asyncio.run(runner())
