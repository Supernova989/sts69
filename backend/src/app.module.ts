import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SeatsModule } from './api/seats/seats.module';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { Environment } from './shared/classes/environment';
import { getEnvValidator } from './shared/func/get-env-validator';
import { StripeModule } from './stripe/stripe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: getEnvValidator(Environment),
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
      // envFilePath: isTestEnvironment() ? 'test-e2e.env' : '.env',
      envFilePath: '.env',
      isGlobal: true,
    }),
    LoggerModule,
    DatabaseModule,
    StripeModule,
    SeatsModule,
  ],
  providers: [AppService],
})
export class AppModule {}
