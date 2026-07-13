import smtplib
from email.message import EmailMessage
from email.utils import make_msgid
from app.core.config import settings
from decimal import Decimal
import os

def send_order_confirmation(user_email: str, order_id: int, total_price: Decimal):
    if not settings.SMTP_HOST:
        print(f"Skipping email sending. SMTP not configured. Would have sent to {user_email} for order {order_id}")
        return
        
    msg = EmailMessage()
    msg.set_content(f"Thank you for your order! Your order ID is #{order_id}. Total: ${total_price}")
    msg["Subject"] = f"Order #{order_id} Confirmation"
    msg["From"] = settings.SMTP_USER
    msg["To"] = user_email

    try:
        with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT)) as server:
            if settings.SMTP_USER and settings.SMTP_PASS:
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)
    except Exception as e:
        print(f"Error sending email: {e}")

def send_reset_password_email(email_to: str, token: str, admin_phone: str = "050-000-0000"):
    if not settings.SMTP_HOST:
        print(f"Skipping email sending. SMTP not configured. Would have sent to {email_to}")
        return
        
    reset_link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
    
    # Generate a unique Content-ID for the logo
    logo_cid = make_msgid(domain='bingo.online')
    # Remove angle brackets for the HTML src
    logo_cid_src = logo_cid[1:-1]
    
    html_content = f"""
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                background-color: #f4f4f5;
                margin: 0;
                padding: 20px;
                text-align: center;
                color: #333;
            }}
            .container {{
                background-color: #ffffff;
                max-width: 500px;
                margin: 0 auto;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }}
            .logo {{
                max-width: 150px;
                margin-bottom: 20px;
            }}
            h2 {{
                color: #1a202c;
                margin-bottom: 20px;
            }}
            p {{
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 20px;
            }}
            .btn {{
                display: inline-block;
                background-color: #3b82f6;
                color: #ffffff !important;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 30px;
            }}
            .footer {{
                font-size: 14px;
                color: #718096;
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <img class="logo" src="cid:{logo_cid_src}" alt="Bingo Fabrics">
            <h2>איפוס סיסמה למערכת</h2>
            <p>שלום,</p>
            <p>קיבלנו בקשה לאיפוס הסיסמה לחשבון שלך. כדי לבחור סיסמה חדשה, לחץ על הכפתור למטה:</p>
            <a href="{reset_link}" class="btn">לאיפוס הסיסמה לחץ כאן</a>
            <p>הקישור יהיה בתוקף לשעה אחת בלבד.</p>
            <p>אם לא ביקשת לאפס את הסיסמה, התעלם מהודעה זו.</p>
            
            <div class="footer">
                בברכה,<br>
                צוות <strong>Bingo Fabrics</strong><br>
                שירות לקוחות: <a href="tel:{admin_phone}" dir="ltr">{admin_phone}</a>
            </div>
        </div>
    </body>
    </html>
    """
    
    msg = EmailMessage()
    msg["Subject"] = "איפוס סיסמה - Bingo Fabrics"
    msg["From"] = settings.SMTP_USER
    msg["To"] = email_to
    msg.set_content("לצפייה בהודעה אנא השתמש בלקוח דוא\"ל שתומך ב-HTML.")
    msg.add_alternative(html_content, subtype='html')

    # Read the logo file and attach it as inline image
    logo_path = os.path.join(os.path.dirname(__file__), "..", "bingo_logo.webp")
    try:
        with open(logo_path, 'rb') as f:
            logo_data = f.read()
            msg.get_payload()[1].add_related(logo_data, 'image', 'webp', cid=logo_cid)
    except Exception as e:
        print(f"Failed to attach logo: {e}")

    try:
        with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT)) as server:
            server.starttls()  # Start TLS for port 587
            if settings.SMTP_USER and settings.SMTP_PASS:
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)
    except Exception as e:
        print(f"Error sending reset email: {e}")
