import { http } from '@google-cloud/functions-framework';
import { Request, Response } from 'express';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

http('handler', async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    return res.status(405).send();
  }

  const { sessionId } = req.body;

  if (typeof sessionId !== 'string') {
    return res.status(400).send('Missing or invalid sessionId');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return res.status(400).send('Session not found');
    }
    if (session.status === 'open') {
      await stripe.checkout.sessions.expire(sessionId);
    }

    return res.status(200).send('ok');
  } catch (err: any) {
    console.error('Stripe error:', err.message);
    return res.status(500).send('Failed to cancel session');
  }
});