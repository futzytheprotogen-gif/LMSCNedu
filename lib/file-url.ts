const PRIVATE_BLOB_HOST_SUFFIX = ".private.blob.vercel-storage.com";

export function urlFilePrivat(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    if (
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname.endsWith(PRIVATE_BLOB_HOST_SUFFIX)
    ) {
      return `/api/file?url=${encodeURIComponent(url)}`;
    }
  } catch {
    return url;
  }

  return url;
}
