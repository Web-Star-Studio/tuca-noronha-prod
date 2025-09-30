import type { Id } from "../../_generated/dataModel";

export type SupplierBankDetails = {
  bankName?: string;
  accountType?: string;
  accountNumber?: string;
  agencyNumber?: string;
  holderName?: string;
  holderDocument?: string;
  pixKey?: string;
};

export type SupplierAssetAssociation = {
  assetId: string;
  assetType: string;
  assetName?: string;
};

export interface Supplier {
  _id: Id<"suppliers">;
  _creationTime: number;
  name: string;
  phone?: string;
  email?: string;
  bankDetails?: SupplierBankDetails;
  notes?: string;
  assetAssociations: SupplierAssetAssociation[];
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}
