import { Module } from '@nestjs/common';
import { AdminSeatsController } from './admin-seats.controller';
import { AdminSeatsService } from './admin-seats.service';
import { CustomerSeatsController } from './customer-seats.controller';
import { CustomerSeatsService } from './customer-seats.service';

@Module({
  controllers: [AdminSeatsController, CustomerSeatsController],
  providers: [AdminSeatsService, CustomerSeatsService],
})
export class SeatsModule {}
