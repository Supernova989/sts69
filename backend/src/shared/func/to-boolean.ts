import { toLower, toString } from 'lodash';

/**
 * @param value
 * @throws Error when the value cannot be cast to Boolean
 */
export const toBoolean = (value: any): boolean => {
  if (typeof value === 'undefined') {
    return false;
  }
  if (!['string', 'number'].includes(typeof value)) {
    throw new Error('Cannot transform value to boolean');
  }
  switch (toLower(toString(value))) {
    case 'true':
    case '1': {
      return true;
    }
    case 'false':
    case '0': {
      return false;
    }
    default:
      throw new Error('Cannot transform value to boolean');
  }
};
