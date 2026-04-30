import NextAuth from 'next-auth';

// Minimal NextAuth instance for the Edge runtime.
// No database, no bcrypt — only JWT signature verification using NEXTAUTH_SECRET.
// Tokens written by the full config (src/lib/auth/config.ts) are readable here
// because both instances share the same secret.
export const { auth } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    jwt({ token }) { return token; },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: { signIn: '/login' },
});
