/*
  Employee service hooks for partners to manage their employees and permissions.
*/

import { api } from "@/../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/../convex/_generated/dataModel";

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