import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimitByKey } from "@/lib/ratelimit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // Trust the X-Forwarded-Host header from Vercel / any proxy so cookies are
  // issued and validated against the actual production hostname. Without this,
  // NextAuth v5 can refuse to set the session cookie on custom domains, which
  // looks like a sign-in → redirect-back-to-login loop.
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/complete-profile",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Apple({
      clientId: process.env.APPLE_ID!,
      clientSecret: "",
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name
            ? `${profile.name.firstName ?? ""} ${profile.name.lastName ?? ""}`.trim()
            : profile.email?.split("@")[0] ?? "Apple User",
          email: profile.email,
        };
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Throttle brute-force / credential-stuffing per target account.
        const rl = await rateLimitByKey("login", `login:${email.toLowerCase()}`);
        if (!rl.success) {
          throw new Error("Too many sign-in attempts. Please try again later.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.hashedPassword) return null;

        // TODO: Re-enable email verification check when Resend is fully configured with the domain
        // if (!user.emailVerified) {
        //   throw new Error("EMAIL_NOT_VERIFIED");
        // }

        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const ctx = {
        provider: account?.provider,
        email: user?.email,
        userId: user?.id,
        hasProfile: !!profile,
      };
      try {
        // OAuth providers: always allow sign-in, auto-verify email
        if (account?.provider === "google" || account?.provider === "apple") {
          try {
            if (user.email) {
              const existingUser = await prisma.user.findUnique({
                where: { email: user.email },
              });
              if (existingUser && !existingUser.emailVerified) {
                await prisma.user.update({
                  where: { email: user.email },
                  data: { emailVerified: new Date() },
                });
              }
            }
          } catch (innerError) {
            console.error(
              "[auth][signIn] inner DB error (non-blocking):",
              ctx,
              innerError,
            );
          }
          return true;
        }
        return true;
      } catch (error) {
        console.error("[auth][signIn] FATAL:", ctx, error);
        throw error;
      }
    },

    async jwt({ token, user, trigger, session }) {
      const ctx = {
        hasUser: !!user,
        tokenEmail: token?.email,
        trigger,
      };
      try {
        if (user) {
          token.id = user.id as string;
        }

        if (trigger === "update" && session) {
          token.name = session.name;
          token.role = session.role;
        }

        if (token.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: token.email },
              select: { id: true, role: true, name: true, avatarUrl: true, emailVerified: true },
            });
            if (dbUser) {
              token.id = dbUser.id;
              token.role = dbUser.role;
              token.name = dbUser.name;
              // Re-read every request so the banner clears the moment a user verifies.
              token.isEmailVerified = !!dbUser.emailVerified;
              // Strip data: URLs to prevent JWT cookie bloat (>4KB cookies break sessions).
              // Real CDN/S3 URLs are fine, but base64 fallbacks would balloon the cookie.
              if (
                dbUser.avatarUrl &&
                !dbUser.avatarUrl.startsWith("data:")
              ) {
                token.picture = dbUser.avatarUrl;
              } else {
                token.picture = null;
              }
            }
          } catch (innerError) {
            console.error(
              "[auth][jwt] inner DB error (non-blocking):",
              ctx,
              innerError,
            );
          }
        }
        return token;
      } catch (error) {
        console.error("[auth][jwt] FATAL:", ctx, error);
        throw error;
      }
    },

    async redirect({ url, baseUrl }) {
      try {
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        if (new URL(url).origin === baseUrl) return url;
        return baseUrl;
      } catch (error) {
        console.error("[auth][redirect] FATAL:", { url, baseUrl }, error);
        return baseUrl;
      }
    },

    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
          session.user.name = token.name as string;
          session.user.image = (token.picture as string) || null;
          session.user.isEmailVerified = !!token.isEmailVerified;
        }
        return session;
      } catch (error) {
        console.error(
          "[auth][session] FATAL:",
          { sessionUserId: session?.user?.id, tokenId: token?.id },
          error,
        );
        throw error;
      }
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log("[auth][event:signIn]", {
        provider: account?.provider,
        email: user?.email,
        isNewUser,
      });
      // For OAuth signups, attach pending Client-based collaborator invites.
      if (isNewUser && user?.id && user?.email) {
        const { attachPendingInvites } = await import(
          "@/lib/attach-pending-invites"
        );
        await attachPendingInvites(user.id, user.email);
      }
    },
  },
  logger: {
    error(error) {
      console.error("[auth][next-auth-error]", error);
    },
    warn(code) {
      console.warn("[auth][next-auth-warn]", code);
    },
  },
});
