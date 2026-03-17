import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/stats", (req, res) => {
    // In a real application, this would fetch from a database
    res.json({
      totalVolume: "SAR 1,250,000",
      activeTransactions: 452,
      complianceStatus: "Compliant"
    });
  });

  app.get("/api/records", (req, res) => {
    // In a real application, this would fetch from a database
    res.json([
      { id: 'TXN-001', merchant: 'Dubai Luxury Real Estate', amount: 50000, currency: 'AED', type: 'payment', status: 'Completed', date: '2026-03-17', timestamp: '14:30', notes: 'Property lease', paymentMethod: 'Apple Pay' },
      { id: 'TXN-002', merchant: 'Riyadh Tech Solutions', amount: 12500, currency: 'SAR', type: 'withdrawal', status: 'Pending', date: '2026-03-16', timestamp: '09:15', notes: 'Server maintenance', paymentMethod: 'STC Pay' },
      { id: 'TXN-003', merchant: 'Kuwait Fashion Hub', amount: 850, currency: 'KWD', type: 'deposit', status: 'Completed', date: '2026-03-15', timestamp: '11:00', notes: 'Inventory sale', paymentMethod: 'K-Net' },
      { id: 'TXN-004', merchant: 'Oman Travel Agency', amount: 200, currency: 'OMR', type: 'payment', status: 'Completed', date: '2026-03-14', timestamp: '16:45', notes: 'Flight booking', paymentMethod: 'Visa/Mastercard' },
      { id: 'TXN-005', merchant: 'Qatar Tech Supplies', amount: 3000, currency: 'QAR', type: 'payment', status: 'Pending', date: '2026-03-13', timestamp: '10:20', notes: 'Hardware purchase', paymentMethod: 'Visa/Mastercard' },
      { id: 'TXN-006', merchant: 'Bahrain Consulting', amount: 1500, currency: 'BHD', type: 'deposit', status: 'Completed', date: '2026-03-12', timestamp: '13:10', notes: 'Consulting fee', paymentMethod: 'Benefit' },
      { id: 'TXN-007', merchant: 'Saudi Retail Group', amount: 45000, currency: 'SAR', type: 'payment', status: 'Completed', date: '2026-03-11', timestamp: '08:00', notes: 'Bulk purchase', paymentMethod: 'Mada' },
      { id: 'TXN-008', merchant: 'UAE Logistics', amount: 12000, currency: 'AED', type: 'withdrawal', status: 'Pending', date: '2026-03-10', timestamp: '17:30', notes: 'Shipping costs', paymentMethod: 'Visa/Mastercard' },
      { id: 'TXN-009', merchant: 'Kuwait Food Services', amount: 500, currency: 'KWD', type: 'payment', status: 'Completed', date: '2026-03-09', timestamp: '12:00', notes: 'Catering', paymentMethod: 'K-Net' },
      { id: 'TXN-010', merchant: 'Oman Construction', amount: 75000, currency: 'OMR', type: 'deposit', status: 'Completed', date: '2026-03-08', timestamp: '09:45', notes: 'Contract payment', paymentMethod: 'Visa/Mastercard' },
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
