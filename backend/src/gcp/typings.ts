import { protos } from '@google-cloud/tasks';

export enum TaskQueueName {
  CANCEL_STRIPE_CHECKOUT_SESSION = 'cancel-stripe-checkout-session',
  SEND_EMAIL = 'user-registration',
}

export interface BaseCloudTaskInput {
  scheduleAt: number;
}

export interface ScheduleStripeSessionExpirationInput {
  sessionId: string;
}

export interface ScheduleMailInput {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachmentLinks: string[];
}

export interface CreateTaskInput extends BaseCloudTaskInput {
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body: unknown;
  scheduleAt: number;
  url: string;
  queueName: string;
  headers: protos.google.cloud.tasks.v2.HttpRequest['headers'];
}