import { useState, useEffect } from 'react';
import { GCC_COUNTRIES } from '../constants';
import { Building2, CreditCard, Wallet, CheckCircle2, Circle, Loader2, ArrowRight } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function PaymentGateway({ lang, user }: { lang: 'EN' | 'AR', user: any }) {
  const [selectedCountry, setSelectedCountry] = useState('SA');
  const [linkedMethods, setLinkedMethods] = useState<Record<string, boolean>>({
    'SA-mada': true,
    'SA-stcpay': true,
    'AE-applepay': true,
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [bitcartStores, setBitcartStores] = useState<any[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<'selection' | 'form' | 'processing' | 'success' | 'error'>('selection');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [phoneData, setPhoneData] = useState('');

  useEffect(() => {
    if (user && showCheckout) {
      const fetchStores = async () => {
        try {
          const res = await fetch(`/api/bitcart/proxy/stores?userId=${user.uid}`);
          const data = await res.json();
          setBitcartStores(data.results || data || []);
        } catch (err) {
          console.error('Failed to fetch Bitcart stores:', err);
        }
      };
      fetchStores();
    }
  }, [user, showCheckout]);

  const handlePayment = async () => {
    if (!selectedMethod) return;
    setCheckoutStep('processing');
    setError(null);
    
    try {
      const country = (GCC_COUNTRIES as any)[selectedCountry];
      const amount = 150.00;
      const currency = country.currency.EN;
      
      const isCrypto = selectedMethod.type === 'wallet' && !['stcpay', 'applepay'].some(id => selectedMethod.id.includes(id));

      if (isCrypto) {
        const storeId = bitcartStores[0]?.id;
        if (!storeId) throw new Error('No Bitcart store found. Please create one in the Crypto Hub.');

        const response = await fetch('/api/bitcart/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            price: amount,
            currency: selectedMethod.name.EN === 'USDT' ? 'USDT' : selectedMethod.name.EN === 'Ethereum' ? 'ETH' : 'BTC',
            store_id: storeId
          })
        });

        if (!response.ok) throw new Error('Failed to create crypto invoice');
        const invoice = await response.json();
        
        // For crypto, we show the success screen but might need to show the payment address
        setCheckoutStep('success');
      } else {
        // Traditional Payment (Mada, Apple Pay, STC Pay)
        // Simulate a real processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const orderData = {
          userId: user.uid,
          amount,
          currency,
          status: 'completed',
          paymentMethod: selectedMethod.id,
          methodName: selectedMethod.name[lang],
          createdAt: new Date().toISOString(),
          metadata: {
            cardNumber: cardData.number ? `****${cardData.number.slice(-4)}` : null,
            phone: phoneData || null
          }
        };

        await addDoc(collection(db, 'orders'), orderData);
        
        // Also add to transactions for the dashboard
        await addDoc(collection(db, 'transactions'), {
          ...orderData,
          merchant: 'KhalijPay Merchant',
          type: 'payment',
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toLocaleTimeString(),
        });

        // Trigger a simulated webhook
        try {
          await fetch('/api/webhooks/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              event: 'order.completed',
              payload: orderData
            })
          });
        } catch (e) {
          console.warn('Webhook trigger failed (expected if not configured):', e);
        }

        setCheckoutStep('success');
      }
    } catch (err: any) {
      console.error('Payment Error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setCheckoutStep('error');
    }
  };

  const renderPaymentForm = () => {
    if (!selectedMethod) return null;

    const isMada = selectedMethod.id.includes('mada');
    const isApplePay = selectedMethod.id.includes('applepay');
    const isStcPay = selectedMethod.id.includes('stcpay');
    const isCrypto = selectedMethod.type === 'wallet' && !isStcPay && !isApplePay;

    return (
      <div className="space-y-6">
        {isApplePay && (
          <div className="space-y-6 text-center">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePayment}
              className="bg-black text-white p-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-900 transition-colors shadow-lg"
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-xl font-bold">Pay with Apple Pay</span>
            </motion.div>
            <p className="text-xs text-zinc-400">Secure payment via Apple Pay</p>
          </div>
        )}

        {isStcPay && (
          <div className="space-y-4">
            <div className="p-4 bg-[#4F008C] rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-2xl italic">stc pay</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Mobile Number</label>
              <input 
                type="tel" 
                placeholder="05xxxxxxxx"
                value={phoneData}
                onChange={(e) => setPhoneData(e.target.value)}
                className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#4F008C] outline-none font-mono text-lg"
              />
            </div>
            <button 
              onClick={handlePayment}
              className="w-full py-4 bg-[#4F008C] text-white font-bold rounded-xl hover:bg-[#3D006D] transition-colors shadow-lg"
            >
              {lang === 'EN' ? 'Pay Now' : 'ادفع الآن'}
            </button>
          </div>
        )}

        {(isMada || selectedMethod.type === 'card') && (
          <div className="space-y-4">
            {isMada && (
              <div className="flex justify-end mb-2">
                <span className="text-[10px] font-bold bg-zinc-100 px-2 py-0.5 rounded text-zinc-500 uppercase">mada enabled</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Card Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="0000 0000 0000 0000"
                  value={cardData.number}
                  onChange={(e) => setCardData({...cardData, number: e.target.value})}
                  className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono text-lg"
                />
                <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-6 h-6" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Expiry Date</label>
                <input 
                  type="text" 
                  placeholder="MM/YY"
                  value={cardData.expiry}
                  onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                  className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono text-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">CVC</label>
                <input 
                  type="text" 
                  placeholder="123"
                  value={cardData.cvc}
                  onChange={(e) => setCardData({...cardData, cvc: e.target.value})}
                  className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono text-lg"
                />
              </div>
            </div>
            <button 
              onClick={handlePayment}
              className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-lg"
            >
              {lang === 'EN' ? 'Pay Now' : 'ادفع الآن'}
            </button>
          </div>
        )}

        {isCrypto && (
          <div className="space-y-6 text-center">
            <div className="p-6 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
              <p className="text-sm text-zinc-600 mb-4">You are about to pay with {selectedMethod.name[lang]}</p>
              <button 
                onClick={handlePayment}
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                {lang === 'EN' ? 'Generate Invoice' : 'إنشاء فاتورة'}
              </button>
            </div>
            <p className="text-xs text-zinc-500">Payments are processed instantly via the internal Bitcart engine</p>
          </div>
        )}
      </div>
    );
  };

  const t = (key: string) => {
    const translations: any = {
      EN: { 
        title: 'Payment Gateway & Integrations',
        subtitle: 'Configure local payment methods for each GCC country',
        banks: 'Bank Transfers',
        wallets: 'Digital Wallets',
        cards: 'Cards & Networks',
        linked: 'Linked',
        unlinked: 'Link Method',
        currency: 'Local Currency'
      },
      AR: { 
        title: 'بوابة الدفع والربط',
        subtitle: 'إعداد طرق الدفع المحلية لكل دولة من دول مجلس التعاون',
        banks: 'التحويلات البنكية',
        wallets: 'المحافظ الرقمية',
        cards: 'البطاقات والشبكات',
        linked: 'مربوط',
        unlinked: 'ربط الطريقة',
        currency: 'العملة المحلية'
      }
    };
    return translations[lang][key];
  };

  const toggleMethod = (countryCode: string, methodId: string) => {
    const key = `${countryCode}-${methodId}`;
    setLinkedMethods(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const countryData = (GCC_COUNTRIES as any)[selectedCountry];

  const renderMethods = (type: string, title: string, icon: any) => {
    const methods = countryData.methodsDetails.filter((m: any) => m.type === type);
    if (methods.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 text-zinc-800">
          {icon}
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {methods.map((method: any) => {
            const isLinked = linkedMethods[`${selectedCountry}-${method.id}`];
            return (
              <motion.div 
                key={method.id} 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${isLinked ? 'border-emerald-500 bg-emerald-50/50' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
                onClick={() => toggleMethod(selectedCountry, method.id)}
              >
                <span className="font-semibold text-zinc-900">{method.name[lang]}</span>
                <div className={`flex items-center gap-1.5 text-sm font-medium ${isLinked ? 'text-emerald-600' : 'text-zinc-500'}`}>
                  {isLinked ? (
                    <><CheckCircle2 className="w-4 h-4" /> {t('linked')}</>
                  ) : (
                    <><Circle className="w-4 h-4" /> {t('unlinked')}</>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-zinc-200">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('title')}</h2>
        <p className="text-zinc-500">{t('subtitle')}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
        {Object.keys(GCC_COUNTRIES).map(code => (
          <button
            key={code}
            onClick={() => setSelectedCountry(code)}
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-colors ${selectedCountry === code ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            {(GCC_COUNTRIES as any)[code].name[lang]}
          </button>
        ))}
      </div>

      <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 mb-8 flex justify-between items-center">
        <div>
          <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('currency')}</p>
          <p className="text-2xl font-mono font-bold text-zinc-900">{countryData.currency[lang]} <span className="text-zinc-400 text-lg">({countryData.currency.EN})</span></p>
        </div>
      </div>

      {renderMethods('wallet', t('wallets'), <Wallet className="w-5 h-5 text-indigo-500" />)}
      {renderMethods('bank', t('banks'), <Building2 className="w-5 h-5 text-blue-500" />)}
      {renderMethods('card', t('cards'), <CreditCard className="w-5 h-5 text-amber-500" />)}

      <div className="mt-8 pt-8 border-t border-zinc-200">
        <button 
          onClick={() => { setShowCheckout(true); setCheckoutStep('selection'); }}
          className="w-full md:w-auto px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {lang === 'EN' ? 'Checkout' : 'الدفع'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-zinc-900 text-white p-6 text-center relative">
                <button 
                  onClick={() => setShowCheckout(false)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <h3 className="text-lg font-bold mb-1">{lang === 'EN' ? 'Checkout' : 'الدفع'}</h3>
                <p className="text-zinc-400 text-sm">{countryData.name[lang]}</p>
              </div>
              
              <div className="p-8">
                {checkoutStep === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 mb-2">{lang === 'EN' ? 'Payment Successful' : 'تم الدفع بنجاح'}</h3>
                    <p className="text-zinc-500 mb-8">150.00 {countryData.currency.EN} received</p>
                    <button 
                      onClick={() => setShowCheckout(false)}
                      className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors"
                    >
                      {lang === 'EN' ? 'Close' : 'إغلاق'}
                    </button>
                  </motion.div>
                ) : checkoutStep === 'error' ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ArrowRight className="w-10 h-10 text-red-600 rotate-45" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 mb-2">{lang === 'EN' ? 'Payment Failed' : 'فشل الدفع'}</h3>
                    <p className="text-red-500 mb-8 text-sm">{error}</p>
                    <button 
                      onClick={() => setCheckoutStep('selection')}
                      className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors"
                    >
                      {lang === 'EN' ? 'Try Again' : 'إعادة المحاولة'}
                    </button>
                  </motion.div>
                ) : checkoutStep === 'processing' ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 text-zinc-900 animate-spin mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{lang === 'EN' ? 'Processing Payment...' : 'جاري معالجة الدفع...'}</h3>
                    <p className="text-zinc-500">Please do not close this window</p>
                  </div>
                ) : checkoutStep === 'form' ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-100">
                      <button 
                        onClick={() => setCheckoutStep('selection')}
                        className="text-zinc-400 hover:text-zinc-900 transition-colors"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </button>
                      <span className="font-bold text-zinc-900">{selectedMethod?.name[lang]}</span>
                    </div>
                    {renderPaymentForm()}
                  </motion.div>
                ) : (
                  <>
                    <div className="text-center mb-10">
                      <p className="text-zinc-500 text-sm mb-1">{lang === 'EN' ? 'Amount Due' : 'المبلغ المطلوب'}</p>
                      <p className="text-4xl font-mono font-bold text-zinc-900 flex items-center justify-center gap-2">
                        150.00 <span className="text-xl text-zinc-400">{countryData.currency.EN}</span>
                      </p>
                    </div>

                    <div className="mb-8">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">{lang === 'EN' ? 'Select Payment Method' : 'اختر طريقة الدفع'}</p>
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {countryData.methodsDetails.filter((m: any) => linkedMethods[`${selectedCountry}-${m.id}`]).map((m: any) => (
                          <motion.div 
                            key={m.id}
                            whileHover={{ x: 4 }}
                            onClick={() => setSelectedMethod(m)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all ${selectedMethod?.id === m.id ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'}`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod?.id === m.id ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'}`}>
                              {selectedMethod?.id === m.id && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="font-bold text-zinc-900">{m.name[lang]}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => setCheckoutStep('form')}
                      disabled={!selectedMethod}
                      className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      {lang === 'EN' ? 'Continue' : 'استمرار'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
