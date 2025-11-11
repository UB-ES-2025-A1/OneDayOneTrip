# test_comments_and_ratings.py
def _mk_trip(client):
    js = {"title":"Cotiella","author":{"userId":"u1","name":"Jesús"},"city":"Plan"}
    r = client.post("/trips/", files={"trip_json": (None, __import__("json").dumps(js))})
    return r.json()["trip_id"]

def test_add_comment_and_list(client):
    tid = _mk_trip(client)
    # add comment
    r = client.post(f"/trips/{tid}/comment",
                    json={"userId":"u1","userName":"Jesús","content":"Brutal"})
    assert r.status_code == 200
    cid = r.json()["comment_id"]
    assert cid.startswith("c_")
    # list comments
    r2 = client.get(f"/trips/{tid}/comments?limit=10&skip=0")
    data = r2.json()
    assert r2.status_code == 200
    assert data["trip_id"] == tid
    assert data["count"] == 1
    assert data["comments"][0]["content"] == "Brutal"

def test_rate_trip_both_endpoints(client):
    tid = _mk_trip(client)
    # POST /trips/{id}/rating (body plano con userId y rating)
    r1 = client.post(f"/trips/{tid}/rating", json={"userId":"u1","rating":5})
    assert r1.status_code == 200
    # POST /ratings/trip/{id} (con RatingModel)
    r2 = client.post(f"/ratings/trip/{tid}", json={"userId":"u2","rating":3})
    assert r2.status_code == 200
    stats = r2.json()
    assert stats["numRatings"] == 2
    assert 3.0 <= stats["avgRating"] <= 5.0
