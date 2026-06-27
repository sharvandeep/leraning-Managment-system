import urllib.request
import urllib.error
import json

api_url = "http://localhost:8000/api"
email = "sharvandeepk@gmail.com"

print("Triggering real password reset email for sharvandeepk@gmail.com...")
data = json.dumps({"email": email}).encode("utf-8")
req = urllib.request.Request(f"{api_url}/auth/forgot-password", data=data, headers={"Content-Type": "application/json"}, method="POST")
try:
    with urllib.request.urlopen(req) as res:
        print(f"Status: {res.status} | Body: {res.read().decode('utf-8')}")
        print("Real SMTP email dispatched successfully!")
except urllib.error.HTTPError as e:
    print(f"Error: {e.code} | Reason: {e.read().decode('utf-8')}")
