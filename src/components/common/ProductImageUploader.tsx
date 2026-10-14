import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Upload, X, Check, Star, Plus, Trash2 } from 'lucide-react';

export interface ProductImageUploaderProps {
  value?: string | string[];
  onChange: (primaryUrl: string, allUrls?: string[]) => void;
  images?: string[];
  onImagesChange?: (urls: string[]) => void;
  label?: string;
  productType?: string;
  multiple?: boolean;
}

// Helper to compress a file
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  value,
  onChange,
  images: initialImages,
  onImagesChange,
  label = 'Product Images & Media',
  multiple = true,
}) => {
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressProgress, setCompressProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Normalize incoming images array
  const normalizeImages = (): string[] => {
    if (initialImages && Array.isArray(initialImages) && initialImages.length > 0) {
      return initialImages.filter(Boolean);
    }
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }
    if (typeof value === 'string' && value.trim()) {
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch {
          // ignore
        }
      }
      return [value.trim()];
    }
    return [];
  };

  const [currentImages, setCurrentImages] = useState<string[]>(normalizeImages());

  // Keep internal list in sync when prop changes externally
  useEffect(() => {
    const next = normalizeImages();
    if (JSON.stringify(next) !== JSON.stringify(currentImages)) {
      setCurrentImages(next);
    }
  }, [value, initialImages]);

  // Dispatch changes upward
  const updateImages = (newImages: string[]) => {
    const cleanList = newImages.filter(Boolean);
    setCurrentImages(cleanList);
    const primary = cleanList[0] || '';
    onChange(primary, cleanList);
    if (onImagesChange) {
      onImagesChange(cleanList);
    }
  };

  // Add multiple files from file picker
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    setCompressProgress(`Processing ${files.length} image${files.length > 1 ? 's' : ''}...`);

    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (validFiles.length === 0) {
        alert('Please select valid image files (PNG, JPG, WEBP).');
        setIsCompressing(false);
        return;
      }

      const compressedUrls = await Promise.all(validFiles.map((file) => compressImageFile(file)));
      
      if (multiple) {
        updateImages([...currentImages, ...compressedUrls]);
      } else {
        updateImages([compressedUrls[0]]);
      }
    } catch (err) {
      console.error('Failed to process image files:', err);
    } finally {
      setIsCompressing(false);
      setCompressProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove one specific image
  const handleRemoveImage = (indexToRemove: number) => {
    const updated = currentImages.filter((_, idx) => idx !== indexToRemove);
    updateImages(updated);
  };

  // Set image as Primary / Cover (move to index 0)
  const handleMakeCover = (indexToCover: number) => {
    if (indexToCover === 0) return;
    const target = currentImages[indexToCover];
    const rest = currentImages.filter((_, idx) => idx !== indexToCover);
    updateImages([target, ...rest]);
  };


  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', marginBottom: '2px' }}>
            {label}
          </label>
          {/* <small style={{ color: '#64748b', fontSize: '0.78rem' }}>
            Upload multiple high-resolution photos. First image is automatically used as the <strong>Cover / POS primary photo</strong>.
          </small> */}
        </div>
        {currentImages.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-12">
              {currentImages.length} {currentImages.length === 1 ? 'Image' : 'Images'} Uploaded
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger py-0 px-2 fs-11"
              onClick={() => updateImages([])}
              title="Clear all images"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1',
        }}
      >
        {/* Gallery Grid (Shown when 1 or more images are present) */}
        {currentImages.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '12px',
              }}
            >
              {currentImages.map((imgUrl, index) => {
                const isCover = index === 0;
                return (
                  <div
                    key={`${imgUrl.slice(0, 30)}-${index}`}
                    style={{
                      position: 'relative',
                      height: '130px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: isCover ? '2px solid #16a34a' : '1px solid #e2e8f0',
                      background: '#ffffff',
                      boxShadow: isCover ? '0 3px 8px rgba(22, 163, 74, 0.18)' : '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Product photo ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />

                    {/* Cover badge */}
                    {isCover ? (
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          background: '#16a34a',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                      >
                        <Star size={10} fill="#ffffff" /> Cover
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMakeCover(index)}
                        title="Set as Cover Photo"
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          background: 'rgba(15, 23, 42, 0.75)',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        Set Cover
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      title="Remove this photo"
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.95)',
                        color: '#ffffff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      <X size={13} />
                    </button>

                    {/* Image index footer */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        background: 'rgba(15, 23, 42, 0.7)',
                        color: '#ffffff',
                        fontSize: '10px',
                        textAlign: 'center',
                        padding: '2px 0',
                        fontWeight: 500,
                      }}
                    >
                      Photo #{index + 1}
                    </div>
                  </div>
                );
              })}

              {/* Quick Add More Tile */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  height: '130px',
                  borderRadius: '10px',
                  border: '2px dashed #94a3b8',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#16a34a';
                  e.currentTarget.style.color = '#16a34a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#94a3b8';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <Plus size={24} style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>+ Add Photos</span>
              </div>
            </div>
          </div>
        )}

        {/* File Upload Dropzone */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple={multiple}
            onChange={handleFilesSelected}
            style={{ display: 'none' }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '1.5px dashed #94a3b8',
              borderRadius: '10px',
              padding: '22px 16px',
              textAlign: 'center',
              background: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#16a34a')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#94a3b8')}
          >
            <Upload size={26} style={{ color: '#16a34a', margin: '0 auto 8px auto' }} />
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
              {isCompressing
                ? compressProgress || 'Optimizing images...'
                : 'Click to browse and upload multiple images (or drag & drop)'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Supports multiple PNG, JPG, WEBP • Auto-compressed & optimized for high-speed POS display
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
