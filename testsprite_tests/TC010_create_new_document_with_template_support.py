import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_create_new_document_with_template_support():
    # Use test email and code for authentication (replace with valid test credentials)
    test_email = "testuser@example.com"
    test_code = "123456"  # Replace with valid code or mock
    
    session = requests.Session()
    try:
        # Authenticate user and get cookies for session
        send_code_resp = session.post(
            f"{BASE_URL}/api/auth/send-code",
            json={"email": test_email},
            timeout=TIMEOUT
        )
        assert send_code_resp.status_code == 200
        assert send_code_resp.json().get("success") is True

        verify_resp = session.post(
            f"{BASE_URL}/api/auth/verify-code",
            json={"email": test_email, "code": test_code},
            timeout=TIMEOUT
        )
        assert verify_resp.status_code == 200
        verify_json = verify_resp.json()
        assert verify_json.get("success") is True

        headers = {"Content-Type": "application/json"}

        # Step 1: Get enabled templates to ensure valid templateCode input
        templates_resp = session.get(f"{BASE_URL}/api/templates", timeout=TIMEOUT)
        assert templates_resp.status_code == 200
        templates = templates_resp.json()
        assert isinstance(templates, list)
        assert len(templates) > 0
        template_code = templates[0].get("code")
        assert template_code is not None, "No valid templateCode found from templates"

        # Step 2: Get user's organizations to pick optional organizationId if any
        orgs_resp = session.get(f"{BASE_URL}/api/organizations", timeout=TIMEOUT)
        assert orgs_resp.status_code in (200, 401)
        organization_id = None
        if orgs_resp.status_code == 200:
            orgs = orgs_resp.json()
            if isinstance(orgs, list) and len(orgs) > 0 and "id" in orgs[0]:
                organization_id = orgs[0]["id"]

        # Prepare payloads for various cases

        # Successful creation with minimum required field (templateCode only)
        payload_minimal = {
            "templateCode": template_code
        }

        # Successful creation with all optional fields
        payload_full = {
            "templateCode": template_code,
            "organizationId": organization_id,
            "title": "Test Document Title",
            "bodyText": "Sample text body for the document."
        }

        # 1) Test successful creation minimal
        resp = session.post(f"{BASE_URL}/api/documents", json=payload_minimal, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Expected 201 Created, got {resp.status_code}"
        doc1 = resp.json()
        assert isinstance(doc1, dict)
        assert "id" in doc1

        # 2) Test successful creation full
        resp = session.post(f"{BASE_URL}/api/documents", json=payload_full, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Expected 201 Created, got {resp.status_code}"
        doc2 = resp.json()
        assert isinstance(doc2, dict)
        assert "id" in doc2

        # 3) Test validation error: missing required templateCode
        payload_invalid = {
            "title": "Missing TemplateCode"
        }
        resp = session.post(f"{BASE_URL}/api/documents", json=payload_invalid, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400

        # 4) Test unauthorized access (without authentication)
        session_no_auth = requests.Session()
        resp = session_no_auth.post(f"{BASE_URL}/api/documents", json=payload_minimal, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 401

        # 5) Test access denied or limit exceeded
        payload_forbidden = {
            "templateCode": "invalid_template_code_to_trigger_403"
        }
        resp = session.post(f"{BASE_URL}/api/documents", json=payload_forbidden, headers=headers, timeout=TIMEOUT)
        assert resp.status_code in (403, 400)  # Could be forbidden or validation error

    finally:
        pass

test_create_new_document_with_template_support()
