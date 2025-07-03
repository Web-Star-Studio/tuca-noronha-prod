/*
  Employee service hooks for partners to manage their employees and permissions.
*/

import { api } from "../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";

export type Employee = {
  _id: Id<"users">;
  name?: string;
  email?: string;
  image?: string;
  role: string;
};

export const useEmployees = () => {
  const employees = useQuery(api.domains.rbac.queries.listEmployees, {});
  return {
    employees: employees as Employee[] | undefined,
    isLoading: employees === undefined,
  };
};

export const useCreateEmployee = () => {
  const createInvite = useMutation(api.domains.rbac.mutations.createInvite);
  return async ({ name, email }: { name: string; email: string }) => {
    return await createInvite({ name, email });
  };
};

export const useGrantAssetPermission = () => {
  const grant = useMutation(api.domains.rbac.mutations.grantAssetPermission);
  return async (args: {
    employeeId: Id<"users">;
    assetId: string;
    assetType: string;
    permissions: string[];
    note?: string;
  }) => {
    return await grant(args);
  };
};

export const useRevokeAssetPermission = () => {
  const revoke = useMutation(api.domains.rbac.mutations.revokeAssetPermission);
  return async (permissionId: Id<"assetPermissions">) => {
    return await revoke({ permissionId });
  };
};

export const useUpdateEmployee = () => {
  const update = useMutation(api.domains.rbac.mutations.updateEmployee);
  return async ({ id, name, image }: { id: Id<"users">; name?: string; image?: string }) => {
    return await update({ id, name, image });
  };
};

export const useRemoveEmployee = () => {
  const rem = useMutation(api.domains.rbac.mutations.removeEmployee);
  return async (id: Id<"users">, includeClerk: boolean = true) => {
    return await rem({ id, includeClerk });
  };
};

/**
 * Obtém todos os assets do parceiro atual, agrupados por tipo.
 * Útil para gerenciamento de permissões.
 */
export const usePartnerAssets = () => {
  const assets = useQuery(api.domains.rbac.queries.listPartnerAssets);
  return {
    assets,
    isLoading: assets === undefined
  };
};

/**
 * Obtém todas as organizações do usuário atual baseado em seu role.
 * - Partners: suas próprias organizações
 * - Employees: organizações atribuídas a eles
 * - Masters: todas as organizações
 */
export const useUserOrganizations = () => {
  const organizations = useQuery(api.domains.rbac.queries.listUserOrganizations);
  return {
    organizations,
    isLoading: organizations === undefined
  };
};

/**
 * @deprecated Use useUserOrganizations instead
 * Obtém todas as organizações do parceiro atual.
 * Útil para gerenciamento de permissões sobre empreendimentos.
 */
export const usePartnerOrganizations = () => {
  const organizations = useQuery(api.domains.rbac.queries.listUserOrganizations);
  return {
    organizations,
    isLoading: organizations === undefined
  };
};

/**
 * Hook para conceder permissão sobre uma organização a um employee
 */
export const useGrantOrganizationPermission = () => {
  const grant = useMutation(api.domains.rbac.mutations.grantOrganizationPermission);
  return async (args: {
    employeeId: Id<"users">;
    organizationId: Id<"partnerOrganizations">;
    permissions: string[];
    note?: string;
  }) => {
    return await grant(args);
  };
};

/**
 * Hook para revogar permissão sobre uma organização de um employee
 */
export const useRevokeOrganizationPermission = () => {
  const revoke = useMutation(api.domains.rbac.mutations.revokeOrganizationPermission);
  return async (permissionId: Id<"organizationPermissions">) => {
    return await revoke({ permissionId });
  };
};

/**
 * Hook para atualizar permissões sobre uma organização
 */
export const useUpdateOrganizationPermission = () => {
  const update = useMutation(api.domains.rbac.mutations.updateOrganizationPermission);
  return async (args: {
    permissionId: Id<"organizationPermissions">;
    permissions: string[];
    note?: string;
  }) => {
    return await update(args);
  };
};

/**
 * Hook para listar todas as permissões de organizações
 */
export const useOrganizationPermissions = () => {
  const permissions = useQuery(api.domains.rbac.queries.listAllOrganizationPermissions, {});
  return {
    permissions,
    isLoading: permissions === undefined
  };
};

/**
 * Hook para listar organizações que um employee pode acessar
 */
export const useEmployeeOrganizations = (employeeId?: Id<"users">) => {
  const organizations = useQuery(
    api.domains.rbac.queries.listEmployeeOrganizations, 
    employeeId ? { employeeId } : {}
  );
  return {
    organizations,
    isLoading: organizations === undefined
  };
}; 