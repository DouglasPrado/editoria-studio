import fs from "node:fs/promises";
import { Client } from "pg";

const targetUrl = process.env.DATABASE_URL;
const source = process.env.IMPORT_FILE ?? "external/data/editoria-export.json";
const clerkOwnerUserId = process.env.CLERK_OWNER_USER_ID;
if (!targetUrl) throw new Error("Defina DATABASE_URL com a URL interna do PostgreSQL no Easypanel.");
const data = JSON.parse(await fs.readFile(source, "utf8"));
const client = new Client({ connectionString: targetUrl, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
const value = (row, camel, snake = camel) => row[camel] ?? row[snake] ?? null;
await client.connect();
try {
  await client.query("BEGIN");
  for (const row of data.users) {
    const importedOpenId = data.users.length === 1 && clerkOwnerUserId ? clerkOwnerUserId : value(row, "openId", "open_id");
    await client.query(`INSERT INTO users (id, open_id, name, email, login_method, role, created_at, updated_at, last_signed_in) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO UPDATE SET open_id = EXCLUDED.open_id, name = EXCLUDED.name, email = EXCLUDED.email`, [row.id, importedOpenId, row.name, row.email, clerkOwnerUserId ? "clerk" : value(row, "loginMethod", "login_method"), row.role, value(row, "createdAt", "created_at"), value(row, "updatedAt", "updated_at"), value(row, "lastSignedIn", "last_signed_in")]);
  }
  for (const row of data.projects) await client.query(`INSERT INTO projects (id, user_id, name, description, brand_tone, color_primary, color_accent, font_heading, font_body, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`, [row.id, value(row, "userId", "user_id"), row.name, row.description, value(row, "brandTone", "brand_tone"), value(row, "colorPrimary", "color_primary"), value(row, "colorAccent", "color_accent"), value(row, "fontHeading", "font_heading"), value(row, "fontBody", "font_body"), value(row, "createdAt", "created_at"), value(row, "updatedAt", "updated_at")]);
  for (const row of data.pillars) await client.query(`INSERT INTO editorial_pillars (id, project_id, name, theme, description, color, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`, [row.id, value(row, "projectId", "project_id"), row.name, row.theme, row.description, row.color, value(row, "createdAt", "created_at")]);
  for (const row of data.content) await client.query(`INSERT INTO content_items (id, project_id, pillar_id, title, format, status, scheduled_for, script, caption, hashtags, visual_reference, completed_at, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO NOTHING`, [row.id, value(row, "projectId", "project_id"), value(row, "pillarId", "pillar_id"), row.title, row.format, row.status, value(row, "scheduledFor", "scheduled_for"), row.script, row.caption, row.hashtags, value(row, "visualReference", "visual_reference"), value(row, "completedAt", "completed_at"), value(row, "createdAt", "created_at"), value(row, "updatedAt", "updated_at")]);
  for (const row of data.moodboards) await client.query(`INSERT INTO moodboard_items (id, project_id, campaign, title, image_key, image_url, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`, [row.id, value(row, "projectId", "project_id"), row.campaign, row.title, value(row, "imageKey", "image_key"), value(row, "imageUrl", "image_url"), value(row, "createdAt", "created_at")]);
  for (const table of ["users", "projects", "editorial_pillars", "content_items", "moodboard_items"]) await client.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`);
  await client.query("COMMIT");
  console.log("Importação para PostgreSQL concluída.");
} catch (error) { await client.query("ROLLBACK"); throw error; } finally { await client.end(); }
