import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def _smtp_config():
    return {
        "host": os.environ.get("SMTP_HOST"),
        "port": int(os.environ.get("SMTP_PORT", "587")),
        "user": os.environ.get("SMTP_USER"),
        "password": os.environ.get("SMTP_PASSWORD"),
        "from_addr": os.environ.get("SMTP_FROM", os.environ.get("SMTP_USER")),
    }

def smtp_configured():
    cfg = _smtp_config()
    return bool(cfg["host"] and cfg["user"] and cfg["password"] and cfg["from_addr"])

def send_invite_email(to_email: str, org_name: str, invite_code: str, role_label: str = "member"):
    cfg = _smtp_config()
    if not (cfg["host"] and cfg["user"] and cfg["password"] and cfg["from_addr"]):
        print("⚠️  SMTP not configured — invite email skipped (set SMTP_* in backend/.env)")
        return False

    subject = f"You've been invited to {org_name} on Sentinel"
    body = f"""Hello,

You've been invited to join the "{org_name}" organisation on Sentinel as {role_label}.

Log in to your Sentinel account and accept the invitation on the Organisation page.

Invite code: {invite_code}

If you don't have an account yet, sign up with this email first, then accept.

— Sentinel
"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = cfg["from_addr"]
    msg["To"] = to_email
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=15) as server:
            server.starttls()
            server.login(cfg["user"], cfg["password"])
            server.sendmail(cfg["from_addr"], [to_email], msg.as_string())
        print(f"📧 Invite email sent to {to_email}")
        return True
    except Exception as e:
        print(f"⚠️  Failed to send invite email to {to_email}: {e}")
        return False
