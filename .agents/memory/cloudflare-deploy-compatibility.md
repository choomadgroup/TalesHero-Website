---
name: Cloudflare deploy compatibility
description: Wrangler version compatibility for the Tales Hero deployment command
---

The project runs on Node 20, so the Cloudflare Pages deploy command must use a Wrangler major that still supports Node 20 rather than resolving the latest major implicitly.

**Why:** The latest Wrangler release began requiring Node 22, which makes an unpinned `npx wrangler` command fail in this project's runtime.

**How to apply:** Keep the deploy command pinned to the validated Node 20-compatible Wrangler release until the project's Node engine is intentionally upgraded.