import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const sourceUrl = process.env.SOURCE_MYSQL_URL;
const output = process.env.EXPORT_FILE ?? "external/data/editoria-export.json";
if (!sourceUrl) throw new Error("Defina SOURCE_MYSQL_URL com a URL atual do banco MySQL/TiDB.");
const client = await mysql.createConnection(sourceUrl);
try {
  const [users] = await client.query("SELECT * FROM users ORDER BY id");
  const [projects] = await client.query("SELECT * FROM projects ORDER BY id");
  const [pillars] = await client.query("SELECT * FROM editorialPillars ORDER BY id");
  const [content] = await client.query("SELECT * FROM contentItems ORDER BY id");
  const [moodboards] = await client.query("SELECT * FROM moodboardItems ORDER BY id");
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify({ exportedAt: new Date().toISOString(), users, projects, pillars, content, moodboards }, null, 2));
  console.log(`Exportação concluída em ${output}.`);
} finally { await client.end(); }
