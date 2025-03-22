import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SeatStatus } from '../shared/types/seat-status';
import { SeatReservation } from './seat-reservation';

@Entity({ name: 'seats' })
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  label: string; // e.g., "A1", "B2"

  @Column({ type: 'enum', default: SeatStatus.AVAILABLE, enum: SeatStatus })
  status: SeatStatus;

  @ManyToOne(() => SeatReservation, (reservation) => reservation.seats, { nullable: true })
  @JoinColumn({ name: 'reservation_id' })
  reservation: SeatReservation;
}
