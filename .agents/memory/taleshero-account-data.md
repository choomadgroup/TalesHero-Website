---
name: Tales Hero account data
description: Durable mapping for account profile and currency data in the external game database.
---

Cash is stored on `userinfofrompublisher.fdCash`. `fdWhitelist` is also on `userinfofrompublisher`: `1` permits game login and `0` represents a ban. MAU is stored on `userinfofrompublisher.fdMau` (added via migration in db.js). TR/game money is stored on `userinfogame.fdGameMoney`, EXP on `userinfogame.fdExp` — both joined through `userinfo.fdUserNum`. The in-game nickname is `userinfo.fdNickname`; keep it separate from the immutable publisher username.

**Why:** The website account screen needs to read the game database's existing balances rather than inventing or duplicating wallet fields.

**How to apply:** Keep profile reads joined to the existing game tables. Auth endpoints (me.js, login.js) return cash, mau, tr. The AuthUser interface requires all three. GM Tools PLAYER_SELECT also selects Mau and Exp. EXP send is Owner-only (no GM request path). MAU send follows the same Owner/GM-request pattern as Cash and TR.
