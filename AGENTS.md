# Repository Guidelines

## Project Structure & Module Organization
- `src/app` holds Next.js routes; keep protected dashboards inside `(protected)` segments and share layouts/providers via `src/app/(shared)`.
- Domain UIs live in `src/components/*` (bookings, coupons, chat) while low-level primitives stay in `src/components/ui`.
- Convex code sits in `convex/domains/*` with matching `queries.ts`/`mutations.ts`; the global schema is defined in `convex/schema.ts`.
- Utilities, hooks, and types belong in `src/lib`, `src/hooks`, and `src/types`; static assets use `public/`, reference docs `docs/`.

## Build, Test, and Development Commands
- `bun run dev` – Next.js dev server; pair with `bunx convex dev` or `./start-all.sh` to boot Convex locally.
- `bun run build` then `bun start` – compile and serve the production bundle.
- `bun run lint` – Next.js ESLint preset; fix issues before committing.
- `bun run test:integration`, `bun run test:webhook`, `bun run test:email` – run Convex/email/webhook checks from `scripts/`.
- `bun test src/lib/testing/couponValidation.test.ts` – exercise coupon validators; copy this pattern for new unit suites.

## Coding Style & Naming Conventions
- TypeScript + React 19; prefer named exports, `PascalCase` components, `useCamelCase` hooks, and `camelCase` helpers.
- Follow the existing two-space indentation, trailing commas, and double quotes; rely on ESLint for verification.
- Compose styling with Tailwind utility classes and the local `cn` helper instead of inline styles.
- Mirror domain names between `convex/domains/*` and UI folders for discoverability.

## Testing Guidelines
- Use Bun’s test runner for colocated unit specs in `.test.ts` files; place fixtures beside the logic they cover.
- Integration scripts expect a seeded Convex deployment and valid `.env.local`; run them after schema or webhook changes.
- Describe scenarios in plain language (`deve rejeitar código vazio`) and document temporary gaps in the PR if coverage is postponed.

## Commit & Pull Request Guidelines
- Match the concise, imperative history (`fix bookings modal state`); limit subjects to ~60 characters.
- Squash noisy WIP commits before pushing; every commit must pass lint, build, and relevant scripts.
- PRs should link the tracker ticket, summarise behavioural changes, list new env vars, and attach screenshots/Looms for UI updates.

## Security & Configuration Tips
- Keep secrets in `.env.local` and the Convex dashboard; never commit credentials or production keys.
- Update `convex/auth.config.ts` whenever roles change and call out permission impacts in the PR description.
- Verify Sentry, Stripe, and Clerk keys per environment before `bun run build` to avoid runtime failures.
