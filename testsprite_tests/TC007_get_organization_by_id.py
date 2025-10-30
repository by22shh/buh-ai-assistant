import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Set this to a valid Bearer token with appropriate permissions for the test user:
AUTH_TOKEN = "Bearer YOUR_VALID_JWT_TOKEN_HERE"

def test_get_organization_by_id():
    headers = {
        "Authorization": AUTH_TOKEN,
        "Content-Type": "application/json"
    }
    org_data = {
        "name_full": f"Test Organization {uuid.uuid4()}",
        "inn": "1234567890",
        "address_legal": "123 Test St, Test City"
    }
    org_id = None
    try:
        # Create organization to get a valid ID for test
        create_resp = requests.post(
            f"{BASE_URL}/api/organizations",
            json=org_data,
            headers=headers,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Create org failed: {create_resp.text}"
        created_org = create_resp.json()
        assert isinstance(created_org, dict)
        if "id" in created_org:
            org_id = created_org["id"]
        else:
            # If API does not return id, try to get organizations list and find it by name_full
            list_resp = requests.get(f"{BASE_URL}/api/organizations", headers=headers, timeout=TIMEOUT)
            assert list_resp.status_code == 200
            orgs = list_resp.json()
            orgs_by_name = [org for org in orgs if org.get("name_full") == org_data["name_full"]]
            assert len(orgs_by_name) == 1
            org_id = orgs_by_name[0]["id"]
        # Test GET organization by valid ID
        get_resp = requests.get(f"{BASE_URL}/api/organizations/{org_id}", headers=headers, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Get org by id failed: {get_resp.text}"
        org_detail = get_resp.json()
        assert org_detail.get("id") == org_id
        assert org_detail.get("name_full") == org_data["name_full"]
        assert org_detail.get("inn") == org_data["inn"]
        assert org_detail.get("address_legal") == org_data["address_legal"]

        # Test GET organization by invalid ID returns 404
        fake_id = "00000000-0000-0000-0000-000000000000"
        not_found_resp = requests.get(f"{BASE_URL}/api/organizations/{fake_id}", headers=headers, timeout=TIMEOUT)
        assert not_found_resp.status_code == 404

        # Test GET organization without auth returns 401
        unauth_resp = requests.get(f"{BASE_URL}/api/organizations/{org_id}", timeout=TIMEOUT)
        assert unauth_resp.status_code == 401 or unauth_resp.status_code == 403

    finally:
        if org_id:
            # Clean up created organization
            requests.delete(f"{BASE_URL}/api/organizations/{org_id}", headers=headers, timeout=TIMEOUT)


test_get_organization_by_id()