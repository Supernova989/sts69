import { http } from '@google-cloud/functions-framework';
import { Request, Response } from 'express';
import { Stripe } from 'stripe';

http('cancelStripeSession', async (req: Request, res: Response) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia'
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId } = req.body;

  if (typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid sessionId' });
  }

  try {
    await stripe.checkout.sessions.expire(sessionId);
    return res.status(200).json({ message: `Session ${sessionId} cancelled` });
  } catch (err: any) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: 'Failed to cancel session' });
  }
});