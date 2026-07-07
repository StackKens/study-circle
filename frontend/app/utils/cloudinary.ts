const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) {
  console.warn(
    "[cloudinary] VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET is not set. File uploads will fail."
  );
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
