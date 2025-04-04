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

export interface HandleUserSessionInput {
  sessionId: string;
  refreshToken: string;
  // userId: string;
  ip?: string;
  userAgent?: string;
}
