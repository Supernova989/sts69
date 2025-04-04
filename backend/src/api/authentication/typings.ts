import { Response } from 'express';
import { User } from '../../entities/user';

export interface RegisterInput {
  email: string;
  password: string;
  firstname?: string;
  lastname?: string;
}

export interface CreateUserInput {
  email: string;
  plainPassword: string;
  firstname?: string;
  lastname?: string;
}

export interface UserSessionMetadata {
  ip?: string;
  userAgent?: string;
}

export interface LoginInput extends UserSessionMetadata {
  user: User;
  response: Response;
}

export interface HandleUserSessionInput extends UserSessionMetadata {
  sessionId: string;
  refreshToken: string;
}

export interface RefreshLoginInput extends UserSessionMetadata {
  refreshToken?: string;
  response: Response;
  ip?: string;
}

export interface GenerateTokensInput {
  sessionId: string;
  userId: string;
}
