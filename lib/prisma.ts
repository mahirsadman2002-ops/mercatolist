import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// Soft-delete filter for BusinessListing. Deleting a listing sets `deletedAt`
// instead of removing the row (see the DELETE handler). This extension makes
// every ordinary read transparently ignore soft-deleted rows, so we don't have
// to remember `deletedAt: null` in ~40 query sites — and a missed one can't
// leak a deleted listing to the public.
//
// Opting in to deleted rows (admin views, restore): pass an explicit `deletedAt`
// in the where clause (e.g. `{ deletedAt: { not: null } }`). Because we only
// inject the filter when `deletedAt` isn't already specified, those queries pass
// through untouched. `update`/`delete`/`create` are never filtered, so admin
// restore (via update) and the soft-delete write itself work normally.
function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });

  const base = new PrismaClient({ adapter });

  return base.$extends({
    name: "soft-delete-listings",
    query: {
      businessListing: {
        // List/aggregate reads: inject deletedAt: null unless caller set it.
        async findMany({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findFirst({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findFirstOrThrow({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async count({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async aggregate({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async groupBy({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        // findUnique's where only accepts unique fields, so we can't inject
        // deletedAt there — filter the single result after the fact instead.
        async findUnique({ args, query }) {
          const result = await query(args);
          return result && (result as { deletedAt?: Date | null }).deletedAt
            ? null
            : result;
        },
        async findUniqueOrThrow({ args, query }) {
          const result = await query(args);
          if (result && (result as { deletedAt?: Date | null }).deletedAt) {
            throw new Error("No BusinessListing found (soft-deleted)");
          }
          return result;
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
