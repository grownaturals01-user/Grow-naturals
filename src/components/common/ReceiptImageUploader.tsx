import React, { useState, useRef } from 'react';
import { Upload, Link2, X, Receipt, Eye, FileText, Camera } from 'lucide-react';

interface ReceiptImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
}

export const ReceiptImageUploader: React.FC<ReceiptImageUploaderProps> = ({
  value,
  onChange,
  label = 'Receipt / Bill Voucher Proof (Optional)',
  helperText = 'Attach photo of paper bill, cash memo, GST invoice, or payment transaction screenshot',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compress & convert file to data URL (retaining high readability for receipt text)
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1400; // Sharp receipt resolution
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
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          onChange(compressedDataUrl);
        } else {
          onChange(event.target?.result as string);
        }
        setIsCompressing(false);
      };
      img.onerror = () => {
        onChange(event.target?.result as string);
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-main, #334155)', marginBottom: '4px' }}>
        {label}
      </label>
      {helperText && (
        <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: 'var(--color-text-secondary, #64748b)' }}>
          {helperText}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: value ? '160px 1fr' : '1fr',
          gap: '16px',
          alignItems: 'center',
          background: 'var(--color-bg-secondary, #f8fafc)',
          padding: '16px',
          borderRadius: '12px',
          border: '1.5px dashed var(--color-border, #cbd5e1)',
          borderColor: isDragging ? 'var(--color-primary, #0284c7)' : 'var(--color-border, #cbd5e1)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Preview Box */}
        {value && (
          <div
            style={{
              position: 'relative',
              width: '160px',
              height: '140px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid var(--color-border, #e2e8f0)',
              background: '#ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            <img
              src={value}
              alt="Receipt Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => onChange('')}
              title="Remove Receipt Image"
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.92)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              <X size={14} />
            </button>
            <div
              style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                fontSize: '10px',
                textAlign: 'center',
                padding: '3px 0',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <Receipt size={11} /> Bill Attached
            </div>
          </div>
        )}

        {/* Controls Container */}
        <div>
          {/* Tab Selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeTab === 'upload' ? 'var(--color-primary, #0284c7)' : 'var(--color-border, #e2e8f0)',
                background: activeTab === 'upload' ? 'var(--color-primary-bg, #f0f9ff)' : '#ffffff',
                color: activeTab === 'upload' ? 'var(--color-primary, #0284c7)' : 'var(--color-text-secondary, #64748b)',
                cursor: 'pointer',
              }}
            >
              <Upload size={14} /> Upload Receipt / Bill
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeTab === 'url' ? 'var(--color-primary, #0284c7)' : 'var(--color-border, #e2e8f0)',
                background: activeTab === 'url' ? 'var(--color-primary-bg, #f0f9ff)' : '#ffffff',
                color: activeTab === 'url' ? 'var(--color-primary, #0284c7)' : 'var(--color-text-secondary, #64748b)',
                cursor: 'pointer',
              }}
            >
              <Link2 size={14} /> Paste Web URL
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                style={{ display: 'none' }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: '1px dashed var(--color-border, #cbd5e1)',
                  borderRadius: '8px',
                  padding: '20px 16px',
                  textAlign: 'center',
                  background: isDragging ? 'var(--color-primary-bg, #f0f9ff)' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Receipt size={24} style={{ color: 'var(--color-primary, #0284c7)' }} />
                  <Camera size={24} style={{ color: 'var(--color-text-secondary, #94a3b8)' }} />
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main, #334155)' }}>
                  {isCompressing ? 'Processing & Optimizing Image...' : value ? 'Click or drag to replace receipt image' : 'Click to browse receipt photo or drag and drop'}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary, #64748b)' }}>
                  Supports JPG, PNG, WEBP (camera photos, transaction screenshots, vouchers)
                </p>
              </div>
            </div>
          )}

          {/* URL Tab */}
          {activeTab === 'url' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="url"
                placeholder="https://example.com/receipt.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyUrl();
                  }
                }}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!urlInput.trim()}
                className="btn btn-primary"
                style={{ padding: '0 16px' }}
              >
                Apply URL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
