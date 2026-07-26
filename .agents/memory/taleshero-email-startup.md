---
name: Tales Hero email startup
description: Optional Resend configuration must not prevent the Vite app from booting
---

Tales Hero's Resend client must be created only when an email is actually sent, not while the Vite config or route modules are loading.

**Why:** `RESEND_API_KEY` may be absent in development or preview environments; constructing `Resend` at module import time makes the entire web app fail before the landing page can load.

**How to apply:** Keep the missing-key error explicit inside the email-send path, and configure `RESEND_API_KEY` before testing password-reset or security-question email delivery.