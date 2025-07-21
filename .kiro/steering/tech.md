# Technology Stack

## Core Framework
- **Next.js 15** with App Router and React 19
- **TypeScript** with strict mode enabled
- **Convex** for backend (database + serverless functions)
- **Clerk** for authentication and user management

## Frontend Technologies
- **TailwindCSS** for styling with custom configuration
- **Shadcn/ui** component library built on Radix UI primitives
- **Framer Motion** for animations
- **React Hook Form** with Zod validation
- **Zustand** for client-side state management
- **Tanstack Query** for server state management

## Backend & Database
- **Convex** as primary backend with real-time subscriptions
- **Convex Auth** integration with Clerk
- **Domain-driven architecture** in `/convex/domains/`
- **Strict schema validation** with Convex validators

## Payment & Integrations
- **Stripe** with Connect for marketplace payments
- **Stripe Express** accounts for partners
- **Resend** for transactional emails
- **React Email** for email templates
- **Sentry** for error monitoring

## Development Tools
- **ESLint** and **TypeScript** for code quality
- **Bun** and **npm** package managers
- **Turbo** for faster development builds

## Common Commands

```bash
# Development
npm run dev              # Start Next.js dev server (with Turbo)
npx convex dev          # Start Convex backend in dev mode

# Building
npm run build           # Build for production
npm run start          # Start production server

# Code Quality
npm run lint           # Run ESLint
npx tsc --noEmit      # TypeScript type checking

# Testing & Scripts
npm run test:openai           # Test OpenAI integration
npm run test:integration      # Test Convex integration
npm run test:email           # Test email functionality
npm run setup:subscription   # Setup guide subscription
npm run test:webhook         # Test webhook endpoints
```

## Key Configuration Files
- `next.config.mjs` - Next.js configuration with Sentry
- `convex/schema.ts` - Database schema definitions
- `convex/auth.config.ts` - Clerk authentication setup
- `tailwind.config.ts` - TailwindCSS configuration
- `components.json` - Shadcn/ui configuration