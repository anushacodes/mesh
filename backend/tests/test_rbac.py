def test_personal_board_access(client):
    """Test that a user can create and view their own personal boards, but another user cannot access it"""
    # 1. Signup Alice and get her token
    client.post("/app/auth/register", json={"name": "Alice", "email": "alice@example.com", "password": "password123"})
    res = client.post("/app/auth/login", json={"email": "alice@example.com", "password": "password123"})
    alice_token = res.json()["access_token"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}

    # 2. Signup Bob and get his token
    client.post("/app/auth/register", json={"name": "Bob", "email": "bob@example.com", "password": "password123"})
    res2 = client.post("/app/auth/login", json={"email": "bob@example.com", "password": "password123"})
    bob_token = res2.json()["access_token"]
    bob_headers = {"Authorization": f"Bearer {bob_token}"}

    # 3. Alice creates a personal board
    res_board = client.post(
        "/app/boards/", 
        json={"name": "Alice's Secret Board", "description": "Strictly private"},
        headers=alice_headers
    )
    assert res_board.status_code == 201
    board_id = res_board.json()["id"]

    # 4. Bob tries to access Alice's personal board -> Should get 403 Forbidden
    res_bob_peek = client.get(f"/app/boards/{board_id}", headers=bob_headers)
    assert res_bob_peek.status_code == 403

    # 5. Alice can access her own board -> Should get 200 OK
    res_alice_peek = client.get(f"/app/boards/{board_id}", headers=alice_headers)
    assert res_alice_peek.status_code == 200
    assert res_alice_peek.json()["name"] == "Alice's Secret Board"


def test_team_board_rbac(client):
    """Test that team members can access team boards, but strangers are blocked"""
    # 1. Create User 1 (Team Owner)
    client.post("/app/auth/register", json={"name": "Owner", "email": "owner@example.com", "password": "password123"})
    res = client.post("/app/auth/login", json={"email": "owner@example.com", "password": "password123"})
    owner_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # 2. Create User 2 (Team Member)
    client.post("/app/auth/register", json={"name": "Member", "email": "member@example.com", "password": "password123"})
    res2 = client.post("/app/auth/login", json={"email": "member@example.com", "password": "password123"})
    member_headers = {"Authorization": f"Bearer {res2.json()['access_token']}"}

    # 3. Create User 3 (Stranger)
    client.post("/app/auth/register", json={"name": "Stranger", "email": "stranger@example.com", "password": "password123"})
    res3 = client.post("/app/auth/login", json={"email": "stranger@example.com", "password": "password123"})
    stranger_headers = {"Authorization": f"Bearer {res3.json()['access_token']}"}

    # 4. Owner creates a team
    res_team = client.post("/app/teams/", json={"name": "Engineers", "description": "Core devs"}, headers=owner_headers)
    assert res_team.status_code == 201
    team_id = res_team.json()["id"]

    # 5. Owner adds Member to the team
    res_add = client.post(f"/app/teams/{team_id}/members", json={"email": "member@example.com"}, headers=owner_headers)
    assert res_add.status_code == 201

    # 6. Owner creates a board assigned to this team
    res_board = client.post(
        "/app/boards/",
        json={"name": "Engineering Sprint", "team_id": team_id},
        headers=owner_headers
    )
    assert res_board.status_code == 201
    board_id = res_board.json()["id"]

    # 7. Team member tries to access the board -> Should get 200 OK
    res_member_view = client.get(f"/app/boards/{board_id}", headers=member_headers)
    assert res_member_view.status_code == 200

    # 8. Stranger tries to access the board -> Should get 403 Forbidden
    res_stranger_view = client.get(f"/app/boards/{board_id}", headers=stranger_headers)
    assert res_stranger_view.status_code == 403


def test_board_scoped_task_creation(client):
    """Test task creation on a board is restricted to authorized users"""
    # 1. Create Alice (Owner) and Bob (Stranger)
    client.post("/app/auth/register", json={"name": "Alice", "email": "alice@example.com", "password": "password123"})
    res_alice = client.post("/app/auth/login", json={"email": "alice@example.com", "password": "password123"})
    alice_headers = {"Authorization": f"Bearer {res_alice.json()['access_token']}"}

    client.post("/app/auth/register", json={"name": "Bob", "email": "bob@example.com", "password": "password123"})
    res_bob = client.post("/app/auth/login", json={"email": "bob@example.com", "password": "password123"})
    bob_headers = {"Authorization": f"Bearer {res_bob.json()['access_token']}"}

    # 2. Alice creates a board
    res_board = client.post("/app/boards/", json={"name": "Sprint Board"}, headers=alice_headers)
    board_id = res_board.json()["id"]

    # 3. Bob tries to create a task on Alice's board -> Should get 403 Forbidden
    res_task_bob = client.post(
        "/app/tasks/",
        json={"title": "Hack board", "board_id": board_id},
        headers=bob_headers
    )
    assert res_task_bob.status_code == 403

    # 4. Alice creates a task on her own board -> Should get 201 Created
    res_task_alice = client.post(
        "/app/tasks/",
        json={"title": "Complete task scope", "board_id": board_id},
        headers=alice_headers
    )
    assert res_task_alice.status_code == 201
    assert res_task_alice.json()["title"] == "Complete task scope"
