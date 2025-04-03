import { isArray } from 'lodash';
import { defineMetadata, getMetadata } from 'reflect-metadata/no-conflict';

const propertiesMetadataKey = Symbol('properties');

const DEFAULT_TAG = 'default';
const KEY_SEPARATOR = '|||';
const TAG_SEPARATOR = '###';

/**
 * Saves the name of the property as metadata to the class owning it.
 * @example
 * ```ts
 * class MyClass {
 *  @Property()
 *  myProp1: number;
 *
 *  myProp2: boolean;
 * }
 * ```
 */
export function Property(tag: string | string[] = DEFAULT_TAG) {
  const tags = isArray(tag) ? tag : [tag];

  if (!tag.length) {
    throw new Error('At least 1 tag must be defined');
  }

  return function (target: any, propertyKey: string) {
    const properties = getMetadata(propertiesMetadataKey, target) || [];
    properties.push(`${propertyKey}${KEY_SEPARATOR}${tags.sort().join(TAG_SEPARATOR)}`);
    defineMetadata(propertiesMetadataKey, properties, target);
  };
}

/**
 * Extracts property names saved with @Property from the class.
 * @example
 * getClassProps(MyClass); // ['myProp1']
 */
export function getClassProps(target: any, tags: string[] = [DEFAULT_TAG]): string[] {
  const keys: string[] = getMetadata(propertiesMetadataKey, target.prototype) ?? [];

  return keys
    .map((key) => {
      const split: string[] = key.split(KEY_SEPARATOR);
      const name: string = split[0];
      const usedTags: string = split[1];

      if (split.length !== 2 || !usedTags || !name) {
        throw new Error('invalid metadata');
      }
      return { name, usedTags };
    })
    .filter(({ usedTags }) => {
      return usedTags.split(TAG_SEPARATOR).some((tag) => tags.includes(tag));
    })
    .map(({ name }) => name);
}
