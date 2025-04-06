import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'user-sessions' })
export class UserSession {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  // @Column({ type: 'varchar', name: 'user_id' })
  // userId: string;

  @Column({ type: 'varchar', name: 'refresh_token_hash' })
  refreshTokenHash: string;

  @Column({ type: 'varchar', name: 'user_agent', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', nullable: true })
  ip: string | null;

  @Column({ default: false })
  expired: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
