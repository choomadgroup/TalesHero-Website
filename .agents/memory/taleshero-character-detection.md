---
name: Tales Hero character detection
description: How to correctly detect a player's base character from the game DB
---

# Character Detection

## The Rule
`userinfogame.fdAvatarCharacterSettingNum` tracks the **fashion/costume SET** currently worn,
not the base character the player IS. A player wearing Elims fashion on Cain will have an Elims
item number in this field → cpkref returns fdChar=25 (Elims) even though the player IS Cain.

**Correct approach:** query `tblavataruser JOIN tblavataritemdesc` for equipped items
(`fdUsing=1`) where `fdType=1 AND fdPosition=0` — these are base character unlock items.
`tblavataritemdesc.fdCharacter` on such a row is the true base character ID.

**Why:** Discovered by querying tblavataritemdesc and finding that Cain (#83404) and Elims
(#83403) both have `fdType=1, fdPosition=0, fdItemKind=0` whereas all fashion items are `fdType=2`.

## Priority in me.js
1. `inv.fdCharFromInv` — base character from inventory (fdType=1, fdPosition=0, fdUsing=1) — most reliable
2. `cpk.fdChar` — from fdAvatarCharacterSettingNum via cpkref — last resort (may return fashion character)

## localStorage (Akun.tsx)
Old format stored numeric index → treated as stale and cleared on load.
New format stores character NAME (string) so old sessions cannot override game detection.
Game character always wins unless user has an explicit name-based override for a DIFFERENT character.

## Key table facts
- `tblavataritemdesc.fdType=1, fdPosition=0` → base character item
- `tblavataritemdesc.fdType=2` → fashion/accessory item
- `tblavataruser.fdUsing=1` → currently equipped
- `tblavataruser.fdCharacter` → which character the item belongs to
- CHAR_NAME_MAP in me.js: Cain=26, Elims=25
