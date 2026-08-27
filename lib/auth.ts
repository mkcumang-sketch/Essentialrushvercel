import { NextAuthOptions, getServerSession, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/types/next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),

    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        await connectDB();

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const email = credentials.email.trim().toLowerCase();
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

        // 🚀 FIX: .env.local HARDCODED ADMIN CHECK
        // Agar credentials file wale admin se match hote hain, toh DB check bypass kar do
        if (adminEmail && email === adminEmail && credentials.password === process.env.ADMIN_PASSWORD) {
          return {
            id: "system-admin-id",
            name: "Godmode Admin",
            email: adminEmail,
            role: "SUPER_ADMIN",
          };
        }

        // Normal Users ke liye DB check
        const user = await User.findOne({ email }).select("+password").exec();

        if (!user) {
          throw new Error("User not found");
        }
        if (!user.password) {
          throw new Error("Password not found");
        }

        const isMatch = await bcrypt.compare(credentials.password, user.password);

        if (!isMatch) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          name: user.name || null,
          email: user.email || null,
          role: user.role || "USER",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "USER";
      }

      if (account?.provider === "google" && token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email.toLowerCase() });
        
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role || "USER";
        } else {
          token.role = "USER";
        }
      }

      // 🚀 THE ULTIMATE GODMODE OVERRIDE:
      // Chahe wo Google se aaye ya form se, agar email ADMIN_EMAIL hai, toh assign SUPER_ADMIN!
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      if (adminEmail && token.email?.toLowerCase() === adminEmail) {
        token.role = "SUPER_ADMIN";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id || "";
        (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    },
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
  if (!session?.user) {
    return false;
  }
  return session.user.role === "SUPER_ADMIN";
}