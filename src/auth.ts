import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import {
  getAdminAuthSetupIssues,
  getAuthSecret,
  getGoogleClientId,
  getGoogleClientSecret,
  isAdminEmail,
} from "@/lib/admin-auth";

const authIsConfigured = getAdminAuthSetupIssues().length === 0;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: getAuthSecret() ?? "admin-auth-not-configured",
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    error: "/admin/unauthorized",
  },
  providers: authIsConfigured
    ? [
        Google({
          clientId: getGoogleClientId() ?? "",
          clientSecret: getGoogleClientSecret() ?? "",
          authorization: {
            params: {
              prompt: "select_account",
            },
          },
        }),
      ]
    : [],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") {
        return false;
      }

      const email = typeof profile?.email === "string" ? profile.email : null;
      const emailVerified =
        typeof profile?.email_verified === "boolean"
          ? profile.email_verified
          : false;

      if (!emailVerified || !isAdminEmail(email)) {
        return "/admin/unauthorized";
      }

      return true;
    },
  },
});
