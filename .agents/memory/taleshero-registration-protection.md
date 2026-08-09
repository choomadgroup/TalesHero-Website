---
name: Tales Hero registration protection
description: Anti-abuse registration flow and the production secrets it depends on
---

New registrations must remain outside the game account table until the player verifies their email. The pending record stores only the game-compatible password hash and security-question data, uses a one-time hashed token, expires after 30 minutes, and is cleaned up during database migration.

**Why:** Direct registration allowed bots or throwaway accounts to consume rows in the game database before an email address was proven usable.

**How to apply:** Keep Turnstile validation server-side, keep `dev-bypass` development-only, preserve the per-IP/email/username limits, and configure `RESEND_API_KEY`, `TURNSTILE_SITE_KEY`, and `TURNSTILE_SECRET_KEY` before testing production registration.

Account recovery details follow the same boundary: username/Game ID, creation date, and masked registration IP are sent only to the verified email address, together with a one-hour password-reset link.

**Why:** Returning account metadata directly from an email lookup would let anyone who knows an address probe or expose player data.

**How to apply:** Keep the account-info endpoint email-only, Turnstile-protected, rate-limited, and generic in its browser response.