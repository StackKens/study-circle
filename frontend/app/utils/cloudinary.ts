const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) {
  console.warn(
    "[cloudinary] VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET is not set. File uploads will fail."
  );
}

const TRANSFORMED_CACHE = new Map<string, string>();

export function getOptimizedAvatarUrl(
  url: string | null | undefined,
  width = 200,
): string | null {
  if (!url) return null;
  const cached = TRANSFORMED_CACHE.get(url);
  if (cached) return cached;

  if (!url.startsWith("https://res.cloudinary.com/")) return url;

  const separator = "/image/upload/";
  const idx = url.indexOf(separator);
  if (idx === -1) return url;

  const insertAt = idx + separator.length;
  const optimized =
    url.slice(0, insertAt) +
    `w_${width},q_auto,f_auto/` +
    url.slice(insertAt);

  TRANSFORMED_CACHE.set(url, optimized);
  return optimized;
}

export async function uploadToCloudinary(file: File): Promise<string> {
  if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) {
    throw new Error("Cloudinary is not configured. Contact the administrator.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`,
    { method: "POST", body: form }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Cloudinary upload failed");
  return data.secure_url;
}
