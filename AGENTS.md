# Repository Guidelines

This guide keeps contributors aligned while the macOS Google Tasks desktop app is still being scaffolded. Treat it as the source of truth before opening any PR.

## Project Structure & Module Organization
Organize runtime code under `src/`: `src/main/` for the Electron main process, `src/renderer/` for the React UI, and `src/common/` for shared models and utilities. Store UI assets (icons, preload HTML) in `assets/`. Configuration such as OAuth credentials or environment defaults belongs in `config/` with example files checked in and secrets ignored.

## Build, Test, and Development Commands
Run `npm install` once to hydrate dependencies. Use `npm run dev` for hot-reloaded development, `npm run build` to produce a signed production bundle, and `npm run lint` before every commit. Execute `npm test` for the full test suite; add `--watch` while iterating locally.

## Coding Style & Naming Conventions
Use TypeScript with strict mode. Follow the default Prettier configuration (2-space indentation, single quotes, semicolons). Prefer descriptive PascalCase for components, camelCase for functions and variables, UPPER_SNAKE for constants, and kebab-case for filenames. Keep renderer components lean; push business logic into `src/common/` services.

## Testing Guidelines
Tests live alongside code in `__tests__` directories. Use Vitest with the testing-library matcher extensions for renderer components and Electron mocks for main-process contracts. Name files `*.spec.ts`. Aim for meaningful coverage on authentication flows, list syncing, and offline reconciliation. Run `npm test -- --coverage` before merging any feature work.

## Commit & Pull Request Guidelines
Adopt Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) to keep the changelog automatable. Each PR should include: concise scope summary, linked issue or TODO, screenshots or screen recordings for UI changes, and a checklist of manual verification steps (`npm run dev`, sync against a test Google account).

## Security & Configuration Tips
Never commit real OAuth secrets; instead, place them in `.env.local` and document required variables in `config/.env.example`. When debugging syncing, use separate Google accounts from personal data. Review third-party dependencies before adding them and prefer lightweight utilities to preserve the app’s startup performance targets.
