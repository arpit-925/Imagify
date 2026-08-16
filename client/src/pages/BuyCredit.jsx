import React, { useContext, useState } from 'react'
import { assets, plans } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import axios from 'axios'

export default function BuyCredit() {
  const { user, setShowLogin, backendUrl, token, loadCreditsData } = useContext(AppContext)
  const [loadingPlan, setLoadingPlan] = useState(null)
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID

  const handlePurchase = async (planId, planName) => {
    if (!user) {
      setShowLogin(true)
      return
    }

    setLoadingPlan(planId)

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/payment/create-order`,
        { plan: planId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!data.success) {
        toast.error(data.message || 'Could not create order')
        return
      }

      const options = {
        key: data.key || razorpayKey,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Imagify',
        description: `${planName} plan - ${data.credits} credits`,
        order_id: data.order.id,
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        theme: { color: '#1f2937' },
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(
              `${backendUrl}/api/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            )

            if (verifyRes.data.success) {
              toast.success(`${verifyRes.data.creditsAdded || data.credits} credits have been added to your account.`)
              loadCreditsData()
            } else {
              toast.error(verifyRes.data.message || 'Payment verification failed. Please try again.')
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed. Please try again.')
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled.')
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.')
      })
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0.2, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      viewport={{ once: true }}
      className='min-h-[80vh] text-center pt-14 mb-10 '>
      <button className='border border-gray-400 px-10 py-2 rounded-full mb-6'>Our Plans </button>
      <h1 className='text-center text-3xl font-medium mb-6 sm:mb-10'>Choose the plan</h1>

      <div className='flex flex-wrap justify-center gap-6 text-left'>
        {plans.map((item, index) => (
          <div key={index}
            className='bg-white drop-shadow-sm border rounded-lg py-12 px-8 text-gray-600 hover:scale-105 transition-all duration-500'>
            <img width={40} src={assets.logo_icon} alt='' />
            <p className='mt-3 mb-1 font-semibold'>{item.id}</p>
            <p className='text-sm'>{item.desc}</p>
            <p className='mt-6'><span className='text-3xl font-medium'>₹{item.price} </span>/ {item.credits} credits</p>
            <button
              onClick={() => handlePurchase(item.id.toLowerCase(), item.id)}
              disabled={loadingPlan !== null}
              className='w-full bg-gray-800 text-white mt-8 text-sm rounded-md py-2.5 min-w-52 disabled:opacity-60 disabled:cursor-not-allowed'>
              {loadingPlan === item.id.toLowerCase() ? 'Processing...' : user ? 'Purchase' : 'Get Started'}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  )
}