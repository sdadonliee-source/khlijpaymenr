import { useState } from 'react';
import { GCC_COUNTRIES } from '../constants';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function CurrencyConverter({ lang }: { lang: 'EN' | 'AR' }) {
  const [amount, setAmount] = useState(0);
  const [from, setFrom] = useState('SAR');
  const [to, setTo] = useState('AED');
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (key: string) => {
    const translations: any = {
      EN: { title: 'Currency Converter', amount: 'Amount', from: 'From', to: 'To', convert: 'Convert', result: 'Result', loading: 'Converting...', error: 'Error fetching rates' },
      AR: { title: 'محول العملات', amount: 'المبلغ', from: 'من', to: 'إلى', convert: 'تحويل', result: 'النتيجة', loading: 'جاري التحويل...', error: 'خطأ في جلب أسعار الصرف' }
    };
    return translations[lang][key];
  };

  const handleConvert = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const rate = data.rates[to];
      if (rate) {
        setResult(amount * rate);
      } else {
        throw new Error('Rate not found');
      }
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const getCurrencyLabel = (currencyCode: string) => {
    const country = Object.values(GCC_COUNTRIES).find(c => c.currency.EN === currencyCode);
    return country ? country.currency[lang] : currencyCode;
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-zinc-200 mt-6 md:mt-8">
      <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8">{t('title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        <input type="number" placeholder={t('amount')} className="p-3 border border-zinc-300 rounded-lg" value={amount} onChange={e => setAmount(Number(e.target.value))} />
        <div className="flex flex-col sm:flex-row gap-2">
          <select className="p-3 border border-zinc-300 rounded-lg flex-1" value={from} onChange={e => setFrom(e.target.value)}>
            {Object.keys(GCC_COUNTRIES).map(c => <option key={c} value={(GCC_COUNTRIES as any)[c].currency.EN}>{(GCC_COUNTRIES as any)[c].currency[lang]}</option>)}
          </select>
          <select className="p-3 border border-zinc-300 rounded-lg flex-1" value={to} onChange={e => setTo(e.target.value)}>
            {Object.keys(GCC_COUNTRIES).map(c => <option key={c} value={(GCC_COUNTRIES as any)[c].currency.EN}>{(GCC_COUNTRIES as any)[c].currency[lang]}</option>)}
          </select>
        </div>
      </div>
      <button 
        onClick={handleConvert} 
        disabled={loading}
        className="w-full px-6 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white rounded-lg font-semibold transition-colors"
      >
        {loading ? t('loading') : t('convert')}
      </button>
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center font-semibold">
          {error}
        </div>
      )}
      {result !== null && !error && (
        <div className="mt-6 p-4 bg-zinc-100 rounded-xl text-center">
          <p className="text-xs md:text-sm font-semibold text-zinc-500 uppercase tracking-wider">{t('result')}</p>
          <p className="font-mono text-xl md:text-2xl mt-1">{result.toFixed(2)} {getCurrencyLabel(to)}</p>
        </div>
      )}
    </div>
  );
}
