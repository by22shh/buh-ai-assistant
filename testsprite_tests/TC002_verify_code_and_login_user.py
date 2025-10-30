import requests
from requests.cookies import RequestsCookieJar

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_verify_code_and_login_user():
    email = "testuser@example.com"
    valid_code = None
    session = requests.Session()
    headers = {"Content-Type": "application/json"}

    # Step 1: Send code to the email to get a valid code token from /api/auth/send-code
    try:
        send_code_resp = session.post(
            f"{BASE_URL}/api/auth/send-code",
            json={"email": email},
            headers=headers,
            timeout=TIMEOUT
        )
        assert send_code_resp.status_code == 200, f"Failed to send code: {send_code_resp.text}"
        send_code_data = send_code_resp.json()
        assert send_code_data.get("success") is True, "Send code did not succeed"
        token = send_code_data.get("token")
        assert token and isinstance(token, str), "No token returned for code sending"

        # Normally the 6-digit code is received by email; since we can't get it, assume a correct code exists for testing
        # This token may be needed or authorized by system, here we test with a dummy valid code "123456"
        # In a real integration environment, this step would capture or mock the actual code.
        valid_code = "123456"

        # Step 2: Verify code with correct code
        verify_correct_resp = session.post(
            f"{BASE_URL}/api/auth/verify-code",
            json={"email": email, "code": valid_code},
            headers=headers,
            timeout=TIMEOUT
        )
        assert verify_correct_resp.status_code == 200, f"Correct code verification failed: {verify_correct_resp.text}"

        # Validate JWT token issuance and HttpOnly cookie setting
        # Check JSON response success and presence of user object
        verify_data = verify_correct_resp.json()
        assert verify_data.get("success") is True, "Verify code success=false on correct code"
        assert "user" in verify_data and isinstance(verify_data["user"], dict), "User object missing or invalid"

        # Check for HttpOnly cookie set (JWT in cookie)
        cookies = verify_correct_resp.cookies
        has_httponly_jwt_cookie = False
        for cookie in cookies:
            if cookie.has_nonstandard_attr("HttpOnly") or "httponly" in (cookie._rest or {}):
                has_httponly_jwt_cookie = True
                # Optionally check cookie name for JWT token presence or pattern
                break
        # Because RequestsCookieJar does not expose HttpOnly attribute easily,
        # fallback: assume that cookie exists at all if headers contain set-cookie with HttpOnly
        if not has_httponly_jwt_cookie:
            set_cookie_header = verify_correct_resp.headers.get("set-cookie", "")
            has_httponly_jwt_cookie = "httponly" in set_cookie_header.lower()
        assert has_httponly_jwt_cookie, "No HttpOnly cookie set after successful verification"

        # Step 3: Verify code with incorrect code
        wrong_code = "000000"
        verify_wrong_resp = session.post(
            f"{BASE_URL}/api/auth/verify-code",
            json={"email": email, "code": wrong_code},
            headers=headers,
            timeout=TIMEOUT
        )
        assert verify_wrong_resp.status_code == 400, f"Invalid code did not return 400: {verify_wrong_resp.text}"

        # Step 4: Test rate limit exceeded - send multiple rapid requests with invalid codes to provoke 429
        rate_limit_exceeded = False
        for _ in range(10):
            resp = session.post(
                f"{BASE_URL}/api/auth/verify-code",
                json={"email": email, "code": wrong_code},
                headers=headers,
                timeout=TIMEOUT
            )
            if resp.status_code == 429:
                rate_limit_exceeded = True
                break
        assert rate_limit_exceeded, "Rate limit not enforced on excessive verify-code calls"

    finally:
        session.close()

test_verify_code_and_login_user()