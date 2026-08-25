export type UserRole = "USER" | "ADMIN";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface AccessTokenPayload {
  sub: number;
  email: string;
  name: string | null;
  role: UserRole;
  iat?: number;
  exp?: number;
}
