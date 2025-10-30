import requests
import uuid
import time

BASE_URL = "http://localhost:3000"
ORG_ENDPOINT = f"{BASE_URL}/api/organizations"
TIMEOUT = 30

# Dummy auth token - replace with valid token for real testing
AUTH_TOKEN = "Bearer your_valid_jwt_token_here"

headers = {
    "Authorization": AUTH_TOKEN,
    "Content-Type": "application/json",
    "Accept": "application/json"
}

def test_update_organization_with_validation():
    # Step 1: Create a new organization to update
    create_payload = {
        "name_full": "Test Organization " + str(uuid.uuid4()),
        "inn": "1234567890",
        "address_legal": "123 Test St, Test City"
    }
    org_id = None
    try:
        response = requests.post(ORG_ENDPOINT, json=create_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Failed to create organization: {response.status_code} {response.text}"
        created_org = response.json()
        assert "id" in created_org, "Created organization response missing 'id'"
        org_id = created_org["id"]

        # Step 2: Update the organization with valid data
        update_payload = {
            "name_full": "Updated Organization " + str(uuid.uuid4()),
            "inn": "0987654321",
            "address_legal": "456 Updated Ave, New City"
        }
        update_response = requests.put(f"{ORG_ENDPOINT}/{org_id}", json=update_payload, headers=headers, timeout=TIMEOUT)

        # Check success update
        assert update_response.status_code == 200, f"Update failed: {update_response.status_code} {update_response.text}"
        updated_org = update_response.json()
        assert updated_org.get("name_full") == update_payload["name_full"], "Name not updated correctly"
        assert updated_org.get("inn") == update_payload["inn"], "INN not updated correctly"
        assert updated_org.get("address_legal") == update_payload["address_legal"], "Address not updated correctly"

        # Step 3: Test validation error: send invalid INN (e.g., too short)
        invalid_payload = {
            "name_full": "Invalid Org",
            "inn": "123",  # Invalid INN format
            "address_legal": "789 Invalid Rd"
        }
        invalid_response = requests.put(f"{ORG_ENDPOINT}/{org_id}", json=invalid_payload, headers=headers, timeout=TIMEOUT)
        assert invalid_response.status_code == 400, f"Expected 400 for validation error but got {invalid_response.status_code}"

        # Step 4: Test unauthorized access (no token)
        no_auth_response = requests.put(f"{ORG_ENDPOINT}/{org_id}", json=update_payload, headers={"Content-Type": "application/json"}, timeout=TIMEOUT)
        assert no_auth_response.status_code == 401, f"Expected 401 Unauthorized but got {no_auth_response.status_code}"

        # Step 5: Test not found error (non-existent ID)
        fake_id = str(uuid.uuid4())
        not_found_response = requests.put(f"{ORG_ENDPOINT}/{fake_id}", json=update_payload, headers=headers, timeout=TIMEOUT)
        assert not_found_response.status_code == 404, f"Expected 404 Not Found but got {not_found_response.status_code}"

    finally:
        # Clean up: delete created organization if exists
        if org_id:
            try:
                del_response = requests.delete(f"{ORG_ENDPOINT}/{org_id}", headers=headers, timeout=TIMEOUT)
                assert del_response.status_code == 200 or del_response.status_code == 404, f"Failed to delete organization: {del_response.status_code}"
            except Exception:
                pass

test_update_organization_with_validation()