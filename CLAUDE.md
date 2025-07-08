# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
bun run dev              # Start Next.js development server with Turbo
bunx convex dev          # Start Convex backend in development mode

# Build and Production
bun run build           # Build Next.js for production
bun start              # Start Next.js production server

# Code Quality
bun run lint           # Run ESLint
bunx tsc --noEmit      # TypeScript type checking

# Testing
bun run test:openai            # Test OpenAI integration
bun run test:integration       # Test Convex integration
bun run test:email            # Test email functionality
bun run test:webhook          # Test subscription webhooks
bun run test:webhook-endpoint # Test webhook endpoints

# Special Scripts
bun run setup:subscription    # Setup guide subscription system
bun run browser-tools-server # Start browser tools server
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

## Frontend Structure

### Route Organization
The frontend uses Next.js App Router with a clear separation between protected and public routes:

#### Protected Routes (`src/app/(protected)/`)
- **Admin Dashboard** (`admin/dashboard/`) - Partner and master admin panels
  - Asset management (activities, events, restaurants, vehicles, accommodations)
  - Booking management and confirmation
  - User and employee management
  - Media and analytics
  - Coupons management
- **User Dashboard** (`meu-painel/`) - Traveler dashboard
  - Personal bookings and reservations
  - Wishlist and recommendations
  - Chat with partners
  - Profile customization
- **Booking System** (`reservas/`) - Booking management and details
- **Onboarding** (`onboarding/`) - User onboarding flow

#### Public Routes (`src/app/`)
- **Asset Browsing** - Activities, events, restaurants, vehicles, accommodations
- **Booking Flow** - Booking creation and payment
- **Authentication** - Sign in/up with Clerk
- **Static Pages** - Help, accessibility, etc.

### Component Architecture
Components are organized by domain and functionality:

#### Domain Components (`src/components/`)
- **`cards/`** - Display components for assets (activities, events, restaurants, etc.)
- **`dashboard/`** - Admin and user dashboard components
- **`bookings/`** - Booking forms and management
- **`filters/`** - Search and filter components
- **`payments/`** - Payment integration components
- **`chat/`** - Real-time messaging components
- **`reviews/`** - Review and rating system
- **`coupons/`** - Coupon validation, user assignment, and asset management components

#### UI Components (`src/components/ui/`)
- Shadcn/ui components for consistent design
- Custom components built on top of Shadcn/ui
- Reusable form components and layout utilities

#### Hooks and Services (`src/lib/`)
- Custom React hooks for data fetching and state management
- Service layers for API communication
- Utility functions and constants

## Backend Structure (Convex)

### Domain-Driven Architecture
The backend is organized into business domains in `convex/domains/`:

#### Core Business Domains
- **`users/`** - User management, authentication, roles
- **`rbac/`** - Role-based access control system
- **`activities/`** - Activity booking with ticket support
- **`events/`** - Event management with Sympla integration
- **`restaurants/`** - Restaurant reservations with table management
- **`accommodations/`** - Accommodation bookings
- **`vehicles/`** - Vehicle rental system
- **`packages/`** - Travel packages combining multiple services
- **`bookings/`** - Unified booking system across all asset types

#### Support Domains
- **`stripe/`** - Payment processing and webhook handling
- **`media/`** - File upload and storage management
- **`email/`** - Email templates and sending
- **`notifications/`** - System notifications
- **`chat/`** - Real-time messaging
- **`reviews/`** - Review and rating system
- **`vouchers/`** - Digital voucher generation
- **`audit/`** - System audit logging
- **`subscriptions/`** - Guide subscription system
- **`coupons/`** - Comprehensive coupon system with RBAC integration

### Function Organization
Each domain follows consistent patterns:
- **`queries.ts`** - Data fetching functions
- **`mutations.ts`** - Data modification functions
- **`actions.ts`** - External API integrations and complex operations
- **`types.ts`** - TypeScript types and validators
- **`utils.ts`** - Domain-specific utility functions
- **`index.ts`** - Public API exports

