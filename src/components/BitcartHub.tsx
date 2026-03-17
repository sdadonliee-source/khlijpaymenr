import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Wallet, ShoppingCart, Package, ExternalLink, RefreshCw, Plus, CreditCard } from 'lucide-react';

interface BitcartHubProps {
  lang: 'EN' | 'AR';
  user: any;
}

export default function BitcartHub({ lang, user }: BitcartHubProps) {
  const [activeTab, setActiveTab] = useState<'stores' | 'wallets' | 'invoices' | 'products' | 'pos'>('stores');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [posAmount, setPosAmount] = useState('');
  const [posCurrency, setPosCurrency] = useState('BTC');
  const [posStatus, setPosStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const createPosInvoice = async () => {
    if (!posAmount || !user) return;
    setPosStatus('loading');
    try {
      // Use the first store for POS
      const storesRes = await axios.get(`/api/bitcart/proxy/stores?userId=${user.uid}`);
      const storeId = storesRes.data.results?.[0]?.id || storesRes.data[0]?.id;
      
      if (!storeId) throw new Error('No store found. Create a store in Bitcart first.');

      const response = await axios.post('/api/bitcart/invoice', {
        storeId,
        amount: parseFloat(posAmount),
        currency: posCurrency
      });

      setPosStatus('success');
      window.open(response.data.payment_url, '_blank');
      setTimeout(() => setPosStatus('idle'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create POS invoice');
      setPosStatus('idle');
    }
  };

  const [lastFetchTime, setLastFetchTime] = useState<Record<string, number>>({});

  const fetchData = async (tab: string, force = false) => {
    if (!user || tab === 'pos') return;
    
    // Cooldown: Don't fetch the same tab more than once every 5 seconds unless forced
    const now = Date.now();
    if (!force && lastFetchTime[tab] && now - lastFetchTime[tab] < 5000) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/bitcart/proxy/${tab}?userId=${user.uid}`);
      const results = response.data.results || response.data;
      setData(Array.isArray(results) ? results : [results]);
      setLastFetchTime(prev => ({ ...prev, [tab]: now }));
    } catch (err: any) {
      console.error(`Error fetching ${tab}:`, err);
      if (err.response?.status === 429) {
        setError(lang === 'EN' ? 'Too many requests. Please wait a moment.' : 'طلبات كثيرة جداً. يرجى الانتظار قليلاً.');
      } else {
        setError(err.response?.data?.detail || err.response?.data?.error || `Failed to fetch ${tab}`);
      }
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-6 h-6 text-zinc-900" />
          <h2 className="text-2xl font-bold text-zinc-900">{t('title')}</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchData(activeTab, true)}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            title={t('refresh')}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-bold">
            <Plus className="w-4 h-4" />
            {t('add')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 mb-6 overflow-x-auto hide-scrollbar">
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
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-zinc-900 text-zinc-900 font-bold' 
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-6 text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          {error}
        </div>
      )}

      {activeTab === 'pos' ? (
        <div className="max-w-md mx-auto p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
          <div className="mb-6">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">{t('amount')}</label>
            <div className="relative">
              <input 
                type="number" 
                value={posAmount}
                onChange={(e) => setPosAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-4xl font-mono p-4 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none"
              />
              <select 
                value={posCurrency}
                onChange={(e) => setPosCurrency(e.target.value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-zinc-100 p-2 rounded-lg font-bold text-sm"
              >
                <option>BTC</option>
                <option>USDT</option>
                <option>SAR</option>
              </select>
            </div>
          </div>
          <button 
            onClick={createPosInvoice}
            disabled={posStatus === 'loading' || !posAmount}
            className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg disabled:opacity-50"
          >
            {posStatus === 'loading' ? 'Creating...' : posStatus === 'success' ? 'Invoice Created!' : t('createInvoice')}
          </button>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p>{t('noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, idx) => (
            <div key={item.id || idx} className="p-4 border border-zinc-100 rounded-xl hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-zinc-900">{item.name || item.id}</h4>
                {item.status && (
                  <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold ${
                    item.status === 'Complete' || item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {item.status}
                  </span>
                )}
              </div>
              
              <div className="space-y-2 text-sm text-zinc-500">
                {activeTab === 'wallets' && (
                  <p className="flex justify-between">
                    <span>{t('balance')}:</span>
                    <span className="font-mono text-zinc-900">{item.balance} {item.currency}</span>
                  </p>
                )}
                {activeTab === 'invoices' && (
                  <>
                    <p className="flex justify-between">
                      <span>{t('price')}:</span>
                      <span className="font-mono text-zinc-900">{item.price} {item.currency}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>ID:</span>
                      <span className="truncate ml-4">{item.id}</span>
                    </p>
                  </>
                )}
                {activeTab === 'products' && (
                  <p className="flex justify-between">
                    <span>{t('price')}:</span>
                    <span className="font-mono text-zinc-900">{item.price}</span>
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-50 flex justify-end">
                <button className="text-zinc-400 hover:text-zinc-900 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
