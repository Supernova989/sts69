import { CloudTasksClient, protos } from '@google-cloud/tasks';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { Environment } from '../shared/classes/environment';
import { BaseGcpService } from './shared/base-gcp-service';
import {
  BaseCloudTaskInput,
  CreateTaskInput,
  ScheduleMailInput,
  ScheduleStripeSessionExpirationInput,
  TaskQueueName,
} from './typings';

@Injectable()
export class GoogleCloudTaskService extends BaseGcpService {
  protected override scopes = ['https://www.googleapis.com/auth/cloud-platform'];

  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly logger: LoggerService
  ) {
    super();
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
        Authorization: `Bearer ${await this.getAccessToken()}`,
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
        Authorization: `Bearer ${await this.getAccessToken()}`,
      },
      body: { sessionId },
      url: this.configService.get('EXPIRE_STRIPE_CHECKOUT_TASK_URL'),
      scheduleAt,
    });
  }

  /**
   * Creates a scheduled task via Google Cloud Tasks.
   */
  async createTask(props: CreateTaskInput) {
    const { body, httpMethod, scheduleAt, url, queueName, headers } = props;

    const client = new CloudTasksClient();
    const project = this.configService.get('GCP_PROJECT_ID');
    const location = this.configService.get('GCP_REGION');
    const parent = client.queuePath(project, location, queueName);

    const serviceAccountEmail = this.configService.get('TASKS_SA_EMAIL');

    const task: protos.google.cloud.tasks.v2.ITask = {
      httpRequest: {
        httpMethod,
        url,
        headers,
        body: Buffer.from(JSON.stringify(body)).toString('base64'),
        oidcToken: { serviceAccountEmail },
      },
      scheduleTime: { seconds: scheduleAt },
    };

    const request: protos.google.cloud.tasks.v2.ICreateTaskRequest = {
      parent,
      task,
    };

    const result = await client.createTask(request);

    this.logger.log('Task scheduled successfully');

    return result;
  }
}
