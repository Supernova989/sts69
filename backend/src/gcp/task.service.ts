import { CloudTasksClient, protos } from '@google-cloud/tasks';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { Environment } from '../shared/classes/environment';
import { BaseGcpService } from './shared/base-gcp-service';
import { CreateTaskProps, TaskQueueName } from './typings';

@Injectable()
export class GoogleCloudTaskService extends BaseGcpService {
  protected override scopes = ['https://www.googleapis.com/auth/cloud-platform'];

  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly logger: LoggerService
  ) {
    super();
  }

  async createQueue(name: string) {
    const client = new CloudTasksClient();
    const project = this.configService.get('GCP_PROJECT_ID');
    const location = this.configService.get('GCP_REGION');

    const parent = client.locationPath(project, location);
    const queuePath = client.queuePath(project, location, name);

    const request = {
      parent,
      queue: {
        name: queuePath,
        rateLimits: {
          maxDispatchesPerSecond: 5,
          maxConcurrentDispatches: 10,
        },
        retryConfig: {
          maxAttempts: 10,
          maxRetryDuration: { seconds: 10 },
          minBackoff: { seconds: 1 },
          maxBackoff: { seconds: 10 },
        },
      },
    };

    try {
      return await client.createQueue(request);
    } catch (error) {
      if (error.code === 6) {
        // ignore if already exists
        return;
      }
      this.logger.error('Failed to create task queue - %s', [error.message], {
        src: 'GoogleCloudTaskService::createQueue',
      });
    }
  }

  /**
   * Schedules a task to expire a Stripe session. Used for session lifetime below 30 minutes.
   */
  async scheduleStripeSessionExpiration(sessionId: string) {
    return this.createTask<{ sessionId: string }>({
      httpMethod: 'POST',
      queueName: TaskQueueName.CANCEL_STRIPE_CHECKOUT_SESSIONS,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await this.getAccessToken()}`,
      },
      body: { sessionId },
      url: '',
      scheduleAt: 0,
    });
  }

  /**
   * Creates a scheduled task via Google Cloud Tasks.
   */
  async createTask<T extends object = object>(props: CreateTaskProps<T>) {
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
