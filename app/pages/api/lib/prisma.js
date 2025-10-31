// lib/prisma.js
// Import the generated Prisma client directly (generator outputs to ../generated/prisma)
import { PrismaClient } from "../../../generated/prisma";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "info", "warn", "error"], // utile pour debug
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
