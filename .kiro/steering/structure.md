# Project Structure

## Root Directory Organization

```
├── src/                     # Next.js application source
├── convex/                  # Convex backend functions and schema
├── public/                  # Static assets
├── docs/                    # Project documentation
├── scripts/                 # Utility scripts
└── tests/                   # Test files
```

## Frontend Structure (`src/`)

### App Router (`src/app/`)
- **(protected)/** - Routes requiring authentication
  - **admin/** - Master user dashboard and tools
  - **dashboard/** - General user dashboard
  - **meu-painel/** - Personal user panel
- **atividades/** - Activities listing and detail pages
- **eventos/** - Events listing and detail pages
- **restaurantes/** - Restaurant listing and detail pages
- **veiculos/** - Vehicle listing and detail pages
- **pacotes/** - Package system pages
- **api/** - API route handlers

### Components (`src/components/`)
- **ui/** - Shadcn/ui base components
- **bookings/** - Booking system components
- **cards/** - Service display cards
- **dashboard/** - Dashboard-specific components
- **filters/** - Search and filter components
- **auth/** - Authentication components
- **chat/** - Real-time chat components

### Libraries (`src/lib/`)
- **hooks/** - Custom React hooks
- **services/** - Business logic services
- **store/** - Zustand state management
- **providers/** - React context providers
- **utils.ts** - Utility functions

## Backend Structure (`convex/`)

### Domain-Driven Architecture (`convex/domains/`)
Each domain follows consistent structure:
- **index.ts** - Domain exports
- **queries.ts** - Read operations
- **mutations.ts** - Write operations
- **types.ts** - TypeScript definitions
- **utils.ts** - Domain utilities

### Key Domains
- **activities/** - Activity management
- **bookings/** - Reservation system
- **events/** - Event management
- **restaurants/** - Restaurant management
- **vehicles/** - Vehicle management
- **users/** - User management
- **rbac/** - Role-based access control
- **chat/** - Real-time messaging
- **stripe/** - Payment processing
- **email/** - Email notifications

### Core Files
- **schema.ts** - Database schema definitions
- **auth.config.ts** - Authentication configuration
- **http.ts** - HTTP endpoints
- **shared/** - Shared utilities and validators

## Configuration Files

- **next.config.mjs** - Next.js configuration with Sentry
- **tailwind.config.ts** - TailwindCSS styling configuration
- **components.json** - Shadcn/ui component configuration
- **tsconfig.json** - TypeScript configuration
- **package.json** - Dependencies and scripts

## Import Conventions

- Use absolute imports with `@/` alias for src directory
- Domain imports from `convex/domains/` use relative paths
- UI components imported from `@/components/ui`
- Utilities imported from `@/lib/utils`

## File Naming Conventions

- **Components**: PascalCase (e.g., `BookingForm.tsx`)
- **Pages**: lowercase with hyphens (e.g., `meu-painel/`)
- **Utilities**: camelCase (e.g., `useCurrentUser.ts`)
- **Types**: PascalCase interfaces/types
- **Constants**: UPPER_SNAKE_CASE