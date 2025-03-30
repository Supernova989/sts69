import { protos } from '@google-cloud/tasks';

export interface CreateTaskProps<B extends object> {
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body: B;
  scheduleAt: number;
  url: string;
  queueName: string;
  headers: protos.google.cloud.tasks.v2.HttpRequest['headers'];
}

export enum TaskQueueName {
  CANCEL_STRIPE_CHECKOUT_SESSION = 'cancel-stripe-checkout-session',
}
