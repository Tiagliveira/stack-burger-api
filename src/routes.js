import { Router } from 'express';
import multer from 'multer';
import CategoryController from './app/controllers/CategoryController.js';
import DashboardController from './app/controllers/DashboardController.js';
import DeliveryTaxController from './app/controllers/DeliveryTaxController.js';
import ExpenseController from './app/controllers/ExpenseController.js';
import OrderController from './app/controllers/OrderController.js';
import ProductController from './app/controllers/ProductController.js';
import SessionController from './app/controllers/SessionController.js';
import CreatePaymentIntentController from './app/controllers/stripe/CreatePaymentIntentController.js';
import UserController from './app/controllers/UserController.js';
import adminMiddleware from './app/middlewares/admin.js';
import authMiddleware from './app/middlewares/auth.js';
import multerConfig from './config/multer.cjs';

const routes = new Router();

const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);
routes.get('/products', ProductController.index);
routes.get('/categories', CategoryController.index);

routes.use(authMiddleware);

routes.post(
  '/products',
  adminMiddleware,
  upload.single('file'),
  ProductController.store,
);
routes.put(
  '/products/:id',
  adminMiddleware,
  upload.single('file'),
  ProductController.update,
);
routes.delete('/products/:id', adminMiddleware, ProductController.delete);
routes.post('/products/:id/rate', ProductController.rate);

routes.post(
  '/categories',
  adminMiddleware,
  upload.single('file'),
  CategoryController.store,
);
routes.put(
  '/categories/:id',
  adminMiddleware,
  upload.single('file'),
  CategoryController.update,
);

routes.post('/orders', OrderController.store);
routes.get('/orders', adminMiddleware, OrderController.index);
routes.get('/orders/history', OrderController.show);
routes.put('/orders/:id', adminMiddleware, OrderController.update);
routes.put('/orders/:id/cancel', OrderController.cancel);
routes.post('/orders/:id/messages', OrderController.addMessage);
routes.post('/orders/:id/rate', OrderController.rateOrder);

routes.post('/create_payment_intent', CreatePaymentIntentController.store);

routes.post('/delivery-calculate', DeliveryTaxController.calculate);

routes.post('/delivery-taxes', adminMiddleware, DeliveryTaxController.store);
routes.get('/delivery-taxes', adminMiddleware, DeliveryTaxController.index);

routes.get('/dashboard', adminMiddleware, DashboardController.index);
routes.get('/dashboard/reports', adminMiddleware, DashboardController.reports);

routes.post('/expenses', adminMiddleware, ExpenseController.store);

export default routes;
