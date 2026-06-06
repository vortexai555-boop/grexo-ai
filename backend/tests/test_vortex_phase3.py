"""VORTEX AI Phase 3 - Payments / Subscriptions / Admin Panel API tests."""
import os
import re
import uuid
import base64
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    from pathlib import Path
    env_path = Path("/app/frontend/.env")
    for line in env_path.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip()
            break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@vortex.ai"
ADMIN_PASSWORD = "VortexAdmin@2026"


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def user_a():
    email = f"test_p3_userA_{uuid.uuid4().hex[:8]}@vortex-ai.com"
    r = requests.post(f"{API}/auth/signup", json={"email": email, "password": "PassAA@2026", "name": "PayerA"}, timeout=20)
    assert r.status_code == 200, r.text
    return {"email": email, "token": r.json()["token"], "user": r.json()["user"]}


@pytest.fixture(scope="module")
def user_b():
    email = f"test_p3_userB_{uuid.uuid4().hex[:8]}@vortex-ai.com"
    r = requests.post(f"{API}/auth/signup", json={"email": email, "password": "PassBB@2026", "name": "PayerB"}, timeout=20)
    assert r.status_code == 200, r.text
    return {"email": email, "token": r.json()["token"], "user": r.json()["user"]}


def _utr():
    return f"UTR{uuid.uuid4().hex[:12].upper()}"


