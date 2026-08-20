import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 140 }).notNull(),
  description: text("description"),
  brandTone: text("brandTone"),
  colorPrimary: varchar("colorPrimary", { length: 24 }).default("#27211D").notNull(),
  colorAccent: varchar("colorAccent", { length: 24 }).default("#B68A56").notNull(),
  fontHeading: varchar("fontHeading", { length: 100 }).default("Playfair Display").notNull(),
  fontBody: varchar("fontBody", { length: 100 }).default("DM Sans").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const editorialPillars = mysqlTable("editorialPillars", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  theme: varchar("theme", { length: 160 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 24 }).default("#B68A56").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const contentItems = mysqlTable("contentItems", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  pillarId: int("pillarId"),
  title: varchar("title", { length: 180 }).notNull(),
  format: mysqlEnum("format", ["stories", "reels 7s", "reels longo", "carrossel"]).notNull(),
  status: mysqlEnum("status", ["ideia", "em produção", "pronto", "publicado"]).default("ideia").notNull(),
  scheduledFor: timestamp("scheduledFor"),
  script: text("script"),
  caption: text("caption"),
  hashtags: text("hashtags"),
  visualReference: text("visualReference"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const moodboardItems = mysqlTable("moodboardItems", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  campaign: varchar("campaign", { length: 140 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 1024 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
