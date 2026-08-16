const plans = {
  basic: {
    amount: 1000, // ₹10 in paise
    credits: 100,
    name: 'Basic',
  },
  advanced: {
    amount: 5000, // ₹50 in paise
    credits: 500,
    name: 'Advanced',
  },
  business: {
    amount: 25000, // ₹250 in paise
    credits: 5000,
    name: 'Business',
  },
};

export const isValidPlan = (plan) => Boolean(plans[plan]);

export default plans;