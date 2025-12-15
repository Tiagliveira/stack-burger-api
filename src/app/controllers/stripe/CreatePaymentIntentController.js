import Stripe from 'stripe';
import * as Yup from 'yup';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const calculateOrderAmount = (items, deliveryFee) => {
  const productsTotal = items.reduce((acc, current) => {
    const price = Number(current.price);
    const quantity = Number(current.quantity);
    return price * quantity + acc;
  }, 0);

  const fee = Number(deliveryFee) || 0;

  const total = productsTotal + fee;

  return Math.round(total);
};

class CreatePaymentIntentController {
  async store(request, response) {
    const schema = Yup.object({
      products: Yup.array().required(),
      deliveryFee: Yup.number(),
    });

    try {
      schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { products, deliveryFee } = request.body;

    const amount = calculateOrderAmount(products, deliveryFee);

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'brl',
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return response.json({
        clientSecret: paymentIntent.client_secret,
        dpmCheckerLink: `https://dashboard.stripe.com/settings/payment_methods/review?transaction_id=${paymentIntent.id}`,
      });
    } catch (err) {
      console.error('Erro no Stripe:', err.message);
      return response.status(400).json({ error: err.message });
    }
  }
}

export default new CreatePaymentIntentController();
