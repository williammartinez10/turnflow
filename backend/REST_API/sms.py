import logging
import os
import re


from twilio.http.http_client import TwilioHttpClient
from twilio.rest import Client

logger = logging.getLogger(__name__)


def send_sms(phone_number: str, body: str):
    """
    Send an SMS using the backend's Twilio configuration.

    Accepts a ten-digit phone number, including the database's XXX-XXX-XXXX
    format, and converts it to +1XXXXXXXXXX.

    SMS failures are logged separately and do not undo Customer registration.
    """
    if os.getenv("SMS_ENABLED", "false").strip().lower() != "true":
        return None

    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    from_number = os.getenv("TWILIO_PHONE_NUMBER", "").strip()

    if not account_sid or not auth_token or not from_number:
        logger.error("SMS was not submitted: Twilio configuration is incomplete.")
        return None

    digits = re.sub(r"\D", "", phone_number or "")

    if len(digits) == 10:
        to_number = f"+1{digits}"
    elif len(digits) == 11 and digits.startswith("1"):
        to_number = f"+{digits}"
    else:
        logger.error("SMS was not submitted: invalid recipient phone format.")
        return None

    try:
        # Limit the time spent waiting for Twilio.
        http_client = TwilioHttpClient(timeout=10)
        client = Client(
            account_sid,
            auth_token,
            http_client=http_client,
        )

        message = client.messages.create(
            body=body,
            from_=from_number,
            to=to_number,
        )

        # Acceptance by Twilio does not confirm delivery to the phone.
        logger.info("SMS submitted to Twilio: %s", message.sid)
        return message.sid

    except Exception as error:
        # Avoid logging phone numbers, message contents, or credentials.
        logger.error(
            "SMS submission failed (%s, code=%s).",
            type(error).__name__,
            getattr(error, "code", None),
        )
        return None