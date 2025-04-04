import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { DynamicConfigService } from './dynamic-config/dynamic-config.service';
import { defaultConfig } from './dynamic-config/init-data';
import { globalPipeOptions } from './global-pipe-options';
import { LoggerService } from './logger/logger.service';
import { Environment } from './shared/classes/environment';
import { StripeService } from './stripe/stripe.service';

async function bootstrap() {
  const pStart = performance.now();

  const app = await NestFactory.create(AppModule, { logger: ['error'] });

  // Logger
  const logger = app.get(LoggerService);
  logger.enable();

  // Config
  const configService = app.get(ConfigService<Environment>);

  // Dynamic config
  const dcs = app.get(DynamicConfigService);
  await dcs.reload();
  await dcs.initConfigurations(defaultConfig);

  // Stripe
  const stripeService = app.get(StripeService);
  stripeService.enable();

  app
    .use(cookieParser())
    .useGlobalPipes(new ValidationPipe(globalPipeOptions))
    .enableVersioning({
      type: VersioningType.HEADER,
      header: 'X-Client-Type',
    })
    .enableCors({
      credentials: true,
      origin: configService.get('CORS_DOMAINS'),
      // methods: ["GET", "POST", "PATCH"],
    });

  await app.listen(process.env.PORT ?? 3000);

  const pEnd = performance.now();

  logger.log('App has started in %s seconds', [((pEnd - pStart) / 1000).toFixed(3)]);

  process.on('unhandledRejection', (reason, p) => {
    logger.alert('General Unhandled Rejection: %s. %o', [reason, p]);
  });

  process.on('uncaughtException', ({ name, message, stack }, p) => {
    logger.alert('General Uncaught Rejection: %s - %s. %o %o', [name, message, stack, p]);
  });
}
bootstrap();
