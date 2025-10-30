import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_JWT_TOKEN"  # Replace with valid JWT token
}

def test_delete_organization_by_id():
    org_data = {
        "name_full": f"Test Organization {uuid.uuid4()}",
        "inn": "7707083893",
        "address_legal": "123 Test St, Test City"
    }

    created_org_id = None
    # Create a new organization to delete
    try:
        create_resp = requests.post(
            f"{BASE_URL}/api/organizations",
            json=org_data,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Failed to create organization, status {create_resp.status_code}"
        created_org_id = create_resp.json().get("id")
        assert created_org_id, "Response JSON missing organization id"

        # Delete the created organization
        delete_resp = requests.delete(
            f"{BASE_URL}/api/organizations/{created_org_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert delete_resp.status_code == 200, f"Failed to delete organization, status {delete_resp.status_code}"

        # Confirm deletion: requesting the same organization should return 404
        get_deleted_resp = requests.get(
            f"{BASE_URL}/api/organizations/{created_org_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert get_deleted_resp.status_code == 404, f"Deleted organization still accessible, status {get_deleted_resp.status_code}"

        # Try deleting a non-existent organization ID
        fake_id = str(uuid.uuid4())
        del_fake_resp = requests.delete(
            f"{BASE_URL}/api/organizations/{fake_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert del_fake_resp.status_code == 404, f"Deleting non-existent organization should return 404, got {del_fake_resp.status_code}"

    finally:
        # Cleanup in case deletion failed in test: attempt to delete if exists
        if created_org_id:
            requests.delete(
                f"{BASE_URL}/api/organizations/{created_org_id}",
                headers=HEADERS,
                timeout=TIMEOUT
            )

test_delete_organization_by_id()
