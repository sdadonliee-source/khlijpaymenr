import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { GCC_COUNTRIES } from '../constants';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

function NewTransactionForm({ onAdd, lang }: { onAdd: (txn: any) => void, lang: 'EN' | 'AR' }) {
  const [formData, setFormData] = useState({
    id: '', merchant: '', amount: 0, currency: 'SAR', type: 'payment', status: 'completed', date: '', timestamp: '', notes: '', paymentMethod: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...formData, amount: Number(formData.amount) });
    setFormData({ id: '', merchant: '', amount: 0, currency: 'SAR', type: 'payment', status: 'completed', date: '', timestamp: '', notes: '', paymentMethod: '' });
  };

  const t = (key: string) => {
    const translations: any = {
      EN: { title: 'New Transaction', id: 'ID', merchant: 'Merchant', amount: 'Amount', currency: 'Currency', type: 'Type', status: 'Status', date: 'Date', timestamp: 'Timestamp', notes: 'Notes (Optional)', add: 'Add Transaction', payment: 'Payment', deposit: 'Deposit', withdrawal: 'Withdrawal', completed: 'Completed', pending: 'Pending', failed: 'Failed', paymentMethod: 'Payment Method' },
      AR: { title: 'معاملة جديدة', id: 'المعرف', merchant: 'التاجر', amount: 'المبلغ', currency: 'العملة', type: 'النوع', status: 'الحالة', date: 'التاريخ', timestamp: 'الوقت', notes: 'ملاحظات (اختياري)', add: 'إضافة معاملة', payment: 'دفع', deposit: 'إيداع', withdrawal: 'سحب', completed: 'مكتملة', pending: 'معلقة', failed: 'فاشلة', paymentMethod: 'طريقة الدفع' }
    };
    return translations[lang][key];
  };

  const getPaymentMethods = () => {
    const country = Object.values(GCC_COUNTRIES).find(c => c.currency.EN === formData.currency);
    return country ? country.paymentMethods[lang] : [];
  };

  const getCurrencyLabel = (currencyCode: string) => {
    const country = Object.values(GCC_COUNTRIES).find(c => c.currency.EN === currencyCode);
    return country ? country.currency[lang] : currencyCode;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-zinc-200 mb-6 md:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <h3 className="col-span-1 md:col-span-2 text-xl font-bold mb-2">{t('title')}</h3>
      <input required placeholder={t('id')} className="p-3 border border-zinc-300 rounded-lg" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} />
      <input required placeholder={t('merchant')} className="p-3 border border-zinc-300 rounded-lg" value={formData.merchant} onChange={e => setFormData({...formData, merchant: e.target.value})} />
      <div className="flex flex-col sm:flex-row gap-2">
        <input required type="number" placeholder={t('amount')} className="flex-1 p-3 border border-zinc-300 rounded-lg" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
        <select className="p-3 border border-zinc-300 rounded-lg sm:w-1/3" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value, paymentMethod: ''})}>
          {Object.keys(GCC_COUNTRIES).map(c => <option key={c} value={(GCC_COUNTRIES as any)[c].currency.EN}>{(GCC_COUNTRIES as any)[c].currency[lang]}</option>)}
        </select>
      </div>
      <select className="p-3 border border-zinc-300 rounded-lg" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
        <option value="">{t('paymentMethod')}</option>
        {getPaymentMethods().map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select className="p-3 border border-zinc-300 rounded-lg" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
        {['payment', 'deposit', 'withdrawal'].map(tKey => <option key={tKey} value={tKey}>{t(tKey)}</option>)}
      </select>
      <select className="p-3 border border-zinc-300 rounded-lg" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
        {['completed', 'pending', 'failed'].map(sKey => <option key={sKey} value={sKey}>{t(sKey)}</option>)}
      </select>
      <input required type="date" className="p-3 border border-zinc-300 rounded-lg" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
      <input required type="time" className="p-3 border border-zinc-300 rounded-lg" value={formData.timestamp} onChange={e => setFormData({...formData, timestamp: e.target.value})} />
      <input placeholder={t('notes')} className="col-span-1 md:col-span-2 p-3 border border-zinc-300 rounded-lg" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
      <button type="submit" className="col-span-1 md:col-span-2 px-6 py-3 bg-zinc-900 text-white rounded-lg font-semibold">{t('add')}</button>
    </form>
  );
}

