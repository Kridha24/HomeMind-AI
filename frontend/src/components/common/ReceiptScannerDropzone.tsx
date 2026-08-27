import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, RefreshCw, CheckCircle2, AlertCircle, FileText, Sparkles } from 'lucide-react';

interface ReceiptScannerDropzoneProps {
  onScanComplete?: (extractedData: any) => void;
  onScanStart?: () => void;
}

export const ReceiptScannerDropzone: React.FC<ReceiptScannerDropzoneProps> = ({
  onScanComplete,
  onScanStart,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsScanning(true);
    setStatusMessage('Scanning receipt with Vision OCR Engine...');

    if (onScanStart) onScanStart();

    // Simulate OCR processing steps
    setTimeout(() => {
      setStatusMessage('Extracting line items & total prices...');
    }, 1200);

    setTimeout(() => {
      setIsScanning(false);
      setStatusMessage('Receipt successfully ingested!');
      if (onScanComplete) {
        onScanComplete({
          merchant: 'Supermarket Store',
          total: 1450,
          date: new Date().toISOString().split('T')[0],
          items: ['Organic Milk (2L)', 'Wheat Bread', 'Bell Peppers', 'Greek Yogurt'],
        });
      }
    }, 2400);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all overflow-hidden ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : 'border-primary/40 bg-panel/60 hover:border-blue-500/60 hover:bg-secondary/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />

        {previewUrl ? (
          <div className="relative mx-auto max-w-xs rounded-2xl overflow-hidden shadow-2xl border border-primary/40">
            <img src={previewUrl} alt="Receipt Preview" className="w-full h-48 object-cover" />

            {/* Glowing Laser Scanline Animation */}
            {isScanning && (
              <div className="absolute inset-0 bg-blue-500/10 pointer-events-none">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce duration-1000" />
              </div>
            )}

            <div className="absolute bottom-0 inset-x-0 bg-background/90 backdrop-blur-md p-2 text-xs font-semibold text-primary flex items-center justify-center gap-2">
              {isScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span>{statusMessage}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{statusMessage || 'Click to scan another'}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 shadow-lg shadow-blue-500/10">
              <Camera className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-primary">
                Drag and drop your receipt here, or <span className="text-blue-400">browse file</span>
              </p>
              <p className="text-xs text-muted">Supports JPG, PNG with automatic Vision OCR extraction</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
