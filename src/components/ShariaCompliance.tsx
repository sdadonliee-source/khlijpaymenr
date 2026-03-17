import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle2 } from 'lucide-react';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function ShariaCompliance({ lang, user }: { lang: 'EN' | 'AR', user: any }) {
  const [checklist, setChecklist] = useState([
    { id: 1, en: 'No Riba (Interest)', ar: 'خلو المعاملات من الربا', compliant: false },
    { id: 2, en: 'No Gharar (Uncertainty)', ar: 'خلو المعاملات من الغرر', compliant: false },
    { id: 3, en: 'No Haram Activities', ar: 'الاستثمار في أنشطة مباحة شرعاً', compliant: false },
    { id: 4, en: 'Zakat Compliance', ar: 'الالتزام بحساب وإخراج الزكاة', compliant: false },
  ]);
  const [reviewDate, setReviewDate] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchCompliance = async () => {
      const docRef = doc(db, 'shariaCompliance', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.checklist) setChecklist(data.checklist);
        if (data.reviewDate) setReviewDate(data.reviewDate);
      }
    };
    fetchCompliance();
  }, [user]);

  const saveCompliance = async (newChecklist: any, newDate: string) => {
    if (!user) return;
    const docRef = doc(db, 'shariaCompliance', user.uid);
    await setDoc(docRef, {
      userId: user.uid,
      checklist: newChecklist,
      reviewDate: newDate,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const t = (key: string) => {
    const translations: any = {
      EN: { title: 'Sharia Compliance', date: 'Sharia Board Review Date', compliant: 'Compliant', nonCompliant: 'Non-Compliant' },
      AR: { title: 'الامتثال الشرعي', date: 'تاريخ مراجعة الهيئة الشرعية', compliant: 'متوافق', nonCompliant: 'غير متوافق' }
    };
    return translations[lang][key];
  };

  const toggleCompliance = (id: number) => {
    const newChecklist = checklist.map(item => item.id === id ? { ...item, compliant: !item.compliant } : item);
    setChecklist(newChecklist);
    saveCompliance(newChecklist, reviewDate);
  };

  const handleDateChange = (e: any) => {
    const newDate = e.target.value;
    setReviewDate(newDate);
    saveCompliance(checklist, newDate);
  };

  const [zakatAmount, setZakatAmount] = useState<number>(0);
  const [zakatResult, setZakatResult] = useState<number | null>(null);

  const calculateZakat = () => {
    // Standard Zakat is 2.5% of total wealth above Nisab
    const result = zakatAmount * 0.025;
    setZakatResult(result);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8">{t('title')}</h2>
        <div className="mb-6 md:mb-8">
          <label className="block mb-2 text-xs md:text-sm font-semibold text-zinc-500 uppercase tracking-wider">{t('date')}:</label>
          <input type="date" className="p-3 border border-zinc-300 rounded-lg w-full" value={reviewDate} onChange={handleDateChange} />
        </div>
        <div className="space-y-4">
          {checklist.map(item => (
            <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 md:p-6 border border-zinc-200 rounded-xl hover:bg-zinc-50 gap-4">
              <span className="font-medium text-sm md:text-base">{lang === 'EN' ? item.en : item.ar}</span>
              <button 
                onClick={() => toggleCompliance(item.id)}
                className={`w-full sm:w-auto px-6 py-2 rounded-lg font-semibold text-sm md:text-base ${item.compliant ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
              >
                {item.compliant ? t('compliant') : t('nonCompliant')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Zakat Calculator */}
      <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8">{lang === 'EN' ? 'Zakat Calculator' : 'حاسبة الزكاة'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{lang === 'EN' ? 'Total Wealth (SAR)' : 'إجمالي الثروة (ريال)'}</label>
            <input 
              type="number" 
              className="p-3 border border-zinc-300 rounded-lg" 
              value={zakatAmount} 
              onChange={(e) => setZakatAmount(Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={calculateZakat}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
            >
              {lang === 'EN' ? 'Calculate Zakat' : 'احسب الزكاة'}
            </button>
          </div>
        </div>
        {zakatResult !== null && (
          <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
            <p className="text-xs md:text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-1">{lang === 'EN' ? 'Zakat Due' : 'الزكاة المستحقة'}</p>
            <p className="font-mono text-2xl md:text-3xl font-bold text-emerald-900">{zakatResult.toLocaleString()} {lang === 'EN' ? 'SAR' : 'ريال'}</p>
            <p className="mt-2 text-xs text-emerald-600">{lang === 'EN' ? 'Calculated at 2.5% of total wealth.' : 'تم الحساب بنسبة 2.5% من إجمالي الثروة.'}</p>
          </div>
        )}
      </div>
      {/* Sharia Board Certificate */}
      <div className="bg-zinc-900 p-8 md:p-12 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{lang === 'EN' ? 'Sharia Compliance Certificate' : 'شهادة الامتثال الشرعي'}</h2>
          <p className="text-zinc-400 max-w-lg mx-auto mb-8 text-sm md:text-base">
            {lang === 'EN' 
              ? 'This merchant has been verified to adhere to Islamic finance principles, including no-interest transactions and ethical investment standards.' 
              : 'تم التحقق من التزام هذا التاجر بمبادئ التمويل الإسلامي، بما في ذلك المعاملات الخالية من الربا ومعايير الاستثمار الأخلاقية.'}
          </p>
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{lang === 'EN' ? 'Certificate ID' : 'رقم الشهادة'}</p>
              <p className="font-mono text-emerald-400">KP-SH-2026-8842</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{lang === 'EN' ? 'Status' : 'الحالة'}</p>
              <p className="text-emerald-400 font-bold uppercase">{lang === 'EN' ? 'Active' : 'نشط'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
