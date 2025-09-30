"use client";

import { useEffect, useMemo, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import type { MediaEntry } from "@/lib/media";
import { isVideoEntry } from "@/lib/media";

export type SmartMediaMode = "image" | "video";

export interface SmartMediaProps {
  entry: MediaEntry;
  alt: string;
  className?: string;
  imageProps?: Omit<ImageProps, "src" | "alt">;
  videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>;
  fallback?: React.ReactNode;
  /**
   * When true, unknown media defaults to rendering as video first.
   * This prevents Next/Image from attempting to load UploadThing videos.
   */
  preferVideoFallback?: boolean;
}

function resolveInitialMode(
  entry: MediaEntry,
  preferVideoFallback: boolean,
): SmartMediaMode {
  if (!entry?.url) {
    return "image";
  }

  if (entry.type?.startsWith("image/")) {
    return "image";
  }

  if (entry.type?.startsWith("video/")) {
    return "video";
  }

  if (isVideoEntry(entry)) {
    return "video";
  }

  return preferVideoFallback ? "video" : "image";
}

export function SmartMedia({
  entry,
  alt,
  className,
  imageProps,
  videoProps,
  fallback,
  preferVideoFallback = true,
}: SmartMediaProps) {
  const [hasSwitched, setHasSwitched] = useState(false);

  const initialMode = useMemo(
    () => resolveInitialMode(entry, preferVideoFallback),
    [entry, preferVideoFallback],
  );

  const [mode, setMode] = useState<SmartMediaMode>(initialMode);

  useEffect(() => {
    setMode(initialMode);
    setHasSwitched(false);
  }, [initialMode, entry.url]);

  if (!entry?.url) {
    return fallback ? <>{fallback}</> : null;
  }

  const mergedVideoClass = cn(className, videoProps?.className);
  const mergedImageClass = cn(className, imageProps?.className);

  if (mode === "video") {
    return (
      <video
        key={`video-${entry.url}`}
        {...videoProps}
        className={mergedVideoClass}
        src={entry.url}
        onError={(event) => {
          videoProps?.onError?.(event);
          if (!hasSwitched && !entry.type?.startsWith("video/")) {
            setMode("image");
            setHasSwitched(true);
          }
        }}
      />
    );
  }

  return (
    <Image
      key={`image-${entry.url}`}
      {...imageProps}
      src={entry.url}
      alt={alt}
      className={mergedImageClass}
      onError={(event) => {
        imageProps?.onError?.(event);
        if (!hasSwitched) {
          setMode("video");
          setHasSwitched(true);
        }
      }}
    />
  );
}
