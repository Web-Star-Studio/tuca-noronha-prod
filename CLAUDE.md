# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Build: `npm run build`
- Development: `npm run dev`
- Start: `npm run start`
- Lint: `npm run lint`
- TypeCheck: `npx tsc --noEmit`
- Convex Development: `npx convex dev`

## Code Style

- TypeScript with strict type checking
- React functional components with hooks
- Next.js App Router conventions
- File-based routing in `src/app` directory
- Import React components using absolute imports with `@/*` alias
- Use TailwindCSS for styling
- Convex functions in `/convex` directory follow patterns in convex_rules.md
- ESLint with Next.js core web vitals and TypeScript rules
- Explicit type annotations for props using React.ReactNode
- Non-nullable assertion (!) only when value is guaranteed
- Client components marked with "use client" directive
- Follow Clerk authentication patterns for user management
- Zustand for state management and TanStack Query for data fetching