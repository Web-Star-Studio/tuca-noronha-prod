import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define the tables related to vehicles
export default defineSchema({
  vehicles: defineTable({
    // Basic information - Required fields
    name: v.string(),
    brand: v.string(),
    model: v.string(),
    category: v.string(), // economy, compact, sedan, suv, luxury, etc.
    seats: v.number(),
    
    // Optional fields (for backwards compatibility with existing vehicles)
    year: v.optional(v.number()),
    color: v.optional(v.string()),
    licensePlate: v.optional(v.string()),
    fuelType: v.optional(v.string()), // Gasolina, Etanol, Flex, Diesel, Elétrico, Híbrido
    transmission: v.optional(v.string()), // Manual, Automático, CVT, Semi-automático
    features: v.optional(v.array(v.string())),
    adminRating: v.optional(v.number()), // 1-5 stars rating
    
    // Business details - Required fields
    estimatedPricePerDay: v.number(),
    netRate: v.number(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    
    // Status - Required
    status: v.string(), // available, rented, maintenance
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    ownerId: v.optional(v.id("users")), // Reference to user who created/owns this vehicle
    organizationId: v.optional(v.string()), // For multi-tenant applications
  }).index("by_status", ["status"]),
  
  vehicleBookings: defineTable({
    vehicleId: v.id("vehicles"),
    userId: v.id("users"),
    startDate: v.number(), // Unix timestamp
    endDate: v.number(), // Unix timestamp
    totalPrice: v.number(),
    status: v.string(), // pending, confirmed, canceled, completed
    paymentMethod: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    pickupLocation: v.optional(v.string()),
    returnLocation: v.optional(v.string()),
    additionalDrivers: v.optional(v.number()),
    additionalOptions: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_vehicleId", ["vehicleId"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_vehicleId_status", ["vehicleId", "status"])
    .index("by_dates", ["startDate", "endDate"])
}); 
