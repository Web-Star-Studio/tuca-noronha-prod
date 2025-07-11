# Coupon System PRD - Tuca Noronha Tourism Platform

## Executive Summary

This document outlines the requirements for implementing a comprehensive coupon system integrated with the existing Tuca Noronha Tourism Platform. The system will provide role-based coupon management for administrators (Master, Partner, Employee) and seamless integration with the existing Stripe payment system.

## Project Overview

### Problem Statement
The platform currently lacks a promotional system that allows administrators to create, manage, and distribute discount coupons to travelers. This limits marketing capabilities and the ability to incentivize bookings across different asset types.

### Solution
Implement a full-featured coupon system that integrates with the existing RBAC system and Stripe payment infrastructure, providing:
- Administrative interfaces for coupon CRUD operations
- Role-based access control for coupon management
- Flexible coupon types and discount structures
- Asset-specific and user-specific coupon assignments
- Real-time validation and usage tracking
- Seamless integration with existing booking flows

## Current System Analysis

### Existing Architecture
Based on the analysis of the current codebase, the platform already has:

**Backend (Convex)**:
- Domain-driven architecture with `convex/domains/coupons/` already implemented
- Comprehensive coupon queries, mutations, and validations
- RBAC system with Master, Partner, Employee, and Traveler roles
- Stripe integration with payment processing and webhook handling

**Frontend (React/Next.js)**:
- Admin dashboard with role-based navigation
- Coupon validation components (`CouponValidator.tsx`)
- Existing UI patterns using Shadcn/ui components
- Organization-scoped access control

**Database Schema**:
- `coupons` table with comprehensive fields
- `couponUsages` table for tracking usage
- `assetPermissions` table for employee access control
- User management with role-based permissions

### Current Coupon System Status ✅ PHASE 1 & 2 COMPLETE
The system has been enhanced with comprehensive coupon functionality:

**✅ Phase 1 - Foundation Features:**
- Advanced coupon CRUD operations with role-based permissions
- Multiple coupon validation with conflict detection
- Comprehensive usage tracking and statistics
- Stripe promotion code integration
- Asset permissions for employee access control
- Real-time coupon validation and application
- Analytics dashboard for coupon performance
- Automatic coupon application logic
- Enhanced database schema with performance indexes

**✅ Phase 2 - Core Integration Features:**
- User assignment interface for targeted coupon distribution
- Asset-specific coupon management with visual selection
- Booking flow integration with coupon validation
- Enhanced Stripe checkout with coupon discount calculation
- Bulk coupon operations for efficient management
- Real-time price calculation with applied discounts
- Comprehensive coupon metadata tracking in payments
- Activity booking form with integrated coupon validation

## Requirements

### Functional Requirements

#### 1. Admin Interface Enhancement

**1.1 Master Role Capabilities**
- Access to all coupons across all partners and organizations
- Global coupon creation for system-wide promotions
- Analytics and reporting across all coupon usage
- Partner-specific coupon oversight and management

**1.2 Partner Role Capabilities**
- Create and manage coupons for their own organizations
- Assign coupons to specific users (travelers)
- Associate coupons with their assets (activities, restaurants, vehicles, events)
- View usage statistics for their coupons
- Manage employee access to coupon functions

**1.3 Employee Role Capabilities**
- Access to coupons based on asset permissions granted by partners
- Limited coupon creation (if permitted by partner)
- Usage tracking and basic analytics for assigned assets
- Customer service functions (applying coupons to bookings)

#### 2. Coupon Types and Configuration

**2.1 Discount Types**
- Percentage discounts (e.g., 10% off)
- Fixed amount discounts (e.g., R$ 50 off)
- Free shipping/service fees
- Buy-one-get-one (BOGO) promotions
- Minimum purchase requirements

**2.2 Coupon Scopes**
- Global (applies to all asset types)
- Asset-type specific (restaurants, activities, vehicles, events)
- Asset-specific (individual restaurants, activities, etc.)
- User-specific (targeted to individual travelers)
- Organization-specific (limited to specific partner organizations)

**2.3 Coupon Categories**
- Public coupons (visible to all users)
- Private coupons (invitation-only)
- First-time customer coupons
- Returning customer coupons
- Loyalty program coupons
- Seasonal/promotional coupons

#### 3. Stripe Integration

**3.1 Payment Processing**
- Automatic discount application during Stripe checkout
- Support for multiple coupons per transaction
- Conflict resolution for incompatible coupons
- Real-time price calculation with discounts

