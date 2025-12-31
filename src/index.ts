import express from 'express';
import cookieParser from 'cookie-parser';
import pino from 'pino';
import authRoutes from './routes/auth.routes.js';
import auditRoutes from './routes/audit.routes.js';
import pendingChangesRoutes from './routes/pending-changes.routes.js';
import usersRoutes from './routes/users.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import subcategoriesRoutes from './routes/subcategories.routes.js';
import productsRoutes from './routes/products.routes.js';
import { authenticateToken, requireAdmin, requireEditor } from './middleware/auth.middleware.js';

const logger = pino();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration (adjust for your frontend URL)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/pending-changes', pendingChangesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/subcategories', subcategoriesRoutes);
app.use('/api/products', productsRoutes);

// Protected routes examples
app.get('/api/admin/dashboard', authenticateToken, requireAdmin, (req, res) => {
  res.json({ message: 'Admin dashboard data', role: 'admin' });
});

app.get('/api/editor/content', authenticateToken, requireEditor, (req, res) => {
  res.json({ message: 'Editor content data', role: 'editor' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info('Default credentials:');
  logger.info('  Admin - email: admin@gogreen.com, password: admin123');
  logger.info('  Editor - email: editor@gogreen.com, password: editor123');
});
