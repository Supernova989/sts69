import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { LoggerService } from '../logger/logger.service';
import { Environment } from '../shared/classes/environment';
import { CreatePaymentIntentProps } from './typings';

const CURRENCY = 'eur';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly logger: LoggerService
  ) {}

  enable() {
    this.stripe = new Stripe(this.configService.get('STRIPE_PRIVATE_KEY'), {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async createPaymentIntent(props: CreatePaymentIntentProps): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.create({
      ...props,
      currency: CURRENCY,
      automatic_payment_methods: { enabled: true },
    });
  }
}
