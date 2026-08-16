import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import plans, { isValidPlan } from '../config/plans.js';
import paymentModel from '../models/paymentModel.js';
import userModel from '../models/userModel.js';

const createOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { plan } = req.body;

    if (!isValidPlan(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const planConfig = plans[plan];

    const order = await razorpay.orders.create({
      amount: planConfig.amount,
      currency: 'INR',
      receipt: `imagify_${userId}_${Date.now()}`,
      notes: {
        userId: String(userId),
        plan,
      },
    });

    const payment = new paymentModel({
      userId,
      razorpayOrderId: order.id,
      plan,
      amount: order.amount,
      credits: planConfig.credits,
      status: 'created',
    });

    await payment.save();

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
      plan,
      credits: planConfig.credits,
    });
  } catch (error) {
    console.error('Create order error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const userId = req.userId;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    const payment = await paymentModel.findOne({ razorpayOrderId: razorpay_order_id, userId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (payment.status === 'paid') {
      const user = await userModel.findById(userId);
      return res.json({
        success: true,
        message: 'Payment already processed',
        credits: user ? user.creditBalance : 0,
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    try {
      const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
      const isCaptured = razorpayPayment.status === 'captured';
      const amountMatches = Number(razorpayPayment.amount) === Number(payment.amount);
      if (!isCaptured || !amountMatches) {
        await paymentModel.updateOne({ _id: payment._id }, { $set: { status: 'failed' } });
        return res.status(400).json({ success: false, message: 'Payment was not captured' });
      }
    } catch (error) {
      console.error('Razorpay payment fetch error:', error.message);
      return res.status(502).json({ success: false, message: 'Could not verify payment with Razorpay' });
    }

    const updated = await paymentModel.findOneAndUpdate(
      { _id: payment._id, status: 'created' },
      {
        $set: {
          status: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
      },
      { new: true }
    );

    if (!updated) {
      const user = await userModel.findById(userId);
      return res.json({
        success: true,
        message: 'Payment already processed',
        credits: user ? user.creditBalance : 0,
      });
    }

    const user = await userModel.findByIdAndUpdate(
      userId,
      { $inc: { creditBalance: updated.credits } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Payment successful',
      credits: user.creditBalance,
      creditsAdded: updated.credits,
    });
  } catch (error) {
    console.error('Payment verification error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const payments = await paymentModel
      .find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('-razorpaySignature')
      .lean();

    res.json({ success: true, payments });
  } catch (error) {
    console.error('Payment history error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addCreditsFromWebhook = async (orderId, paymentId) => {
  const payment = await paymentModel.findOne({ razorpayOrderId: orderId });

  if (!payment) {
    console.error('Webhook: payment record not found for order:', orderId);
    return;
  }

  if (payment.status === 'paid') {
    return;
  }

  const updated = await paymentModel.findOneAndUpdate(
    { _id: payment._id, status: 'created' },
    {
      $set: {
        status: 'paid',
        razorpayPaymentId: paymentId,
      },
    },
    { new: true }
  );

  if (!updated) {
    return;
  }

  await userModel.findByIdAndUpdate(
    updated.userId,
    { $inc: { creditBalance: updated.credits } },
    { new: true }
  );

  console.log(`Webhook: credits added for order ${orderId}`);
};

const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing signature' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.rawBody || JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const entity = req.body.payload?.payment?.entity;

    if (!entity || !entity.order_id || !entity.id) {
      return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    }

    if (event === 'payment.captured') {
      await addCreditsFromWebhook(entity.order_id, entity.id);
    } else if (event === 'payment.failed') {
      await paymentModel.updateOne(
        { razorpayOrderId: entity.order_id, status: 'created' },
        { $set: { status: 'failed', razorpayPaymentId: entity.id } }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export { createOrder, verifyPayment, getPaymentHistory, handleWebhook };