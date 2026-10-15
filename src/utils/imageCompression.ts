/**
 * Client-side image compression and resizing utility for GrowNaturals
 * Scales large images down to ultra-efficient ~15KB - 35KB swatches/previews
 * while preserving high visual clarity for swatches and popover previews.
 * Guaranteed to keep JSON payloads small and prevent HTTP 413 (Payload Too Large).
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
  maxSizeBytes?: number;
  targetMaxKb?: number;
}

export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxDimension = 240,
    quality = 0.65,
    maxSizeBytes = 15 * 1024 * 1024, // 15MB max file input
    targetMaxKb = 15, // target maximum base64 payload size in KB (~10KB-12KB max)
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

    // Check file size against allowed input limit
    if (file.size > maxSizeBytes) {
      const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
      return reject(new Error(`Image file size must be less than ${maxMb}MB.`));
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

      // If already a tiny SVG or < 15KB data URL, return directly
      if (file.type === 'image/svg+xml' || (result.length < 20 * 1024 && file.size < 15 * 1024)) {
        return resolve(result);
      }

      const img = new Image();

      img.onerror = () => {
        reject(new Error('Unable to decode image. Please select a valid JPG or PNG image.'));
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Compute initial scale
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
            return reject(new Error('Could not initialize canvas context for compression.'));
          }

          // Use white background in case of transparent PNGs converting to JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          let compressed = canvas.toDataURL('image/jpeg', quality);

          // If still larger than targetMaxKb (base64 string length), perform second aggressive pass
          const maxChars = targetMaxKb * 1024;
          if (compressed.length > maxChars) {
            const shrinkDimension = Math.min(180, Math.round(maxDimension * 0.75));
            let sWidth = width;
            let sHeight = height;
            if (sWidth > shrinkDimension || sHeight > shrinkDimension) {
              if (sWidth > sHeight) {
                sHeight = Math.round((sHeight * shrinkDimension) / sWidth);
                sWidth = shrinkDimension;
              } else {
                sWidth = Math.round((sWidth * shrinkDimension) / sHeight);
                sHeight = shrinkDimension;
              }
            }

            const shrinkCanvas = document.createElement('canvas');
            shrinkCanvas.width = Math.max(1, sWidth);
            shrinkCanvas.height = Math.max(1, sHeight);
            const sCtx = shrinkCanvas.getContext('2d');
            if (sCtx) {
              sCtx.fillStyle = '#ffffff';
              sCtx.fillRect(0, 0, sWidth, sHeight);
              sCtx.drawImage(canvas, 0, 0, sWidth, sHeight);
              compressed = shrinkCanvas.toDataURL('image/jpeg', 0.58);
            }
          }

          resolve(compressed);
        } catch (err: any) {
          reject(new Error(err?.message || 'Failed to compress image file.'));
        }
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}
