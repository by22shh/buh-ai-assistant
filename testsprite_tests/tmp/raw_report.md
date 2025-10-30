
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** buh-ai-assistant
- **Date:** 2025-10-30
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** send_verification_code_to_email
- **Test Code:** [TC001_send_verification_code_to_email.py](./TC001_send_verification_code_to_email.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 56, in <module>
  File "<string>", line 17, in test_send_verification_code_to_email
AssertionError: Expected 200 for first send, got 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5dfba65f-30f6-479e-a357-ce547d73665b/055a052f-acff-420c-8733-81081fba85be
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** verify_code_and_login_user
- **Test Code:** [TC002_verify_code_and_login_user.py](./TC002_verify_code_and_login_user.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 89, in <module>
  File "<string>", line 21, in test_verify_code_and_login_user
AssertionError: Failed to send code: {"success":false,"error":"Внутренняя ошибка сервера"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5dfba65f-30f6-479e-a357-ce547d73665b/32f9645c-f5fe-40ef-adfc-46e697329c52
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** get_current_user_profile
- **Test Code:** [TC003_get_current_user_profile.py](./TC003_get_current_user_profile.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 27, in test_get_current_user_profile
  File "<string>", line 15, in get_auth_token
  File "/var/task/requests/models.py", line 1024, in raise_for_status
    raise HTTPError(http_error_msg, response=self)
requests.exceptions.HTTPError: 500 Server Error: Internal Server Error for url: http://localhost:3000/api/auth/verify-code

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 54, in <module>
  File "<string>", line 30, in test_get_current_user_profile
AssertionError: Authentication failed for valid user credentials

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5dfba65f-30f6-479e-a357-ce547d73665b/44f47fc3-a432-4876-88d8-b5c43878b851
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** update_user_profile_with_email_change_verification
- **Test Code:** [TC004_update_user_profile_with_email_change_verification.py](./TC004_update_user_profile_with_email_change_verification.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 21, in test_update_user_profile_with_email_change_verification
AssertionError: Send code failed: {"success":false,"error":"Внутренняя ошибка сервера"}

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 167, in <module>
  File "<string>", line 27, in test_update_user_profile_with_email_change_verification
AssertionError: Failed to send verification code: Send code failed: {"success":false,"error":"Внутренняя ошибка сервера"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5dfba65f-30f6-479e-a357-ce547d73665b/59b41ad1-b916-4390-9686-865ae47d05ed
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** list_user_organizations
- **Test Code:** [TC005_list_user_organizations.py](./TC005_list_user_organizations.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 70, in <module>
  File "<string>", line 21, in test_list_user_organizations
AssertionError: Send code failed: {"success":false,"error":"Внутренняя ошибка сервера"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5dfba65f-30f6-479e-a357-ce547d73665b/c4554cfc-2c01-4044-ac3f-0ca8bf4ee7fa
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** create_organization_with_valid_requisites
- **Test Code:** [TC006_create_organization_with_valid_requisites.py](./TC006_create_organization_with_valid_requisites.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 83, in <module>
  File "<string>", line 45, in test_create_organization_with_valid_requisites
AssertionError: Expected 201 Created, got 401 with body {"error":"Unauthorized","message":"Invalid or expired token"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5dfba65f-30f6-479e-a357-ce547d73665b/71e6e440-8bbf-4699-b0e6-c389027233b6
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** get_organization_by_id
- **Test Code:** [TC007_get_organization_by_id.py](./TC007_get_organization_by_id.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 66, in <module>
  File "<string>", line 29, in test_get_organization_by_id
AssertionError: Create org failed: {"error":"Unauthorized","message":"Invalid or expired token"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5dfba65f-30f6-479e-a357-ce547d73665b/51edaec0-f2c0-420a-a9e1-323136b6e7ba
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** update_organization_with_validation
- **Test Code:** [TC008_update_organization_with_validation.py](./TC008_update_organization_with_validation.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 75, in <module>
  File "<string>", line 28, in test_update_organization_with_validation
AssertionError: Failed to create organization: 401 {"error":"Unauthorized","message":"Invalid or expired token"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5dfba65f-30f6-479e-a357-ce547d73665b/d7e432de-f765-4528-941f-791498eab9d6
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** delete_organization_by_id
- **Test Code:** [TC009_delete_organization_by_id.py](./TC009_delete_organization_by_id.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 65, in <module>
  File "<string>", line 27, in test_delete_organization_by_id
AssertionError: Failed to create organization, status 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5dfba65f-30f6-479e-a357-ce547d73665b/ee121a8f-070e-455e-84e7-a9ba26899ddb
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** create_new_document_with_template_support
- **Test Code:** [TC010_create_new_document_with_template_support.py](./TC010_create_new_document_with_template_support.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 102, in <module>
  File "<string>", line 19, in test_create_new_document_with_template_support
AssertionError

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5dfba65f-30f6-479e-a357-ce547d73665b/68bc2025-3693-47dc-b975-877c3e2a2e56
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---