import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  contentItems,
  editorialPillars,
  InsertUser,
  moodboardItems,
  projects,
  users,
} from "../drizzle/schema";
import { statusForCompletion, type ContentFormat, type ContentStatus } from "@shared/editoria";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

async function ownedProject(userId: number, projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const result = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).limit(1);
  if (!result[0]) throw new Error("Projeto não encontrado ou sem permissão.");
  return { db, project: result[0] };
}

export async function listProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function createProject(userId: number, input: { name: string; description?: string; brandTone?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const result = await db.insert(projects).values({ userId, ...input });
  return Number(result[0].insertId);
}

export async function updateProjectBrand(userId: number, projectId: number, input: {
  description?: string; brandTone?: string; colorPrimary: string; colorAccent: string; fontHeading: string; fontBody: string;
}) {
  const { db } = await ownedProject(userId, projectId);
  await db.update(projects).set(input).where(eq(projects.id, projectId));
}

export async function listPillars(userId: number) {
  const userProjects = await listProjects(userId);
  if (!userProjects.length) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select().from(editorialPillars).where(inArray(editorialPillars.projectId, userProjects.map(project => project.id))).orderBy(desc(editorialPillars.createdAt));
}

export async function createPillar(userId: number, input: { projectId: number; name: string; theme: string; description?: string; color?: string }) {
  const { db } = await ownedProject(userId, input.projectId);
  const result = await db.insert(editorialPillars).values(input);
  return Number(result[0].insertId);
}

export async function listContent(userId: number) {
  const userProjects = await listProjects(userId);
  if (!userProjects.length) return [];
  const db = await getDb();
  if (!db) return [];
  const items = await db.select().from(contentItems).where(inArray(contentItems.projectId, userProjects.map(project => project.id))).orderBy(desc(contentItems.scheduledFor), desc(contentItems.createdAt));
  const pillars = await listPillars(userId);
  return items.map(item => ({ ...item, pillar: pillars.find(pillar => pillar.id === item.pillarId) ?? null }));
}

export async function createContent(userId: number, input: {
  projectId: number; pillarId?: number | null; title: string; format: ContentFormat; status: ContentStatus;
  scheduledFor?: Date | null; script?: string; caption?: string; hashtags?: string; visualReference?: string; completedAt?: Date | null;
}) {
  const { db } = await ownedProject(userId, input.projectId);
  if (input.pillarId) {
    const pillar = await db.select().from(editorialPillars).where(and(eq(editorialPillars.id, input.pillarId), eq(editorialPillars.projectId, input.projectId))).limit(1);
    if (!pillar[0]) throw new Error("Pilar editorial inválido para este projeto.");
  }
  const result = await db.insert(contentItems).values(input);
  return Number(result[0].insertId);
}

export async function getContentForUser(userId: number, contentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const item = await db.select().from(contentItems).where(eq(contentItems.id, contentId)).limit(1);
  if (!item[0]) throw new Error("Conteúdo não encontrado.");
  await ownedProject(userId, item[0].projectId);
  return { db, item: item[0] };
}

export async function updateContentStatus(userId: number, contentId: number, status: ContentStatus) {
  const { db } = await getContentForUser(userId, contentId);
  await db.update(contentItems).set({ status }).where(eq(contentItems.id, contentId));
}

export async function updateContent(userId: number, contentId: number, input: {
  pillarId?: number | null; title?: string; format?: ContentFormat; status?: ContentStatus; scheduledFor?: Date | null;
  script?: string; caption?: string; hashtags?: string; visualReference?: string;
}) {
  const { db, item } = await getContentForUser(userId, contentId);
  if (input.pillarId) {
    const pillar = await db.select().from(editorialPillars).where(and(eq(editorialPillars.id, input.pillarId), eq(editorialPillars.projectId, item.projectId))).limit(1);
    if (!pillar[0]) throw new Error("Pilar editorial inválido para este projeto.");
  }
  await db.update(contentItems).set(input).where(eq(contentItems.id, contentId));
}

export async function setContentCompleted(userId: number, contentId: number, completed: boolean) {
  const { db } = await getContentForUser(userId, contentId);
  await db.update(contentItems).set({
    completedAt: completed ? new Date() : null,
    status: statusForCompletion(completed),
  }).where(eq(contentItems.id, contentId));
}

export async function listMoodboards(userId: number) {
  const userProjects = await listProjects(userId);
  if (!userProjects.length) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moodboardItems).where(inArray(moodboardItems.projectId, userProjects.map(project => project.id))).orderBy(desc(moodboardItems.createdAt));
}

export async function createMoodboardItem(userId: number, input: { projectId: number; campaign: string; title: string; imageKey: string; imageUrl: string }) {
  const { db } = await ownedProject(userId, input.projectId);
  const result = await db.insert(moodboardItems).values(input);
  return Number(result[0].insertId);
}
