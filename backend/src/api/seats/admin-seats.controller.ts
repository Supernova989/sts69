import { Controller, Get, Param } from '@nestjs/common';
import { AdminSeatsService } from './admin-seats.service';

@Controller('api/v1/admin/seats')
export class AdminSeatsController {
  constructor(private readonly adminSeatsService: AdminSeatsService) {}

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.adminSeatsService.getById(id);
  }

  @Get()
  find() {}

  @Get()
  create() {}

  @Get()
  patch() {}
}
