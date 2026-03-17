import { useState, useEffect } from 'react';
import { Bitcoin, ShieldCheck, Clock, Wallet, Key, Link2, Cpu, CheckCircle2, Lock, QrCode, Copy, Loader2, ArrowRight } from 'lucide-react';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function CryptoGateway({ lang, user }: { lang: 'EN' | 'AR', user: any }) {
  const [showSimulator, setShowSimulator] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'awaiting' | 'processing' | 'completed'>('awaiting');
  const [btcPrice, setBtcPrice] = useState<number | null>(null);

  useEffect(() => {
    // Fetch real BTC price
    fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
      .then(res => res.json())
      .then(data => {
        if (data && data.price) {
          setBtcPrice(parseFloat(data.price));
        }
      })
      .catch(err => console.error('Error fetching BTC price:', err));
  }, []);

  useEffect(() => {
    let timer: any;
    if (showSimulator && timeLeft > 0 && paymentStatus === 'awaiting') {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showSimulator, timeLeft, paymentStatus]);

  useEffect(() => {
    if (showSimulator) {
      // Simulate payment flow
      const processTimer = setTimeout(() => {
        setPaymentStatus('processing');
        const completeTimer = setTimeout(async () => {
          if (user) {
            try {
              const response = await fetch('/api/crypto/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.uid,
                  amount: 150.00,
                  currency: 'SAR',
                  method: 'USDT (TRC20)'
                })
              });
              
              if (response.ok) {
                setPaymentStatus('completed');
              } else {
                console.error('Crypto checkout failed');
                setPaymentStatus('awaiting');
              }
            } catch (error) {
              console.error('Error during crypto checkout:', error);
              setPaymentStatus('awaiting');
            }
          } else {
            setPaymentStatus('completed');
          }
        }, 3000);
        return () => clearTimeout(completeTimer);
      }, 5000);
      return () => clearTimeout(processTimer);
    } else {
      setPaymentStatus('awaiting');
      setTimeLeft(1800);
    }
  }, [showSimulator, user]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const t = (key: string) => {
    const translations: any = {
      EN: { 
        title: 'Yousef Pay Crypto',
        subtitle: 'Self-hosted, non-custodial crypto settlement gateway',
        assets: 'Supported Settlement Assets',
        network: 'Network',
        contract: 'Contract',
        format: 'Format',
        invoiceDefaults: 'Invoice Defaults',
        expiry: 'Expiry Time',
        minutes: 'minutes',
        confirmations: 'Required Confirmations',
        securityWallet: 'Security & Wallet Configuration',
        hdWallet: 'HD Wallet Type',
        mnemonic: 'Mnemonic Storage',
        encrypted: 'Encrypted in ENV',
        gapLimit: 'Gap Limit',
        apiKey: 'API Key Authentication',
        webhook: 'Webhook Secret',
        rateLimit: 'Rate Limiting',
        enabled: 'Enabled',
        fiatDisplay: 'Fiat Display Currencies',
        simulate: 'Test Checkout',
        payWith: 'Pay with',
        amountDue: 'Amount Due',
        sendExactly: 'Send exactly',
        address: 'Payment Address',
        awaiting: 'Awaiting Payment...',
        close: 'Close'
      },
      AR: { 
        title: 'خليج باي كريبتو',
        subtitle: 'بوابة تسوية رقمية ذاتية الاستضافة وغير حفظية',
        assets: 'أصول التسوية المدعومة',
        network: 'الشبكة',
        contract: 'العقد',
        format: 'الصيغة',
        invoiceDefaults: 'الافتراضيات للفواتير',
        expiry: 'وقت الصلاحية',
        minutes: 'دقيقة',
        confirmations: 'التأكيدات المطلوبة',
        securityWallet: 'إعدادات الأمان والمحفظة',
        hdWallet: 'نوع المحفظة',
        mnemonic: 'تخزين الكلمات المفتاحية',
        encrypted: 'مشفرة في البيئة',
        gapLimit: 'حد الفجوة (Gap Limit)',
        apiKey: 'مصادقة مفتاح API',
        webhook: 'سر الويب هوك (Webhook)',
        rateLimit: 'تقييد الطلبات (Rate Limiting)',
        enabled: 'مفعل',
        fiatDisplay: 'عملات العرض المحلية',
        simulate: 'تجربة الدفع',
        payWith: 'الدفع بواسطة',
        amountDue: 'المبلغ المطلوب',
        sendExactly: 'أرسل بالضبط',
        address: 'عنوان الدفع',
        awaiting: 'في انتظار الدفع...',
        close: 'إغلاق'
      }
    };
    return translations[lang][key];
  };

  const cryptoAssets = [
    { asset: 'BTC', network: 'Bitcoin', format: 'P2PKH', icon: <Bitcoin className="w-6 h-6 text-orange-500" /> },
    { asset: 'USDT', network: 'TRC20', contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', icon: <Cpu className="w-6 h-6 text-emerald-500" /> },
    { asset: 'USDT', network: 'ERC20', contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7', icon: <Cpu className="w-6 h-6 text-blue-500" /> },
    { asset: 'USDC', network: 'Polygon', contract: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', icon: <Cpu className="w-6 h-6 text-indigo-500" /> }
  ];

  const confirmations = [
    { network: 'Bitcoin', count: 2 },
    { network: 'TRC20', count: 19 },
    { network: 'ERC20', count: 12 },
    { network: 'Polygon', count: 64 }
  ];

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-zinc-200 relative">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl md:text-3xl font-bold">{t('title')}</h2>
            <span className="px-2.5 py-1 bg-zinc-900 text-white text-xs font-bold rounded-md">v1.0.0</span>
          </div>
          <p className="text-zinc-500">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="hidden md:flex px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-lg border border-emerald-200 items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Non-Custodial
          </span>
          <span className="hidden md:flex px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg border border-blue-200 items-center gap-1.5">
            <Lock className="w-4 h-4" /> Self-Hosted
          </span>
          <button 
            onClick={() => { setTimeLeft(1800); setShowSimulator(true); }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" /> {t('simulate')}
          </button>
        </div>
      </div>

      {/* Fiat Display */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 text-zinc-800">{t('fiatDisplay')}</h3>
        <div className="flex gap-2 flex-wrap">
          {['SAR', 'AED', 'KWD', 'QAR', 'BHD', 'OMR'].map(fiat => (
            <span key={fiat} className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg font-mono font-semibold border border-zinc-200">
              {fiat}
            </span>
          ))}
        </div>
      </div>

      {/* Crypto Assets */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 text-zinc-800">{t('assets')}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cryptoAssets.map((crypto, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {crypto.icon}
                  <span className="font-bold text-lg">{crypto.asset}</span>
                </div>
                <div className="flex items-center gap-2">
                  {crypto.asset === 'Bitcoin' && btcPrice && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                      ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                  <span className="px-2.5 py-1 bg-white border border-zinc-200 rounded-md text-xs font-bold text-zinc-600">
                    {crypto.network}
                  </span>
                </div>
              </div>
              {crypto.contract ? (
                <div className="text-sm">
                  <span className="text-zinc-500">{t('contract')}: </span>
                  <span className="font-mono text-xs break-all bg-white px-2 py-1 rounded border border-zinc-100">{crypto.contract}</span>
                </div>
              ) : (
                <div className="text-sm">
                  <span className="text-zinc-500">{t('format')}: </span>
                  <span className="font-mono text-xs bg-white px-2 py-1 rounded border border-zinc-100">{crypto.format}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Invoice Defaults */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-zinc-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-zinc-400" /> {t('invoiceDefaults')}
          </h3>
          <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-200">
              <span className="text-zinc-600 font-medium">{t('expiry')}</span>
              <span className="font-bold text-zinc-900">30 {t('minutes')}</span>
            </div>
            <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">{t('confirmations')}</h4>
            <div className="space-y-3">
              {confirmations.map(conf => (
                <div key={conf.network} className="flex justify-between items-center">
                  <span className="text-zinc-600">{conf.network}</span>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-zinc-200">{conf.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Wallet */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-zinc-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-zinc-400" /> {t('securityWallet')}
          </h3>
          <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 space-y-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-zinc-400" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-zinc-600 font-medium">{t('hdWallet')}</span>
                  <span className="font-mono text-sm">hd_wallet</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-zinc-500 text-sm">{t('gapLimit')}</span>
                  <span className="font-mono text-sm">20</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-zinc-200">
              <Key className="w-5 h-5 text-zinc-400" />
              <div className="flex-1 flex justify-between items-center">
                <span className="text-zinc-600 font-medium">{t('mnemonic')}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">{t('encrypted')}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-zinc-200">
              <Link2 className="w-5 h-5 text-zinc-400" />
              <div className="flex-1 flex justify-between items-center">
                <span className="text-zinc-600 font-medium">{t('webhook')}</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-zinc-200">
              <ShieldCheck className="w-5 h-5 text-zinc-400" />
              <div className="flex-1 flex justify-between items-center">
                <span className="text-zinc-600 font-medium">{t('apiKey')}</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-zinc-200">
              <Cpu className="w-5 h-5 text-zinc-400" />
              <div className="flex-1 flex justify-between items-center">
                <span className="text-zinc-600 font-medium">{t('rateLimit')}</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Simulator Modal */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-zinc-900 text-white p-6 text-center relative">
              <h3 className="text-lg font-bold mb-1">{t('payWith')} USDT</h3>
              <p className="text-zinc-400 text-sm">TRC20 Network</p>
              {paymentStatus !== 'completed' && (
                <div className="absolute top-4 right-4 bg-zinc-800 text-zinc-300 px-2 py-1 rounded font-mono text-sm flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
                </div>
              )}
            </div>
            
            {/* Body */}
            <div className="p-6">
              {paymentStatus === 'completed' ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">{t('completed')}</h3>
                  <p className="text-zinc-500 mb-8">40.00 USDT received</p>
                  <button 
                    onClick={() => setShowSimulator(false)}
                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {t('returnToMerchant')} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <p className="text-zinc-500 text-sm mb-1">{t('amountDue')} (150.00 SAR)</p>
                    <p className="text-3xl font-mono font-bold text-zinc-900 flex items-center justify-center gap-2">
                      40.00 <span className="text-lg text-zinc-400">USDT</span>
                    </p>
                  </div>

                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-white border-2 border-zinc-200 rounded-xl shadow-sm relative overflow-hidden">
                      <QrCode className="w-40 h-40 text-zinc-900" />
                      {paymentStatus === 'processing' && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('address')}</span>
                      <button 
                        onClick={() => handleCopy('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center gap-1"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="font-mono text-sm text-zinc-800 break-all bg-white p-2 rounded border border-zinc-200">
                      TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
                    </p>
                  </div>

                  <div className={`flex items-center justify-center gap-3 font-semibold py-3 rounded-xl border ${
                    paymentStatus === 'processing' 
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t(paymentStatus)}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {paymentStatus !== 'completed' && (
              <div className="p-4 border-t border-zinc-100 bg-zinc-50 text-center">
                <button 
                  onClick={() => setShowSimulator(false)}
                  className="text-zinc-500 hover:text-zinc-800 font-semibold transition-colors"
                >
                  {t('close')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
