import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationModule } from './api/authentication/authentication.module';
import { SeatsModule } from './api/seats/seats.module';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { GoogleCloudPlatformModule } from './gcp/gcp.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RoleGuard } from './guards/role.guard';
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
    GoogleCloudPlatformModule,
    AuthenticationModule,
    SeatsModule,
  ],
  providers: [
    AppService,
    // guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule {}
