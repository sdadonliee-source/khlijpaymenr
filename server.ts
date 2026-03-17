import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import admin from 'firebase-admin';

// Import the Firebase configuration
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
const adminDb = admin.firestore();
if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
  // Note: In some versions of firebase-admin, you might need a different way to specify the database ID
  // but usually projectId is enough if it's the default database.
  // If it's a named database, we might need to use the full database path or a specific client.
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Bitcart Generic Proxy (Real Integration)
  app.all('/api/bitcart/proxy/*', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });

      // Fetch developer settings for Bitcart config
      const docRef = adminDb.collection('developerSettings').doc(userId as string);
      const docSnap = await docRef.get();
      
      let bitcartUrl = 'https://bitcart.yourdomain.com';
      let bitcartApiKey = 'Admin API Key';

      if (docSnap.exists) {
        const data = docSnap.data()!;
        if (data.bitcartUrl) bitcartUrl = data.bitcartUrl;
        if (data.bitcartApiKey) bitcartApiKey = data.bitcartApiKey;
      }
      
      if (!bitcartUrl || !bitcartApiKey) {
        return res.status(400).json({ error: 'Bitcart not configured' });
      }

      const endpoint = (req.params as any)[0];
      const method = req.method;
      const url = `${bitcartUrl}/${endpoint}`;

      const response = await axios({
        method,
        url,
        data: req.body,
        params: req.query,
        headers: {
          'Authorization': `Token ${bitcartApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const data = error.response?.data || { error: error.message || 'Internal Server Error' };
      console.error(`Bitcart Proxy Error (${status}):`, data);
      res.status(status).json(data);
    }
  });

  // Bitcart Invoice Creation (Real Integration)
  app.post('/api/bitcart/invoice', async (req, res) => {
    try {
      const { userId, amount, currency, storeId } = req.body;
      
      if (!userId || !amount || !currency) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Fetch developer settings for Bitcart config
      const docRef = adminDb.collection('developerSettings').doc(userId);
      const docSnap = await docRef.get();
      
      let bitcartUrl = 'https://bitcart.yourdomain.com';
      let bitcartApiKey = 'Admin API Key';

      if (docSnap.exists) {
        const data = docSnap.data()!;
        if (data.bitcartUrl) bitcartUrl = data.bitcartUrl;
        if (data.bitcartApiKey) bitcartApiKey = data.bitcartApiKey;
      }

      // Create invoice in Bitcart
      const response = await axios.post(`${bitcartUrl}/invoices`, {
        price: amount,
        currency: currency,
        store_id: storeId // Optional, depends on Bitcart setup
      }, {
        headers: {
          'Authorization': `Token ${bitcartApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const invoice = response.data;

      // Create order in Firestore
      await adminDb.collection('orders').add({
        userId,
        amount,
        currency,
        status: 'pending',
        bitcartInvoiceId: invoice.id,
        createdAt: new Date().toISOString()
      });

      res.json(invoice);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const data = error.response?.data || { error: error.message || 'Internal Server Error' };
      console.error(`Bitcart Invoice Error (${status}):`, data);
      res.status(status).json(data);
    }
  });

  app.post('/api/webhook/bitcart', async (req, res) => {
    try {
      const { event, payload } = req.body;
      
      // In production, we should verify signature
      // const signature = req.headers['x-bitcart-signature'];
      
      if (event === 'invoice.paid' || event === 'invoice.confirmed') {
        const invoiceId = payload.id;
        
        // Find order by bitcartInvoiceId
        const ordersRef = adminDb.collection('orders');
        const querySnapshot = await ordersRef.where('bitcartInvoiceId', '==', invoiceId).get();
        
        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0];
          await orderDoc.ref.update({
            status: 'paid',
            paidAt: new Date().toISOString()
          });
          console.log('Order marked as paid:', orderDoc.id);
        }
      } else if (event === 'invoice.expired') {
        const invoiceId = payload.id;
        const ordersRef = adminDb.collection('orders');
        const querySnapshot = await ordersRef.where('bitcartInvoiceId', '==', invoiceId).get();
        
        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0];
          await orderDoc.ref.update({
            status: 'expired'
          });
        }
      }
      
      res.status(200).send('OK');
    } catch (error: any) {
      console.error('Bitcart Webhook Error:', error);
      res.status(500).send('Internal Server Error');
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
      const docRef = adminDb.collection('developerSettings').doc(userId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).json({ error: 'Developer settings not found' });
      }

      const settings = docSnap.data()!;
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
