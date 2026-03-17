import { useState } from 'react';
import { GCC_COUNTRIES } from '../constants';
import { Building2, CreditCard, Wallet, CheckCircle2, Circle } from 'lucide-react';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function PaymentGateway({ lang }: { lang: 'EN' | 'AR' }) {
  const [selectedCountry, setSelectedCountry] = useState('SA');
  const [linkedMethods, setLinkedMethods] = useState<Record<string, boolean>>({
    'SA-mada': true,
    'SA-stcpay': true,
    'AE-applepay': true,
  });

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
    </div>
  );
}
