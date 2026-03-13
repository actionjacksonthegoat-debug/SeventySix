"""
ZAP authentication hook for SeventySix DAST scanning.

Reads a pre-obtained JWT access token from the ZAP_AUTH_TOKEN environment
variable and configures ZAP's replacer to add the Authorization header
to all spidered and scanned requests.

Usage in ZAP baseline:
  1. Pre-authenticate via curl/API call and export ZAP_AUTH_TOKEN
  2. Pass this script as the hook: -hook .zap/auth-hook.py
"""

import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def zap_started(zap, target):
    """Called after ZAP starts — configure auth header via replacer."""
    token = os.environ.get("ZAP_AUTH_TOKEN", "")
    if not token:
        logger.warning("ZAP_AUTH_TOKEN not set — running unauthenticated scan only")
        return

    logger.info("Configuring ZAP replacer with Bearer token for authenticated scanning")

    # Enable the replacer add-on and add an Authorization header rule
    zap.replacer.add_rule(
        description="Auth Bearer Token",
        enabled="true",
        matchtype="REQ_HEADER",
        matchregex="false",
        matchstring="Authorization",
        replacement=f"Bearer {token}",
        initiators="",
    )

    logger.info("ZAP authenticated scanning configured successfully")
