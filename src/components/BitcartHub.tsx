import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Wallet, ShoppingCart, Package, ExternalLink, RefreshCw, Plus, CreditCard, Trash2, CheckCircle2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

import { QRCodeSVG } from 'qrcode.react';

interface BitcartHubProps {
  lang: 'EN' | 'AR';
  user: any;
}

export default function BitcartHub({ lang, user }: BitcartHubProps) {
  const [activeTab, setActiveTab] = useState<'stores' | 'wallets' | 'invoices' | 'products' | 'pos'>('stores');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bitcartUrl, setBitcartUrl] = useState('');
  const [posAmount, setPosAmount] = useState('');
  const [posCurrency, setPosCurrency] = useState('BTC');
  const [posStatus, setPosStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    // Internal Bitcart is always available at /api/bitcart
    setBitcartUrl(window.location.origin + '/api/bitcart');
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`/api/bitcart/${activeTab}?userId=${user.uid}`, formData);
      setShowCreateModal(false);
      setFormData({});
      fetchData(activeTab, true);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || `Failed to create ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    setLoading(true);
    try {
      await axios.delete(`/api/bitcart/${activeTab}/${id}?userId=${user.uid}`);
      fetchData(activeTab, true);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || `Failed to delete ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const syncInvoice = async (id: string) => {
    setLoading(true);
    try {
      await axios.get(`/api/bitcart/invoices/${id}?userId=${user.uid}`);
      fetchData('invoices', true);
    } catch (err: any) {
      setError('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const createPosInvoice = async () => {
    if (!posAmount || !user) return;
    setPosStatus('loading');
    try {
      // Use the first store for POS
      const storesRes = await axios.get(`/api/bitcart/stores?userId=${user.uid}`);
      const stores = storesRes.data.results || storesRes.data;
      const storeId = stores?.[0]?.id;
      
      if (!storeId) throw new Error('No store found. Create a store first.');

      const response = await axios.post('/api/bitcart/invoices', {
        userId: user.uid,
        store_id: storeId,
        price: parseFloat(posAmount),
        currency: posCurrency
      });

      setPosStatus('success');
      setActiveInvoice(response.data);
      fetchData('invoices', true);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to create POS invoice');
      setPosStatus('idle');
    }
  };

  const [lastFetchTime, setLastFetchTime] = useState<Record<string, number>>({});

  const fetchData = async (tab: string, force = false) => {
    if (!user || tab === 'pos') return;
    
    const now = Date.now();
    if (!force && lastFetchTime[tab] && now - lastFetchTime[tab] < 2000) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/bitcart/${tab}?userId=${user.uid}`);
      const results = response.data.results || response.data;
      setData(Array.isArray(results) ? results : [results]);
      setLastFetchTime(prev => ({ ...prev, [tab]: now }));
    } catch (err: any) {
      console.error(`Error fetching ${tab}:`, err);
      setError(err.response?.data?.detail || err.response?.data?.error || `Failed to fetch ${tab}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, user]);

  const t = (key: string) => {
    const translations: any = {
      EN: {
        title: 'Bitcart Hub',
        stores: 'Stores',
        wallets: 'Wallets',
        invoices: 'Invoices',
        products: 'Products',
        pos: 'POS Terminal',
        noData: 'No data found',
        refresh: 'Refresh',
        add: 'Add New',
        status: 'Status',
        balance: 'Balance',
        price: 'Price',
        createInvoice: 'Create Invoice',
        amount: 'Amount'
      },
      AR: {
        title: 'مركز Bitcart',
        stores: 'المتاجر',
        wallets: 'المحافظ',
        invoices: 'الفواتير',
        products: 'المنتجات',
        pos: 'نقطة البيع',
        noData: 'لا توجد بيانات',
        refresh: 'تحديث',
        add: 'إضافة جديد',
        status: 'الحالة',
        balance: 'الرصيد',
        price: 'السعر',
        createInvoice: 'إنشاء فاتورة',
        amount: 'المبلغ'
      }
    };
    return translations[lang][key];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('title')}</h2>
            <p className="text-zinc-500 text-sm font-medium">{bitcartUrl || 'Not configured'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchData(activeTab, true)}
            className="p-2.5 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm"
            title={t('refresh')}
          >
            <RefreshCw className={`w-5 h-5 text-zinc-600 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setFormData({});
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors text-sm font-bold shadow-lg shadow-zinc-200"
          >
            <Plus className="w-4 h-4" />
            {t('add')}
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-zinc-100 rounded-2xl w-fit overflow-x-auto hide-scrollbar border border-zinc-200">
        {[
          { id: 'stores', icon: LayoutDashboard, label: t('stores') },
          { id: 'wallets', icon: Wallet, label: t('wallets') },
          { id: 'invoices', icon: ShoppingCart, label: t('invoices') },
          { id: 'products', icon: Package, label: t('products') },
          { id: 'pos', icon: CreditCard, label: t('pos') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all whitespace-nowrap text-sm font-bold ${
              activeTab === tab.id 
                ? 'text-zinc-900' 
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-zinc-200"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <p className="font-medium">{error}</p>
        </motion.div>
      )}

      {activeTab === 'pos' ? (
        <div className="max-w-md mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-800 relative overflow-hidden"
          >
            {/* Hardware Accents */}
            <div className="absolute top-8 right-8 flex gap-1.5">
              <div className={`w-2 h-2 rounded-full ${posStatus === 'loading' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-700'}`} />
              <div className={`w-2 h-2 rounded-full ${posStatus === 'success' ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
            </div>

            {posStatus === 'success' && activeInvoice ? (
              <div className="space-y-8 text-center">
                <div className="bg-white p-6 rounded-3xl inline-block mx-auto shadow-inner">
                  <QRCodeSVG 
                    value={activeInvoice.payment_url || activeInvoice.id} 
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-mono text-2xl font-bold">{activeInvoice.price} {activeInvoice.currency}</h4>
                  <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Invoice: {activeInvoice.id.substring(0, 8)}...</p>
                </div>
                <div className="p-4 bg-zinc-800 rounded-2xl border border-zinc-700/50">
                  <p className="text-zinc-400 text-xs mb-1">Status</p>
                  <p className="text-emerald-500 font-bold uppercase tracking-widest text-sm">{activeInvoice.status}</p>
                </div>
                <button 
                  onClick={() => {
                    setPosStatus('idle');
                    setActiveInvoice(null);
                    setPosAmount('');
                  }}
                  className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-bold hover:bg-zinc-700 transition-colors"
                >
                  New Transaction
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">{t('pos')}</label>
                  <div className="bg-zinc-800/50 p-6 rounded-3xl border border-zinc-700/50">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-zinc-500 font-mono text-lg">{posCurrency}</span>
                      <input 
                        type="number" 
                        value={posAmount}
                        onChange={(e) => setPosAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full text-5xl font-mono bg-transparent text-white outline-none placeholder:text-zinc-700"
                      />
                    </div>
                    <div className="flex gap-2">
                      {['BTC', 'USDT', 'SAR'].map(curr => (
                        <button 
                          key={curr}
                          onClick={() => setPosCurrency(curr)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${posCurrency === curr ? 'bg-white text-zinc-900' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={createPosInvoice}
                  disabled={posStatus === 'loading' || !posAmount}
                  className="w-full py-5 bg-white text-zinc-900 rounded-2xl font-bold hover:bg-zinc-100 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {posStatus === 'loading' ? (
                    <><RefreshCw className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : (
                    <>{t('createInvoice')}</>
                  )}
                </motion.button>
              </>
            )}

            <p className="mt-6 text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
              Secure Hardware Terminal v2.0
            </p>
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-zinc-50 rounded-2xl animate-pulse border border-zinc-100" />
            ))
          ) : data.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
              <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold">{t('noData')}</p>
            </div>
          ) : (
            data.map((item, idx) => (
              <motion.div 
                key={item.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white p-6 rounded-2xl border border-zinc-200 hover:border-zinc-900 hover:shadow-xl hover:shadow-zinc-100 transition-all relative overflow-hidden"
              >
                {/* Status Indicator */}
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <h4 className="font-bold text-zinc-900 group-hover:text-zinc-900 transition-colors">{item.name || item.id}</h4>
                    <p className="text-[10px] font-mono text-zinc-400 truncate max-w-[150px]">{item.id}</p>
                  </div>
                  {item.status && (
                    <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase font-bold tracking-wider ${
                      item.status === 'Complete' || item.status === 'active' || item.status === 'Paid' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-zinc-50 text-zinc-500 border border-zinc-100'
                    }`}>
                      {item.status}
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  {activeTab === 'wallets' && (
                    <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('balance')}</span>
                      <span className="font-mono font-bold text-zinc-900">{item.balance} {item.currency}</span>
                    </div>
                  )}
                  {activeTab === 'invoices' && (
                    <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('price')}</span>
                      <span className="font-mono font-bold text-zinc-900">{item.price} {item.currency}</span>
                    </div>
                  )}
                  {activeTab === 'products' && (
                    <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('price')}</span>
                      <span className="font-mono font-bold text-zinc-900">{item.price}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="text-zinc-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex gap-2">
                    {activeTab === 'invoices' && item.status === 'pending' && (
                      <button 
                        onClick={() => syncInvoice(item.id)}
                        className="text-zinc-400 hover:text-emerald-600 transition-colors p-2 hover:bg-emerald-50 rounded-lg"
                        title="Sync with Blockchain"
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    {item.payment_url && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(item.payment_url);
                          alert('Payment URL copied to clipboard');
                        }}
                        className="text-zinc-400 hover:text-zinc-900 transition-colors p-2 hover:bg-zinc-50 rounded-lg"
                        title="Copy Payment URL"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        if (item.payment_url) window.open(item.payment_url, '_blank');
                      }}
                      className="text-zinc-400 hover:text-zinc-900 transition-colors p-2 hover:bg-zinc-50 rounded-lg"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-zinc-900" />
              <h3 className="text-3xl font-bold mb-2 tracking-tight">Create {activeTab.slice(0, -1)}</h3>
              <p className="text-zinc-500 text-sm mb-8">Fill in the details for your new {activeTab.slice(0, -1)}</p>
              
              <form onSubmit={handleCreate} className="space-y-6">
                {activeTab === 'stores' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Store Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Default Currency</label>
                      <input 
                        type="text" 
                        placeholder="USD"
                        className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                        onChange={(e) => setFormData({ ...formData, default_currency: e.target.value })}
                      />
                    </div>
                  </>
                )}
                {activeTab === 'wallets' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Wallet Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Currency (e.g. btc)</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">XPub / Address</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                        onChange={(e) => setFormData({ ...formData, xpub: e.target.value })}
                      />
                    </div>
                  </>
                )}
                {activeTab === 'products' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Product Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Price</label>
                      <input 
                        type="number" 
                        required
                        step="0.01"
                        className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      />
                    </div>
                  </>
                )}
                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl font-bold hover:bg-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-xl shadow-zinc-200"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
