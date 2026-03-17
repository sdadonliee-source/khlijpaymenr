/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import Transactions from './components/Transactions';
import ShariaCompliance from './components/ShariaCompliance';
import CurrencyConverter from './components/CurrencyConverter';
import PaymentGateway from './components/PaymentGateway';
import NfcPayment from './components/NfcPayment';
import Orders from './components/Orders';
import BitcartHub from './components/BitcartHub';
import DeveloperSettings from './components/DeveloperSettings';
import { LANGUAGES } from './constants';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [lang, setLang] = useState<'EN' | 'AR'>('EN');
  const [user, setUser] = useState<any>(null);
  const [storeId, setStoreId] = useState<string>('default-store'); // Simplified for now
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalVolume: 'Loading...',
    activeTransactions: 'Loading...',
    complianceStatus: 'Loading...'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Check if user exists in Firestore, if not create
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            role: 'merchant',
            createdAt: new Date().toISOString()
          });
        }
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [chartData, setChartData] = useState<any[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  useEffect(() => {
    if (view === 'dashboard' && user) {
      const q = query(collection(db, 'transactions'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let volume = 0;
        let active = 0;
        
        // Group by date for chart
        const dailyVolume: Record<string, number> = {};
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'completed') {
            volume += data.amount;
            
            // Extract day of week from date
            if (data.date) {
              const dateObj = new Date(data.date);
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              dailyVolume[dayName] = (dailyVolume[dayName] || 0) + data.amount;
            }
          }
          if (data.status === 'pending') {
            active += 1;
          }
        });
        
        // Format chart data
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const newChartData = days.map(day => ({
          name: day,
          volume: dailyVolume[day] || 0
        }));
        
        setChartData(newChartData);

        setDashboardData({
          totalVolume: formatCurrency(volume),
          activeTransactions: active.toString(),
          complianceStatus: 'Compliant'
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'transactions');
      });
      return () => unsubscribe();
    }
  }, [view, user]);

  const t = (key: string) => {
    const translations: any = {
      EN: {
        dashboard: 'Dashboard',
        transactions: 'Transactions',
        compliance: 'Compliance',
        shariaCompliance: 'Sharia Compliance',
        gateway: 'Payment Gateway',
        cryptoGateway: 'Crypto Hub',
        nfcPayment: 'NFC Payment',
        orders: 'Orders',
        developers: 'Developers',
        welcome: 'Welcome to your unified gateway',
        totalVolume: 'Total Volume (GCC)',
        activeTransactions: 'Active Transactions',
        complianceStatus: 'Compliance Status',
        yousefPay: 'Yousef Pay',
        weeklyVolume: 'Weekly Volume Trend',
        login: 'Sign in with Google',
        logout: 'Sign Out',
        loginSubtitle: 'Merchant Portal Login'
      },
      AR: {
        dashboard: 'لوحة التحكم',
        transactions: 'المعاملات',
        compliance: 'الامتثال',
        shariaCompliance: 'الامتثال الشرعي',
        gateway: 'بوابة الدفع',
        cryptoGateway: 'مركز الكريبتو',
        nfcPayment: 'الدفع عبر NFC',
        orders: 'الطلبات',
        developers: 'المطورين',
        welcome: 'مرحباً بك في بوابتك الموحدة',
        totalVolume: 'إجمالي الحجم (الخليج)',
        activeTransactions: 'المعاملات النشطة',
        complianceStatus: 'حالة الامتثال',
        yousefPay: 'يوسف باي',
        weeklyVolume: 'اتجاه الحجم الأسبوعي',
        login: 'تسجيل الدخول بواسطة جوجل',
        logout: 'تسجيل الخروج',
        loginSubtitle: 'تسجيل الدخول لبوابة التجار'
      }
    };
    return translations[lang][key];
  };

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-100"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div></div>;
  }

  if (!user) {
    return (
      <div dir={LANGUAGES[lang].dir} className="min-h-screen bg-zinc-100 flex items-center justify-center font-sans p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-zinc-200">
          <div className="w-16 h-16 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-2xl font-bold italic">K</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-zinc-900">{t('yousefPay')}</h1>
          <p className="text-zinc-500 mb-8">{t('loginSubtitle')}</p>
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('login')}
          </button>
          <button className="mt-6 text-sm text-zinc-500 hover:text-zinc-800 font-semibold" onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')}>
            {lang === 'EN' ? 'العربية' : 'English'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir={LANGUAGES[lang].dir} className="min-h-screen bg-zinc-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-zinc-950 text-zinc-100 p-4 md:p-6 flex flex-col md:min-h-screen shrink-0 z-10 shadow-xl">
        <div className="flex justify-between items-center mb-4 md:mb-10">
          <h1 className="text-2xl font-bold italic text-white cursor-pointer" onClick={() => setView('dashboard')}>{t('yousefPay')}</h1>
          <button className="md:hidden px-3 py-1 bg-zinc-800 rounded-lg text-sm font-bold" onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')}>
            {lang === 'EN' ? 'ع' : 'EN'}
          </button>
        </div>
        <nav className="flex flex-row md:flex-col gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button className={`whitespace-nowrap text-left px-4 py-2 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`} onClick={() => setView('dashboard')}>{t('dashboard')}</button>
          <button className={`whitespace-nowrap text-left px-4 py-2 rounded-lg transition-colors ${view === 'transactions' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`} onClick={() => setView('transactions')}>{t('transactions')}</button>
          <button className={`whitespace-nowrap text-left px-4 py-2 rounded-lg transition-colors ${view === 'gateway' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`} onClick={() => setView('gateway')}>{t('gateway')}</button>
          <button className={`whitespace-nowrap text-left px-4 py-2 rounded-lg transition-colors ${view === 'crypto' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`} onClick={() => setView('crypto')}>{t('cryptoGateway')}</button>
          <button className={`whitespace-nowrap text-left px-4 py-2 rounded-lg transition-colors ${view === 'nfc' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`} onClick={() => setView('nfc')}>{t('nfcPayment')}</button>
          <button className={`whitespace-nowrap text-left px-4 py-2 rounded-lg transition-colors ${view === 'orders' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`} onClick={() => setView('orders')}>{t('orders')}</button>
          <button className={`whitespace-nowrap text-left px-4 py-2 rounded-lg transition-colors ${view === 'compliance' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`} onClick={() => setView('compliance')}>{t('shariaCompliance')}</button>
          <button className={`whitespace-nowrap text-left px-4 py-2 rounded-lg transition-colors ${view === 'developers' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`} onClick={() => setView('developers')}>{t('developers')}</button>
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <button className="hidden md:block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg font-bold" onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')}>
            {lang === 'EN' ? 'العربية' : 'English'}
          </button>
          <button className="hidden md:block px-4 py-2 text-zinc-400 hover:text-white transition-colors rounded-lg font-bold text-sm" onClick={handleLogout}>
            {t('logout')}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-10 overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-7xl mx-auto"
          >
            {view === 'dashboard' && (
              <>
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-zinc-900">{t('welcome')}</h2>
                  <button className="md:hidden text-zinc-500 font-bold text-sm" onClick={handleLogout}>{t('logout')}</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 hover:shadow-md transition-shadow">
                    <h3 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">{t('totalVolume')}</h3>
                    <p className="font-mono text-2xl md:text-3xl mt-2 text-zinc-900">{dashboardData.totalVolume}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 hover:shadow-md transition-shadow">
                    <h3 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">{t('activeTransactions')}</h3>
                    <p className="font-mono text-2xl md:text-3xl mt-2 text-zinc-900">{dashboardData.activeTransactions}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 sm:col-span-2 md:col-span-1 hover:shadow-md transition-shadow">
                    <h3 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">{t('complianceStatus')}</h3>
                    <p className={`font-bold text-xl md:text-2xl mt-2 ${dashboardData.complianceStatus === 'Compliant' ? 'text-emerald-600' : 'text-amber-600'}`}>{dashboardData.complianceStatus}</p>
                  </div>
                </div>

                {/* Merchant Profile & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-900 font-bold text-xl">
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">{user.email}</h3>
                        <p className="text-sm text-zinc-500">Merchant ID: <span className="font-mono">{user.uid.substring(0, 8)}...</span></p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Account Status</p>
                        <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Active
                        </p>
                      </div>
                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Region</p>
                        <p className="text-sm font-bold text-zinc-900">GCC / Middle East</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-2">Quick Actions</h3>
                      <p className="text-zinc-400 text-sm mb-6">Manage your gateway operations instantly.</p>
                    </div>
                    <div className="space-y-3">
                      <button onClick={() => setView('gateway')} className="w-full py-2.5 bg-white text-zinc-900 rounded-lg font-bold text-sm hover:bg-zinc-100 transition-colors">New Payment</button>
                      <button onClick={() => setView('developers')} className="w-full py-2.5 bg-zinc-800 text-white rounded-lg font-bold text-sm hover:bg-zinc-700 transition-colors border border-zinc-700">API Keys</button>
                    </div>
                  </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 mb-8">
                  <h3 className="text-lg font-bold mb-6 text-zinc-800">{t('weeklyVolume')}</h3>
                  <div className="h-[300px] w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#18181b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dx={-10} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#18181b', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="volume" stroke="#18181b" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <CurrencyConverter lang={lang} />

                {/* Recent Orders Section */}
                <div className="mt-8">
                  <Orders lang={lang} user={user} />
                </div>
              </>
            )}
            {view === 'transactions' && <Transactions lang={lang} user={user} />}
            {view === 'gateway' && <PaymentGateway lang={lang} user={user} />}
            {view === 'crypto' && <BitcartHub lang={lang} user={user} />}
            {view === 'nfc' && <NfcPayment user={user} storeId={storeId} amount={100} currency="BTC" />}
            {view === 'orders' && <Orders lang={lang} user={user} />}
            {view === 'compliance' && <ShariaCompliance lang={lang} user={user} />}
            {view === 'developers' && <DeveloperSettings lang={lang} user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
