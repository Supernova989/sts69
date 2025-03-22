import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });

  // Logger
  const logger = app.get<LoggerService>(LoggerService);
  logger.enable();

  await app.listen(process.env.PORT ?? 3000);

  logger.log('App is running');
}
bootstrap();
