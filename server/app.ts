import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { isDatabaseConfigured } from './db';
import { dbCheck } from './middlewares/dbCheck';
import authRoutes from './routes/authRoutes';
import bootstrapRoutes from './routes/bootstrapRoutes';
import productRoutes from './routes/productRoutes';
import saleRoutes from './routes/saleRoutes';
import stockEntryRoutes from './routes/stockEntryRoutes';
import configRoutes from './routes/configRoutes';

const app = express();
const PORT = 3030;

app.use(express.json());
app.use('/api', dbCheck);

app.use('/api', authRoutes);
app.use('/api', bootstrapRoutes);
app.use('/api', productRoutes);
app.use('/api', saleRoutes);
app.use('/api', stockEntryRoutes);
app.use('/api/config', configRoutes);

export async function init() {
  if (!isDatabaseConfigured()) {
    console.warn('WARNING: DATABASE_URL is not set. All /api requests will return 503.');
  } else {
    console.log('PostgreSQL database configured successfully!');
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Flora PDV full-stack server running on http://0.0.0.0:${PORT}`);
  });
}
