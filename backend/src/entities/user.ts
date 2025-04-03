import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserType } from '../shared/types/user-type';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  firstname: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastname: string | null;

  @Column({ type: 'varchar', select: false })
  password: string;

  @Column({ type: 'enum', enum: UserType })
  type: UserType;

  @Column({ type: 'boolean', default: false })
  active: boolean;
}