export default function Transactions({ lang }: { lang: 'EN' | 'AR' }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    fetch('/api/records')
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(err => console.error('Error fetching transactions:', err));
  }, []);

  const t = (key: string) => {
    const translations: any = {
      EN: { title: 'Recent Transactions', search: 'Search...', id: 'ID', merchant: 'Merchant', amount: 'Amount', currency: 'Currency', type: 'Type', status: 'Status', date: 'Date', timestamp: 'Timestamp', prev: 'Prev', next: 'Next', page: 'Page', details: 'Transaction Details', notes: 'Notes', close: 'Close', payment: 'Payment', deposit: 'Deposit', withdrawal: 'Withdrawal', completed: 'Completed', pending: 'Pending', failed: 'Failed', paymentMethod: 'Payment Method', of: 'of' },
      AR: { title: 'المعاملات الأخيرة', search: 'بحث...', id: 'المعرف', merchant: 'التاجر', amount: 'المبلغ', currency: 'العملة', type: 'النوع', status: 'الحالة', date: 'التاريخ', timestamp: 'الوقت', prev: 'السابق', next: 'التالي', page: 'صفحة', details: 'تفاصيل المعاملة', notes: 'ملاحظات', close: 'إغلاق', payment: 'دفع', deposit: 'إيداع', withdrawal: 'سحب', completed: 'مكتملة', pending: 'معلقة', failed: 'فاشلة', paymentMethod: 'طريقة الدفع', of: 'من' }
    };
    return translations[lang][key];
  };

  const handleAddTransaction = (newTxn: any) => {
    setTransactions([newTxn, ...transactions]);
  };

  const handleSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getCurrencyLabel = (currencyCode: string) => {
    const country = Object.values(GCC_COUNTRIES).find(c => c.currency.EN === currencyCode);
    return country ? country.currency[lang] : currencyCode;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn: any) =>
      txn.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.amount.toString().includes(searchTerm)
    );
  }, [transactions, searchTerm]);

  const sortedTransactions = useMemo(() => {
    const sortableTransactions = [...filteredTransactions];
    sortableTransactions.sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableTransactions;
  }, [filteredTransactions, sortConfig]);

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = sortedTransactions.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div>
      <NewTransactionForm onAdd={handleAddTransaction} lang={lang} />
      <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-zinc-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold">{t('title')}</h2>
          <input
            type="text"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-zinc-300 rounded-lg text-sm"
          />
        </div>
        <div className="w-full">
          <div className="hidden md:grid md:grid-cols-9 gap-4 text-xs font-semibold uppercase text-zinc-500 tracking-wider border-b border-zinc-200 pb-4 mb-2">
            <div className="cursor-pointer" onClick={() => handleSort('id')}>{t('id')}</div>
            <div className="cursor-pointer" onClick={() => handleSort('merchant')}>{t('merchant')}</div>
            <div className="cursor-pointer" onClick={() => handleSort('amount')}>{t('amount')}</div>
            <div>{t('currency')}</div>
            <div>{t('type')}</div>
            <div>{t('status')}</div>
            <div>{t('paymentMethod')}</div>
            <div className="cursor-pointer" onClick={() => handleSort('date')}>{t('date')}</div>
            <div>{t('timestamp')}</div>
          </div>
          {currentTransactions.length > 0 ? (
            currentTransactions.map((txn: any) => (
              <div key={txn.id} className="flex flex-col md:grid md:grid-cols-9 gap-2 md:gap-4 py-4 border-b border-zinc-100 cursor-pointer hover:bg-zinc-50 md:items-center" onClick={() => setSelectedTransaction(txn)}>
                <div className="flex justify-between items-center md:hidden">
                  <div className="text-sm font-bold truncate">{txn.merchant}</div>
                  <div className="font-mono text-sm font-bold">{txn.amount.toLocaleString()} <span className="text-xs text-zinc-500 font-normal">{getCurrencyLabel(txn.currency)}</span></div>
                </div>
                <div className="flex justify-between items-center md:hidden mt-1">
                  <div className="text-xs text-zinc-500">{txn.date} &bull; {t(txn.type)}</div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${txn.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : txn.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{t(txn.status.toLowerCase())}</div>
                </div>
                
                <div className="hidden md:block font-mono text-sm">{txn.id}</div>
                <div className="hidden md:block text-sm truncate">{txn.merchant}</div>
                <div className="hidden md:block font-mono text-sm">{txn.amount.toLocaleString()}</div>
                <div className="hidden md:block font-mono text-sm">{getCurrencyLabel(txn.currency)}</div>
                <div className="hidden md:block capitalize text-sm">{t(txn.type)}</div>
                <div className={`hidden md:block text-sm font-medium ${txn.status === 'Completed' ? 'text-emerald-600' : txn.status === 'Pending' ? 'text-amber-600' : 'text-red-600'}`}>{t(txn.status.toLowerCase())}</div>
                <div className="hidden md:block text-sm truncate">{txn.paymentMethod}</div>
                <div className="hidden md:block font-mono text-sm">{txn.date}</div>
                <div className="hidden md:block font-mono text-sm">{txn.timestamp}</div>
              </div>
            ))
          ) : (
            <p className="p-4 text-zinc-500">No transactions found.</p>
          )}
        </div>
        <div className="flex justify-between items-center mt-8">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="px-3 py-2 md:px-4 bg-white border border-zinc-300 rounded-lg disabled:opacity-50 text-xs md:text-sm uppercase tracking-wider"
          >
            {t('prev')}
          </button>
          <span className="text-xs md:text-sm text-zinc-600">{t('page')} {currentPage} {t('of')} {totalPages || 1}</span>
          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-3 py-2 md:px-4 bg-white border border-zinc-300 rounded-lg disabled:opacity-50 text-xs md:text-sm uppercase tracking-wider"
          >
            {t('next')}
          </button>
        </div>

        {selectedTransaction && (
          <div className="fixed inset-0 bg-zinc-950/50 flex items-center justify-center p-4 backdrop-blur-sm z-50" onClick={() => setSelectedTransaction(null)}>
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-zinc-200 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl md:text-2xl font-bold mb-6">{t('details')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 text-sm">
                <div><p className="text-zinc-500 mb-1">{t('id')}</p><p className="font-mono">{selectedTransaction.id}</p></div>
                <div><p className="text-zinc-500 mb-1">{t('merchant')}</p><p>{selectedTransaction.merchant}</p></div>
                <div><p className="text-zinc-500 mb-1">{t('amount')}</p><p className="font-mono">{selectedTransaction.amount.toLocaleString()} {getCurrencyLabel(selectedTransaction.currency)}</p></div>
                <div><p className="text-zinc-500 mb-1">{t('paymentMethod')}</p><p>{selectedTransaction.paymentMethod}</p></div>
                <div><p className="text-zinc-500 mb-1">{t('type')}</p><p className="capitalize">{t(selectedTransaction.type)}</p></div>
                <div><p className="text-zinc-500 mb-1">{t('status')}</p><p className={`font-medium ${selectedTransaction.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>{t(selectedTransaction.status.toLowerCase())}</p></div>
                <div><p className="text-zinc-500 mb-1">{t('date')}</p><p className="font-mono">{selectedTransaction.date} {selectedTransaction.timestamp}</p></div>
                <div className="sm:col-span-2"><p className="text-zinc-500 mb-1">{t('notes')}</p><p>{selectedTransaction.notes || 'N/A'}</p></div>
              </div>
              <button className="mt-8 w-full px-6 py-3 bg-zinc-900 text-white rounded-lg font-semibold" onClick={() => setSelectedTransaction(null)}>{t('close')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
