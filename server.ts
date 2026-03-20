import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import admin from 'firebase-admin';
import * as bitcoin from 'bitcoinjs-lib';
import { ethers } from 'ethers';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import * as ecc from 'tiny-secp256k1';

// Initialize ECC for bitcoinjs-lib
const bip32Instance = bip32.BIP32Factory(ecc);

// Import the Firebase configuration
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
const adminDb = admin.firestore();

export const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

  // --- Internal Bitcart Logic (The "Core") ---

  const getBlockchainProvider = (coin: string) => {
    switch (coin.toLowerCase()) {
      case 'btc':
        return 'https://mempool.space/api';
      case 'eth':
      case 'usdt':
        return 'https://api.etherscan.io/api'; // Requires API key for production, using public limits for now
      default:
        return null;
    }
  };

  const deriveBtcAddress = (xpub: string, index: number) => {
    try {
      const node = bip32Instance.fromBase58(xpub);
      const child = node.derive(0).derive(index);
      const { address } = bitcoin.payments.p2wpkh({
        pubkey: child.publicKey,
        network: bitcoin.networks.bitcoin,
      });
      return address;
    } catch (error) {
      console.error('BTC Derivation Error:', error);
      return null;
    }
  };

  const checkUsdtBalance = async (address: string) => {
    try {
      const provider = new ethers.JsonRpcProvider('https://cloudflare-eth.com');
      const usdtAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
      const abi = ['function balanceOf(address) view returns (uint256)'];
      const contract = new ethers.Contract(usdtAddress, abi, provider);
      const balance = await contract.balanceOf(address);
      return Number(ethers.formatUnits(balance, 6)); // USDT has 6 decimals
    } catch (error) {
      console.error('USDT Balance Check Error:', error);
      return 0;
    }
  };

  const checkBtcBalance = async (address: string) => {
    try {
      const response = await axios.get(`https://mempool.space/api/address/${address}`);
      const { chain_stats, mempool_stats } = response.data;
      const totalReceived = chain_stats.funded_txo_sum + mempool_stats.funded_txo_sum;
      return totalReceived / 100000000; // Convert satoshis to BTC
    } catch (error) {
      console.error('BTC Balance Check Error:', error);
      return 0;
    }
  };

  const checkEthBalance = async (address: string) => {
    try {
      const provider = new ethers.JsonRpcProvider('https://cloudflare-eth.com');
      const balance = await provider.getBalance(address);
      return Number(ethers.formatEther(balance));
    } catch (error) {
      console.error('ETH Balance Check Error:', error);
      return 0;
    }
  };

  // --- Bitcart-Compatible API Endpoints ---

  // Stores
  app.get('/api/bitcart/stores', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      const snapshot = await adminDb.collection('bitcart_stores').where('userId', '==', userId).get();
      const stores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ results: stores });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/bitcart/stores', async (req, res) => {
    try {
      const { userId, name, currency } = req.body;
      if (!name) return res.status(400).json({ error: 'Store name is required' });
      const docRef = await adminDb.collection('bitcart_stores').add({
        userId,
        name,
        currency: currency || 'USD',
        createdAt: new Date().toISOString()
      });
      res.json({ id: docRef.id, name, currency });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/bitcart/stores/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, currency } = req.body;
      if (!name) return res.status(400).json({ error: 'Store name is required' });
      await adminDb.collection('bitcart_stores').doc(id).update({
        name,
        currency: currency || 'USD',
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Wallets
  app.get('/api/bitcart/wallets', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      const snapshot = await adminDb.collection('bitcart_wallets').where('userId', '==', userId).get();
      const wallets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ results: wallets });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/bitcart/wallets', async (req, res) => {
    try {
      const { userId, name, xpub, coin } = req.body;
      const docRef = await adminDb.collection('bitcart_wallets').add({
        userId,
        name,
        xpub,
        coin: coin || 'BTC',
        createdAt: new Date().toISOString()
      });
      res.json({ id: docRef.id, name, coin });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Invoices
  app.get('/api/bitcart/invoices', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      const snapshot = await adminDb.collection('bitcart_invoices').where('userId', '==', userId).get();
      const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ results: invoices });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/bitcart/invoices', async (req, res) => {
    try {
      const { userId, price, currency, store_id, wallet_id } = req.body;
      
      // Fetch wallet to get xpub/address
      let wallet;
      if (wallet_id) {
        const walletSnap = await adminDb.collection('bitcart_wallets').doc(wallet_id).get();
        if (walletSnap.exists) wallet = walletSnap.data();
      } else {
        // Default to first wallet for the user/coin
        const walletQuery = await adminDb.collection('bitcart_wallets')
          .where('userId', '==', userId)
          .where('coin', '==', currency || 'BTC')
          .limit(1)
          .get();
        if (!walletQuery.empty) wallet = walletQuery.docs[0].data();
      }

      let paymentAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'; // Fallback
      
      if (wallet) {
        if (wallet.xpub && currency === 'BTC') {
          // Derive a new address (using a random index for now, in real app we'd track index)
          const index = Math.floor(Math.random() * 1000);
          paymentAddress = deriveBtcAddress(wallet.xpub, index) || wallet.xpub;
        } else {
          paymentAddress = wallet.xpub; // It might be a single address
        }
      }

      const invoiceData = {
        userId,
        price,
        currency: currency || 'BTC',
        store_id,
        wallet_id,
        status: 'pending',
        payment_address: paymentAddress,
        amount_paid: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };

      const docRef = await adminDb.collection('bitcart_invoices').add(invoiceData);
      
      await adminDb.collection('orders').add({
        userId,
        amount: price,
        currency: currency || 'BTC',
        status: 'pending',
        bitcartInvoiceId: docRef.id,
        createdAt: new Date().toISOString()
      });

      res.json({ id: docRef.id, ...invoiceData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/bitcart/invoices/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = adminDb.collection('bitcart_invoices').doc(id);
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) return res.status(404).json({ error: 'Invoice not found' });
      
      const invoice = docSnap.data()!;
      
      if (invoice.status === 'pending') {
        let currentBalance = 0;
        if (invoice.currency === 'BTC') {
          currentBalance = await checkBtcBalance(invoice.payment_address);
        } else if (invoice.currency === 'ETH') {
          currentBalance = await checkEthBalance(invoice.payment_address);
        } else if (invoice.currency === 'USDT') {
          currentBalance = await checkUsdtBalance(invoice.payment_address);
        }

        if (currentBalance >= invoice.price) {
          await docRef.update({ status: 'complete', amount_paid: currentBalance });
          invoice.status = 'complete';
          invoice.amount_paid = currentBalance;

          const ordersRef = adminDb.collection('orders');
          const querySnapshot = await ordersRef.where('bitcartInvoiceId', '==', id).get();
          if (!querySnapshot.empty) {
            await querySnapshot.docs[0].ref.update({ status: 'paid', paidAt: new Date().toISOString() });
          }
        }
      }

      res.json({ id, ...invoice });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Legacy Proxy support (to avoid breaking frontend immediately)
  app.all('/api/bitcart/proxy/*', async (req, res) => {
    const endpoint = (req.params as any)[0];
    const internalUrl = `/api/bitcart/${endpoint}`;
    // Redirect to internal API
    req.url = internalUrl;
    app._router.handle(req, res, () => {});
  });

  // Webhooks
  app.post('/api/webhooks/trigger', async (req, res) => {
    try {
      const { userId, event, payload } = req.body;
      const docRef = adminDb.collection('developerSettings').doc(userId);
      const docSnap = await docRef.get();
      if (!docSnap.exists) return res.status(404).json({ error: 'Settings not found' });
      const { webhookUrl, webhookSecret } = docSnap.data()!;
      if (!webhookUrl) return res.status(400).json({ error: 'No webhook URL' });

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = crypto.createHmac('sha256', webhookSecret || '').update(`${timestamp}.${JSON.stringify(payload)}`).digest('hex');

      await axios.post(webhookUrl, payload, {
        headers: {
          'YousefPay-Signature': `t=${timestamp},v1=${signature}`,
          'YousefPay-Event': event
        }
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Health
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

// Only listen if not in Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}
