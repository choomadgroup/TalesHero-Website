---
name: Tales Hero account locks
description: Permanent account-field rules and reset-password behavior.
---

Username is immutable after game-account registration. Email and the security question are write-once fields: legacy users may set missing values from the website, then neither field can be changed. Setting either value requires the current game password.

**Why:** These fields identify or recover an account, so browser-side controls alone are not sufficient and later edits would undermine account recovery.

**How to apply:** Enforce the rule in the server handler before any database update; keep reset-password verification tied to the stored security-answer hash and question.