import type { QueryCtx, MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { Media } from "./types";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess } from "../../domains/rbac";

type Ctx = QueryCtx | MutationCtx;

/**
 * Formats file size from bytes to human-readable format
 */
export function formatFileSize(bytes: bigint | number): string {
  const byteNum = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  
  if (byteNum < 1024) return `${byteNum} B`;
  if (byteNum < 1024 * 1024) return `${(byteNum / 1024).toFixed(1)} KB`;
  if (byteNum < 1024 * 1024 * 1024) return `${(byteNum / (1024 * 1024)).toFixed(1)} MB`;
  return `${(byteNum / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Gets filename without extension
 */
export function getFileNameWithoutExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "");
}

/**
 * Gets file extension
 */
export function getFileExtension(fileName: string): string {
  const match = fileName.match(/\.([^/.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Checks if a file is an image based on its MIME type
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Validates that a media item belongs to the specified user
 */
export async function validateMediaOwnership(
  ctx: Ctx,
  mediaId: Id<"media">,
  userId: Id<"users"> | null
): Promise<boolean> {
  if (!userId) return false;
  
  const media = await ctx.db.get(mediaId);
  if (!media) return false;
  
  return media.uploadedBy.toString() === userId.toString();
} 