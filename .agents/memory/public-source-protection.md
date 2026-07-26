---
name: Public source protection
description: Security boundary for the Tales Hero development preview and production server
---

The app intentionally keeps Vite in the Replit preview so the frontend can load during development, but direct browser or scanner requests for source, backend, workspace metadata, and environment paths must return 404. Production serves only the built `dist/public` output and applies the same denylist before the SPA fallback.

**Why:** A public preview once rendered `client/src/Pages/Login.tsx`, exposing implementation details and a client-side reCAPTCHA site key. Source visibility is unnecessary for visitors and can reveal server structure or future implementation details.

**How to apply:** Preserve both the Vite development middleware guard and the production Express guard when changing routing or preview configuration. Keep account/auth pages out of the sitemap and marked `noindex, nofollow`; never solve this by disabling Vite's internal module serving, because that breaks the running preview.