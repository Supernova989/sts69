import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import stripe from 'stripe';
import { LoggerService } from '../logger/logger.service';
import { Environment } from '../shared/classes/environment';
import { ReservationStatus } from '../shared/types/reservation-status';
import { CreateCheckoutSession } from './typings';

const CURRENCY = 'eur';

@Injectable()
export class StripeService {
  private stripe: stripe;

  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly logger: LoggerService
  ) {}

  /**
   * Init the client.
   */
  enable() {
    this.stripe = new stripe.Stripe(this.configService.get('STRIPE_PRIVATE_KEY'), {
      apiVersion: '2025-02-24.acacia',
    });
  }

  /**
   * Creates a checkout session.
   */
  async createCheckoutSession(props: CreateCheckoutSession): Promise<stripe.Response<stripe.Checkout.Session>> {
    const { reservation, userId } = props;

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new Error('reservation is not pending');
    }

    if (reservation.stripeSessionId) {
      throw new Error('stripe session already set');
    }

    if (moment(reservation.reservedUntil).isBefore(moment())) {
      throw new Error('reserved expired');
    }

    const lineItems: Array<stripe.Checkout.SessionCreateParams.LineItem> = reservation.seats.map((seat) => ({
      price_data: {
        currency: CURRENCY,
        product_data: {
          name: `${reservation.event.name}. Row ${seat.row}, seat ${seat.label}`,
        },
        unit_amount: 1000,
      },
      quantity: 1,
    }));

    if (!lineItems.length) {
      throw new Error('no items for session');
    }

    const metadata: stripe.MetadataParam = {
      userId,
      seatIds: reservation.seats.map(({ id }) => id).join(', '),
      reservationId: reservation.id,
    };

    const session = await this.stripe.checkout.sessions.create({
      success_url: this.configService.get('STRIPE_CHECKOUT_SUCCESS_URL'),
      line_items: lineItems,
      payment_method_types: ['card'],
      mode: 'payment',
      metadata,
      // minimise the session expiration time
      expires_at: moment().add(30, 'minutes').unix(),
    });

    this.logger.log('Checkout session %s created', [session.id], { src: 'StripeService::createCheckoutSession' });

    return session;
  }
}
