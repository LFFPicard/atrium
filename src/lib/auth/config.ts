import NextAuth, { DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

const DEFAULT_SECRET = 'changeme_generate_a_real_secret';
const secret = process.env.NEXTAUTH_SECRET;
if (!secret || secret === DEFAULT_SECRET) {
  const msg = !secret
    ? '[atrium] SECURITY: NEXTAUTH_SECRET is not set. Sessions will be insecure. Generate one with: openssl rand -base64 32'
    : '[atrium] SECURITY: NEXTAUTH_SECRET is still the default placeholder. Replace it immediately: openssl rand -base64 32';
  console.error(msg);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET must be changed from its default value before running in production.');
  }
}

declare module 'next-auth' {
  interface User {
    role: string;
    username: string;
  }
  interface Session {
    user: { role: string; username: string } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: string;
    username: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.username, username),
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.username = token.username;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});
