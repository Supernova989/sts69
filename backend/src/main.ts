import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GoogleCloudTaskService } from './gcp/task.service';
import { TaskQueueName } from './gcp/typings';
import { LoggerService } from './logger/logger.service';
import { StripeService } from './stripe/stripe.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });

  // Logger
  const logger = app.get(LoggerService);
  logger.enable();

  // Stripe
  const stripeService = app.get(StripeService);
  stripeService.enable();

  await app.listen(process.env.PORT ?? 3000);

  logger.log('App is running');
}
bootstrap();
