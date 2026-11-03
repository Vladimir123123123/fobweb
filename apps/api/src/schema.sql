CREATE TABLE IF NOT EXISTS users (
  steam_id text PRIMARY KEY,
  persona text,
  avatar text,
  country text,
  cis_opt_in boolean NOT NULL DEFAULT false,
  hide_leaderboard boolean NOT NULL DEFAULT false,
  discord_id text,
  discord_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS snapshots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  steam_id text NOT NULL REFERENCES users (steam_id),
  season text NOT NULL,
  wardog_level integer,
  xp bigint,
  account_value bigint,
  cash bigint,
  gold integer,
  unlocks integer,
  role_assault integer,
  role_medic integer,
  role_recon integer,
  role_support integer,
  role_driver integer,
  role_pilot integer,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snapshots_player ON snapshots (steam_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sync_sessions (
  steam_id text PRIMARY KEY REFERENCES users (steam_id),
  status text NOT NULL,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS squads (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  tag text NOT NULL,
  owner_steam_id text NOT NULL REFERENCES users (steam_id),
  closed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  discord_url text NOT NULL DEFAULT '',
  logo_path text,
  banner_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE squads ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE squads ADD COLUMN IF NOT EXISTS discord_url text NOT NULL DEFAULT '';
ALTER TABLE squads ADD COLUMN IF NOT EXISTS logo_path text;
ALTER TABLE squads ADD COLUMN IF NOT EXISTS banner_path text;

CREATE TABLE IF NOT EXISTS squad_assets (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  squad_id bigint NOT NULL REFERENCES squads (id) ON DELETE CASCADE,
  kind text NOT NULL,
  path text NOT NULL,
  discord_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS squad_assets_pending ON squad_assets (status, created_at);

CREATE TABLE IF NOT EXISTS squad_members (
  squad_id bigint NOT NULL REFERENCES squads (id) ON DELETE CASCADE,
  steam_id text NOT NULL REFERENCES users (steam_id),
  role text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (squad_id, steam_id)
);

CREATE TABLE IF NOT EXISTS admins (
  steam_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_invites (
  token text PRIMARY KEY,
  created_by text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_by text,
  used_at timestamptz
);

CREATE TABLE IF NOT EXISTS events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  steam_id text,
  visitor_id text,
  path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_created ON events (created_at DESC);

CREATE TABLE IF NOT EXISTS builds (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  steam_id text NOT NULL REFERENCES users (steam_id),
  season text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  code text NOT NULL,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS builds_season ON builds (season, created_at DESC);

CREATE TABLE IF NOT EXISTS build_votes (
  build_id bigint NOT NULL REFERENCES builds (id) ON DELETE CASCADE,
  steam_id text NOT NULL REFERENCES users (steam_id),
  useful boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (build_id, steam_id)
);

CREATE TABLE IF NOT EXISTS build_notes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  build_id bigint NOT NULL REFERENCES builds (id) ON DELETE CASCADE,
  steam_id text NOT NULL REFERENCES users (steam_id),
  kind text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS build_notes_build ON build_notes (build_id, created_at);
