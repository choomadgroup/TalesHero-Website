---
name: Tales Hero database runtime
description: External MySQL setup and the Vite middleware compatibility constraint for auth routes
---

The Tales Hero auth flow intentionally uses an external MySQL database through `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`. The Replit-managed PostgreSQL variables are not interchangeable with this implementation.

**Why:** The imported project already defines a MySQL schema and mysql2-based auth handlers, so preserving that database choice avoids an unrequested migration and keeps existing data compatibility.

**How to apply:** Keep the MySQL secrets available to the workflow. When auth handlers are mounted directly as Vite middleware, provide Express-like `res.status()` and `res.json()` helpers; `mysql2/promise` query calls must use the promise tuple API rather than callback syntax.