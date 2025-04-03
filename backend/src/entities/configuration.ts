import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('configurations')
export class Configuration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  key: string;

  @Column()
  updatedBy: string;

  @Column({ type: 'jsonb' })
  value: Record<string, any>;
}
