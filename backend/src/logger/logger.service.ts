import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toLower } from 'lodash';
import * as winston from 'winston';
import { Environment } from '../shared/classes/environment';
import { LoggerLevel } from '../shared/types/logger-level';

const customLevels: Record<LoggerLevel, number> = {
  alert: 0, // Highest priority
  error: 1,
  notice: 2,
  warn: 3,
  info: 4,
  debug: 5,
  verbose: 6,
};

type MetaObject = {
  src?: string;
  [s: string]: any;
};

@Injectable()
export class LoggerService {
  private logger?: winston.Logger;

  constructor(private readonly configService: ConfigService<Environment, true>) {}

  /**
   * Enables logging feature.
   */
  enable() {
    const options = this.getOptions();
    this.logger = winston.createLogger(options);
  }

  // log(message: any, ...meta: any[]): void {
  //   this.logger?.info(message, ...meta);
  // }

  log(message: any, args?: any[], metadata?: MetaObject): void {
    this.logger?.info({
      message,
      metadata,
      splat: args,
    });
  }

  warn(message: any, args?: any[], metadata?: MetaObject): void {
    this.logger?.warn({
      message,
      metadata,
      splat: args,
    });
  }

  error(message: any, args?: any[], metadata?: MetaObject): void {
    this.logger?.error({
      message,
      metadata,
      splat: args,
    });
  }

  debug(message: any, args?: any[], metadata?: MetaObject): void {
    this.logger?.debug({
      message,
      metadata,
      splat: args,
    });
  }

  verbose(message: string, ...meta: any[]): void {
    this.logger?.verbose(message, ...meta);
  }

  alert(message: any, args?: any[], metadata?: MetaObject): void {
    this.logger?.alert({
      message,
      metadata,
      splat: args,
    });
  }

  notice(message: string, ...meta: any[]): void {
    this.logger?.log('notice' satisfies `${LoggerLevel}`, message, ...meta);
  }

  private getSeverity(level: LoggerLevel): string {
    switch (level) {
      case 'debug':
      case 'verbose':
        return 'DEBUG';
      case 'info':
        return 'INFO';
      case 'error':
        return 'ERROR';
      case 'warn':
        return 'WARNING';
      case 'notice':
        return 'NOTICE';
      case 'alert':
        return 'ALERT';
      default:
        return 'DEFAULT';
    }
  }

  private getOptions(): winston.LoggerOptions {
    return {
      levels: customLevels,
      level: toLower(this.configService.get('LOGGER_LEVEL')),
      transports: [new winston.transports.Console()],
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.printf(({ message, level, timestamp, metadata }) => {
          if (this.configService.get<boolean>('LOGGER_GCP_FORMAT')) {
            return JSON.stringify({
              severity: this.getSeverity(level as LoggerLevel),
              message,
              additionalData: metadata,
            });
          }

          const output = `[${level}]: ${message as string}`;

          if (this.configService.get<boolean>('LOGGER_TIMESTAMP')) {
            return `${timestamp as string} - ${output}`;
          }
          return output;
        })
      ),
    };
  }
}
