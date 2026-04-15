/**
 * NeuralHub · Prisma Client Singleton
 *
 * Prevents "too many connections" in Next.js dev due to hot module reloads.
 * In production, PgBouncer handles connection pooling at the infrastructure layer.
 */

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "warn", "error"]
      : ["error"],
    errorFormat: "minimal",
  });
}

export const prisma: PrismaClient =
  global.__prisma ?? (global.__prisma = createPrismaClient());

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
