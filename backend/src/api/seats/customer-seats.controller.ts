import { Controller } from '@nestjs/common';
import { CustomerSeatsService } from './customer-seats.service';

@Controller('api/v1/seats')
export class CustomerSeatsController {
  constructor(private readonly customerSeatsService: CustomerSeatsService) {}
}
