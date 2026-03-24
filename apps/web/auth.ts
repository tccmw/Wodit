import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const hasGoogleOAuthConfig = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== "your-google-client-id" &&
    process.env.GOOGLE_CLIENT_SECRET !== "your-google-client-secret"
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: hasGoogleOAuthConfig
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        })
      ]
    : [],
  secret: process.env.AUTH_SECRET || "wodit-dev-secret-change-me",
  trustHost: true,
  pages: {
    signIn: "/"
  }
});

export { hasGoogleOAuthConfig };
