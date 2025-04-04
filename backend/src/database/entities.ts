import { Configuration } from '../entities/configuration';
import { VenueEvent } from '../entities/event';
import { Seat } from '../entities/seat';
import { SeatReservation } from '../entities/seat-reservation';
import { User } from '../entities/user';
import { UserSession } from '../entities/user-session';

export const entities = [User, UserSession, Seat, SeatReservation, VenueEvent, Configuration];
