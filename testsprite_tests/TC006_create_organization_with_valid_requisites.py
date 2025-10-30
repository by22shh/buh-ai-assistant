import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Placeholder token for authenticated requests; in real scenarios this should be obtained via auth flow
AUTH_TOKEN = "Bearer your_valid_jwt_token_here"

def create_organization_payload():
    unique_suffix = str(uuid.uuid4())[:8]
    return {
        "name_full": f"Test Organization {unique_suffix}",
        "inn": "7707083893",  # Example valid INN for a Russian organization (10 digits)
        "address_legal": "123 Test St, Test City, Test Country"
    }

def test_create_organization_with_valid_requisites():
    headers_auth = {
        "Authorization": AUTH_TOKEN,
        "Content-Type": "application/json"
    }
    
    headers_unauth = {
        "Content-Type": "application/json"
    }
    
    payload = create_organization_payload()
    
    # Test unauthorized access (no Authorization header)
    try:
        response = requests.post(f"{BASE_URL}/api/organizations", json=payload, headers=headers_unauth, timeout=TIMEOUT)
    except Exception as e:
        assert False, f"Request to create organization without auth failed unexpectedly: {e}"
    else:
        assert response.status_code == 401, f"Expected 401 Unauthorized for no auth, got {response.status_code}"
    
    # Test creating organization with valid requisites
    org_id = None
    try:
        response = requests.post(f"{BASE_URL}/api/organizations", json=payload, headers=headers_auth, timeout=TIMEOUT)
    except Exception as e:
        assert False, f"Request to create organization failed: {e}"
    
    assert response.status_code == 201, f"Expected 201 Created, got {response.status_code} with body {response.text}"
    
    try:
        data = response.json()
    except Exception as e:
        assert False, f"Response is not valid JSON: {e}"
    
    # Validate that response contains at least an ID or some identifier
    # Since schema not explicitly given for response body, assume it returns object including 'id'
    org_id = data.get("id")
    assert org_id is not None and isinstance(org_id, str) and org_id.strip() != "", "Response missing valid organization ID"
    
    # Validate response fields match input (name_full, inn, address_legal)
    assert data.get("name_full") == payload["name_full"], "name_full in response does not match request"
    assert data.get("inn") == payload["inn"], "inn in response does not match request"
    assert data.get("address_legal") == payload["address_legal"], "address_legal in response does not match request"
    
    # Additional business rules checks could be done here if API returns relevant details or errors
    
    # Test validation error by sending invalid INN (e.g., incorrect format)
    invalid_payload = payload.copy()
    invalid_payload["inn"] = "123"  # invalid INN (too short)
    try:
        response_invalid = requests.post(f"{BASE_URL}/api/organizations", json=invalid_payload, headers=headers_auth, timeout=TIMEOUT)
    except Exception as e:
        assert False, f"Request with invalid INN failed unexpectedly: {e}"
    else:
        assert response_invalid.status_code == 400, f"Expected 400 Validation error for invalid INN, got {response_invalid.status_code}"
    
    # Cleanup: delete the created organization
    if org_id:
        try:
            del_response = requests.delete(f"{BASE_URL}/api/organizations/{org_id}", headers=headers_auth, timeout=TIMEOUT)
        except Exception as e:
            assert False, f"Cleanup delete organization failed: {e}"
        else:
            assert del_response.status_code == 200, f"Expected 200 on delete, got {del_response.status_code}"

test_create_organization_with_valid_requisites()