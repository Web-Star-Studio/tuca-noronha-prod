import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

type MediaFileMetadata = {
  userId: string;
};

export const uploadRouter = {
  mediaUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    video: { maxFileSize: "512MB", maxFileCount: 2 },
  })
    .middleware(async () => {
      const { userId } = await auth();

      if (!userId) {
        throw new UploadThingError("Você precisa estar autenticado para enviar arquivos");
      }

      return { userId } satisfies MediaFileMetadata;
    })
    .onUploadComplete(async ({ file, metadata }) => {
      return {
        fileUrl: file.ufsUrl ?? file.url,
        fileKey: file.key,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedBy: metadata.userId,
      } satisfies MediaFileMetadata & {
        fileUrl: string;
        fileKey: string;
        fileName: string;
        fileType: string;
        fileSize: number;
      };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
