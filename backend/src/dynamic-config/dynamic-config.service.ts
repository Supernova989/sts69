import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { cloneDeep, difference } from 'lodash';
import { DeepPartial, Repository } from 'typeorm';
import { Configuration } from '../entities/configuration';
import { LoggerService } from '../logger/logger.service';
import { getClassProps } from '../shared/func/get-class-props';
import { sleep } from '../shared/func/sleep';
import { ConfigurationCache } from './cache';

/**
 * Base class for the system configurations stored in DB.
 * Keeps them cached locally.
 */
@Injectable()
export class DynamicConfigService {
  private readonly cache = new ConfigurationCache();

  constructor(
    @InjectRepository(Configuration) private readonly cfgRepository: Repository<Configuration>,
    private readonly logger: LoggerService
  ) {}

  /**
   * Finds dynamic-config documents in DB and saves them to the cache.
   */
  async reload() {
    const configs = await this.cfgRepository.find({});
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

    this.cache[key] = value;

    const payload: DeepPartial<Configuration> = {
      key: key as string,
      value: value as Record<string, any>,
      updatedBy: updatedBy ?? 'system',
    };

    try {
      const existing = await this.cfgRepository.findOne({ where: { key: key as string } });

      if (!existing) {
        await this.cfgRepository.save(payload);
      } else {
        await this.cfgRepository.update(
          { id: existing.id },
          {
            ...payload,
            //  version: (existing.version ?? 0) + 1,
          }
        );
      }
    } catch (err: any) {
      this.logger.error('SystemConfigService::setConfig - key: %s - %s', [key, err.message]);
    }
  }

  async initConfigurations(initial: ConfigurationCache): Promise<void> {
    const keys = getClassProps(this.cache.constructor) as (keyof ConfigurationCache)[];

    const promises: Promise<void>[] = [];
    for (const key of keys) {
      promises.push(this.initConfiguration(key, initial));
    }
    await Promise.all(promises);
  }

  private async initConfiguration(key: keyof ConfigurationCache, initial: ConfigurationCache) {
    const fnStart = performance.now();

    const defaultValue = initial[key];
    if (!defaultValue) {
      this.logger.error('SystemConfigService::initConfiguration - Configuration [%s] is missing default value!', [key]);
      return;
    }
    const cfg = await this.getConfig(key, false);
    if (!cfg) {
      this.logger.log('SystemConfigService::initConfiguration - Configuration [%s] is not found. Initializing...', [
        key,
      ]);
      await this.setConfig(key, defaultValue);

      const fnEnd = performance.now();
      this.logger.debug('SystemConfigService::initConfiguration - init [%s] done in %s', [
        key,
        ((fnEnd - fnStart) / 1000).toFixed(3),
      ]);
      return;
    }
    const missingKeys = difference(Object.keys(defaultValue), Object.keys(cfg));
    for (const mk of missingKeys) {
      if (cfg[mk]) {
        return;
      }
      await this.setConfig(key, { ...cfg, [mk]: defaultValue[mk] });
      this.logger.log(
        'SystemConfigService::initConfiguration - Configuration [%s] is missing property [%s]. Adding...',
        [key, mk]
      );
    }
  }
}
