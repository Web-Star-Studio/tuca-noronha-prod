import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useEmployees() {
  const [isCreating, setIsCreating] = useState(false);

  // Queries
  const employees = useQuery(api.domains.users.queries.listPartnerEmployees, { limit: 100 });
  const stats = useQuery(api.domains.users.queries.getPartnerEmployeeStats);

  // Mutations
  const createEmployeeMutation = useMutation(api.domains.users.mutations.createEmployee);

  // Create employee function
  const createEmployee = useCallback(async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    organizationId?: string;
  }) => {
    setIsCreating(true);
    
    try {
      const result = await createEmployeeMutation(data);
      
      toast.success("Colaborador criado com sucesso!", {
        description: "O colaborador já pode fazer login com as credenciais fornecidas.",
      });
      
      return result;
    } catch (error) {
      console.error("Erro ao criar colaborador:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erro desconhecido ao criar colaborador";
      
      toast.error("Erro ao criar colaborador", {
        description: errorMessage,
      });
      
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [createEmployeeMutation]);

  // Filter employees by search term
  const filterEmployees = useCallback((searchTerm: string) => {
    if (!employees || !searchTerm) return employees || [];
    
    return employees.filter(emp => 
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees]);

  // Get employee status
  const getEmployeeStatus = useCallback((employee: any) => {
    if (employee.clerkId?.startsWith("failed_")) {
      return { type: "failed", label: "Falhou" };
    }
    
    if (employee.clerkId?.startsWith("temp_") || employee.creationRequestStatus === "pending") {
      return { type: "pending", label: "Processando" };
    }

    if (employee.emailVerificationTime) {
      return { type: "active", label: "Ativo" };
    }

    return { type: "inactive", label: "Inativo" };
  }, []);

  return {
    // Data
    employees,
    stats,
    
    // Loading states
    isLoading: employees === undefined || stats === undefined,
    isCreating,
    
    // Actions
    createEmployee,
    filterEmployees,
    getEmployeeStatus,
  };
} 