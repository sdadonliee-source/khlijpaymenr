import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  loading: boolean;
  initialData?: any;
}

export default function StoreModal({ isOpen, onClose, onSave, loading, initialData }: Props) {
  const [formData, setFormData] = React.useState({ name: '', default_currency: '' });
  const [error, setError] = React.useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({ name: initialData.name || '', default_currency: initialData.currency || '' });
    } else {
      setFormData({ name: '', default_currency: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Store name is required');
      return;
    }
    setError('');
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-zinc-900" />
        <h3 className="text-3xl font-bold mb-2 tracking-tight">{initialData ? 'Edit Store' : 'Create Store'}</h3>
        <p className="text-zinc-500 text-sm mb-8">{initialData ? 'Update your store details' : 'Fill in the details for your new store'}</p>
        
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Store Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Default Currency</label>
            <input 
              type="text" 
              placeholder="USD"
              value={formData.default_currency}
              className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
              onChange={(e) => setFormData({ ...formData, default_currency: e.target.value })}
            />
          </div>
          <div className="flex gap-4 pt-6">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl font-bold hover:bg-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-xl shadow-zinc-200"
            >
              {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
