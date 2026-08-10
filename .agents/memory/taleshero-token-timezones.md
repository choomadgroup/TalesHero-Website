---
name: Tales Hero token timezones
description: How expiry timestamps must be created for the MySQL-backed auth flows
---

Expiry timestamps for MySQL `DATETIME` auth records must be generated inside MySQL with `NOW()`/`DATE_ADD`, not passed from Node's UTC `Date` object. The database session uses `+07:00` while the Node process uses UTC.

**Why:** A Node `Date` inserted into a MySQL `DATETIME` column was stored as UTC clock time and immediately failed comparisons against MySQL `NOW()` in WIB, making fresh verification links appear expired.

**How to apply:** Use MySQL expressions for registration verification, password reset, and session expiry; keep comparisons in SQL against `NOW()`.