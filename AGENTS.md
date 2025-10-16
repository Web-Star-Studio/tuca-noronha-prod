# Repository Guidelines

## Project Structure & Module Organization
- `src/app` holds Next.js routes; keep protected dashboards inside `(protected)` segments and share layouts/providers via `src/app/(shared)`.
- Domain UIs live in `src/components/*` (bookings, coupons, chat) while low-level primitives stay in `src/components/ui`.
- Convex code sits in `convex/domains/*` with matching `queries.ts`/`mutations.ts`; the global schema is defined in `convex/schema.ts`.
- Utilities, hooks, and types belong in `src/lib`, `src/hooks`, and `src/types`; static assets use `public/`, reference docs `docs/`.

## Build, and Development Commands
- `bun run dev` – Next.js dev server; pair with `bunx convex dev` to boot Convex locally.
- `bun run build` then `bun start` – compile and serve the production bundle.
- `bun run lint` – Next.js ESLint preset; fix issues before committing.

## Coding Style & Naming Conventions
- TypeScript + React 19; prefer named exports, `PascalCase` components, `useCamelCase` hooks, and `camelCase` helpers.
- Follow the existing two-space indentation, trailing commas, and double quotes; rely on ESLint for verification.
- Compose styling with Tailwind utility classes and the local `cn` helper instead of inline styles.
- Mirror domain names between `convex/domains/*` and UI folders for discoverability.

## Commit & Pull Request Guidelines
- Match the concise, imperative history (`fix bookings modal state`); limit subjects to ~60 characters.
- Squash noisy WIP commits before pushing; every commit must pass lint, build, and relevant scripts.
- PRs should link the tracker ticket, summarise behavioural changes, list new env vars, and attach screenshots/Looms for UI updates.

## Security & Configuration Tips
- Keep secrets in `.env.local` and the Convex dashboard; never commit credentials or production keys.
- Update `convex/auth.config.ts` whenever roles change and call out permission impacts in the PR description.

## General Rules
- If you change any frontend form or component, always check the Convex mutation or action that it calls and update it accordingly. Making sure that the convex's validator matches the frontend form's validation.
- If you change any Convex mutation or action, always check the frontend form or component that calls it and update it accordingly. Making sure that the frontend form's validation matches the convex's validator.
- If you create any call to convex mutation or action from the frontend, always check if the mutation or action exists in the convex/domains folder and create it if it doesn't or update it to make sure it matches the frontend form's validation.