**3.2 Webhook Integration**
- Coupon usage tracking via payment success webhooks
- Automatic usage count updates
- Refund handling for coupon reversals
- Failed payment cleanup

#### 4. User Interface Components

**4.1 Admin Dashboard Integration**
- Add "Cupons" section to admin navigation
- Role-based menu items in existing dashboard layout
- Integration with organization switcher for partners
- Consistent styling with existing admin UI patterns

**4.2 Coupon Management Interface**
- Coupon creation/editing forms
- Bulk coupon operations
- Usage analytics dashboard
- User assignment interface
- Asset association interface

**4.3 Traveler Interface**
- Coupon validation component in booking flow
- Available coupons display
- Usage history in user dashboard
- Notification system for new coupons

### Non-Functional Requirements

#### 1. Performance
- Coupon validation must complete within 200ms
- Support for 10,000+ concurrent coupon validations
- Efficient database queries with proper indexing
- Caching for frequently accessed coupons

#### 2. Security
- Role-based access control enforcement
- Coupon code generation with collision prevention
- Rate limiting for coupon validation attempts
- Audit logging for all coupon operations

#### 3. Scalability
- Support for 100,000+ active coupons
- Horizontal scaling capability
- Database optimization for large datasets
- Efficient pagination for large result sets

#### 4. Reliability
- 99.9% uptime for coupon validation
- Graceful degradation when coupon service is unavailable
- Comprehensive error handling and logging
- Backup and recovery procedures

## Technical Implementation

### Database Enhancements

Based on the existing schema, the following enhancements may be needed:

```typescript
// Additional indexes for performance
coupons.index("by_partner_active", ["partnerId", "isActive"])
coupons.index("by_organization_active", ["organizationId", "isActive"])
coupons.index("by_type_active", ["type", "isActive"])
coupons.index("by_expiration", ["validUntil"])

// New tables for enhanced functionality
couponTemplates: {
  // Template definitions for recurring coupon creation
}

couponCampaigns: {
  // Campaign tracking for marketing purposes
}
```

### API Endpoints

Building on the existing Convex functions:

**Enhanced Queries**:
- `getCouponsByPartner` - Partner-specific coupon listing
- `getCouponsByAsset` - Asset-specific coupon retrieval
- `getCouponAnalytics` - Enhanced analytics and reporting
- `validateMultipleCoupons` - Multiple coupon validation

**New Mutations**:
- `bulkCreateCoupons` - Bulk coupon creation
- `assignCouponToUsers` - User assignment functionality
- `deactivateCoupon` - Soft deactivation
- `duplicateCoupon` - Coupon duplication

**Enhanced Actions**:
- `createStripePromotionCode` - Stripe promotion code integration
- `syncCouponUsage` - Usage synchronization
- `generateCouponReport` - Reporting functionality

### Frontend Components

Building on existing patterns:

**Admin Components**:
```typescript
// New admin components following existing patterns
- CouponManagementDashboard
- CouponForm (create/edit)
- CouponAnalytics
- CouponUserAssignment
- CouponAssetAssignment
- CouponBulkActions
```

**User Components**:
```typescript
// Enhanced user-facing components
- CouponSelector (multiple coupon selection)
- CouponHistory (user coupon history)
- CouponNotifications (new coupon alerts)
- CouponRecommendations (personalized suggestions)
```

### Integration Points

**Existing System Integration**:
- Extend admin dashboard navigation with coupon sections
- Integrate with existing RBAC system for permissions
- Use existing Stripe integration for payment processing
- Leverage existing notification system for coupon alerts

**New Integration Requirements**:
- Email system integration for coupon notifications
- Analytics system integration for usage tracking
- Audit system integration for compliance logging
- Recommendation system integration for personalized offers

## User Experience

### Admin Workflow

**Master Admin**:
1. Access global coupon dashboard
2. Create system-wide promotional campaigns
3. Monitor usage across all partners
4. Generate comprehensive reports

**Partner Admin**:
1. Switch to organization context
2. Access organization-specific coupon management
3. Create asset-specific coupons
4. Assign coupons to travelers
5. Monitor usage and performance

**Employee**:
1. Access assigned asset coupons
2. Apply coupons to customer bookings
3. View basic usage statistics
4. Assist customers with coupon issues

### Traveler Workflow

**Booking Process**:
1. Select asset (activity, restaurant, etc.)
2. Configure booking details
3. Apply available coupons
4. Validate coupon eligibility
5. Complete payment with discount

