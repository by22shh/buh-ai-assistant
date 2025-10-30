import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_list_user_organizations():
    """
    Test retrieving the list of organizations associated with the authenticated user.
    Validate response structure and unauthorized access handling.
    """
    # Sample credentials for authentication - replace with valid email and code for real test
    email = "testuser@example.com"
    
    try:
        # Step 1: Send verification code to email
        send_code_resp = requests.post(
            f"{BASE_URL}/api/auth/send-code",
            json={"email": email},
            timeout=TIMEOUT,
        )
        assert send_code_resp.status_code == 200, f"Send code failed: {send_code_resp.text}"
        send_code_data = send_code_resp.json()
        assert send_code_data.get("success") is True, "Send code success flag is False"
        assert "token" in send_code_data, "No token returned on send-code"

        # Since the actual code is sent externally, we assume here for test purposes a valid code "123456"
        # In real scenarios, the code must be retrieved from email or test mocks
        code = "123456"

        # Step 2: Verify code and login user
        verify_code_resp = requests.post(
            f"{BASE_URL}/api/auth/verify-code",
            json={"email": email, "code": code},
            timeout=TIMEOUT,
        )
        assert verify_code_resp.status_code == 200, f"Verify code failed: {verify_code_resp.text}"
        verify_code_data = verify_code_resp.json()
        assert verify_code_data.get("success") is True, "Verify code success flag is False"
        assert "user" in verify_code_data, "No user info in verify code response"

        # Extract cookies (HttpOnly assumed) for authenticated requests
        cookies = verify_code_resp.cookies

        # Step 3: Authorized request - list organizations
        orgs_resp = requests.get(
            f"{BASE_URL}/api/organizations",
            cookies=cookies,
            timeout=TIMEOUT,
        )
        assert orgs_resp.status_code == 200, f"Authorized orgs list failed: {orgs_resp.text}"
        orgs_data = orgs_resp.json()
        assert isinstance(orgs_data, list), "Organizations response is not a list"

        # Optional: Validate each organization object is dict
        for org in orgs_data:
            assert isinstance(org, dict), "Organization item is not a dict"

        # Step 4: Unauthorized request - without cookies
        unauthorized_resp = requests.get(
            f"{BASE_URL}/api/organizations",
            timeout=TIMEOUT,
        )
        assert unauthorized_resp.status_code == 401, (
            f"Unauthorized access should return 401, got {unauthorized_resp.status_code}"
        )

    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

test_list_user_organizations()