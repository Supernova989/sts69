import { SeatReservation } from 'src/entities/seat-reservation';

export interface CreateCheckoutSession {
  userId: string;
  reservation: SeatReservation;
}
