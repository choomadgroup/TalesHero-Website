# Simple Mantine Template

A responsive single-page website built with React, TypeScript, and Mantine UI v5.

## Stack

- **React 17** with TypeScript
- **Mantine v5** (core, hooks, carousel) — UI component library
- **react-scripts 5** (Create React App) — build tooling
- **SCSS** via `sass` (dart-sass)

## Running the app

```
PORT=5000 npm start
```

The dev server starts on port 5000. The workflow "Start application" handles this automatically.

## Build for production

```
npm run build
```

## Notes

- Several packages were overridden in `package.json` (`overrides`) to satisfy Replit's security policy (CVE-blocked versions replaced with patched ones): `webpack`, `@babel/traverse`, `websocket-driver`, `shell-quote`, and others.
- Mantine packages are pinned to `5.10.5` (the v5.0.0 tarball had missing subdirectory files).
- `sass` replaces the deprecated `node-sass`.
- Install with `--legacy-peer-deps` due to embla-carousel peer dep conflict with `@mantine/carousel`.

## User preferences

(none yet)
