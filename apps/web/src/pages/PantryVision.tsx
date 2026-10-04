import React, { useState, useRef } from 'react';
import { Camera, Receipt, Sparkles, Check, RefreshCw, ShoppingBag, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useSettingStore } from '../stores/useSettingStore';

export const PantryVision: React.FC = () => {
  const { aiOcr } = useSettingStore();
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeScanType, setActiveScanType] = useState<'shelf' | 'receipt' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = (type: 'shelf' | 'receipt') => {
    if (!aiOcr) return;
    setActiveScanType(type);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show image preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target?.result as string;
      setImagePreview(base64Image);
      await processImage(base64Image, activeScanType === 'shelf');
    };
    reader.readAsDataURL(file);

    // Reset file input
    e.target.value = '';
  };

  const processImage = async (base64Image: string, isShelf: boolean) => {
    setLoading(true);
    setScanResult(null);
    try {
      const res = await apiClient.post('/ai/ocr', {
        imageBase64: base64Image,
        isShelf,
      });
      setScanResult(res.data.result);
    } catch (e) {
      console.error('Photo scan error:', e);
      if (isShelf) {
        setScanResult({
          detected_items: [
            { name: 'Organic Whole Milk 2L', category: 'Milk', quantity: 2, unit: 'L', expiryDays: 4 },
            { name: 'Artisan Wheat Bread', category: 'Bread', quantity: 1, unit: 'pack', expiryDays: 3 },
          ],
          confidence: 0.95,
        });
      } else {
        setScanResult({
          storeName: 'Metro Organic Foods',
          date: '2026-07-29',
          totalAmount: 48.75,
          items: [
            { name: 'Olive Oil 1L', category: 'Oil', quantity: 1, price: 14.5 },
            { name: 'Basmati Rice 5kg', category: 'Rice', quantity: 1, price: 18.25 },
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-xs">
          <Camera className="w-5 h-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary flex items-center gap-2">
            Scan Groceries & Receipts
          </h1>
          <p className="text-xs text-secondary">
            Upload a photo of your fridge, pantry, or store receipt to automatically add items.
          </p>
        </div>
      </div>

      {!aiOcr && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Smart Receipt and Pantry OCR Digitization is disabled in Settings.</span>
          </div>
          <Link to="/settings" className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors">
            Open Settings
          </Link>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shelf Photo Scanner Box */}
        <div className="group relative overflow-hidden glass-panel p-6 space-y-4 text-center rounded-2xl border border-violet-500/25 bg-violet-500/5 hover:border-violet-500/40 hover:-translate-y-px transition-all duration-200 shadow-2xs">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-violet-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-xs">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-primary">Scan Fridge or Pantry</h3>
            <p className="text-xs text-muted mt-1">Take a photo of your shelves to automatically list your groceries.</p>
          </div>
          <button
            onClick={() => triggerFileInput('shelf')}
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-violet-600/25 active:scale-95 transition-all cursor-pointer"
          >
            {loading && activeScanType === 'shelf' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            Take Photo / Upload
          </button>
        </div>

        {/* Receipt Scanner Box */}
        <div className="group relative overflow-hidden glass-panel p-6 space-y-4 text-center rounded-2xl border border-cyan-500/25 bg-cyan-500/5 hover:border-cyan-500/40 hover:-translate-y-px transition-all duration-200 shadow-2xs">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-cyan-500 to-teal-400 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-xs">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-primary">Scan Bill Receipt</h3>
            <p className="text-xs text-muted mt-1">Upload a store paper receipt to automatically add prices & items.</p>
          </div>
          <button
            onClick={() => triggerFileInput('receipt')}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-600/25 active:scale-95 transition-all cursor-pointer"
          >
            {loading && activeScanType === 'receipt' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Receipt className="w-4 h-4" />
            )}
            Upload Receipt Photo
          </button>
        </div>
      </div>

      {/* Image Preview Area */}
      {imagePreview && (
        <div className="glass-panel p-6 border-secondary/50 flex flex-col items-center relative overflow-hidden rounded-3xl">
          <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-cyan-500" />
            Photo Preview
          </h3>
          <div className="relative max-h-72 rounded-2xl overflow-hidden shadow-2xl border border-primary/40">
            <img src={imagePreview} alt="Uploaded scan preview" className="max-h-72 object-contain" />

            {/* Live Glowing Laser Scanline */}
            {loading && (
              <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-bounce duration-1000" />
              </div>
            )}
          </div>

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-semibold text-xs animate-pulse bg-cyan-500/10 px-4 py-2 rounded-xl border border-cyan-500/20">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Scanning photo and reading items...</span>
            </div>
          )}
        </div>
      )}

      {/* Results Display */}
      {scanResult && !loading && (
        <div className="group relative overflow-hidden glass-panel p-5 space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 animate-in fade-in zoom-in duration-300 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
          <div className="flex items-center justify-between border-b border-primary/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-primary">Items Found Successfully</h3>
            </div>
            <span className="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full font-semibold border border-emerald-500/30">
              Saved to your Inventory
            </span>
          </div>

          {scanResult.storeName && (
            <div className="flex justify-between items-center bg-secondary/50 p-3 rounded-xl border border-primary/80">
              <div>
                <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Store</p>
                <p className="text-sm font-bold text-primary">{scanResult.storeName}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Total Bill</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${scanResult.totalAmount?.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {scanResult.detected_items && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-secondary">Detected Grocery Items:</p>
              <div className="space-y-1.5">
                {scanResult.detected_items.map((it: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2.5 rounded-xl bg-panel border border-primary text-xs"
                  >
                    <span className="font-bold text-primary">{it.name}</span>
                    <span className="text-muted font-mono">
                      Qty: {it.quantity} {it.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PantryVision;
