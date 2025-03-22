import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ReservationStatus } from '../shared/types/reservation-status';
import { VenueEvent } from './event';
import { Seat } from './seat';
import { User } from './user';

@Entity({ name: 'seat-reservations' })
export class SeatReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => VenueEvent, { eager: true })
  @JoinColumn({ name: 'event_id' })
  event: VenueEvent;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Seat, (seat) => seat.reservation, { eager: true })
  seats: Seat[];

  @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.PENDING })
  status: ReservationStatus;

  @Column({ type: 'timestamp', nullable: false })
  reservedUntil: Date;

  @Column({ name: 'stripe_session_id', type: 'varchar', nullable: true })
  stripeSessionId: string | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
