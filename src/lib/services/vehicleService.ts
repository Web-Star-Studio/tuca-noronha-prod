import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

// Types
export interface Vehicle {
  _id: Id<"vehicles">;
  name: string;
  brand: string;
  model: string;
  category: string;
  year: number;
  licensePlate: string;
  color: string;
  seats: number;
  fuelType: string;
  transmission: string;
  pricePerDay: number;
  description?: string;
  features: string[];
  imageUrl?: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export interface VehicleBooking {
  _id: Id<"vehicleBookings">;
  vehicleId: Id<"vehicles">;
  userId: Id<"users">;
  startDate: number;
  endDate: number;
  totalPrice: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  pickupLocation?: string;
  returnLocation?: string;
  additionalDrivers?: number;
  additionalOptions?: string[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
  vehicle?: Vehicle;
  user?: any;
}

export interface VehicleStats {
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  totalRevenue: number;
  bookingsCompleted: number;
}

// Custom hook to get all vehicles
export function useVehicles(
  search?: string,
  category?: string,
  status?: string,
  limit = 10,
  organizationId?: string
) {
  const result = useQuery(api.domains.vehicles.queries.listVehicles, {
    search,
    category,
    status,
    organizationId,
    paginationOpts: { limit },
  });

  const vehicles = result?.vehicles || [];
  const continueCursor = result?.continueCursor;
  
  return {
    vehicles,
    continueCursor,
    isLoading: result === undefined,
  };
}

// Custom hook to get a specific vehicle by ID
export function useVehicle(id: Id<"vehicles"> | null) {
  const result = useQuery(
    api.domains.vehicles.queries.getVehicle,
    id ? { id } : "skip"
  );

  return {
    vehicle: result,
    isLoading: result === undefined,
  };
}

// Custom hook to get vehicle statistics
export function useVehicleStats() {
  const result = useQuery(api.domains.vehicles.queries.getVehicleStats, {});

    const stats: VehicleStats = result || {
    totalVehicles: 0,
    availableVehicles: 0,
    rentedVehicles: 0,
    maintenanceVehicles: 0,
    totalRevenue: 0,
    bookingsCompleted: 0,
  };

  return {
    stats,
    isLoading: result === undefined,
  };
}

// Custom hook to create a vehicle
export function useCreateVehicle() {
  const createVehicleMutation = useMutation(api.domains.vehicles.mutations.createVehicle);

  const createVehicle = useCallback(
    async (vehicleData: Omit<Vehicle, "_id" | "createdAt" | "updatedAt">) => {
      try {
        const vehicleId = await createVehicleMutation(vehicleData);
        return vehicleId;
      } catch {
        console.error("Error creating vehicle:", error);
        throw error;
      }
    },
    [createVehicleMutation]
  );

  return createVehicle;
}

// Custom hook to update a vehicle
export function useUpdateVehicle() {
  const updateVehicleMutation = useMutation(api.domains.vehicles.mutations.updateVehicle);

  const updateVehicle = useCallback(
    async (
      id: Id<"vehicles">,
      vehicleData: Partial<Omit<Vehicle, "_id" | "createdAt" | "updatedAt">>
    ) => {
      try {
        const vehicleId = await updateVehicleMutation({
          id,
          ...vehicleData,
        });
        return vehicleId;
      } catch {
        console.error("Error updating vehicle:", error);
        throw error;
      }
    },
    [updateVehicleMutation]
  );

  return updateVehicle;
}

// Custom hook to delete a vehicle
export function useDeleteVehicle() {
  const deleteVehicleMutation = useMutation(api.domains.vehicles.mutations.deleteVehicle);

  const deleteVehicle = useCallback(
    async (id: Id<"vehicles">) => {
      try {
        await deleteVehicleMutation({ id });
        return true;
      } catch {
        console.error("Error deleting vehicle:", error);
        throw error;
      }
    },
    [deleteVehicleMutation]
  );

  return deleteVehicle;
}

// Custom hook to get vehicle bookings
export function useVehicleBookings(
  vehicleId?: Id<"vehicles">,
  userId?: Id<"users">,
  status?: string,
  limit = 10
) {
  const result = useQuery(api.domains.vehicles.queries.listVehicleBookings, {
    vehicleId,
    userId,
    status,
    paginationOpts: { limit },
  });

  const bookings = result?.bookings || [];
  const continueCursor = result?.continueCursor;
  
  return {
    bookings,
    continueCursor,
    isLoading: result === undefined,
  };
}

// Custom hook to create a vehicle booking
export function useCreateVehicleBooking() {
  const createBookingMutation = useMutation(api.domains.vehicles.mutations.createVehicleBooking);

  const createBooking = useCallback(
    async (bookingData: Omit<VehicleBooking, "_id" | "createdAt" | "updatedAt" | "vehicle" | "user">) => {
      try {
        const bookingId = await createBookingMutation(bookingData);
        return bookingId;
      } catch {
        console.error("Error creating booking:", error);
        throw error;
      }
    },
    [createBookingMutation]
  );

  return createBooking;
}

// Custom hook to update a vehicle booking
export function useUpdateVehicleBooking() {
  const updateBookingMutation = useMutation(api.domains.vehicles.mutations.updateVehicleBooking);

  const updateBooking = useCallback(
    async (
      id: Id<"vehicleBookings">,
      bookingData: Pick<VehicleBooking, "status" | "paymentMethod" | "paymentStatus" | "notes">
    ) => {
      try {
        const bookingId = await updateBookingMutation({
          id,
          ...bookingData,
        });
        return bookingId;
      } catch {
        console.error("Error updating booking:", error);
        throw error;
      }
    },
    [updateBookingMutation]
  );

  return updateBooking;
} 