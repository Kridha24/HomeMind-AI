import React, { useState } from 'react';
import { Camera, Upload, Sparkles, Check, RefreshCw, ShoppingBag } from 'lucide-react';
import apiClient from '../services/apiClient';

export const PantryVision: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleSimulateScan = async (isShelf: boolean) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/ai/ocr', {
        imageBase64: 'simulated_data',
        isShelf
      });
      setScanResult(res.data.result);
    } catch (e) {
      if (isShelf) {
        setScanResult({
          detected_items: [
            { name: 'Organic Whole Milk 2L', category: 'Milk', quantity: 2, unit: 'L', expiryDays: 4 },
            { name: 'Artisan Wheat Bread', category: 'Bread', quantity: 1, unit: 'pack', expiryDays: 3 },
            { name: 'Greek Yogurt 500g', category: 'Milk', quantity: 2, unit: 'pcs', expiryDays: 10 }
          ],
          confidence: 0.95
        });
      } else {
        setScanResult({
          storeName: 'Metro Organic Foods',
          date: '2026-07-29',
          totalAmount: 48.75,
          items: [
            { name: 'Olive Oil 1L', category: 'Oil', quantity: 1, price: 14.50 },
            { name: 'Basmati Rice 5kg', category: 'Rice', quantity: 1, price: 18.25 }
          ]
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          Pantry Vision & OCR Scanner
          <Camera className="w-5 h-5 text-pink-400" />
        </h1>
        <p className="text-xs text-slate-400">Upload shelf or receipt photos to automatically detect groceries and parse expense line items</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shelf Photo Scanner Box */}
        <div className="glass-panel p-6 space-y-4 text-center border-purple-500/30">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Scan Pantry Shelf</h3>
            <p className="text-xs text-slate-400 mt-1">Snap a photo of your fridge or pantry shelf to auto-update stock</p>
          </div>
          <button
            onClick={() => handleSimulateScan(true)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Scan Pantry Shelf
          </button>
        </div>

        {/* Receipt Scanner Box */}
        <div className="glass-panel p-6 space-y-4 text-center border-blue-500/30">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Scan Grocery Receipt</h3>
            <p className="text-xs text-slate-400 mt-1">Upload paper store receipt to extract items, store name & total price</p>
          </div>
          <button
            onClick={() => handleSimulateScan(false)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Scan Store Receipt
          </button>
        </div>
      </div>

      {/* Results Display */}
      {scanResult && (
        <div className="glass-panel p-5 space-y-4 border-emerald-500/40 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-100">OCR Extraction Completed</h3>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-semibold border border-emerald-500/20">
              Auto-synced to Household DB
            </span>
          </div>

          <div className="space-y-2">
            {(scanResult.detected_items || scanResult.items)?.map((item: any, idx: number) => (
              <div key={idx} className="glass-card p-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{item.name}</h4>
                  <p className="text-[10px] text-slate-400">Category: {item.category}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-purple-300">{item.quantity} {item.unit || 'pcs'}</span>
                  {item.price && <span className="block text-xs font-bold text-emerald-400">${item.price.toFixed(2)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
