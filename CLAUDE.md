# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Build: `npm run build`
- Development: `npm run dev`
- Start: `npm run start`
- Lint: `npm run lint`
- TypeCheck: `npx tsc --noEmit`
- Convex Development: `npx convex dev`

## Architecture Overview

This is a travel platform (Tuca Noronha) built with Next.js 15, React 19, Convex database, and Clerk authentication. The platform serves multiple user types in a tourism/travel booking context:

- **Travelers**: Book accommodations, activities, events, vehicles, and restaurants
- **Partners**: Manage their assets (hotels, restaurants, events, activities, vehicles) and bookings
- **Employees**: Limited access to specific partner assets based on permissions
- **Masters**: Full administrative access

### Key Features

- Multi-tenant RBAC system with asset-level permissions
- Event management with Sympla integration
- Restaurant reservations with detailed profiles
- Vehicle booking system
- Media management for assets
- Real-time booking management

### Domain Structure

The `/convex/domains/` directory organizes business logic by feature:
- `activities/`: Activity booking and management
- `bookings/`: Comprehensive booking system for all services
- `events/`: Event management with external integrations
- `media/`: File storage and media handling
- `rbac/`: Role-based access control system
- `restaurants/`: Restaurant profiles and reservations
- `users/`: User management and authentication
- `vehicles/`: Vehicle rental management

## Code Style

- TypeScript with strict type checking
- React functional components with hooks
- Next.js App Router conventions
- File-based routing in `src/app` directory
- Import React components using absolute imports with `@/*` alias
- Use TailwindCSS for styling with ui-config.ts constants
- Convex functions follow new function syntax from convex_rules.md
- ESLint with Next.js core web vitals and TypeScript rules
- Explicit type annotations for props using React.ReactNode
- Non-nullable assertion (!) only when value is guaranteed
- Client components marked with "use client" directive
- Follow Clerk authentication patterns for user management
- Use UI components from ui-config.ts for consistent styling
- Self-closing tags for empty HTML elements

## RBAC Implementation

- Users have roles: 'traveler', 'partner', 'employee', 'master'
- Asset-level permissions stored in `assetPermissions` table
- Partners can assign employees to specific assets with granular permissions
- All Convex functions check user permissions before executing operations
- Front-end conditionally renders based on user role and permissions

## Booking System

The platform features a comprehensive booking system inspired by industry leaders like OpenTable, Booking.com, and Movida:

### Booking Types
- **Activities**: Date/time-based bookings with participant limits and optional multiple ticket types
- **Events**: Ticket-based bookings with quantity limits and event-specific details
- **Restaurants**: Table reservations with party size limits and restaurant hours validation
- **Vehicles**: Date-range rentals with availability checking and additional options

### Key Features
- Unified booking schemas with common fields (customer info, status, payment tracking)
- Real-time availability checking and conflict detection
- Automatic confirmation code generation
- Comprehensive booking management dashboard for users
- Partner dashboard for managing incoming bookings
- Email validation and phone number formatting
- Booking cancellation with business rules
- Status tracking (pending, confirmed, canceled, completed, refunded)

### Components
- Individual booking forms for each service type (`/src/components/bookings/`)
- Management dashboard with search, filtering, and status updates
- Booking confirmation pages with shareable links
- Partner booking management interfaces

### Database Schema
- `activityBookings`: Activity-specific reservations
- `eventBookings`: Event ticket purchases  
- `restaurantReservations`: Restaurant table bookings
- `vehicleBookings`: Vehicle rental bookings
- All tables include customer info, status tracking, and audit fields