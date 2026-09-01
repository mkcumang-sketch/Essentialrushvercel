import { NextAuthOptions, getServerSession, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";
import bcrypt from "bcryptjs";
import { sanitizeString, sanitizeEmail, sanitizePhone, validatePasswordStrength } from "@/lib/sanitize";

export type UserRole = "USER" | "AGENT" | "STAFF" | "ADMIN" | "SUPER_ADMIN";

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
    maxAge: 30 * 24 * 60 * 60, // 30 Days
  },

  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
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
        // 🛡️ 1. Input Sanitization & String Clamping (LPDoS Defense)
        const rawIdentifier = sanitizeString(credentials?.phone || credentials?.email, 100);
        const rawPassword = typeof credentials?.password === "string" ? credentials.password : "";

        if (!rawIdentifier || !rawPassword) {
          throw new Error("Please enter your Phone number/Email and password.");
        }

        // 🛡️ 2. Strict Exact 8-Character Password Enforcement
        const passwordCheck = validatePasswordStrength(rawPassword);
        if (!passwordCheck.isValid) {
          throw new Error(passwordCheck.error || "Password must be exactly 8 characters with required complexity.");
        }

        await connectDB();

        const isEmail = rawIdentifier.includes("@");
        const cleanPhone = sanitizePhone(rawIdentifier);
        const cleanEmail = sanitizeEmail(rawIdentifier);

        // 🛡️ 3. Safe NoSQL Query with $eq operators to prevent query object injection
        const query = isEmail
          ? { email: { $eq: cleanEmail } }
          : { phone: { $eq: cleanPhone } };

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
      if (user) {
        token.id = user.id;
        token.role = (user.role as UserRole) || "USER";
        token.phone = user.phone || "";
      }

      if (account?.provider === "google" && token.email) {
        await connectDB();
        const cleanEmail = sanitizeEmail(token.email);

        let dbUser = await User.findOne({ email: { $eq: cleanEmail } });

        if (!dbUser) {
          dbUser = await User.create({
            name: sanitizeString(token.name, 60) || "Vault Member",
            email: cleanEmail,
            role: "USER",
            image: typeof token.picture === "string" ? token.picture : "",
          });
        }

        token.id = dbUser._id.toString();
        token.role = (dbUser.role as UserRole) || "USER";
        token.phone = dbUser.phone || "";
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