CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  open_id VARCHAR(128) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  login_method VARCHAR(64),
  role VARCHAR(16) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_signed_in TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(140) NOT NULL,
  description TEXT,
  brand_tone TEXT,
  color_primary VARCHAR(24) NOT NULL DEFAULT '#27211D',
  color_accent VARCHAR(24) NOT NULL DEFAULT '#B68A56',
  font_heading VARCHAR(100) NOT NULL DEFAULT 'Playfair Display',
  font_body VARCHAR(100) NOT NULL DEFAULT 'DM Sans',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS editorial_pillars (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  theme VARCHAR(160) NOT NULL,
  description TEXT,
  color VARCHAR(24) NOT NULL DEFAULT '#B68A56',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_items (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pillar_id BIGINT REFERENCES editorial_pillars(id) ON DELETE SET NULL,
  title VARCHAR(180) NOT NULL,
  format VARCHAR(20) NOT NULL CHECK (format IN ('stories', 'reels 7s', 'reels longo', 'carrossel')),
  status VARCHAR(20) NOT NULL DEFAULT 'ideia' CHECK (status IN ('ideia', 'em produção', 'pronto', 'publicado')),
  scheduled_for TIMESTAMPTZ,
  script TEXT,
  caption TEXT,
  hashtags TEXT,
  visual_reference TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moodboard_items (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  campaign VARCHAR(140) NOT NULL,
  title VARCHAR(160) NOT NULL,
  image_key VARCHAR(512) NOT NULL,
  image_url VARCHAR(1024) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_content_items_project_id ON content_items(project_id);
CREATE INDEX IF NOT EXISTS idx_content_items_scheduled_for ON content_items(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_moodboard_items_project_id ON moodboard_items(project_id);
