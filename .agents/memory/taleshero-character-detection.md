---
name: Tales Hero character detection
description: How to reliably detect the currently active character for a logged-in player
---

## Rule
Join `tblavatarcharactersetting` on:
```sql
acs.fdUserNum = i.fdUserNum
AND acs.fdItemCharacterSettingNum = ig.fdAvatarCharacterSettingNum
```
Use `acs.fdCharacter` — this is the exact character the player is using right now.

**Why:** `fdAvatarCharacterSettingNum` in `userinfogame` is a pointer to the player's current character-slot row in `tblavatarcharactersetting`. The game updates this row's `fdCharacter` column every time the player switches character. Every other approach is unreliable:
- All owned base-character (pos=0) inventory items share `fdUsing=1` and `fdExp=10000` — indistinguishable.
- `essenavataritemcpkref` via `fdAvatarCharacterSettingNum` can return null (settingNum doesn't exist in cpkref for many users) or return a fashion-item character (wrong when player wears cross-character fashion).

**How to apply:** Only this join + `fdCharacter` from `tblavatarcharactersetting` should be used. Do not fall back to inventory-based detection.

## Known character IDs (fdCharacter → name)
1=Jaka, 2=Mingming, 3=Tifanny, 4=BigBo, 5=DnD, 6=Narcius, 7=Maki, 8=Rough, 9=Dewi, 10=Kai,
11=Rina, 12=Rini, 13=Abel, 14=Haru, 15=Vera, 16=Wukong, 17=Hidden Rough, 18=Siho, 19=Luci,
20=Miho, 21=Deva, 22=R, 23=Harang, 24=LaLa, 25=Elims, 26=Cain, 27=YeonOh, 28=Bloody Vera,
212=Maid Mingming, 213=Bloody Vera (alt), 214=Elims (alt), 215=Cain (alt)