### Database Schema
The schema (`convex/schema.ts`) includes:
- User management with RBAC
- Asset tables for all business domains
- Booking tables for each asset type
- Payment and Stripe integration tables
- Media and file storage tables
- Notification and communication tables
- Coupon system with usage tracking and RBAC integration

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
- **coupons/** - Multi-type coupon system with validation and asset assignment

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
- Coupon integration for discount application across all booking types

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

### Stripe Payment Integration
The platform implements a sophisticated Stripe payment system with the following architecture:

#### Payment Flow
1. **Product/Price Creation** - Assets automatically create Stripe products/prices when enabled
2. **Checkout Sessions** - Dynamic checkout creation with booking metadata
3. **Manual Capture** - Payments authorized but captured only after admin approval (for activities/events)
4. **Webhook Processing** - Real-time payment status updates
5. **Refund Management** - Automated refund processing with reason tracking

#### Key Components
- **Backend Actions** (`convex/domains/stripe/actions.ts`):
  - `createStripeProduct` - Creates Stripe products for assets
  - `createCheckoutSession` - Creates checkout sessions for bookings
  - `createPaymentLinkForBooking` - Creates payment links for existing bookings
  - `getOrCreateStripeCustomer` - Customer management
  - `createRefund` - Refund processing
  - `processWebhookEvent` - Webhook event processing
  - `capturePaymentIntent` - Manual payment capture
  - `cancelPaymentIntent` - Payment cancellation

- **Frontend Integration** (`src/api/stripe-webhook/route.ts`):
  - Webhook signature verification
  - Event routing to appropriate handlers
  - Booking status updates based on payment events

#### Payment Statuses
- **`requires_capture`** - Payment authorized, awaiting admin approval
- **`paid`** - Payment completed (checkout session)
- **`succeeded`** - Payment captured successfully
- **`failed`** - Payment failed
- **`canceled`** - Payment cancelled

#### Asset-Specific Behavior
- **Activities/Events**: Manual capture workflow (authorize → admin approval → capture)
- **Restaurants/Vehicles/Accommodations**: Automatic confirmation on payment
- **Subscriptions**: Handled via subscription-specific webhook processing

#### Webhook Events Handled
- `checkout.session.completed` - Payment session completion
- `payment_intent.succeeded` - Payment capture confirmation
- `payment_intent.payment_failed` - Payment failure handling
- `payment_intent.canceled` - Payment cancellation
- `customer.subscription.*` - Subscription events
- `invoice.*` - Invoice events for subscriptions

#### Security Features
- Webhook signature verification
- Idempotent event processing
- Comprehensive audit logging
- Secure customer data handling

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

## Coupon System

The platform includes a comprehensive coupon system integrated with all booking flows and payment processing:

### Coupon Types
- **Percentage Discount** - Percentage-based discounts (e.g., 10% off)
- **Fixed Amount** - Fixed amount discounts (e.g., R$ 50 off)
- **Free Shipping** - Shipping cost discounts (for applicable services)

### Coupon Features
- **RBAC Integration** - Partners and employees can manage coupons within their permissions
- **Asset Assignment** - Coupons can be restricted to specific assets (activities, events, restaurants, vehicles, accommodations)
- **User Assignment** - Coupons can be assigned to specific users/travelers
- **Multi-Usage Control** - Single-use or multi-use coupon configuration
- **Date Restrictions** - Valid from/to date ranges
- **Usage Tracking** - Complete audit trail of coupon usage
- **Conflict Detection** - Prevents multiple incompatible coupons

### Database Schema
- **`coupons`** - Main coupon configuration table with RBAC permissions
- **`couponUsages`** - Usage tracking with booking reference and audit info
- Performance indexes for efficient queries and validation

### Frontend Integration
- **`CouponValidator`** - Reusable component for coupon validation across all booking forms
- **`CouponUserAssignment`** - Admin interface for assigning coupons to users
- **`CouponAssetAssignment`** - Admin interface for asset-specific coupon management
- Real-time validation and price calculation
- Integrated into all booking forms: Activity, Event, Restaurant, Vehicle, Accommodation

### Backend Implementation
- **Domain Structure** (`convex/domains/coupons/`):
  - `queries.ts` - Coupon fetching and validation functions
  - `mutations.ts` - CRUD operations with RBAC checks
  - `types.ts` - Comprehensive validators and type definitions
  - `utils.ts` - Discount calculation and validation logic
- **Stripe Integration** - Coupon metadata passed to checkout sessions
- **Booking Integration** - All booking validators include coupon fields

### Admin Dashboard
- Complete CRUD interface for coupon management
- Bulk operations (create, update, delete multiple coupons)
- Analytics and usage reporting
- User assignment with search and filtering
- Asset assignment with visual asset cards
- Permission-based access control for partners and employees

### Security Features
- Asset-level permissions through RBAC system
- Organization-scoped coupon access for partners
- Employee permissions inherited from partner restrictions
- Comprehensive audit logging of all coupon operations
- Usage validation to prevent fraud and misuse