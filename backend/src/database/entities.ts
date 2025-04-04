import { Configuration } from '../entities/configuration';
import { VenueEvent } from '../entities/event';
import { Seat } from '../entities/seat';
import { SeatReservation } from '../entities/seat-reservation';
import { User } from '../entities/user';

export const entities = [User, Seat, SeatReservation, VenueEvent, Configuration];
