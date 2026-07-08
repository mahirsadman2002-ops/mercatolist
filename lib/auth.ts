import NextAuth from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimitByKey } from "@/lib/ratelimit";

// Our User model stores the profile photo as `avatarUrl`, but the standard
// PrismaAdapter writes/reads NextAuth's `image` field. Without translating,
// createUser("... image ...") throws "Unknown argument `image`" on the FIRST
// OAuth sign-in of a new account (error=Configuration) — existing accounts are
// unaffected because they link/read instead of create. Map both directions.
function mercatoAdapter(): Adapter {
  const base = PrismaAdapter(prisma);
  const withImage = (u: any): AdapterUser =>
    ({ ...u, image: u?.avatarUrl ?? null }) as AdapterUser;
  return {
    ...base,
    createUser: async ({ id: _id, image, name, email, emailVerified }) => {
      const user = await prisma.user.create({
        data: {
          name: name || email?.split("@")[0] || "New User",
          email: email!,
          emailVerified,
          avatarUrl: image ?? null,
        },
      });
      return withImage(user);
    },
    updateUser: async ({ id, image, name, ...data }) => {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...data,
          ...(name != null ? { name } : {}),
          ...(image !== undefined ? { avatarUrl: image ?? null } : {}),
        } as any,
      });
      return withImage(user);
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: mercatoAdapter(),
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
      // NOTE: allowDangerousEmailAccountLinking is intentionally OFF. With it
      // on, an attacker could pre-register victim@gmail with their own password;
      // when the victim later signed in with Google it would silently link to
      // that row, leaving the attacker's password valid = account takeover.
      // Off, Google only ever creates a NEW account or signs into one already
      // linked to that Google identity. (Managed/import accounts set a password
      // via their claim link instead of Google.)
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Normalize so login resolves to the same row registration stored
        // (emails are stored lowercased).
        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        // Throttle brute-force / credential-stuffing per target account.
        const rl = await rateLimitByKey("login", `login:${email}`);
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
              if (existingUser) {
                const data: { emailVerified?: Date; claimedAt?: Date; isManaged?: boolean } = {};
                if (!existingUser.emailVerified) data.emailVerified = new Date();
                // A managed (imported) owner who signs in with Google has
                // effectively claimed their account — stop the recurring
                // "claim your account" emails.
                if (existingUser.isManaged && !existingUser.claimedAt) {
                  data.claimedAt = new Date();
                  data.isManaged = false;
                }
                if (Object.keys(data).length > 0) {
                  await prisma.user.update({ where: { email: user.email }, data });
                }
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
