---
name: Imported workspace setup
description: Dependency restoration behavior for the imported Tales Hero pnpm workspace
---

For this imported pnpm workspace, restore dependencies with the existing lockfile before diagnosing application errors. The generic package helper may interpret a pnpm request as adding a dependency to the workspace root instead of installing the lockfile.

**Why:** The first startup failure was caused by missing `node_modules`, not by the Vite or application source. Installing from the lockfile restored the expected toolchain without changing package versions.

**How to apply:** When the workflow reports `vite: not found` and `node_modules` is absent, use the repository's frozen lockfile installation path, then restart the workflow and inspect runtime logs again.