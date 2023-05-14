export interface TokenPayload {
  sub: string;
  email: string;
  sessionId: string;
}

export interface TokenUser {
  userId: string;
  email: string;
  sessionId: string;
}
