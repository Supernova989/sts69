import { bgRedBright as bgRB } from 'chalk';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

export const getEnvValidator = <T extends object>(cls: ClassConstructor<T>) => {
  return (config: Record<string, unknown>) => {
    const validatedConfig = plainToInstance(cls, config, {
      enableImplicitConversion: false,
    });
    const errors = validateSync(validatedConfig, {
      skipMissingProperties: false,
    });
    if (errors.length > 0) {
      const output = errors.map((e: any) => {
        let text = `Field ${e.property}:\n`;
        const keys = Object.keys(e.constraints);
        keys.forEach((key) => {
          text += `\t- ${e.constraints[key]}\n`;
        });
        return text;
      });
      throw new Error(
        [bgRB('Make sure all the ENV vars are provided and valid!'), output.join('\n')].join('\n'),
      );
    }
    return { ...validatedConfig };
  };
};
