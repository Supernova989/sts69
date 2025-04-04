import { plainToInstance } from 'class-transformer';
import { ConfigurationCache } from './cache';

export const defaultConfig = plainToInstance<ConfigurationCache, ConfigurationCache>(ConfigurationCache, {
  stripe: {
    enable: true,
  },
  rsa512: {
    publicKey:
      '-----BEGIN PUBLIC KEY-----\n' +
      'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK55rlJ7Okf39x5wcey+Ud7wiXj4cjBN\n' +
      '03YgLZVOCbyEM3jEWHsJ+SAweG8qLQOAECsHWofQI+wyPpniXiH1isECAwEAAQ==\n' +
      '-----END PUBLIC KEY-----',
    privateKey:
      '-----BEGIN RSA PRIVATE KEY-----\n' +
      'MIIBPAIBAAJBAK55rlJ7Okf39x5wcey+Ud7wiXj4cjBN03YgLZVOCbyEM3jEWHsJ\n' +
      '+SAweG8qLQOAECsHWofQI+wyPpniXiH1isECAwEAAQJBAI7D7op7XtMo6cK0i+QG\n' +
      'T4O3GyYrVXSFGjUcW3BCbOEdh1udKOXDeca7MwrSSGBSZIw9i15o1H09hkcaum+X\n' +
      '/OkCIQDvWLYq3atBdO34GwoZ/xKF8rliQbXS7/SGhMIiUIqq3wIhALqdeGSTbdy2\n' +
      'dFdDpjtG0+yfxYRsY0Psga5l837qxh5fAiAPudJuSpY//MDN9mjZgGrlJieMDyk1\n' +
      'LNLyK7LdslEKHQIhAIPi+Iw0OYesFwr5T4lDJFFuFVzicUE26+vCN9VxvTUHAiEA\n' +
      '0eSRILO2ULT6GVxD7XajUDlUBKhcgrJR8bLiMo0ZoNk=\n' +
      '-----END RSA PRIVATE KEY-----',
  },
  rsa4096: {
    publicKey:
      '-----BEGIN PUBLIC KEY-----\n' +
      'MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAiAlbwUhxWIuz8sGbp9L3\n' +
      '3L+OvSz4qtXKFiuxFLAEetL7pJMbru/G6Eofx7Vo2ADdThaX3Lv84YKPXilW4o3b\n' +
      '0IxjxaOjhEfqJkvYz+XetUN3P6vAt1AFw+7K6Si2Vbk6a3lumrZ+uFiWBCKovaMc\n' +
      'n+3rp1TFOtT/6H7Uv5RwkBMKkp5pg68WNgsW0PTXh/JmRmxhxDyIlNdDktkaDE5O\n' +
      '1GxU7HVmBI//D7ebFuMXwFJMT8IzVnY+KkGcNHxKLDlZNCKqbyIwwtJbAlg54Uhz\n' +
      '8U1GciFcVIG0IyPO1vvaNS6q1ohGx7wtjQF0wl4KndMainwQArvdAxtQvbhjY/A/\n' +
      '++CcvsXA8oTGBNIQ0s6OVwukbEETO6hUkbkuf1AktWDJMoFog68Yxb6OXfEKjDSG\n' +
      'EGls+mwUPbGdKf6z3lhsYhmvjNTCQiagI6Y6vmd5XLdWdCM36asHYHTgHdJnSJLa\n' +
      'r/TPjgfcrwx9eIdE5vK1DwJG0emyLUtw3akezAqjQ7S0l5XhJjeA7iVczEpsH628\n' +
      'T6UGycBlep9WcrpG4sq++L7GL7T5gaHcVorEgSl1cmWf+yUVk61QfNue/54lOupc\n' +
      'bfjxA9CddBlo7cy8bW9Kx0iWySdHCi0VmsvziZourkdEYuuZwdoxBCYinJTRu3gi\n' +
      'q7O03NuOeKG9XtDmRG8qcn8CAwEAAQ==\n' +
      '-----END PUBLIC KEY-----',
    privateKey:
      '-----BEGIN RSA PRIVATE KEY-----\n' +
      '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\n' +
      '-----END RSA PRIVATE KEY-----',
  },
});
