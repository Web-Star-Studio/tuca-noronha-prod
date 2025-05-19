import { Id } from "../../_generated/dataModel";

export interface Media {
  _id: Id<"media">;
  _creationTime: number;
  storageId: string;
  fileName: string;
  fileType: string;
  fileSize: bigint;
  description?: string;
  category?: string;
  height?: bigint;
  width?: bigint;
  uploadedBy: Id<"users">;
  isPublic: boolean;
  tags?: string[];
  url: string;
}

export interface MediaCreateInput {
  storageId: string;
  fileName: string;
  fileType: string;
  fileSize: bigint;
  description?: string;
  category?: string;
  height?: bigint;
  width?: bigint;
  uploadedBy: Id<"users">;
  isPublic: boolean;
  tags?: string[];
}

export interface MediaUpdateInput {
  id: Id<"media">;
  description?: string;
  category?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface ImageDimensions {
  width?: bigint;
  height?: bigint;
} 