import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { toBoolean } from '../func/to-boolean';
import { AppStage } from '../types/app-stage';
import { LoggerLevel } from '../types/logger-level';

export class Environment {
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
   * Connection string for PostgreSQL.
   */
  @IsString()
  readonly DATABASE_URL: string;

  /**
   * Service Account for Google Cloud Storage.
   */
  @IsString()
  @IsOptional()
  readonly STORAGE_CREDENTIALS?: string;

  /**
   * Defines the maximum log severity.
   */
  @IsEnum(LoggerLevel)
  @IsOptional()
  readonly LOGGER_LEVEL?: LoggerLevel;

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
}
