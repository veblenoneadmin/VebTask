import express from 'express';
import { auth } from './src/lib/auth.js';

const app = express();
const port = process.env.AUTH_PORT || 3001;

// Handle auth routes
app.all('/api/auth/*', auth.handler);

app.listen(port, () => {
  console.log(`Auth server running on port ${port}`);
});