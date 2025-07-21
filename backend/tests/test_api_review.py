import uuid
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.models import Record, Review, User
from app.utils.security import create_access_token, get_password_hash


def create_test_user(db, username=None, password="testpass"):
    if username is None:
        username = f"testuser_{uuid.uuid4().hex[:8]}"
    user = User(
        username=username,
        email=f"{username}@test.com",
        password_hash=get_password_hash(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_test_record(db, user_id):
    record = Record(user_id=user_id, execution_result="Accepted", submission_id=1)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@pytest.fixture(scope="function")
def auth_header(client, db_session):
    user = create_test_user(db_session)
    token = create_access_token({"sub": user.username})
    return {"Authorization": f"Bearer {token}"}, user


def test_create_review(client, db_session, auth_header):
    headers, user = auth_header
    record = create_test_record(db_session, user.id)
    data = {"record_id": record.id, "wrong_reason": "边界条件没考虑", "review_plan": "复习双指针"}
    resp = client.post("/api/review/", json=data, headers=headers)
    assert resp.status_code == 200
    result = resp.json()
    assert result["wrong_reason"] == "边界条件没考虑"
    assert result["review_plan"] == "复习双指针"
    assert result["record_id"] == record.id


def test_get_reviews(client, db_session, auth_header):
    headers, user = auth_header
    record = create_test_record(db_session, user.id)
    # 先创建review
    client.post(
        "/api/review/",
        json={
            "record_id": record.id,
            "wrong_reason": "边界条件没考虑",
            "review_plan": "复习双指针",
        },
        headers=headers,
    )
    resp = client.get("/api/review/", headers=headers)
    assert resp.status_code == 200
    reviews = resp.json()
    assert len(reviews) >= 1
    assert reviews[0]["record_id"] == record.id


def test_get_due_reviews(client, db_session, auth_header):
    headers, user = auth_header
    record = create_test_record(db_session, user.id)
    # 创建一个已到期的review
    review = Review(
        user_id=user.id,
        record_id=record.id,
        wrong_reason="错因",
        review_plan="计划",
        next_review_date=datetime.utcnow() - timedelta(days=1),
    )
    db_session.add(review)
    db_session.commit()
    resp = client.get("/api/review/due", headers=headers)
    assert resp.status_code == 200
    due_reviews = resp.json()
    assert any(r["id"] == review.id for r in due_reviews)


def test_mark_as_reviewed(client, db_session, auth_header):
    headers, user = auth_header
    record = create_test_record(db_session, user.id)
    # 创建review
    review = Review(
        user_id=user.id,
        record_id=record.id,
        wrong_reason="错因",
        review_plan="计划",
        next_review_date=datetime.utcnow() - timedelta(days=1),
    )
    db_session.add(review)
    db_session.commit()
    db_session.refresh(review)
    resp = client.post(f"/api/review/{review.id}/mark-reviewed", headers=headers)
    assert resp.status_code == 200
    updated = resp.json()
    assert updated["review_count"] == 1
    assert updated["id"] == review.id
    assert updated["next_review_date"] > review.next_review_date.isoformat()
