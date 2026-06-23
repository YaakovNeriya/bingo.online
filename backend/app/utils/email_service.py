import smtplib
from email.message import EmailMessage
from app.core.config import settings

def send_order_confirmation(user_email: str, order_id: int, total_price: float):
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
