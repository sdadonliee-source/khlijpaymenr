import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  loading: boolean;
  stores: any[];
}

export default function CreateInvoiceModal({ isOpen, onClose, onSave, loading, stores }: CreateInvoiceModalProps) {
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('BTC');
  const [storeId, setStoreId] = useState(stores[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) return;
    onSave({ price: parseFloat(price), currency, store_id: storeId });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md relative z-10"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-6">Create New Invoice</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Store</label>
                <select 
                  value={storeId} 
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-200 outline-none focus:border-zinc-900"
                >
                  {stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Price</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-200 outline-none focus:border-zinc-900"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Currency</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-200 outline-none focus:border-zinc-900"
                >
                  {['BTC', 'ETH', 'USDT', 'SAR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Invoice'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