**Coupon Management**:
1. View available coupons
2. Track usage history
3. Receive notifications for new coupons
4. Share referral coupons (if applicable)

## Success Metrics

### Business Metrics
- Coupon usage rate (target: 25% of bookings)
- Average discount per booking (target: R$ 35)
- Customer acquisition via coupons (target: 15% of new users)
- Revenue impact of promotional campaigns

### Technical Metrics
- Coupon validation response time (target: <200ms)
- System uptime (target: 99.9%)
- Error rate (target: <0.1%)
- Database query performance optimization

### User Experience Metrics
- Admin task completion rate (target: 95%)
- User satisfaction with coupon system (target: 4.5/5)
- Time to create new coupon (target: <2 minutes)
- Support ticket reduction related to promotions

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2) ✅ COMPLETED
- ✅ **Enhance existing coupon database schema**
  - Added performance indexes for partner, organization, and type filtering
  - Enhanced couponUsages table with additional indexes for better query performance
  - Added support for complex queries with multiple filter combinations
  
- ✅ **Implement advanced coupon validation logic**
  - Added multiple coupon validation support with conflict detection
  - Implemented Stripe promotion code integration
  - Added automatic coupon application logic
  - Created coupon usage tracking with booking integration
  - Added comprehensive eligibility checking with user-specific rules
  
- ✅ **Create basic admin UI components**
  - CouponsGrid component with filtering, searching, and pagination
  - CouponCard component for individual coupon display
  - CouponForm component for creating/editing coupons
  - CouponStats component for analytics display
  - CouponFilters component for advanced filtering
  - Integration with existing admin dashboard navigation
  
- ✅ **Integrate with existing RBAC system**
  - Role-based access control for Master, Partner, and Employee roles
  - Asset permissions for employees (can only manage coupons for assigned assets)
  - Partner-scoped coupon visibility and management
  - Permission validation for coupon creation and editing

### Phase 2: Core Features (Weeks 3-4) ✅ COMPLETED
- ✅ **Complete admin dashboard integration**
  - Created CouponUserAssignment component for managing user-specific coupons
  - Created CouponAssetAssignment component for managing asset-specific coupons
  - Added comprehensive backend functions for user and asset management
  - Integrated bulk operations for efficient coupon management
  
- ✅ **Implement user assignment functionality**
  - Added assignCouponToUsers and removeCouponUsers mutations
  - Created user search and selection interface
  - Implemented real-time user filtering and selection
  - Added proper permission validation for user assignments
  
- ✅ **Add asset-specific coupon management**
  - Added updateCouponAssets mutation for asset assignment
  - Created getPartnerAssets query for asset discovery
  - Implemented asset type filtering and search functionality
  - Added visual asset cards with type icons and metadata
  
- ✅ **Enhance Stripe integration**
  - Updated createCheckoutSession to handle coupon discounts
  - Added coupon metadata to Stripe payment intents
  - Enhanced booking forms with coupon validation
  - Integrated real-time price calculation with discounts

### Phase 3: Advanced Features (Weeks 5-6)
- Implement bulk operations
- Add analytics and reporting
- Create notification system
- Implement multiple coupon support

### Phase 4: Optimization (Weeks 7-8)
- Performance optimization
- Security enhancements
- User experience improvements
- Comprehensive testing

## Risk Assessment

### Technical Risks
- **Database Performance**: Large coupon datasets may impact query performance
  - *Mitigation*: Implement proper indexing and caching strategies
- **Stripe Integration**: Complex discount calculations may cause payment issues
  - *Mitigation*: Comprehensive testing and fallback mechanisms
- **Concurrency**: High-volume coupon validation may cause race conditions
  - *Mitigation*: Implement proper locking and atomic operations

### Business Risks
- **Coupon Abuse**: Users may attempt to exploit coupon system
  - *Mitigation*: Implement rate limiting and fraud detection
- **Revenue Impact**: Excessive discounting may reduce profitability
  - *Mitigation*: Implement usage limits and budget controls
- **Partner Adoption**: Partners may not effectively use coupon system
  - *Mitigation*: Provide comprehensive training and support

## Conclusion

The coupon system enhancement builds upon the existing solid foundation of the Tuca Noronha Tourism Platform. With the current coupon infrastructure already in place, the implementation focuses on enhancing the admin interfaces, improving user experience, and ensuring seamless integration with the existing payment system.

The phased approach ensures minimal disruption to current operations while providing immediate value to administrators and travelers. The success of this implementation will directly contribute to increased bookings, customer satisfaction, and revenue growth for the platform.