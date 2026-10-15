/**
 * Client-side image compression and resizing utility for GrowNaturals
 * Scales large images (500KB - 10MB+) down to efficient ~30KB - 80KB thumbnails/previews
 * while preserving high visual quality for swatches and popover previews.
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
  maxSizeBytes?: number;
}

export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxDimension = 800,
    quality = 0.82,
    maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  } = options;

  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided.'));
    }

    // Check file extension / MIME type
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg', '.jfif', '.heic'];
    const fileName = (file.name || '').toLowerCase();
    const isImageMime = file.type.startsWith('image/');
    const hasImageExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isImageMime && !hasImageExt) {
      return reject(new Error('Please select a valid image file (PNG, JPG, WEBP, etc.).'));
    }

    // Check file size against allowed limit (e.g. 10MB)
    if (file.size > maxSizeBytes) {
      const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
      return reject(new Error(`Image size must be less than ${maxMb}MB.`));
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file. Please try again.'));
    };

    reader.onload = () => {
      const result = reader.result as string;
      if (!result) {
        return reject(new Error('Empty image data received.'));
      }

      // If SVG or very small already (< 30KB), no need to run canvas compression
      if (file.type === 'image/svg+xml' || file.size < 30 * 1024) {
        return resolve(result);
      }

      const img = new Image();

      img.onerror = () => {
        // Fallback to original read result if canvas loading fails
        resolve(result);
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Compute aspect ratio scaling
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(result);
          }

          // Use white background in case of transparent PNGs converting to JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // Render scaled image
          ctx.drawImage(img, 0, 0, width, height);

          // Generate compressed JPEG data URL
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          // Gracefully fallback to original result if canvas throws (e.g. tainted canvas)
          resolve(result);
        }
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}
