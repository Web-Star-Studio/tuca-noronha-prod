export const VIDEO_EXTENSIONS = [
  "mp4",
  "mov",
  "webm",
  "mkv",
  "avi",
  "m4v",
  "mpg",
  "mpeg",
  "ogv",
];

/**
 * Infer if an URL likely points to a video file by checking the extension.
 * Defaults to false when the URL does not expose an extension (UploadThing links normally do).
 */
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const normalized = new URL(url).pathname.toLowerCase();
    return VIDEO_EXTENSIONS.some((extension) =>
      normalized.endsWith(`.${extension}`),
    );
  } catch {
    // URL parsing failed, try simple string split
    const normalized = url.split(/[?#]/)[0]?.toLowerCase() ?? "";
    return VIDEO_EXTENSIONS.some((extension) =>
      normalized.endsWith(`.${extension}`),
    );
  }
}

export type MediaEntry = {
  url: string;
  type?: string | null;
};

export function serializeMediaEntry(entry: MediaEntry): string {
  if (!entry.type) return entry.url;
  return JSON.stringify({ url: entry.url, type: entry.type });
}

export function parseMediaEntry(value: string | null | undefined): MediaEntry {
  if (!value) return { url: "" };

  const trimmed = value.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null && "url" in parsed) {
        return {
          url: String(parsed.url),
          type: typeof parsed.type === "string" ? parsed.type : undefined,
        };
      }
    } catch {
      // fallthrough to legacy string behaviour
    }
  }

  return { url: value, type: undefined };
}

export function isVideoEntry(entry: MediaEntry): boolean {
  if (entry.type?.startsWith("video/")) {
    return true;
  }

  return isVideoUrl(entry.url);
}
