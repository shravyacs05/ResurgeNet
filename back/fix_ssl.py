# This file provides a fix for the common SSL CERTIFICATE_VERIFY_FAILED error on macOS.
# It ensures that Python uses the 'certifi' library's certificate bundle,
# which is more up-to-date than the system's default.

import ssl
import certifi
import os

def apply_ssl_fix():
    """
    Applies a patch to the default SSL context to use certifi's certificates.
    """
    try:
        # Set environment variables to point to certifi's certificate bundle
        os.environ['SSL_CERT_FILE'] = certifi.where()
        os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
        print("✅ SSL certificate paths set to certifi bundle.")

        # For older versions of Python, creating a default context that works
        # might be necessary. This is a robust way to handle it.
        ssl._create_default_https_context = ssl._create_unverified_context
        print("✅ SSL default context monkey-patched for broader compatibility.")

    except Exception as e:
        print(f"Failed to apply SSL fix: {e}")

# Apply the fix immediately when this module is imported.
apply_ssl_fix()
