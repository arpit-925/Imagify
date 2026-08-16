import express from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  handleWebhook,
} from '../controllers/paymentController.js';
import userAuth from '../middlewares/auth.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-order', userAuth, createOrder);
paymentRouter.post('/verify', userAuth, verifyPayment);
paymentRouter.get('/history', userAuth, getPaymentHistory);
paymentRouter.post('/webhook', handleWebhook);

export default paymentRouter;