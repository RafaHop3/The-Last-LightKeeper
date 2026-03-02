import urllib.request
import json

BASE = "http://localhost:8000/api"
errors = []

def post(path, data, token=None):
    body = json.dumps(data).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", data=body, headers=headers)
    try:
        res = urllib.request.urlopen(req)
        return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def get(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", headers=headers)
    try:
        res = urllib.request.urlopen(req)
        return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def delete(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", headers=headers, method="DELETE")
    try:
        res = urllib.request.urlopen(req)
        return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def put(path, data, token=None):
    body = json.dumps(data).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", data=body, headers=headers, method="PUT")
    try:
        res = urllib.request.urlopen(req)
        return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def check(name, condition, detail=""):
    if condition:
        print(f"  ✅ {name}")
    else:
        print(f"  ❌ {name} {detail}")
        errors.append(name)


print("=" * 50)
print("APLIQUEI API TEST SUITE")
print("=" * 50)

# ===== AUTH =====
print("\n--- AUTH ---")

print("1. Login Admin (seeded)")
status, data = post("/auth/login", {"email": "admin@apliquei.com", "password": "admin123"})
check("Admin login", status == 200 and data.get("user", {}).get("role") == "admin", f"status={status}")
admin_token = data.get("access_token", "")

print("2. Register Recruiter")
status, data = post("/auth/register", {
    "name": "Maria Recrutadora", "email": "maria@empresa.com",
    "password": "123456", "role": "recruiter", "company": "TechCorp"
})
check("Recruiter register", status == 200 and data.get("access_token"), f"status={status}")
rec_token = data.get("access_token", "")

print("3. Register Candidate")
status, data = post("/auth/register", {
    "name": "João Candidato", "email": "joao@email.com",
    "password": "123456", "role": "candidate"
})
check("Candidate register", status == 200 and data.get("access_token"), f"status={status}")
cand_token = data.get("access_token", "")

print("4. Get /me")
status, data = get("/auth/me", token=cand_token)
check("Get me", status == 200 and data.get("email") == "joao@email.com", f"status={status}")

# ===== JOBS =====
print("\n--- JOBS ---")

print("5. Create Job")
status, data = post("/jobs", {
    "title": "Desenvolvedor Full Stack", "company": "TechCorp",
    "location": "São Paulo, SP", "job_type": "remote",
    "salary_min": 8000, "salary_max": 15000,
    "description": "Dev full stack React + Python.",
    "requirements": "React, Python, SQL", "benefits": "VR, Home Office"
}, token=rec_token)
check("Create job", status == 200 and data.get("id"), f"status={status}")
job_id = data.get("id")

print("6. List Jobs (public)")
status, data = get("/jobs")
check("List jobs", status == 200 and len(data) >= 1, f"status={status} count={len(data) if isinstance(data, list) else 0}")

print("7. Get Job Detail")
status, data = get(f"/jobs/{job_id}")
check("Get job detail", status == 200 and data.get("title") == "Desenvolvedor Full Stack", f"status={status}")

print("8. Recruiter My Jobs")
status, data = get("/jobs/recruiter/my-jobs", token=rec_token)
check("Recruiter my jobs", status == 200 and len(data) >= 1, f"status={status}")

# ===== APPLICATIONS =====
print("\n--- APPLICATIONS ---")

print("9. Apply to Job")
status, data = post("/applications", {
    "job_id": job_id, "cover_letter": "5 anos de experiência com React e Python!"
}, token=cand_token)
check("Apply to job", status == 200 and data.get("status") == "pending", f"status={status}")

print("10. Candidate Applications")
status, data = get("/applications/my", token=cand_token)
check("Candidate apps", status == 200 and len(data) >= 1, f"status={status}")

print("11. Recruiter Views Applications")
status, data = get(f"/applications/job/{job_id}", token=rec_token)
check("Recruiter views apps", status == 200 and len(data) >= 1, f"status={status}")

# ===== PUBLIC PLANS =====
print("\n--- PUBLIC PLANS ---")

print("12. List Plans (public)")
status, data = get("/plans")
check("List plans", status == 200 and len(data) == 4, f"status={status} count={len(data) if isinstance(data, list) else 0}")

# ===== ADMIN STATS =====
print("\n--- ADMIN ---")

print("13. Admin Stats")
status, data = get("/admin/stats", token=admin_token)
check("Admin stats", status == 200 and data.get("total_users", 0) >= 3, f"status={status} data={data}")

# ===== ADMIN USERS =====
print("14. Admin List Users")
status, data = get("/admin/users", token=admin_token)
check("Admin list users", status == 200 and len(data) >= 3, f"status={status}")

print("15. Admin Create User")
status, data = post("/admin/users", {
    "name": "Test Admin User", "email": "testadmin@test.com",
    "password": "test123", "role": "candidate"
}, token=admin_token)
check("Admin create user", status == 200 and data.get("id"), f"status={status} {data}")
test_user_id = data.get("id")

print("16. Admin Update User")
status, data = put(f"/admin/users/{test_user_id}", {
    "name": "Updated Name", "is_active": False
}, token=admin_token)
check("Admin update user", status == 200 and data.get("name") == "Updated Name", f"status={status}")

print("17. Admin Delete User")
status, data = delete(f"/admin/users/{test_user_id}", token=admin_token)
check("Admin delete user", status == 200, f"status={status}")

# ===== ADMIN PLANS =====
print("18. Admin List Plans")
status, data = get("/admin/plans", token=admin_token)
check("Admin list plans", status == 200 and len(data) == 4, f"status={status}")
plan_id = data[0]["id"] if data else None

if plan_id:
    print("19. Admin Update Plan")
    status, data = put(f"/admin/plans/{plan_id}", {"description": "Updated desc"}, token=admin_token)
    check("Admin update plan", status == 200 and data.get("description") == "Updated desc", f"status={status}")

# ===== ADMIN SETTINGS =====
print("20. Admin List Settings")
status, data = get("/admin/settings", token=admin_token)
check("Admin list settings", status == 200 and len(data) >= 1, f"status={status}")

print("21. Admin Create Setting")
status, data = post("/admin/settings", {
    "key": "test_setting", "value": "test_value", "category": "general"
}, token=admin_token)
check("Admin create setting", status == 200 and data.get("id"), f"status={status} {data}")
setting_id = data.get("id")

if setting_id:
    print("22. Admin Update Setting")
    status, data = put(f"/admin/settings/{setting_id}", {"value": "updated_value"}, token=admin_token)
    check("Admin update setting", status == 200 and data.get("value") == "updated_value", f"status={status}")

    print("23. Admin Delete Setting")
    status, data = delete(f"/admin/settings/{setting_id}", token=admin_token)
    check("Admin delete setting", status == 200, f"status={status}")

# ===== ADMIN FILES =====
print("24. Admin List Files")
status, data = get("/admin/files", token=admin_token)
check("Admin list files", status == 200, f"status={status}")

print("25. Admin Scan Files")
status, data = post("/admin/files/scan", {}, token=admin_token)
check("Admin scan files", status == 200, f"status={status}")

# ===== ADMIN DB VIEWER =====
print("26. Admin List Tables")
status, data = get("/admin/db/tables", token=admin_token)
check("Admin list tables", status == 200 and len(data) >= 5, f"status={status} tables={len(data) if isinstance(data, list) else 0}")

print("27. Admin View Table")
status, data = get("/admin/db/tables/users?limit=10", token=admin_token)
check("Admin view table", status == 200 and data.get("total", 0) >= 3, f"status={status}")

# ===== SECURITY: Non-admin cannot access admin routes =====
print("\n--- SECURITY ---")
print("28. Candidate cannot access admin")
status, data = get("/admin/stats", token=cand_token)
check("Candidate blocked from admin", status == 403, f"status={status}")

print("29. Recruiter cannot access admin")
status, data = get("/admin/stats", token=rec_token)
check("Recruiter blocked from admin", status == 403, f"status={status}")

# ===== SUMMARY =====
print("\n" + "=" * 50)
if errors:
    print(f"❌ {len(errors)} test(s) FAILED: {', '.join(errors)}")
else:
    print("✅ All 29 tests passed!")
print("=" * 50)
