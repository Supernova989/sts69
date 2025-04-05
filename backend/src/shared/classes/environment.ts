import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, Max } from 'class-validator';
import { safeBase64ToObject } from '../func/safe-base64-to-object';
import { toBoolean } from '../func/to-boolean';
import { AppStage } from '../types/app-stage';
import { LoggerLevel } from '../types/logger-level';

export class Environment {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsOptional()
  PORT?: number;

  @Transform((v) =>
    v.value
      ?.split(',')
      .map((s) => s.trim())
      .filter((v) => !!v)
  )
  @IsString({ each: true })
  @IsArray()
  readonly CORS_DOMAINS: string[];

  /**
   * Stage where the app runs - locally, remotely in the dev stage or in production.
   */
  @IsEnum(AppStage)
  readonly STAGE: AppStage;

  /**
   * Environment identifier used for testing.
   */
  @IsString()
  @IsOptional()
  readonly NODE_ENV?: string;

  /**
   * JWT secret.
   */
  @IsString()
  readonly JWT_SECRET: string;

  /**
   * Issuer for JWT.
   */
  @IsString()
  readonly JWT_ISSUER: string;

  /**
   * Expiration time for JWT (minutes)
   */
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Max(60)
  @IsOptional()
  readonly JWT_EXPIRE_TIME: number = 15;

  /**
   * Connection string for PostgreSQL.
   */
  @IsString()
  readonly DATABASE_URL: string;

  /**
   * Location of GCP project.
   */
  @IsString()
  readonly GCP_REGION: string;

  /**
   * Identifier of GCP project.
   */
  @IsString()
  readonly GCP_PROJECT_ID: string;

  /**
   * Debug: default credentials for Google Cloud Tasks.
   */
  @Transform(({ value }) => safeBase64ToObject(value))
  @IsObject()
  @IsOptional()
  readonly GOOGLE_CLOUD_TASKS_CREDENTIALS?: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsOptional()
  readonly GOOGLE_CLOUD_TASKS_TIMEOUT: number = 300;

  /**
   * Defines the maximum log severity.
   */
  @IsEnum(LoggerLevel)
  @IsOptional()
  readonly LOGGER_LEVEL?: LoggerLevel;

  /**
   * Enables multi session for users. If on, additional logins won't kick out the user.
   */
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  @IsOptional()
  readonly ENABLE_MULTI_SESSION?: boolean = true;

  /**
   * Uses the Google Cloud Platform logger format.
   */
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  @IsOptional()
  readonly LOGGER_GCP_FORMAT?: boolean;

  /**
   * Adds a timestamp prefix to logs.
   */
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  @IsOptional()
  readonly LOGGER_TIMESTAMP?: boolean;

  /**
   * Stripe publishable key.
   */
  @IsString()
  readonly STRIPE_PUBLIC_KEY: string;

  /**
   * Stripe private key.
   */
  @IsString()
  readonly STRIPE_PRIVATE_KEY: string;

  /**
   * Stripe checkout success URL.
   */
  @IsString()
  readonly STRIPE_CHECKOUT_SUCCESS_URL: string;

  /**
   * URL of the endpoint expiring Stripe checkout sessions.
   */
  @IsString()
  readonly EXPIRE_STRIPE_CHECKOUT_TASK_URL: string;

  /**
   * URL of the endpoint expiring Stripe checkout sessions.
   */
  @IsString()
  readonly SEND_EMAIL_TASK_URL: string;
}
