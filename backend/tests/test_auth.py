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
    """Test successful login returns access token"""
    # 1. Register
    client.post("/app/auth/register", json={
        "name": "Login User",
        "email": "login@example.com",
        "password": "mypassword"
    })

    # 2. Login (using JSON payload with email/password)
    payload = {
        "email": "login@example.com",
        "password": "mypassword"
    }
    response = client.post("/app/auth/login", json=payload)
    assert response.status_code == 201
    
    data = response.json()
    assert "access_token" in data
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
