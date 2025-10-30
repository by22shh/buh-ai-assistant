import requests
import time

BASE_URL = "http://localhost:3000"
ENDPOINT = "/api/auth/send-code"
FULL_URL = BASE_URL + ENDPOINT
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def test_send_verification_code_to_email():
    email = "testuser@example.com"
    payload = {"email": email}

    # Send first request to send code
    response = requests.post(FULL_URL, json=payload, headers=HEADERS, timeout=TIMEOUT)
    assert response.status_code == 200, f"Expected 200 for first send, got {response.status_code}"
    data = response.json()
    assert isinstance(data.get("success"), bool), "Response missing 'success' boolean"
    assert data.get("success") is True, "Expected success true in response"
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0, "Token missing or invalid in response"
    assert "message" in data and isinstance(data["message"], str), "Message missing or invalid in response"

    # Immediately send second request to test rate limiting
    start_time = time.perf_counter()
    response2 = requests.post(FULL_URL, json=payload, headers=HEADERS, timeout=TIMEOUT)
    duration = time.perf_counter() - start_time

    # Response time check to detect timing attack prevention (should be nearly constant and short)
    assert duration < 5, f"Response took too long: {duration} seconds, potential timing attack vulnerability"

    # Check expected status codes for rate limiting or success
    if response2.status_code == 429:
        # Rate limit enforced
        # Optionally response body can be checked if available for indication
        assert True
    elif response2.status_code == 200:
        data2 = response2.json()
        assert isinstance(data2.get("success"), bool), "Second response missing 'success' boolean"
        assert "token" in data2 and isinstance(data2["token"], str) and len(data2["token"]) > 0, "Second token missing or invalid"
    else:
        assert False, f"Unexpected status code {response2.status_code} on second request"

    # Check timing attack prevention by measuring multiple calls for consistent response duration
    timings = []
    for _ in range(3):
        start = time.perf_counter()
        r = requests.post(FULL_URL, json=payload, headers=HEADERS, timeout=TIMEOUT)
        r.raise_for_status()  # Raise for unexpected statuses
        timings.append(time.perf_counter() - start)

    max_diff = max(timings) - min(timings)
    assert max_diff < 1.0, f"Response times vary too much ({max_diff}s), potential timing attack risk"


test_send_verification_code_to_email()