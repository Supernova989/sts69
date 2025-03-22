import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Seat } from '../../entities/seat';

@Injectable()
export class AdminSeatsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Seat) private readonly seatRepository: Repository<Seat>
  ) {}

  async getById(id: string) {
    return this.seatRepository.findOneOrFail({ where: { id } });
  }
}
