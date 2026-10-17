// Client-side image & file compression/validation utility
// Ensures files respect size limits without requiring heavy external dependencies.

export interface ProcessedImage {
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
}

/**
 * Resizes and compresses an image file to JPEG/WebP dataUrl.
 * @param file The uploaded File object
 * @param maxWidth Max allowable width in pixels (default: 1400)
 * @param quality Compression quality 0.1 to 1.0 (default: 0.8)
 */
export async function compressImage(
  file: File,
  maxWidth = 1400,
  quality = 0.82
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file is not an image."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas rendering context."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        // Approximate size from base64 length
        const sizeBytes = Math.round((dataUrl.length * 3) / 4);

        resolve({ dataUrl, sizeBytes, width, height });
      };
      img.onerror = () => reject(new Error("Failed to load image for processing."));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Validates document upload (PDF, JPG, PNG) against max size (e.g. 5 MB)
 */
export function validateDocumentFile(
  file: File,
  maxBytes = 5 * 1024 * 1024
): { valid: boolean; error?: string } {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Only PDF documents and image files (JPG, PNG, WebP) are allowed.",
    };
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds the ${maxMb} MB limit. Please upload a smaller file.`,
    };
  }

  return { valid: true };
}

/**
 * Convert any string into an SEO-friendly URL slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}
