import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __homemind_prisma__: PrismaClient | undefined;
}

// Prevent hot-reloading in development from exhausting connection pools
export const prisma = global.__homemind_prisma__ || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__homemind_prisma__ = prisma;
}

export function createTenantPrismaClient(householdId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          args.where = { ...args.where, householdId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, householdId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, householdId };
          return query(args);
        },
      },
    },
  });
}
