import express from 'express';
import { auth } from './src/lib/auth.js';

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

// Handle all auth routes
app.all('/api/auth/*', (req, res) => {
  return auth.handler(req, res);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Auth server running on port ${PORT}`);
});