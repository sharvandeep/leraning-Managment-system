import urllib.request
import urllib.error
import json
from datetime import timedelta
import sys
import os

# Set PYTHONPATH so we can import app modules directly for token generation
sys.path.append(os.getcwd())
from app import security

api_url = "http://localhost:8000/api"
email = "teacher@lms.com"

def make_post_request(url, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            err_body = json.loads(e.read().decode("utf-8"))
        except Exception:
            err_body = e.reason
        return e.code, err_body

print("1. Sending forgot password request for teacher@lms.com...")
status_code, body = make_post_request(f"{api_url}/auth/forgot-password", {"email": email})
print(f"Status: {status_code} | Response: {body}")

print("\n2. Generating a valid reset token using the system's SECRET_KEY...")
# Teacher ID is 3 (verified via check_users.py)
token = security.create_access_token(
    data={"sub": "3", "purpose": "password_reset"},
    expires_delta=timedelta(minutes=15)
)
print(f"Generated Reset Token: {token[:40]}...")

print("\n3. Resetting the password to 'newpassword123' using the token...")
status_code, body = make_post_request(f"{api_url}/auth/reset-password", {
    "token": token,
    "new_password": "newpassword123"
})
print(f"Status: {status_code} | Response: {body}")

print("\n4. Attempting to log in with the new password...")
status_code, body = make_post_request(f"{api_url}/auth/login", {
    "email": email,
    "password": "newpassword123"
})
print(f"Status: {status_code}")
if status_code == 200:
    print("SUCCESS: Logged in successfully with new password!")
else:
    print("FAILED: Could not log in with new password.")
    sys.exit(1)

print("\n5. Re-setting the password back to '123456' to restore defaults...")
status_code, body = make_post_request(f"{api_url}/auth/reset-password", {
    "token": token,
    "new_password": "123456"
})
print(f"Status: {status_code} | Response: {body}")

print("\n6. Verifying login works with restored password...")
status_code, body = make_post_request(f"{api_url}/auth/login", {
    "email": email,
    "password": "123456"
})
print(f"Status: {status_code}")
if status_code == 200:
    print("SUCCESS: Account successfully restored to default password '123456'!")
else:
    print("FAILED: Could not restore account to default password.")
    sys.exit(1)
