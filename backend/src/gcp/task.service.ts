import { CloudTasksClient, protos } from '@google-cloud/tasks';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Buffer } from 'node:buffer';
import { LoggerService } from '../logger/logger.service';
import { Environment } from '../shared/classes/environment';
import {
  BaseCloudTaskInput,
  CreateTaskInput,
  ScheduleMailInput,
  ScheduleStripeSessionExpirationInput,
  TaskQueueName,
} from './typings';

@Injectable()
export class GoogleCloudTaskService {
  private readonly client: CloudTasksClient;

  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly logger: LoggerService
  ) {
    this.client = new CloudTasksClient({
      fallback: true,
      credentials: this.configService.get('GOOGLE_CLOUD_TASKS_CREDENTIALS'),
    });
  }

  /**
   * Schedules a task to send an email.
   */
  async scheduleMail({ scheduleAt, ...rest }: ScheduleMailInput & BaseCloudTaskInput) {
    return this.createTask({
      httpMethod: 'POST',
      queueName: TaskQueueName.SEND_EMAIL,
      headers: {
        'Content-Type': 'application/json',
      },
      body: { ...rest },
      url: this.configService.get('SEND_EMAIL_TASK_URL'),
      scheduleAt,
    });
  }

  /**
   * Schedules a task to expire a Stripe Checkout session.
   * Intended for sessions with a lifetime shorter than 30 minutes.
   */
  async scheduleStripeSessionExpiration({
    scheduleAt,
    sessionId,
  }: ScheduleStripeSessionExpirationInput & BaseCloudTaskInput) {
    return this.createTask({
      httpMethod: 'POST',
      queueName: TaskQueueName.CANCEL_STRIPE_CHECKOUT_SESSION,
      headers: {
        'Content-Type': 'application/json',
      },
      body: { sessionId },
      url: this.configService.get('EXPIRE_STRIPE_CHECKOUT_TASK_URL'),
      scheduleAt,
    });
  }

  /**
   * Creates a scheduled task via Google Cloud Tasks.
   */
  private async createTask(props: CreateTaskInput) {
    const { body, httpMethod, scheduleAt, url, queueName, headers } = props;

    const project = this.configService.get('GCP_PROJECT_ID');
    const location = this.configService.get('GCP_REGION');
    const parent = this.client.queuePath(project, location, queueName);
    const task: protos.google.cloud.tasks.v2.ITask = {
      httpRequest: {
        httpMethod,
        url,
        headers,
        body: Buffer.from(JSON.stringify(body)).toString('base64'),
        oidcToken: { serviceAccountEmail: `cloud-run@${project}.iam.gserviceaccount.com` },
      },
      scheduleTime: { seconds: scheduleAt },
    };

    const request: protos.google.cloud.tasks.v2.ICreateTaskRequest = {
      parent,
      task,
    };

    const [response] = await this.client.createTask(request, {
      timeout: this.configService.get<number>('GOOGLE_CLOUD_TASKS_TIMEOUT'),
    });

    this.logger.log('Task [%s] scheduled successfully', [response.name?.split('/').pop()]);

    return response;
  }
}