# ----- Payment Settings (public for any auth user, write = admin) -----
class TestPaymentSettings:
    def test_get_settings_requires_auth(self):
        r = requests.get(f"{API}/payment-settings", timeout=10)
        assert r.status_code in (401, 403)

    def test_get_settings_shape(self, user_a):
        r = requests.get(f"{API}/payment-settings", headers=auth_headers(user_a["token"]), timeout=10)
        assert r.status_code == 200
        d = r.json()
        for k in ("qr_enabled", "pro_price", "business_price", "currency", "instructions"):
            assert k in d, f"Missing key {k} in payment-settings response"
        assert isinstance(d["pro_price"], (int, float))
        assert isinstance(d["business_price"], (int, float))

    def test_non_admin_cannot_update_settings(self, user_a):
        r = requests.put(f"{API}/admin/payment-settings", json={"pro_price": 39}, headers=auth_headers(user_a["token"]), timeout=10)
        assert r.status_code == 403

    def test_non_admin_cannot_delete_qr(self, user_a):
        r = requests.delete(f"{API}/admin/payment-settings/qr", headers=auth_headers(user_a["token"]), timeout=10)
        assert r.status_code == 403

    def test_admin_update_pro_price(self, admin_token, user_a):
        # change pro_price to 39 then verify visible to user
        r = requests.put(f"{API}/admin/payment-settings", json={"pro_price": 39}, headers=auth_headers(admin_token), timeout=10)
        assert r.status_code == 200, r.text
        assert r.json()["pro_price"] == 39
        r2 = requests.get(f"{API}/payment-settings", headers=auth_headers(user_a["token"]), timeout=10)
        assert r2.json()["pro_price"] == 39
        # restore default
        r3 = requests.put(f"{API}/admin/payment-settings", json={"pro_price": 29}, headers=auth_headers(admin_token), timeout=10)
        assert r3.status_code == 200
        assert r3.json()["pro_price"] == 29

    def test_admin_upload_and_delete_qr(self, admin_token, user_a):
        # tiny 1x1 PNG base64 with data-URL prefix
        png_data_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        r = requests.put(f"{API}/admin/payment-settings", json={"qr_image": png_data_url}, headers=auth_headers(admin_token), timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert body.get("qr_image"), "QR image not stored"
        assert not body["qr_image"].startswith("data:"), "data: prefix should be stripped server-side"
        # User can see it
        rg = requests.get(f"{API}/payment-settings", headers=auth_headers(user_a["token"]), timeout=10)
        assert rg.json().get("qr_image")
        # Delete QR
        rd = requests.delete(f"{API}/admin/payment-settings/qr", headers=auth_headers(admin_token), timeout=10)
        assert rd.status_code == 200
        rg2 = requests.get(f"{API}/payment-settings", headers=auth_headers(user_a["token"]), timeout=10)
        assert not rg2.json().get("qr_image"), "QR should be gone after delete"


# ----- Payment Submission -----
class TestPaymentSubmission:
    def test_submit_requires_auth(self):
        r = requests.post(f"{API}/payments", json={"plan": "pro", "name": "X", "email": "x@x.com", "utr_number": _utr()}, timeout=10)
        assert r.status_code in (401, 403)

    def test_invalid_plan_returns_400(self, user_a):
        r = requests.post(f"{API}/payments", json={"plan": "enterprise", "name": "A", "email": user_a["email"], "utr_number": _utr()}, headers=auth_headers(user_a["token"]), timeout=10)
        assert r.status_code == 400

    def test_short_utr_returns_400(self, user_a):
        r = requests.post(f"{API}/payments", json={"plan": "pro", "name": "A", "email": user_a["email"], "utr_number": "x1"}, headers=auth_headers(user_a["token"]), timeout=10)
        assert r.status_code == 400

    def test_submit_pro_payment_ok(self, user_a):
        utr = _utr()
        r = requests.post(f"{API}/payments", json={"plan": "pro", "name": "PayerA", "email": user_a["email"], "utr_number": utr}, headers=auth_headers(user_a["token"]), timeout=10)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["status"] == "pending"
        assert body["id"].startswith("pay_")
        TestPaymentSubmission._user_a_payment_id = body["id"]
        TestPaymentSubmission._user_a_utr = utr

    def test_duplicate_utr_returns_409(self, user_a):
        utr = getattr(TestPaymentSubmission, "_user_a_utr", _utr())
        r = requests.post(f"{API}/payments", json={"plan": "pro", "name": "A", "email": user_a["email"], "utr_number": utr}, headers=auth_headers(user_a["token"]), timeout=10)
        assert r.status_code == 409

    def test_payments_me_only_returns_own(self, user_a, user_b):
        r_a = requests.get(f"{API}/payments/me", headers=auth_headers(user_a["token"]), timeout=10)
        assert r_a.status_code == 200
        ids_a = {p["id"] for p in r_a.json()}
        assert getattr(TestPaymentSubmission, "_user_a_payment_id", None) in ids_a
        r_b = requests.get(f"{API}/payments/me", headers=auth_headers(user_b["token"]), timeout=10)
        assert r_b.status_code == 200
        ids_b = {p["id"] for p in r_b.json()}
        assert ids_a.isdisjoint(ids_b), "User B sees User A's payments!"

    def test_qr_disabled_blocks_submit(self, admin_token, user_a):
        # Disable QR
        ru = requests.put(f"{API}/admin/payment-settings", json={"qr_enabled": False}, headers=auth_headers(admin_token), timeout=10)
        assert ru.status_code == 200
        try:
            r = requests.post(f"{API}/payments", json={"plan": "pro", "name": "A", "email": user_a["email"], "utr_number": _utr()}, headers=auth_headers(user_a["token"]), timeout=10)
            assert r.status_code == 400
            assert "disabled" in r.json().get("detail", "").lower()
        finally:
            # Restore
            requests.put(f"{API}/admin/payment-settings", json={"qr_enabled": True}, headers=auth_headers(admin_token), timeout=10)


# ----- Admin Approve / Reject Flow -----
class TestAdminApproveFlow:
    def test_non_admin_cannot_list_payments(self, user_a):
        r = requests.get(f"{API}/admin/payments", headers=auth_headers(user_a["token"]), timeout=10)
        assert r.status_code == 403

    def test_non_admin_cannot_approve(self, user_a):
        r = requests.post(f"{API}/admin/payments/anything/approve", headers=auth_headers(user_a["token"]), timeout=10)
        assert r.status_code == 403

    def test_admin_list_payments(self, admin_token):
        r = requests.get(f"{API}/admin/payments", headers=auth_headers(admin_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_approve_pro_payment(self, admin_token, user_b):
        # Submit a new pro payment for user_b
        utr = _utr()
        sub = requests.post(f"{API}/payments", json={"plan": "pro", "name": "PayerB", "email": user_b["email"], "utr_number": utr}, headers=auth_headers(user_b["token"]), timeout=10)
        assert sub.status_code == 200
        pid = sub.json()["id"]
        # Approve
        ap = requests.post(f"{API}/admin/payments/{pid}/approve", headers=auth_headers(admin_token), timeout=15)
        assert ap.status_code == 200, ap.text
        body = ap.json()
        code = body.get("activation_code")
        assert code and re.match(r"^VTX-PRO-[A-Z0-9]{6}$", code), f"Bad activation code: {code}"
        sub_doc = body["subscription"]
        assert sub_doc["status"] == "active"
        assert sub_doc["plan"] == "pro"
        # /auth/me reflects new plan + credits
        me = requests.get(f"{API}/auth/me", headers=auth_headers(user_b["token"]), timeout=10)
        assert me.status_code == 200
        u = me.json()
        assert u["plan"] == "pro"
        assert u["credits"] == 2000
        assert u.get("active_activation_code") == code
        # /subscriptions/me shows active
        ms = requests.get(f"{API}/subscriptions/me", headers=auth_headers(user_b["token"]), timeout=10)
        assert ms.status_code == 200
        d = ms.json()
        assert d["active"] is not None and d["active"]["activation_code"] == code
        # Cannot re-approve
        re_ap = requests.post(f"{API}/admin/payments/{pid}/approve", headers=auth_headers(admin_token), timeout=10)
        assert re_ap.status_code == 400
        # Cannot reject an approved one
        rej = requests.post(f"{API}/admin/payments/{pid}/reject", headers=auth_headers(admin_token), timeout=10)
        assert rej.status_code == 400
        TestAdminApproveFlow._approved_code = code
        TestAdminApproveFlow._approved_pid = pid

    def test_admin_reject_pending_payment(self, admin_token, user_a):
        utr = _utr()
        sub = requests.post(f"{API}/payments", json={"plan": "business", "name": "A", "email": user_a["email"], "utr_number": utr}, headers=auth_headers(user_a["token"]), timeout=10)
        assert sub.status_code == 200
        pid = sub.json()["id"]
        rj = requests.post(f"{API}/admin/payments/{pid}/reject", headers=auth_headers(admin_token), timeout=10)
        assert rj.status_code == 200
        # Confirm status is now rejected
        lst = requests.get(f"{API}/admin/payments", params={"status": "rejected"}, headers=auth_headers(admin_token), timeout=15)
        assert lst.status_code == 200
        ids = {p["id"] for p in lst.json()}
        assert pid in ids

    def test_business_plan_approval_grants_business(self, admin_token, user_a):
        # user_a is currently free (one rejected business); submit fresh business and approve
        utr = _utr()
        sub = requests.post(f"{API}/payments", json={"plan": "business", "name": "A", "email": user_a["email"], "utr_number": utr}, headers=auth_headers(user_a["token"]), timeout=10)
        assert sub.status_code == 200
        pid = sub.json()["id"]
        ap = requests.post(f"{API}/admin/payments/{pid}/approve", headers=auth_headers(admin_token), timeout=15)
        assert ap.status_code == 200, ap.text
        code = ap.json()["activation_code"]
        assert re.match(r"^VTX-BUS-[A-Z0-9]{6}$", code)
        me = requests.get(f"{API}/auth/me", headers=auth_headers(user_a["token"]), timeout=10)
        assert me.json()["plan"] == "business"
        assert me.json()["credits"] == 99999


# ----- Admin Subscriptions + Audit Log -----
class TestAdminViews:
    def test_non_admin_subscriptions_403(self, user_a):
        r = requests.get(f"{API}/admin/subscriptions", headers=auth_headers(user_a["token"]), timeout=10)
        assert r.status_code == 403

    def test_non_admin_audit_403(self, user_a):
        r = requests.get(f"{API}/admin/audit", headers=auth_headers(user_a["token"]), timeout=10)
        assert r.status_code == 403

    def test_admin_subscriptions_list(self, admin_token):
        r = requests.get(f"{API}/admin/subscriptions", headers=auth_headers(admin_token), timeout=15)
        assert r.status_code == 200
        subs = r.json()
        assert isinstance(subs, list)
        # at least 1 active subscription created in approval tests
        assert any(s.get("status") == "active" for s in subs), "Expected at least one active subscription"
        # Activation code format
        for s in subs:
            ac = s.get("activation_code", "")
            assert re.match(r"^VTX-(PRO|BUS)-[A-Z0-9]{6}$", ac), f"Bad code in subscriptions list: {ac}"

    def test_admin_audit_log_has_entries(self, admin_token):
        r = requests.get(f"{API}/admin/audit", headers=auth_headers(admin_token), timeout=15)
        assert r.status_code == 200
        entries = r.json()
        assert isinstance(entries, list) and len(entries) >= 1
        actions = {e["action"] for e in entries}
        assert "approve_payment" in actions
        assert "update_payment_settings" in actions or "delete_qr" in actions
        for e in entries[:5]:
            assert e.get("admin_email") == ADMIN_EMAIL
            assert "ts" in e
