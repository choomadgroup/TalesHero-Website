---
name: Tales Hero admin dashboard
description: Admin panel sections, GM tools layout, and known structural patterns.
---

Admin panel sections (Section type in Admin.tsx): `news | downloads | redeem | players | requests | logs`.

Sidebar nav has a divider between content sections (news/downloads/redeem) and GM Tools sections (players/requests/logs). GM sections (GmPlayerSection, GmRequestsSection, GmLogsSection) render their own topbar+content wrapper internally — Admin.tsx renders them directly without extra wrapping (no double-wrap).

GmPlayerSection send tab layout (as of current): 3 currency cards row (Cash/TR/MAU) + EXP Owner-only row + Item card. EXP send is Owner-only with no GM request path.

AdminUser interface includes `userNum: number` (from cookie, used for logging).

Admin news CRUD built; needs MONGODB_URI + ADMIN_PASSWORD secrets to activate persistence. Redeem codes use MySQL. GM Tools use the game MySQL tables.
