import { useState } from 'react';
import { GCC_COUNTRIES } from '../constants';
import { Building2, CreditCard, Wallet, CheckCircle2, Circle, Loader2, ArrowRight } from 'lucide-react';

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
  const [showSimulator, setShowSimulator] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'awaiting' | 'processing' | 'completed'>('awaiting');

  const handleTestCheckout = async () => {
    setPaymentStatus('processing');
    try {
      const response = await fetch('/api/fiat/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          amount: 150.00,
          currency: (GCC_COUNTRIES as any)[selectedCountry].currency,
          method: 'Card'
        })
      });
      
      if (response.ok) {
        setPaymentStatus('completed');
      } else {
        console.error('Checkout failed');
        setPaymentStatus('awaiting');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      setPaymentStatus('awaiting');
    }
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
              <div 
                key={method.id} 
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
              </div>
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
          onClick={() => { setShowSimulator(true); setPaymentStatus('awaiting'); }}
          className="w-full md:w-auto px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {lang === 'EN' ? 'Test Checkout' : 'تجربة الدفع'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Checkout Simulator Modal */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-zinc-900 text-white p-6 text-center">
              <h3 className="text-lg font-bold mb-1">{lang === 'EN' ? 'Test Checkout' : 'تجربة الدفع'}</h3>
              <p className="text-zinc-400 text-sm">{countryData.name[lang]}</p>
            </div>
            
            <div className="p-6">
              {paymentStatus === 'completed' ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">{lang === 'EN' ? 'Payment Successful' : 'تم الدفع بنجاح'}</h3>
                  <p className="text-zinc-500 mb-8">150.00 {countryData.currency.EN} received</p>
                  <button 
                    onClick={() => setShowSimulator(false)}
                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors"
                  >
                    {lang === 'EN' ? 'Close' : 'إغلاق'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <p className="text-zinc-500 text-sm mb-1">{lang === 'EN' ? 'Amount Due' : 'المبلغ المطلوب'}</p>
                    <p className="text-3xl font-mono font-bold text-zinc-900 flex items-center justify-center gap-2">
                      150.00 <span className="text-lg text-zinc-400">{countryData.currency.EN}</span>
                    </p>
                  </div>

                  <button 
                    onClick={handleTestCheckout}
                    disabled={paymentStatus === 'processing'}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 mb-4"
                  >
                    {paymentStatus === 'processing' ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> {lang === 'EN' ? 'Processing...' : 'جاري المعالجة...'}</>
                    ) : (
                      <>{lang === 'EN' ? 'Pay Now' : 'ادفع الآن'}</>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => setShowSimulator(false)}
                    disabled={paymentStatus === 'processing'}
                    className="w-full py-3 text-zinc-500 hover:text-zinc-800 font-semibold transition-colors"
                  >
                    {lang === 'EN' ? 'Cancel' : 'إلغاء'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
