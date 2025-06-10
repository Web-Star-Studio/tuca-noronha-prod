import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface UseVehiclesPaginationOptions {
  search?: string;
  category?: string;
  status?: string;
  organizationId?: string;
  limit?: number;
}

interface VehiclesPaginationResult {
  vehicles: any[];
  isLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  loadNextPage: () => void;
  reset: () => void;
  continueCursor: string | null;
}

export const useVehiclesPagination = (
  options: UseVehiclesPaginationOptions = {}
): VehiclesPaginationResult => {
  const { search, category, status, organizationId, limit = 20 } = options;
  
  const [cursor, setCursor] = useState<string | null>(null);
  const [accumulatedVehicles, setAccumulatedVehicles] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  // Create a stable query key to detect when filters change
  const queryKey = useMemo(() => 
    JSON.stringify({ search, category, status, organizationId, limit }), 
    [search, category, status, organizationId, limit]
  );
  
  // Reset pagination when filters change
  useEffect(() => {
    setCursor(null);
    setAccumulatedVehicles([]);
    setError(null);
  }, [queryKey]);
  
  const queryResult = useQuery(
    api.domains.vehicles.queries.listVehicles,
    {
      paginationOpts: { 
        cursor, 
        limit 
      },
      search,
      category,
      status,
      organizationId,
    }
  );
  
  // Handle query results
  useEffect(() => {
    if (queryResult) {
      setError(null);
      
      if (cursor === null) {
        // First page or reset - replace all vehicles
        setAccumulatedVehicles(queryResult.vehicles);
      } else {
        // Subsequent pages - append to existing vehicles
        setAccumulatedVehicles(prev => {
          // Avoid duplicates by checking IDs
          const existingIds = new Set(prev.map(v => v._id));
          const newVehicles = queryResult.vehicles.filter(v => !existingIds.has(v._id));
          return [...prev, ...newVehicles];
        });
      }
    }
  }, [queryResult, cursor]);
  
  // Handle errors
  useEffect(() => {
    if (queryResult === undefined) {
      // Query is loading - this is normal
      return;
    }
    
    // If query fails, it would be null or throw
    // Convex queries throw errors that need to be caught higher up
  }, [queryResult]);
  
  const loadNextPage = () => {
    if (queryResult?.continueCursor) {
      setCursor(queryResult.continueCursor);
    }
  };
  
  const reset = () => {
    setCursor(null);
    setAccumulatedVehicles([]);
    setError(null);
  };
  
  return {
    vehicles: accumulatedVehicles,
    isLoading: queryResult === undefined,
    error,
    hasNextPage: !!queryResult?.continueCursor,
    loadNextPage,
    reset,
    continueCursor: queryResult?.continueCursor || null,
  };
}; 