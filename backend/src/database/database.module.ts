import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import { Environment } from '../shared/classes/environment';
import { entities } from './entities';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // imports: [ConfigModule],
      useFactory: (config: ConfigService<Environment>): TypeOrmModuleOptions => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        ssl: false,
        entities,
        synchronize: true, // true only in dev
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
