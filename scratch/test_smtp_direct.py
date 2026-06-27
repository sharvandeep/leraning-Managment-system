import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

# Load env variables
load_dotenv('c:/Users/sharv/Downloads/LMS_BACKEND/.env')

smtp_server = os.getenv("SMTP_SERVER")
smtp_port = os.getenv("SMTP_PORT")
smtp_username = os.getenv("SMTP_USERNAME")
smtp_password = os.getenv("SMTP_PASSWORD")
smtp_from = os.getenv("SMTP_FROM")
smtp_display_name = os.getenv("SMTP_DISPLAY_NAME", "LearnSphear")

print("=== SMTP DIRECT DIAGNOSTIC TEST ===")
print(f"SMTP Server: {smtp_server}")
print(f"SMTP Port: {smtp_port}")
print(f"SMTP Username: {smtp_username}")
print(f"SMTP From: {smtp_from}")
print(f"SMTP Display Name: {smtp_display_name}")
print("Password length:", len(smtp_password) if smtp_password else 0)

if not smtp_server or not smtp_username or not smtp_password:
    print("Error: Missing SMTP configuration in environment.")
    exit(1)

try:
    print("\n1. Initializing SMTP connection...")
    server = smtplib.SMTP(smtp_server, int(smtp_port), timeout=10)
    
    print("2. Sending EHLO...")
    server.ehlo()
    
    print("3. Starting TLS...")
    server.starttls()
    
    print("4. Sending EHLO after TLS...")
    server.ehlo()
    
    print("5. Attempting Login...")
    server.login(smtp_username, smtp_password)
    print("SUCCESS: SMTP Authentication completed successfully!")
    
    print("\n6. Preparing test email message...")
    msg = MIMEMultipart()
    msg['From'] = f'"{smtp_display_name}" <{smtp_from}>'
    msg['To'] = smtp_from # Send it to yourself for testing
    msg['Subject'] = "LearnSphear SMTP Diagnostic Test"
    
    body = "This is a direct diagnostic test email from the LearnSphear development server. If you see this, your SMTP configuration is 100% correct!"
    msg.attach(MIMEText(body, 'plain'))
    
    print("7. Sending email...")
    server.sendmail(smtp_from, smtp_from, msg.as_string())
    print("SUCCESS: Email sent successfully!")
    
    print("8. Closing connection...")
    server.close()
    print("SMTP test complete. Check your inbox!")
except Exception as e:
    print(f"\nSMTP TEST FAILED: {e}")
