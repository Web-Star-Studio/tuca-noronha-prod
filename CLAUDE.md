# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Start Next.js development server with Turbo
npx convex dev          # Start Convex backend in development mode

# Build and Production
npm run build           # Build Next.js for production
npm start              # Start Next.js production server

# Code Quality
npm run lint           # Run ESLint
npx tsc --noEmit      # TypeScript type checking

# Testing
npm run test:openai            # Test OpenAI integration
npm run test:integration       # Test Convex integration
npm run test:email            # Test email functionality
npm run test:webhook          # Test subscription webhooks
npm run test:webhook-endpoint # Test webhook endpoints

# Special Scripts
npm run setup:subscription    # Setup guide subscription system
npm run browser-tools-server # Start browser tools server
```

## Architecture Overview

This is a **Tuca Noronha Tourism Platform** built with:
- **Frontend**: Next.js 15 with App Router + React 19
- **Backend**: Convex (database + serverless functions)  
- **Authentication**: Clerk with custom role-based access control (RBAC)
- **Payments**: Stripe integration
- **Styling**: TailwindCSS + Shadcn/ui components

### Key Directories

- `src/app/` - Next.js App Router with route protection via middleware
- `src/components/` - React components organized by domain (cards, dashboard, filters, ui)
- `src/lib/` - Utilities, hooks, and services
- `convex/` - Backend functions organized by business domains
- `convex/domains/` - Domain-driven organization of backend logic
- `convex/schema.ts` - Database schema definition

### Domain Architecture

The backend is organized by business domains in `convex/domains/`:

- **activities/** - Activity booking system with tickets support
- **events/** - Event management with Sympla integration  
- **restaurants/** - Restaurant reservations with table management
- **accommodations/** - Accommodation bookings
- **vehicles/** - Vehicle rental system
- **packages/** - Travel packages combining multiple services
- **bookings/** - Unified booking system across all asset types
- **chat/** - Real-time messaging between travelers and partners
- **rbac/** - Role-based access control system
- **users/** - User management and authentication
- **stripe/** - Payment processing and webhooks
- **media/** - File upload and management
- **notifications/** - System notifications
- **email/** - Email templates and sending
- **reviews/** - Review and rating system
- **vouchers/** - Digital voucher generation
- **audit/** - System audit logging
- **subscriptions/** - Guide subscription system

## RBAC System

The platform implements a sophisticated role-based access control system:

### User Roles
1. **Traveler** - End users who book services
2. **Partner** - Business owners who provide services  
3. **Employee** - Partner staff with delegated permissions
4. **Master** - Platform administrators

### Key RBAC Features
- Partners can create employees and assign granular permissions
- Employees can only access specific assets assigned by their partner
- Asset permissions are stored in `assetPermissions` table
- Organization-based grouping through `partnerOrganizations`
- Comprehensive audit logging of all permission changes

## Convex Best Practices

### Function Organization
- Use the new function syntax with explicit args/returns validators
- Public functions: `query`, `mutation`, `action` for API endpoints
- Internal functions: `internalQuery`, `internalMutation`, `internalAction` for backend-only logic
- File-based routing: functions in `convex/domains/users/queries.ts` become `api.domains.users.queries.functionName`

### Schema Design
- All tables defined in `convex/schema.ts`
- Comprehensive indexing for performance
- Normalized relationships with proper foreign keys
- Soft deletes where appropriate using `isActive` flags

### Security
- All functions validate user authentication and authorization
- RBAC checks in every mutation that modifies assets
- Asset permissions verified before any CRUD operations
- Audit logging for sensitive operations

## Asset Management

All business assets (activities, events, restaurants, vehicles, accommodations, packages) follow similar patterns:

### Common Fields
- `partnerId` - Owner of the asset
- `isActive` - Soft delete flag
- `isFeatured` - Promotional flag
- Stripe integration fields for payments
- Media galleries and descriptions

### Booking System
- Unified booking tables for each asset type
- Status tracking: pending → confirmed → completed/cancelled
- Payment integration with Stripe
- Confirmation codes and customer info storage

## Authentication & Authorization

### Clerk Integration
- User roles stored in Clerk metadata
- Organization support for partner teams
- Middleware protection for routes in `src/middleware.ts`

### Route Protection
- `(protected)/` routes require authentication
- Role-based access control in components
- Server-side verification in Convex functions

## File Upload & Media

### Convex Storage
- Files uploaded through `media` domain
- Metadata tracking in `media` table
- Public/private access control
- Partner-scoped file management

## Development Guidelines

### Code Organization
- Domain-driven design in backend
- Component-based frontend architecture
- Absolute imports using `@/` alias
- TypeScript strict mode enabled

### Convex Patterns
- Always include validators for args and returns
- Use proper indexes for query performance
- Implement optimistic updates where appropriate
- Handle errors gracefully with user feedback

### UI/UX
- Consistent component patterns using Shadcn/ui
- Responsive design with Tailwind utilities
- Loading states and error boundaries
- Accessibility considerations

## Key Integrations

### Stripe
- Product/price creation for bookings
- Webhook handling for payment events
- Customer management
- Refund processing

### Email System  
- Template-based emails using React Email
- Transactional emails via Resend
- Email logging and status tracking
- Automated booking confirmations

### File Management
- Convex storage for all uploads
- Image optimization and resizing
- Gallery management for assets
- Partner-scoped access control

## Testing Strategy

- Integration tests for Convex functions
- Email template testing
- Webhook endpoint testing  
- OpenAI integration testing

## Environment Configuration

Required environment variables are defined in the codebase. The platform supports both development and production deployments with Convex and Vercel.