---
name: Tales Hero account data
description: Durable mapping for account profile and currency data in the external game database.
---

Cash is stored on `userinfofrompublisher.fdCash`. TR/game money is stored on `userinfogame.fdGameMoney`, joined through `userinfo.fdUserNum` and `userinfo.fdUID` matching the publisher username.

**Why:** The website account screen needs to read the game database's existing balances rather than inventing or duplicating wallet fields.

**How to apply:** Keep profile reads joined to the existing game tables; do not add a second website-owned balance source unless the game schema changes.