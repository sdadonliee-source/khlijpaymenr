import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, addDoc } from 'firebase/firestore';

// Initialize Firebase in backend
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Mock Fiat Checkout API
  app.post('/api/fiat/checkout', async (req, res) => {
    try {
      const { userId, amount, currency, method } = req.body;
      
      if (!userId || !amount || !currency) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create transaction in Firestore
      const txData = {
        id: `TXN-FIAT-${Math.floor(Math.random() * 1000000)}`,
        merchant: 'Test Checkout',
        amount: parseFloat(amount),
        currency,
        type: 'payment',
        status: 'completed',
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toTimeString().split(' ')[0].substring(0, 5),
        notes: `Fiat Checkout Simulator (${method})`,
        paymentMethod: method || 'Card',
        userId,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'transactions'), txData);

      // Trigger webhook asynchronously
      fetch(`http://localhost:${PORT}/api/webhooks/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          event: 'invoice.paid',
          payload: txData
        })
      }).catch(err => console.error('Failed to trigger webhook internally:', err));

      res.json({ success: true, transaction: txData });
    } catch (error: any) {
      console.error('Checkout Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Mock Crypto Checkout API
  app.post('/api/crypto/checkout', async (req, res) => {
    try {
      const { userId, amount, currency, method } = req.body;
      
      if (!userId || !amount || !currency) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create transaction in Firestore
      const txData = {
        id: `TXN-CRYPTO-${Math.floor(Math.random() * 1000000)}`,
        merchant: 'Test Checkout',
        amount: parseFloat(amount),
        currency,
        type: 'payment',
        status: 'completed',
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toTimeString().split(' ')[0].substring(0, 5),
        notes: `Crypto Checkout Simulator (${method})`,
        paymentMethod: method || 'USDT (TRC20)',
        userId,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'transactions'), txData);

      // Trigger webhook asynchronously
      fetch(`http://localhost:${PORT}/api/webhooks/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          event: 'invoice.paid',
          payload: txData
        })
      }).catch(err => console.error('Failed to trigger webhook internally:', err));

      res.json({ success: true, transaction: txData });
    } catch (error: any) {
      console.error('Checkout Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Real Webhook Dispatcher
  app.post('/api/webhooks/trigger', async (req, res) => {
    try {
      const { userId, event, payload } = req.body;

      if (!userId || !event || !payload) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Fetch developer settings from Firestore
      const docRef = doc(db, 'developerSettings', userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return res.status(404).json({ error: 'Developer settings not found' });
      }

      const settings = docSnap.data();
      const { webhookUrl, webhookSecret } = settings;

      if (!webhookUrl) {
        return res.status(400).json({ error: 'No webhook URL configured' });
      }

      // Create HMAC signature
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;
      const signature = crypto
        .createHmac('sha256', webhookSecret || '')
        .update(signaturePayload)
        .digest('hex');

      // Send the webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'YousefPay-Signature': `t=${timestamp},v1=${signature}`,
          'YousefPay-Event': event
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook delivery failed with status: ${response.status}`);
      }

      res.json({ success: true, message: 'Webhook delivered successfully' });
    } catch (error: any) {
      console.error('Webhook Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
