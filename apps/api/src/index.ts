import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import shopsRoutes from './modules/shops/routes';
import productsRoutes from './modules/products/routes';
import categoriesRoutes from './modules/categories/routes';
import subscriptionsRoutes from './modules/subscriptions/routes';
import paymentsRoutes from './modules/payments/routes';
import adminRoutes from './modules/admin/routes';
import authRoutes from './modules/auth/routes';
import passwordResetRoutes from './modules/auth/resetPassword';
import notificationsRoutes from './modules/notifications/routes';
import ogRoutes from './modules/og/routes';

const app = express();

// OG routes must be mounted before helmet so crawlers get clean HTML
app.use('/og', ogRoutes);

app.use(helmet());
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.PORT, () => {
  console.log(`🚀 StatusMarket API running on http://localhost:${env.PORT}`);
});
