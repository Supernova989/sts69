import { Buffer } from 'node:buffer';

/**
 * Decodes a string from base64 and parses as a JSON object.
 */
export function safeBase64ToObject<T extends object>(value: string): T | undefined {
  try {
    return JSON.parse(Buffer.from(value, 'base64').toString('utf-8'));
  } catch (err: any) {
    /* empty */
  }
}
