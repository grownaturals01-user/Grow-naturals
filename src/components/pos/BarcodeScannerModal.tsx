import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const scanner = new Html5QrcodeScanner(
      'pos-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
        onClose();
      },
      (error) => {
        // ignore scan frames without barcode
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="dialog-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="var(--module-sell-accent)" />
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700 }}>Scan Barcode / QR</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body" style={{ padding: '16px' }}>
          <div id="pos-reader" style={{ width: '100%' }} />
          <p style={{ textAlign: 'center', fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Point your camera at a product barcode or QR label.
          </p>
        </div>
      </div>
    </div>
  );
};
