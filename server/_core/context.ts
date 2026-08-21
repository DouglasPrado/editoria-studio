import { clerkClient, getAuth } from "@clerk/express";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import * as postgresDb from "../db-postgres";
import { sdk } from "./sdk";
import { ENV } from "./env";

export type TrpcContext = { req: CreateExpressContextOptions["req"]; res: CreateExpressContextOptions["res"]; user: User | null; };

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    if (ENV.runtime === "external") {
      const auth = getAuth(opts.req);
      if (auth.isAuthenticated && auth.userId) {
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || clerkUser.id;
        await postgresDb.upsertUser({ openId: clerkUser.id, name, email: clerkUser.primaryEmailAddress?.emailAddress ?? null, loginMethod: "clerk" });
        user = await postgresDb.getUserByOpenId(clerkUser.id) ?? null;
      }
    } else {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch { user = null; }
  return { req: opts.req, res: opts.res, user };
}
