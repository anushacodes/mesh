def test_register_user(client):
    """Test successful user registration"""
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    }
    response = client.post("/app/auth/register", json=payload)
    assert response.status_code == 201
    
    data = response.json()
    assert data["name"] == "Test User"
    assert data["email"] == "test@example.com"
    assert "id" in data


def test_register_duplicate_email(client):
    """Test registering with an already occupied email address"""
    payload = {
        "name": "User One",
        "email": "dup@example.com",
        "password": "password123"
    }
    # First signup
    response1 = client.post("/app/auth/register", json=payload)
    assert response1.status_code == 201

    # Duplicate signup
    response2 = client.post("/app/auth/register", json=payload)
    assert response2.status_code == 409
    assert response2.json()["detail"] == "email already registered"


def test_login_success(client):
    """Test successful login returns access token and refresh token"""
    # 1. Register
    client.post("/app/auth/register", json={
        "name": "Login User",
        "email": "login@example.com",
        "password": "mypassword"
    })

    # 2. Login
    payload = {
        "email": "login@example.com",
        "password": "mypassword"
    }
    response = client.post("/app/auth/login", json=payload)
    assert response.status_code == 201
    
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    """Test login fails with incorrect password"""
    client.post("/app/auth/register", json={
        "name": "Auth User",
        "email": "auth@example.com",
        "password": "password123"
    })

    payload = {
        "email": "auth@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/app/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "invalid credentials"


def test_get_current_user_me(client):
    """Test fetching logged in profile with a valid token"""
    # 1. Register and Login
    client.post("/app/auth/register", json={
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "password123"
    })
    
    login_response = client.post("/app/auth/login", json={
        "email": "jane@example.com",
        "password": "password123"
    })
    token = login_response.json()["access_token"]

    # 2. Query /me
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/app/user/me", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == "Jane Doe"
    assert data["email"] == "jane@example.com"


def test_refresh_token_rotation(client):
    """Test rotating the refresh token to get a new set of credentials"""
    # 1. Register & Login
    client.post("/app/auth/register", json={
        "name": "Refresh User",
        "email": "refresh@example.com",
        "password": "password123"
    })
    login_res = client.post("/app/auth/login", json={
        "email": "refresh@example.com",
        "password": "password123"
    })
    data = login_res.json()
    initial_access = data["access_token"]
    initial_refresh = data["refresh_token"]

    # 2. Call refresh -> rotates the refresh token
    refresh_res = client.post("/app/auth/refresh", json={"refresh_token": initial_refresh})
    assert refresh_res.status_code == 200
    
    new_data = refresh_res.json()
    assert "access_token" in new_data
    assert "refresh_token" in new_data
    
    rotated_access = new_data["access_token"]
    rotated_refresh = new_data["refresh_token"]

    assert rotated_access != initial_access
    assert rotated_refresh != initial_refresh

    # 3. Old refresh token should now be invalid -> Should return 401
    expired_res = client.post("/app/auth/refresh", json={"refresh_token": initial_refresh})
    assert expired_res.status_code == 401

    # 4. Check active sessions listing via rotated access token
    headers = {"Authorization": f"Bearer {rotated_access}"}
    sessions_res = client.get("/app/auth/sessions", headers=headers)
    assert sessions_res.status_code == 200
    assert len(sessions_res.json()) == 1

    # 5. Logout using current refresh token
    logout_res = client.post("/app/auth/logout", json={"refresh_token": rotated_refresh})
    assert logout_res.status_code == 204

    # 6. Active sessions should now be empty
    sessions_res2 = client.get("/app/auth/sessions", headers=headers)
    assert len(sessions_res2.json()) == 0

