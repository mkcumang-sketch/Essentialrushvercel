// types/next-auth.d.ts
import 'next-auth';

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
}

declare module 'next-auth' {
  interface Session {
    user: SessionUser;
  }

  interface User {
    id: string;
    role?: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}