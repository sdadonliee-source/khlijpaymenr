import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { ShoppingBag, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface Order {
  id: string;
  storeId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  bitcartInvoiceId: string;
  createdAt: string;
}

export default function Orders({ lang, user }: { lang: 'EN' | 'AR', user: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const t = (key: string) => {
    const translations: any = {
      EN: {
        title: 'Order History',
        noOrders: 'No orders found',
        status: 'Status',
        amount: 'Amount',
        date: 'Date',
        pending: 'Pending',
        paid: 'Paid',
        expired: 'Expired',
        failed: 'Failed'
      },
      AR: {
        title: 'سجل الطلبات',
        noOrders: 'لا توجد طلبات',
        status: 'الحالة',
        amount: 'المبلغ',
        date: 'التاريخ',
        pending: 'قيد الانتظار',
        paid: 'تم الدفع',
        expired: 'منتهي',
        failed: 'فشل'
      }
    };
    return translations[lang][key];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'expired': return <AlertCircle className="w-5 h-5 text-zinc-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-zinc-400" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingBag className="w-6 h-6 text-zinc-900" />
        <h2 className="text-2xl font-bold text-zinc-900">{t('title')}</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>{t('noOrders')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" dir={lang === 'AR' ? 'rtl' : 'ltr'}>
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="py-4 px-4 text-xs font-semibold uppercase text-zinc-500 tracking-wider">{t('date')}</th>
                <th className="py-4 px-4 text-xs font-semibold uppercase text-zinc-500 tracking-wider">{t('amount')}</th>
                <th className="py-4 px-4 text-xs font-semibold uppercase text-zinc-500 tracking-wider">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="text-sm text-zinc-900">{new Date(order.createdAt).toLocaleDateString(lang === 'AR' ? 'ar-EG' : 'en-US')}</div>
                    <div className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleTimeString(lang === 'AR' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-zinc-900">
                    {order.amount} {order.currency}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="text-sm font-medium">{t(order.status)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
