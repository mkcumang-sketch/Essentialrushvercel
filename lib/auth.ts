import { NextAuthOptions, getServerSession, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";
import bcrypt from "bcryptjs";

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      phone?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: UserRole;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    phone?: string;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone or Email", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        await connectDB();

        const identifier = (credentials?.phone || credentials?.email || "").trim();
        const rawPassword = credentials?.password || "";

        if (!identifier || !rawPassword) {
          throw new Error("Please enter your Phone number/Email and password.");
        }

        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD?.trim();
        const isEmail = identifier.includes("@");
        const cleanPhone = identifier.replace(/[^\d+]/g, "");

        // Godmode Admin Hardcoded Bypass
        if (
          adminEmail &&
          adminPassword &&
          identifier.toLowerCase() === adminEmail &&
          rawPassword === adminPassword
        ) {
          return {
            id: "system-admin-id",
            name: "Godmode Admin",
            email: adminEmail,
            role: "SUPER_ADMIN" as UserRole,
          };
        }

        // Standard Database Query
        const query = isEmail
          ? { email: identifier.toLowerCase() }
          : { phone: cleanPhone };

        const user = await User.findOne(query).select("+password").exec();

        if (!user) {
          throw new Error("No account found with this Phone/Email.");
        }
        if (!user.password) {
          throw new Error("No password set. Please log in with Google.");
        }

        const isMatch = await bcrypt.compare(rawPassword, user.password);

        if (!isMatch) {
          throw new Error("Incorrect password. Please try again.");
        }

        return {
          id: user._id.toString(),
          name: user.name || "Vault Member",
          email: user.email || null,
          phone: user.phone || cleanPhone,
          role: (user.role as UserRole) || "USER",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // 1. Initial Login from Credentials
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
        token.phone = (user as any).phone || "";
      }

      // 2. Google OAuth Profile Sync & Auto User Creation
      if (account?.provider === "google" && token.email) {
        await connectDB();
        const cleanEmail = token.email.toLowerCase().trim();

        let dbUser = await User.findOne({ email: cleanEmail });

        if (!dbUser) {
          dbUser = await User.create({
            name: token.name || "Vault Member",
            email: cleanEmail,
            role: "USER",
            image: token.picture || "",
          });
        }

        token.id = dbUser._id.toString();
        token.role = (dbUser.role as UserRole) || "USER";
        token.phone = dbUser.phone || "";
      }

      // 3. Dynamic Godmode Role Override (for Google OAuth and Credentials)
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const tokenEmail = token.email?.trim().toLowerCase();

      if (adminEmail && tokenEmail && tokenEmail === adminEmail) {
        token.role = "SUPER_ADMIN";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role as UserRole;
        (session.user as any).phone = token.phone || "";
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

export async function isSuperAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "SUPER_ADMIN";
}

export async function requireSuperAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "SUPER_ADMIN";
}