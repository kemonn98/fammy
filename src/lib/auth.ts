import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { parseAllowedEmails } from "@/lib/utils";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      const email = profile?.email;
      if (!email || !profile?.email_verified) return false;
      const allowed = parseAllowedEmails();
      return allowed.includes(email);
    },
    async session({ session }) {
      return session;
    },
  },
  trustHost: true,
});
