---
name: Tales Hero character detection
description: How to detect a user's active in-game character; which tables to join and which CHAR_NAME_MAP names match art files.
---

## Rule
Use `tblavatarcharactersetting` (joined via `userinfogame.fdAvatarCharacterSettingNum`) as primary character source. Fallback to `usermyroomslotsettinginfo fdSlotNum=0` when the primary join yields null or 0.

SQL fragment:
```sql
LEFT JOIN tblavatarcharactersetting acs
  ON acs.fdUserNum = i.fdUserNum
  AND acs.fdItemCharacterSettingNum = ig.fdAvatarCharacterSettingNum
LEFT JOIN usermyroomslotsettinginfo mroom
  ON mroom.fdUserNum = i.fdUserNum AND mroom.fdSlotNum = 0
-- in SELECT:
COALESCE(NULLIF(acs.fdCharacter, 0), NULLIF(mroom.fdCharacter, 0)) AS fdChar
```

Users with fdChar=null have never logged into the game; show a placeholder, never a random default character.

## CHAR_NAME_MAP → art file names
Names must match `ALL_CHARACTERS[].name` in `client/src/Pages/Akun.tsx` and art files in `public/Image/Karakter/Art/`.

| fdChar | Name (art file) | Notes |
|--------|----------------|-------|
| 1  | Jaka | DB: Charlie |
| 2  | Mingming | DB: Ming Ming |
| 3  | Tifanny | DB: Lina |
| 4  | BigBo | |
| 5  | DnD | |
| 6  | Narcius | DB: Apollo |
| 7  | Maki | |
| 8  | Rough | |
| 9  | Dewi | DB: Ocean |
| 10 | Kai | DB: Kay |
| 11 | Rina | DB: Yuki |
| 12 | Rini | DB: Kuro |
| 13 | Abel | |
| 14 | Haru | DB: Jin |
| 15 | Vera | |
| 16 | Wukong | |
| 17 | Hidden Rough | |
| 18 | Siho | DB: Sio |
| 19 | Luci | DB: Lucy |
| 20 | Miho | |
| 21 | Bloody Vera | DB: Bloody Vera — was wrongly 'Deva' |
| 22 | R | |
| 23 | Harang | |
| 24 | LaLa | DB: La La |
| 25 | Elims | |
| 26 | Cain | |
| 27 | YeonOh | DB: Yeono |
| 28 | Bloody Vera | variant, same art as 21 |
| 30 | Roroa | DB: Roroa |
| 212 | Xionell | was wrongly 'Maid Mingming' |
| 213 | Celia | was wrongly 'Bloody Vera' |
| 215 | Damyeon | was wrongly 'Cain' |

Characters 29 (Cionel) and 214 (Rolloa) have no art file; omit from map (return null → placeholder).

**Why:** The old approach guessed character from `fdAvatarCharacterSettingNum` alone; that value is null for many accounts, and when it pointed to an accessory item `fdCharacter=0`, the detection failed silently and showed a wrong random character.
