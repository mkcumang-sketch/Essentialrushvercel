import { NextAuthOptions, getServerSession, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";
import bcrypt from "bcryptjs";

// Export UserRole explicitly to ensure type safety across the app
export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
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

        // 🚀 THE ULTIMATE GODMODE OVERRIDE:
        // Bypass DB check if credentials match the admin environment variables
        if (adminEmail && email === adminEmail && credentials.password === process.env.ADMIN_PASSWORD) {
          return {
            id: "system-admin-id",
            name: "Godmode Admin",
            email: adminEmail,
            role: "SUPER_ADMIN" as UserRole,
          };
        }

        // Standard User DB Check
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
          role: (user.role as UserRole) || "USER",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user.role as UserRole) || "USER";
      }

      if (account?.provider === "google" && token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email.toLowerCase() });
        
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = (dbUser.role as UserRole) || "USER";
        } else {
          token.role = "USER";
        }
      }

      // 🚀 GODMODE OVERRIDE FOR OAUTH:
      // Assign SUPER_ADMIN role dynamically if the logged-in email matches ADMIN_EMAIL
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      if (adminEmail && token.email?.toLowerCase() === adminEmail) {
        token.role = "SUPER_ADMIN";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
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