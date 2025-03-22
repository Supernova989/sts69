import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'venue-events' })
export class VenueEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}
