"""Smoke tests for chat management API."""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_create_and_list_chats():
    create = client.post("/api/v1/chat/create", json={"title": "Cow Fever"})
    assert create.status_code == 201
    chat_id = create.json()["id"]

    listing = client.get("/api/v1/chat/list")
    assert listing.status_code == 200
    assert listing.json()["total"] >= 1
    assert any(c["id"] == chat_id for c in listing.json()["chats"])


def test_send_message_and_get_chat():
    create = client.post("/api/v1/chat/create", json={"title": "Test"})
    chat_id = create.json()["id"]

    msg = client.post(
        f"/api/v1/chat/{chat_id}/message",
        json={"message": "My cow has fever", "language": "en"},
    )
    assert msg.status_code == 200
    body = msg.json()
    assert body["chat_id"] == chat_id
    assert body["reply"]
    assert body["user_message"]["role"] == "user"

    detail = client.get(f"/api/v1/chat/{chat_id}")
    assert detail.status_code == 200
    assert len(detail.json()["messages"]) >= 2
    assert len(body["assistant_messages"]) >= 1


def test_rename_and_delete_chat():
    create = client.post("/api/v1/chat/create", json={"title": "Old Title"})
    chat_id = create.json()["id"]

    renamed = client.patch(
        f"/api/v1/chat/{chat_id}/rename",
        json={"title": "New Title"},
    )
    assert renamed.status_code == 200
    assert renamed.json()["title"] == "New Title"

    deleted = client.delete(f"/api/v1/chat/{chat_id}")
    assert deleted.status_code == 200

    detail = client.get(f"/api/v1/chat/{chat_id}")
    assert detail.status_code == 404


def test_send_message_fmd_analysis_blocks():
    create = client.post("/api/v1/chat/create", json={"title": "FMD Test"})
    chat_id = create.json()["id"]

    msg = client.post(
        f"/api/v1/chat/{chat_id}/message",
        json={"message": "My cow has fever and drooling", "language": "en"},
    )
    assert msg.status_code == 200
    body = msg.json()
    assert body["reply"]
    assert body["confidence"] >= 0
    assert len(body["assistant_messages"]) >= 1
    types = {m["message_type"] for m in body["assistant_messages"]}
    assert len(types) >= 1


def test_memory_context():
    create = client.post("/api/v1/chat/create", json={"title": "Memory Test"})
    chat_id = create.json()["id"]

    client.post(
        f"/api/v1/chat/{chat_id}/message",
        json={"message": "Goat has swelling", "language": "en"},
    )

    context = client.get(f"/api/v1/memory/{chat_id}/context?limit=5")
    assert context.status_code == 200
    assert context.json()["chat_id"] == chat_id
    assert len(context.json()["messages"]) <= 5
