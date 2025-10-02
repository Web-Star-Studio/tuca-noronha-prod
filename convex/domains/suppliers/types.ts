import type { Id } from "../../_generated/dataModel";
import { v } from "convex/values";

// Bank Details Type
export type SupplierBankDetails = {
  bankName?: string;
  accountType?: string;      // checking, savings
  agency?: string;            // Agência
  accountNumber?: string;
};

// Asset Association Type (legacy, keep for compatibility)
export type SupplierAssetAssociation = {
  assetId: string;
  assetType: string;
  assetName?: string;
};

// Full Supplier Interface
export interface Supplier {
  _id: Id<"suppliers">;
  _creationTime: number;
  
  // Public Information (appears on voucher)
  name: string;                           // REQUIRED
  address?: string;                       // Endereço
  cnpj?: string;                          // CNPJ
  emergencyPhone?: string;                // Fone de plantão
  
  // Private Information (admin only)
  bankDetails?: SupplierBankDetails;      // Dados bancários
  financialEmail?: string;                // E-mail do financeiro
  contactPerson?: string;                 // Contato
  financialPhone?: string;                // Fone do financeiro
  pixKey?: string;                        // PIX
  
  // Legacy fields (backward compatibility)
  phone?: string;
  email?: string;
  notes?: string;
  assetAssociations?: SupplierAssetAssociation[];
  
  // Metadata
  isActive: boolean;
  partnerId?: Id<"users">;
  organizationId?: Id<"partnerOrganizations">;
  createdBy: Id<"users">;
  updatedBy?: Id<"users">;
  createdAt: number;
  updatedAt: number;
}

// Public Info for Voucher (subset of Supplier)
export interface SupplierPublicInfo {
  name: string;
  address?: string;
  cnpj?: string;
  emergencyPhone?: string;
}

// Convex Validators
export const SupplierBankDetailsValidator = v.optional(v.object({
  bankName: v.optional(v.string()),
  accountType: v.optional(v.string()),
  agency: v.optional(v.string()),
  accountNumber: v.optional(v.string()),
}));

export const CreateSupplierArgs = v.object({
  // Public fields
  name: v.string(),                       // REQUIRED
  address: v.optional(v.string()),
  cnpj: v.optional(v.string()),
  emergencyPhone: v.optional(v.string()),
  
  // Private fields
  bankDetails: SupplierBankDetailsValidator,
  financialEmail: v.optional(v.string()),
  contactPerson: v.optional(v.string()),
  financialPhone: v.optional(v.string()),
  pixKey: v.optional(v.string()),
  
  // Legacy fields
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  notes: v.optional(v.string()),
  
  // Metadata
  partnerId: v.optional(v.id("users")),
  organizationId: v.optional(v.id("partnerOrganizations")),
});

export const UpdateSupplierArgs = v.object({
  id: v.id("suppliers"),
  
  // All fields optional for updates
  name: v.optional(v.string()),
  address: v.optional(v.string()),
  cnpj: v.optional(v.string()),
  emergencyPhone: v.optional(v.string()),
  
  bankDetails: SupplierBankDetailsValidator,
  financialEmail: v.optional(v.string()),
  contactPerson: v.optional(v.string()),
  financialPhone: v.optional(v.string()),
  pixKey: v.optional(v.string()),
  
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  notes: v.optional(v.string()),
  
  isActive: v.optional(v.boolean()),
});
