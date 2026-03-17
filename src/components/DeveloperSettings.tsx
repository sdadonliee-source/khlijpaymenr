import { useState, useEffect } from 'react';
import { Key, Link2, Code, Copy, CheckCircle2, Plus, Trash2, Eye, EyeOff, CreditCard } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function DeveloperSettings({ lang, user }: { lang: 'EN' | 'AR', user: any }) {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState('');
  const [settings, setSettings] = useState<any>({
    apiKey: 'pk_live_8f92j3n4m5k6l7o8p9q0',
    webhookSecret: 'whsec_1a2b3c4d5e6f7g8h9i0j',
    webhookUrl: 'https://api.merchant.com/webhooks/khalijpay',
    bitcartUrl: '',
    bitcartApiKey: ''
  });

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const docRef = doc(db, 'developerSettings', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        // Initialize default settings
        const defaultSettings = {
          userId: user.uid,
          apiKey: `pk_live_${Math.random().toString(36).substring(2, 15)}`,
          webhookSecret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
          webhookUrl: '',
          updatedAt: new Date().toISOString()
        };
        await setDoc(docRef, defaultSettings);
        setSettings(defaultSettings);
      }
    };
    fetchSettings();
  }, [user]);

  const generateNewKey = async () => {
    if (!user) return;
    const newApiKey = `pk_live_${Math.random().toString(36).substring(2, 15)}`;
    const docRef = doc(db, 'developerSettings', user.uid);
    await updateDoc(docRef, {
      apiKey: newApiKey,
      updatedAt: new Date().toISOString()
    });
    setSettings({ ...settings, apiKey: newApiKey });
  };

  const updateWebhookUrl = async (url: string) => {
    if (!user) return;
    const docRef = doc(db, 'developerSettings', user.uid);
    await updateDoc(docRef, {
      webhookUrl: url,
      updatedAt: new Date().toISOString()
    });
    setSettings({ ...settings, webhookUrl: url });
  };

  const t = (key: string) => {
    const translations: any = {
      EN: { 
        title: 'Developer Settings',
        subtitle: 'Manage API keys, webhooks, and integration settings',
        apiKeys: 'API Keys',
        webhooks: 'Webhooks',
        docs: 'API Documentation',
        publicKey: 'API Key',
        secretKey: 'Webhook Secret',
        generateNew: 'Generate New Key',
        endpointUrl: 'Endpoint URL',
        addWebhook: 'Save Webhook',
        events: 'Events to send',
        bitcart: 'Bitcart Integration',
        bitcartUrl: 'Bitcart URL',
        bitcartApiKey: 'Bitcart API Key',
        saveBitcart: 'Save Bitcart Settings',
      },
      AR: { 
        title: 'إعدادات المطورين',
        subtitle: 'إدارة مفاتيح API، الويب هوك، وإعدادات الربط',
        apiKeys: 'مفاتيح API',
        webhooks: 'الويب هوك (Webhooks)',
        docs: 'مستندات API',
        publicKey: 'مفتاح API',
        secretKey: 'سر الويب هوك',
        generateNew: 'إنشاء مفتاح جديد',
        endpointUrl: 'رابط الاستقبال (Endpoint)',
        addWebhook: 'حفظ الويب هوك',
        events: 'الأحداث المرسلة',
        active: 'نشط',
        copied: 'تم النسخ!',
        bitcart: 'ربط Bitcart',
        bitcartUrl: 'رابط Bitcart',
        bitcartApiKey: 'مفتاح API لـ Bitcart',
        saveBitcart: 'حفظ إعدادات Bitcart',
      }
    };
    return translations[lang][key];
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-zinc-200">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('title')}</h2>
        <p className="text-zinc-500">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Keys */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-500" /> {t('apiKeys')}
            </h3>
            <button onClick={generateNewKey} className="text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-700">
              <Plus className="w-4 h-4" /> {t('generateNew')}
            </button>
          </div>
          
          <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-600 mb-1">{t('publicKey')}</label>
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200">
                <code className="flex-1 text-sm text-zinc-800 font-mono truncate">{settings.apiKey}</code>
                <button onClick={() => handleCopy(settings.apiKey, 'public')} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors">
                  {copied === 'public' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-zinc-600 mb-1">{t('secretKey')}</label>
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200">
                <code className="flex-1 text-sm text-zinc-800 font-mono truncate">
                  {showSecret ? settings.webhookSecret : 'whsec_••••••••••••••••••••'}
                </code>
                <button onClick={() => setShowSecret(!showSecret)} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors">
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => handleCopy(settings.webhookSecret, 'secret')} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors">
                  {copied === 'secret' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Webhooks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-500" /> {t('webhooks')}
            </h3>
          </div>

          <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200">
            <div className="flex flex-col gap-3 mb-3">
              <label className="block text-sm font-semibold text-zinc-600">{t('endpointUrl')}</label>
              <div className="flex items-center gap-2">
                <input 
                  type="url" 
                  className="flex-1 p-2.5 border border-zinc-300 rounded-lg text-sm" 
                  value={settings.webhookUrl || ''} 
                  onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                  placeholder="https://api.merchant.com/webhooks"
                />
                <button 
                  onClick={() => updateWebhookUrl(settings.webhookUrl)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
                >
                  {t('addWebhook')}
                </button>
              </div>
            </div>
            <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">{t('events')}</p>
                <p className="text-sm text-zinc-700">invoice.paid, invoice.expired, transaction.confirmed</p>
              </div>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/webhooks/trigger', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user.uid,
                        event: 'test.ping',
                        payload: { message: 'Test webhook from KhalijPay', timestamp: new Date().toISOString() }
                      })
                    });
                    if (res.ok) alert('Test webhook sent successfully!');
                    else alert('Failed to send test webhook. Check your URL.');
                  } catch (e) {
                    alert('Error sending test webhook.');
                  }
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Test Webhook
              </button>
            </div>
          </div>
        </div>

        {/* Bitcart Integration (Internal) */}
        <div className="mt-8 lg:col-span-2">
          <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-emerald-500" /> {t('bitcart')}
          </h3>
          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <p className="font-bold text-emerald-900">Internal Bitcart Engine Active</p>
            </div>
            <p className="text-sm text-emerald-700">
              The Bitcart payment processing engine is now fully integrated into your application. 
              No external API or configuration is required. All stores, wallets, and invoices are managed locally.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Docs */}
      <div className="mt-8 pt-8 border-t border-zinc-200">
        <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2 mb-4">
          <Code className="w-5 h-5 text-zinc-400" /> {t('docs')}
        </h3>
        <div className="bg-zinc-900 rounded-xl p-4 overflow-x-auto" dir="ltr">
          <pre className="text-sm text-emerald-400 font-mono">
{`curl -X POST https://api.khalijpay.com/v1/invoices \\
  -H "Authorization: Bearer ${settings.webhookSecret}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 150.00,
    "currency": "SAR",
    "settlement_asset": "USDT",
    "network": "TRC20"
  }'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
