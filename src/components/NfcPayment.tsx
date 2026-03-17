import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Nfc, AlertCircle, CheckCircle2, Info, CreditCard } from 'lucide-react';

interface NfcPaymentProps {
  user: any;
  storeId: string;
}

export default function NfcPayment({ user, storeId }: NfcPaymentProps) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [nfcSupported, setNfcSupported] = useState(true);
  const [amount, setAmount] = useState('100');
  const [currency, setCurrency] = useState('SAR');
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');

  useEffect(() => {
    if (!('NDEFReader' in window)) {
      setNfcSupported(false);
    }
    if (user) {
      axios.get(`/api/bitcart/stores?userId=${user.uid}`)
        .then(res => {
          const results = res.data.results || res.data || [];
          setStores(results);
          if (results.length > 0) setSelectedStoreId(results[0].id);
        })
        .catch(err => console.error('Failed to fetch stores:', err));
    }
  }, [user]);

  const handleNfcReading = async (event: any) => {
    const { message: nfcMessage, serialNumber } = event;
    setStatus('processing');
    
    let nfcData = serialNumber;
    
    if (nfcMessage.records && nfcMessage.records.length > 0) {
      for (const record of nfcMessage.records) {
        if (record.recordType === "url" || record.recordType === "text") {
          const decoder = new TextDecoder();
          nfcData = decoder.decode(record.data);
          break;
        }
      }
    }

    setMessage(`Detected: ${nfcData.substring(0, 30)}...`);

    try {
      const response = await axios.post('/api/bitcart/invoices', {
        userId: user?.uid,
        store_id: selectedStoreId,
        price: parseFloat(amount),
        currency,
        nfcData
      });

      setStatus('success');
      setMessage(`Payment successful! Invoice: ${response.data.id}`);
    } catch (error) {
      setStatus('error');
      setMessage('Payment failed. Please check your Bitcart configuration.');
    }
  };

  const startNfcScan = async () => {
    if (!nfcSupported) {
      setStatus('error');
      setMessage('Web NFC is not supported on this browser. Please use Chrome on Android.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatus('error');
      setMessage('Please enter a valid amount.');
      return;
    }

    if (!selectedStoreId) {
      setStatus('error');
      setMessage('Please select a Bitcart store first.');
      return;
    }

    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();
      setStatus('scanning');
      setMessage('Ready to scan. Please bring the NFC tag close to your device.');

      ndef.onreading = handleNfcReading;

      ndef.onreadingerror = () => {
        setStatus('error');
        setMessage('Cannot read data from the NFC tag. Try another one.');
      };

    } catch (error) {
      setStatus('error');
      setMessage('Permission denied or NFC hardware is disabled.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
          <Nfc className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Contactless Payment</h2>
          <p className="text-zinc-500 text-sm">Pay using NFC tags, Bolt cards, or crypto wallets</p>
        </div>
      </div>

      {!nfcSupported && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex flex-col gap-3 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Browser Not Supported:</strong> Web NFC is currently only supported in Chrome for Android. 
              iOS and Desktop browsers do not support this feature yet.
            </p>
          </div>
          <button 
            onClick={() => {
              setNfcSupported(true); // Temporarily enable for simulation
              setMessage('Simulation Mode: Ready to scan.');
              setStatus('scanning');
              setTimeout(() => {
                const mockEvent = { serialNumber: 'SIM-NFC-TAG-998877', message: { records: [] } };
                // We can't easily trigger the onreading event from outside, 
                // so we'll just call the logic directly
                handleNfcReading(mockEvent);
              }, 2000);
            }}
            className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-2 rounded-lg hover:bg-amber-200 transition-colors self-start"
          >
            Simulate NFC Tap (For Demo)
          </button>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Select Bitcart Store</label>
        <select 
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold"
        >
          {stores.length === 0 && <option value="">No stores found</option>}
          {stores.map((store: any) => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Amount</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Currency</label>
          <select 
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold"
          >
            <option>SAR</option>
            <option>AED</option>
            <option>KWD</option>
            <option>BHD</option>
            <option>OMR</option>
            <option>QAR</option>
            <option>BTC</option>
            <option>USDT</option>
          </select>
        </div>
      </div>

      <div className="relative group mb-8">
        <div className={`aspect-square rounded-3xl border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4 ${
          status === 'scanning' ? 'border-zinc-900 bg-zinc-50 animate-pulse' : 
          status === 'success' ? 'border-emerald-500 bg-emerald-50' :
          status === 'error' ? 'border-red-500 bg-red-50' : 'border-zinc-100'
        }`}>
          {status === 'idle' && <CreditCard className="w-16 h-16 text-zinc-200" />}
          {status === 'scanning' && <Nfc className="w-16 h-16 text-zinc-900" />}
          {status === 'success' && <CheckCircle2 className="w-16 h-16 text-emerald-500" />}
          {status === 'error' && <AlertCircle className="w-16 h-16 text-red-500" />}
          
          <p className="text-center px-6 font-medium text-zinc-600">
            {message || 'Tap the button below to start'}
          </p>
        </div>
      </div>

      <button
        onClick={startNfcScan}
        disabled={!nfcSupported || status === 'scanning' || status === 'processing'}
        className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        <Nfc className="w-5 h-5" />
        {status === 'scanning' ? 'Scanning...' : 'Start Contactless Payment'}
      </button>

      <div className="mt-10 pt-8 border-t border-zinc-100">
        <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-900 mb-4">
          <Info className="w-4 h-4" />
          Supported Contactless Methods
        </h4>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <li className="flex gap-3 p-3 bg-zinc-50 rounded-lg">
            <div className="w-2 h-2 bg-zinc-900 rounded-full mt-1.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-zinc-900">Bolt Cards</p>
              <p className="text-[10px] text-zinc-500">Lightning Network NFC cards</p>
            </div>
          </li>
          <li className="flex gap-3 p-3 bg-zinc-50 rounded-lg">
            <div className="w-2 h-2 bg-zinc-900 rounded-full mt-1.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-zinc-900">LNURL-Pay</p>
              <p className="text-[10px] text-zinc-500">Static payment QR/NFC tags</p>
            </div>
          </li>
          <li className="flex gap-3 p-3 bg-zinc-50 rounded-lg">
            <div className="w-2 h-2 bg-zinc-900 rounded-full mt-1.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-zinc-900">Crypto Wallets</p>
              <p className="text-[10px] text-zinc-500">NFC-enabled hardware wallets</p>
            </div>
          </li>
          <li className="flex gap-3 p-3 bg-zinc-50 rounded-lg">
            <div className="w-2 h-2 bg-zinc-900 rounded-full mt-1.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-zinc-900">Custom Tags</p>
              <p className="text-[10px] text-zinc-500">Any NDEF-formatted NFC tag</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
