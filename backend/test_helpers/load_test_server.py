"""
Runs the backend with SMS disabled for local testing.
"""

import sys
import types

# Replace the SMS module before the application imports it.
sms = types.ModuleType("backend.REST_API.sms")


def no_sms(*args, **kwargs):
    # Tests using this backend must never send SMS messages.
    return None


sms.send_sms = no_sms
sys.modules["backend.REST_API.sms"] = sms

from backend.REST_API.main import app


@app.get("/load-test/sms-status")
def sms_status():
    return {"sms_disabled": True}