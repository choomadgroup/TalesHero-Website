---
name: Tales Hero item catalogue
description: Durable rules for reading game items, package variants, and public CDN icons.
---

The game inventory table uses `tblavataruser.fdItemDescNum`, which joins to `tblavataritemdesc.fdItemNum`; it does not expose an `fdItemNum` column directly. Use a distinct/grouped query when listing owned items because the same definition can belong to many players.

**Why:** The website catalogue needs the game's canonical names, descriptions, categories, and ownership counts rather than maintaining a second item catalogue.

**How to apply:** Use `tblavataritemdescex.fdSupplyItemDescNum` → `fdVirtualItemDescNum` to identify timed/package variants. The public BunnyCDN asset tree has 64px icons, but its folder name is not reliably derived from `fdPosition`; resolve images with ordered candidate URLs and an on-error fallback rather than assuming one category.