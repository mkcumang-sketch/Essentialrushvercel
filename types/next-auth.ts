export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface NextAuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
}

export interface NextAuthSession {
  user?: NextAuthUser;
  expires?: string;
}
