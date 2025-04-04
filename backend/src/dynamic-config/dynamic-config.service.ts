import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { cloneDeep, difference } from 'lodash';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { Configuration } from '../entities/configuration';
import { LoggerService } from '../logger/logger.service';
import { getClassProps } from '../shared/func/get-class-props';
import { sleep } from '../shared/func/sleep';
import { ConfigurationCache } from './cache';
import { UserSession } from '../entities/user-session';

/**
 * Base class for the system configurations stored in DB.
 * Keeps them cached locally.
 */
@Injectable()
export class DynamicConfigService {
  private readonly cache = new ConfigurationCache();

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Configuration) private readonly configRepo: Repository<Configuration>,
    private readonly logger: LoggerService
  ) {}

  /**
   * Finds dynamic-config documents in DB and saves them to the cache.
   */
  async reload() {
    const configs = await this.configRepo.find({});
    for (const { key, value } of configs) {
      this.cache[key] = value;
    }
  }

  /**
   * Returns a cached dynamic-config object.
   * If no cached value found, a series of retries performed.
   * @param key Configuration key
   * @param retry Enables retry logic
   */
  public async getConfig<T extends keyof ConfigurationCache>(key: T, retry = true): Promise<ConfigurationCache[T]> {
    let value = this.cache[key];
    let attempts = 10;
    if (!retry) {
      return cloneDeep(this.cache[key]);
    }
    while (!value && attempts > 0) {
      await sleep(250);
      attempts--;
      value = cloneDeep(this.cache[key]);
    }
    if (!value) {
      throw new Error(`Configuration ${String(key)} is not cached`);
    }
    return value;
  }

  /**
   * Creates/updates system config locally and in DB.
   * @param key
   * @param value
   * @param updatedBy
   */
  public async setConfig<T extends keyof ConfigurationCache>(
    key: T,
    value: ConfigurationCache[T],
    updatedBy?: string
  ): Promise<void> {
    if (!getClassProps(this.cache.constructor).includes(key as string)) {
      throw new Error('Unknown key');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const configRepo = queryRunner.manager.getRepository(Configuration);
      const existing = await configRepo.findOne({
        where: { key: key as string },
        lock: { mode: 'pessimistic_write' },
      });

      const payload: DeepPartial<Configuration> = {
        key: key as string,
        value: value as Record<string, any>,
        updatedBy: updatedBy ?? 'system',
      };

      if (!existing) {
        await configRepo.save(payload);
      } else {
        await configRepo.update({ id: existing.id }, payload);
      }

      await queryRunner.commitTransaction();
      this.cache[key] = value;
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error('SystemConfigService::setConfig - key: %s - %s', [key, err.message]);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async initConfigurations(initial: ConfigurationCache): Promise<void> {
    const keys = getClassProps(ConfigurationCache) as (keyof ConfigurationCache)[];

    const promises: Promise<void>[] = [];
    for (const key of keys) {
      promises.push(this.initConfiguration(key, initial));
    }
    await Promise.all(promises);
  }

  private async initConfiguration(key: keyof ConfigurationCache, initial: ConfigurationCache): Promise<void> {
    const defaultValue = initial[key];
    if (!defaultValue) {
      this.logger.error('SystemConfigService::initConfiguration - Configuration [%s] is missing default value!', [key]);
      return;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const configRepo = queryRunner.manager.getRepository(Configuration);

      const existing = await configRepo.findOne({ where: { key: key as string } });

      if (!existing) {
        this.logger.log('SystemConfigService::initConfiguration - Configuration [%s] not found. Inserting default...', [
          key,
        ]);
        await queryRunner.manager.save(Configuration, {
          key: key as string,
          value: defaultValue,
          updatedBy: 'system',
        });
      } else {
        const missingKeys = difference(Object.keys(defaultValue), Object.keys(existing.value));
        if (missingKeys.length > 0) {
          const updatedValue = { ...existing.value, ...defaultValue };
          await queryRunner.manager.update(
            Configuration,
            { id: existing.id },
            {
              value: updatedValue as Record<string, any>,
              updatedBy: 'system',
            }
          );
          this.logger.log('SystemConfigService::initConfiguration - Configuration [%s] updated with missing keys: %s', [
            key,
            missingKeys.join(', '),
          ]);
        }
      }

      await queryRunner.commitTransaction();
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error('SystemConfigService::initConfiguration - Failed for key [%s]: %s', [key, err.message]);
    } finally {
      await queryRunner.release();
    }
  }
}
