import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Placeholder credentials for authentication
TEST_EMAIL = "testuser@example.com"
TEST_CODE = "123456"  # This should match the actual code sent in a real test

def get_auth_token(email: str, code: str) -> str:
    url = f"{BASE_URL}/api/auth/verify-code"
    payload = {"email": email, "code": code}
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    if not data.get("success") or "user" not in data:
        raise Exception("Authentication failed")
    # Assuming the API responds with a Set-Cookie header containing HttpOnly cookie and does not return JWT in body
    # To use bearer token style, usually token is returned; here assume cookies session based for requests
    # If token is returned in response, get it accordingly. Since exact method not given, fallback to cookie session.
    return response.cookies

def test_get_current_user_profile():
    # First authenticate user to get valid auth cookies
    try:
        auth_cookies = get_auth_token(TEST_EMAIL, TEST_CODE)
    except Exception:
        # Cannot authenticate, fail test immediately
        assert False, "Authentication failed for valid user credentials"
    
    profile_url = f"{BASE_URL}/api/users/me"
    headers = {"Accept": "application/json"}

    # 1) Test authorized access - valid token/cookie
    response = requests.get(profile_url, headers=headers, cookies=auth_cookies, timeout=TIMEOUT)
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    json_data = response.json()
    # Validate keys existence in response
    expected_keys = {"id", "email", "firstName", "lastName", "role"}
    assert expected_keys.issubset(json_data.keys()), f"Response missing keys: {expected_keys - set(json_data.keys())}"
    # Validate value types
    assert isinstance(json_data["id"], str) and json_data["id"], "id should be non-empty string"
    assert isinstance(json_data["email"], str) and "@" in json_data["email"], "email should be valid string containing '@'"
    assert isinstance(json_data["firstName"], str), "firstName should be string"
    assert isinstance(json_data["lastName"], str), "lastName should be string"
    assert isinstance(json_data["role"], str) and json_data["role"] in {"admin", "user"}, "role should be 'admin' or 'user'"

    # 2) Test unauthorized access - no auth token/cookie
    response_unauth = requests.get(profile_url, headers=headers, timeout=TIMEOUT)
    assert response_unauth.status_code == 401, f"Expected 401 Unauthorized when no auth, got {response_unauth.status_code}"


test_get_current_user_profile()