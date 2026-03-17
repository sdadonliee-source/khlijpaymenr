import { useState } from 'react';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function ShariaCompliance({ lang }: { lang: 'EN' | 'AR' }) {
  const [checklist, setChecklist] = useState([
    { id: 1, en: 'No Riba (Interest)', ar: 'خلو المعاملات من الربا', compliant: false },
    { id: 2, en: 'No Gharar (Uncertainty)', ar: 'خلو المعاملات من الغرر', compliant: false },
    { id: 3, en: 'No Haram Activities', ar: 'الاستثمار في أنشطة مباحة شرعاً', compliant: false },
    { id: 4, en: 'Zakat Compliance', ar: 'الالتزام بحساب وإخراج الزكاة', compliant: false },
  ]);
  const [reviewDate, setReviewDate] = useState('');

  const t = (key: string) => {
    const translations: any = {
      EN: { title: 'Sharia Compliance', date: 'Sharia Board Review Date', compliant: 'Compliant', nonCompliant: 'Non-Compliant' },
      AR: { title: 'الامتثال الشرعي', date: 'تاريخ مراجعة الهيئة الشرعية', compliant: 'متوافق', nonCompliant: 'غير متوافق' }
    };
    return translations[lang][key];
  };

  const toggleCompliance = (id: number) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, compliant: !item.compliant } : item));
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-zinc-200">
      <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8">{t('title')}</h2>
      <div className="mb-6 md:mb-8">
        <label className="block mb-2 text-xs md:text-sm font-semibold text-zinc-500 uppercase tracking-wider">{t('date')}:</label>
        <input type="date" className="p-3 border border-zinc-300 rounded-lg w-full" value={reviewDate} onChange={e => setReviewDate(e.target.value)} />
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
  );
}
