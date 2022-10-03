import asyncio
import json

from okta_jwt_verifier import AccessTokenVerifier, IDTokenVerifier
import logging

logger = logging.getLogger(__name__)


loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)


# def is_access_token_valid(token, issuer, audience="api://default"):
def is_access_token_valid(token, issuer, audience="api://5d3aeb63-9d64-4723-85c9-90ec51b8440c/read"):
    jwt_verifier = AccessTokenVerifier(issuer=issuer, audience=audience)
    try:
        loop.run_until_complete(jwt_verifier.verify(token))
        return True
    except Exception:
        logger.warning("Caught exception verifying access token", exc_info=True)
        return False


# def is_id_token_valid(token, issuer, client_id, nonce="SampleNonce", audience="api://default"):
def is_id_token_valid(token, issuer, client_id, nonce="SampleNonce", audience="api://5d3aeb63-9d64-4723-85c9-90ec51b8440c/read"):
    jwt_verifier = IDTokenVerifier(issuer=issuer, client_id=client_id, audience=audience)
    try:
        loop.run_until_complete(jwt_verifier.verify(token, nonce=nonce))
        return True
    except Exception:
        logger.warning("Caught exception verifying id token", exc_info=True)
        return False
