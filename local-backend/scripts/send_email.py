#!/usr/bin/env python3
"""
Gmail SMTP Email Sender for VNStock AI
Uses Python smtplib (built-in, no extra packages needed)
"""
import sys
import json
import smtplib
import argparse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "seeyeahall@gmail.com"
SENDER_PASSWORD = "qialfxmpfedshqgn"

def send_email(to_email, subject, body, html_body=None, attachments=None):
    msg = MIMEMultipart("alternative")
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain", "utf-8"))
    if html_body:
        msg.attach(MIMEText(html_body, "html", "utf-8"))

    if attachments:
        for filepath in attachments:
            if not os.path.exists(filepath):
                continue
            part = MIMEBase("application", "octet-stream")
            with open(filepath, "rb") as f:
                part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f'attachment; filename="{os.path.basename(filepath)}"',
            )
            msg.attach(part)

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
        return {"success": True, "message": f"Email sent to {to_email}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    parser = argparse.ArgumentParser(description="VNStock AI Email Sender")
    parser.add_argument("--to", required=True, help="Recipient email")
    parser.add_argument("--subject", required=True, help="Email subject")
    parser.add_argument("--body", required=True, help="Plain text body")
    parser.add_argument("--html", help="HTML body")
    parser.add_argument("--attachments", nargs="*", help="File paths to attach")
    args = parser.parse_args()

    result = send_email(args.to, args.subject, args.body, args.html, args.attachments)
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
