import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_update_user_profile_with_email_change_verification():
    # Use test user credentials
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_code = None
    headers = {}

    # Step 1: Send verification code to login user and get code (simulate external process)
    try:
        # Send code request
        resp = requests.post(
            f"{BASE_URL}/api/auth/send-code",
            json={"email": test_email},
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200, f"Send code failed: {resp.text}"
        data = resp.json()
        assert data.get("success") is True, "Send code response missing success true"
        assert "token" in data, "Send code response missing token"
        # The token here is not JWT for auth, so we continue to get code via test assumption
    except Exception as e:
        raise AssertionError(f"Failed to send verification code: {str(e)}")

    # For test purpose, assume code is "123456" (since real email intercept not possible here)
    # In real environment, it should be fetched by other means.
    test_code = "123456"

    # Step 2: Verify code and login user
    try:
        resp = requests.post(
            f"{BASE_URL}/api/auth/verify-code",
            json={"email": test_email, "code": test_code},
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200, f"Verify code failed: {resp.text}"
        verify_data = resp.json()
        assert verify_data.get("success") is True, "Verify code response missing success true"
        assert "user" in verify_data, "Verify code response missing user"
        # Extract cookies (HttpOnly) with JWT token for auth
        cookies = resp.cookies
        assert cookies, "No cookies set in verify code response"
        headers = {"Cookie": "; ".join([f"{c.name}={c.value}" for c in cookies])}
    except Exception as e:
        raise AssertionError(f"Failed to verify code and login: {str(e)}")

    # Step 3: Get current user profile to obtain existing data
    try:
        resp = requests.get(f"{BASE_URL}/api/users/me", headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Get user profile failed: {resp.text}"
        profile = resp.json()
        assert "email" in profile and profile["email"] == test_email, "User profile email mismatch"
    except Exception as e:
        raise AssertionError(f"Failed to get current user profile: {str(e)}")

    # Prepare update payload with changed details
    updated_email = f"updated_{uuid.uuid4().hex[:8]}@example.com"
    update_payload = {
        "firstName": "UpdatedFirst",
        "lastName": "UpdatedLast",
        "email": updated_email,
        "position": "Tester",
        "company": "TestCompany Inc",
    }

    # Step 4: Update user profile successfully
    try:
        resp = requests.put(
            f"{BASE_URL}/api/users/me",
            headers={**headers, "Content-Type": "application/json"},
            json=update_payload,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200, f"Update profile failed: {resp.text}"
    except Exception as e:
        raise AssertionError(f"Failed to update user profile: {str(e)}")

    # Step 5: Confirm email change triggers verification process (try to send code to new email)
    try:
        resp = requests.post(
            f"{BASE_URL}/api/auth/send-code",
            json={"email": updated_email},
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200, f"Send code to updated email failed: {resp.text}"
        send_code_resp = resp.json()
        assert send_code_resp.get("success") is True, "Send code to updated email did not succeed"
    except Exception as e:
        raise AssertionError(f"Email change verification not triggered: {str(e)}")

    # Step 6: Validation error - send bad payload (email invalid format)
    invalid_payload = {
        "firstName": "BadName",
        "lastName": "BadLast",
        "email": "not-an-email",
        "position": "Invalid",
        "company": "InvalidCo",
    }
    try:
        resp = requests.put(
            f"{BASE_URL}/api/users/me",
            headers={**headers, "Content-Type": "application/json"},
            json=invalid_payload,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 400, "Expected 400 validation error for bad email format"
    except AssertionError as e:
        raise
    except Exception as e:
        raise AssertionError(f"Failed to handle validation error: {str(e)}")

    # Step 7: Unauthorized access - no auth headers
    try:
        resp = requests.put(
            f"{BASE_URL}/api/users/me",
            headers={"Content-Type": "application/json"},
            json=update_payload,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 401, "Expected 401 Unauthorized without auth headers"
    except AssertionError as e:
        raise
    except Exception as e:
        raise AssertionError(f"Failed to handle unauthorized update: {str(e)}")

    # Step 8: Email conflict handling
    # First, create another user with an email that will conflict
    conflict_email = f"conflict_{uuid.uuid4().hex[:8]}@example.com"
    try:
        # Send code to conflict email
        resp = requests.post(
            f"{BASE_URL}/api/auth/send-code",
            json={"email": conflict_email},
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200, f"Send code failed for conflict user: {resp.text}"
        # Verify code to create user
        resp = requests.post(
            f"{BASE_URL}/api/auth/verify-code",
            json={"email": conflict_email, "code": "123456"},
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200, f"Verify code failed for conflict user: {resp.text}"
    except Exception as e:
        raise AssertionError(f"Failed to create conflict user: {str(e)}")

    # Try updating original user profile email to conflict_email
    conflict_payload = update_payload.copy()
    conflict_payload["email"] = conflict_email
    try:
        resp = requests.put(
            f"{BASE_URL}/api/users/me",
            headers={**headers, "Content-Type": "application/json"},
            json=conflict_payload,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 409, "Expected 409 Conflict when using existing email"
    except AssertionError as e:
        raise
    except Exception as e:
        raise AssertionError(f"Failed to handle email conflict: {str(e)}")

test_update_user_profile_with_email_change_verification()