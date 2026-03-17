/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Transactions from './components/Transactions';
import ShariaCompliance from './components/ShariaCompliance';
import CurrencyConverter from './components/CurrencyConverter';
import PaymentGateway from './components/PaymentGateway';
import { LANGUAGES } from './constants';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [lang, setLang] = useState<'EN' | 'AR'>('EN');
  const [dashboardData, setDashboardData] = useState({
    totalVolume: 'Loading...',
    activeTransactions: 'Loading...',
    complianceStatus: 'Loading...'
  });

  useEffect(() => {
    if (view === 'dashboard') {
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => setDashboardData(data))
        .catch(err => console.error('Error fetching dashboard data:', err));
    }
  }, [view]);

  const t = (key: string) => {
    const translations: any = {
      EN: {
        dashboard: 'Dashboard',
        transactions: 'Transactions',
        compliance: 'Compliance',
        shariaCompliance: 'Sharia Compliance',
        gateway: 'Payment Gateway',
        welcome: 'Welcome to your unified gateway',
        totalVolume: 'Total Volume (GCC)',
        activeTransactions: 'Active Transactions',
        complianceStatus: 'Compliance Status',
        khalijPay: 'KhalijPay'
      },
      AR: {
        dashboard: 'لوحة التحكم',
        transactions: 'المعاملات',
        compliance: 'الامتثال',
        shariaCompliance: 'الامتثال الشرعي',
        gateway: 'بوابة الدفع',
        welcome: 'مرحباً بك في بوابتك الموحدة',
        totalVolume: 'إجمالي الحجم (الخليج)',
        activeTransactions: 'المعاملات النشطة',
        complianceStatus: 'حالة الامتثال',
        khalijPay: 'خليج باي'
      }
    };
    return translations[lang][key];
  };

  return (
    <div dir={LANGUAGES[lang].dir} className="min-h-screen bg-zinc-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-zinc-950 text-zinc-100 p-4 md:p-6 flex flex-col md:min-h-screen shrink-0">
        <div className="flex justify-between items-center mb-4 md:mb-10">
          <h1 className="text-2xl font-bold italic text-white cursor-pointer" onClick={() => setView('dashboard')}>{t('khalijPay')}</h1>
          <button className="md:hidden px-3 py-1 bg-zinc-800 rounded-lg text-sm font-bold" onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')}>
            {lang === 'EN' ? 'ع' : 'EN'}
          </button>
        </div>
        <nav className="flex flex-row md:flex-col gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button className={`whitespace-nowrap text-left px-4 py-2 rounded-lg ${view === 'dashboard' ? 'bg-zinc-800' : 'hover:bg-zinc-800'}`} onClick={() => setView('dashboard')}>{t('dashboard')}</button>
          <button className={`whitespace-nowrap text-left px-4 py-2 rounded-lg ${view === 'transactions' ? 'bg-zinc-800' : 'hover:bg-zinc-800'}`} onClick={() => setView('transactions')}>{t('transactions')}</button>
          <button className={`whitespace-nowrap text-left px-4 py-2 rounded-lg ${view === 'gateway' ? 'bg-zinc-800' : 'hover:bg-zinc-800'}`} onClick={() => setView('gateway')}>{t('gateway')}</button>
          <button className={`whitespace-nowrap text-left px-4 py-2 rounded-lg ${view === 'compliance' ? 'bg-zinc-800' : 'hover:bg-zinc-800'}`} onClick={() => setView('compliance')}>{t('shariaCompliance')}</button>
        </nav>
        <button className="hidden md:block mt-auto px-4 py-2 bg-zinc-800 rounded-lg font-bold" onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')}>
          {lang === 'EN' ? 'العربية' : 'English'}
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
        {view === 'dashboard' && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">{t('welcome')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                <h3 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">{t('totalVolume')}</h3>
                <p className="font-mono text-2xl md:text-3xl mt-2">{dashboardData.totalVolume}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                <h3 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">{t('activeTransactions')}</h3>
                <p className="font-mono text-2xl md:text-3xl mt-2">{dashboardData.activeTransactions}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 sm:col-span-2 md:col-span-1">
                <h3 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">{t('complianceStatus')}</h3>
                <p className={`font-bold text-xl md:text-2xl mt-2 ${dashboardData.complianceStatus === 'Compliant' ? 'text-emerald-600' : 'text-amber-600'}`}>{dashboardData.complianceStatus}</p>
              </div>
            </div>
            <CurrencyConverter lang={lang} />
          </>
        )}
        {view === 'transactions' && <Transactions lang={lang} />}
        {view === 'gateway' && <PaymentGateway lang={lang} />}
        {view === 'compliance' && <ShariaCompliance lang={lang} />}
      </main>
    </div>
  );
}
