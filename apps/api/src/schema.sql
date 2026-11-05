CREATE TABLE IF NOT EXISTS users (
  steam_id varchar(20) PRIMARY KEY,
  persona varchar(80),
  avatar varchar(300),
  country varchar(8),
  cis_opt_in tinyint(1) NOT NULL DEFAULT 0,
  hide_leaderboard tinyint(1) NOT NULL DEFAULT 0,
  discord_id varchar(32),
  discord_name varchar(80),
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
  last_login_at datetime(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS snapshots (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  steam_id varchar(20) NOT NULL,
  season varchar(8) NOT NULL,
  wardog_level int,
  xp bigint,
  account_value bigint,
  cash bigint,
  gold int,
  unlocks int,
  role_assault int,
  role_medic int,
  role_recon int,
  role_support int,
  role_driver int,
  role_pilot int,
  source varchar(20) NOT NULL,
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
  CONSTRAINT snapshots_user FOREIGN KEY (steam_id) REFERENCES users (steam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS snapshots_player ON snapshots (steam_id, created_at);

CREATE TABLE IF NOT EXISTS sync_sessions (
  steam_id varchar(20) PRIMARY KEY,
  status varchar(20) NOT NULL,
  expires_at datetime(3),
  updated_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
  CONSTRAINT sync_user FOREIGN KEY (steam_id) REFERENCES users (steam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS squads (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name varchar(40) NOT NULL,
  tag varchar(8) NOT NULL,
  owner_steam_id varchar(20) NOT NULL,
  closed tinyint(1) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'pending',
  discord_url varchar(200) NOT NULL DEFAULT '',
  about varchar(700) NOT NULL DEFAULT '',
  criteria varchar(700) NOT NULL DEFAULT '',
  logo_path varchar(80),
  banner_path varchar(80),
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
  CONSTRAINT squads_owner FOREIGN KEY (owner_steam_id) REFERENCES users (steam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS squad_assets (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  squad_id bigint NOT NULL,
  kind varchar(20) NOT NULL,
  path varchar(80) NOT NULL,
  discord_url varchar(200) NOT NULL DEFAULT '',
  status varchar(20) NOT NULL DEFAULT 'pending',
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
  CONSTRAINT assets_squad FOREIGN KEY (squad_id) REFERENCES squads (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS squad_assets_pending ON squad_assets (status, created_at);

CREATE TABLE IF NOT EXISTS squad_members (
  squad_id bigint NOT NULL,
  steam_id varchar(20) NOT NULL,
  role varchar(20) NOT NULL,
  status varchar(20) NOT NULL,
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (squad_id, steam_id),
  CONSTRAINT members_squad FOREIGN KEY (squad_id) REFERENCES squads (id) ON DELETE CASCADE,
  CONSTRAINT members_user FOREIGN KEY (steam_id) REFERENCES users (steam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE UNIQUE INDEX IF NOT EXISTS squad_members_one ON squad_members (steam_id);

CREATE TABLE IF NOT EXISTS admins (
  steam_id varchar(20) PRIMARY KEY,
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_invites (
  token varchar(80) PRIMARY KEY,
  created_by varchar(20) NOT NULL,
  expires_at datetime(3) NOT NULL,
  used_by varchar(20),
  used_at datetime(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS events (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name varchar(40) NOT NULL,
  steam_id varchar(20),
  visitor_id varchar(64),
  path varchar(200),
  utm_source varchar(80),
  utm_medium varchar(80),
  utm_campaign varchar(80),
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS events_created ON events (created_at);

CREATE TABLE IF NOT EXISTS auth_pending (
  state varchar(80) PRIMARY KEY,
  next_path varchar(200) NOT NULL DEFAULT '/ratings',
  expires_at datetime(3) NOT NULL,
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS builds (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  steam_id varchar(20) NOT NULL,
  season varchar(8) NOT NULL,
  title varchar(80) NOT NULL,
  summary varchar(200) NOT NULL DEFAULT '',
  code varchar(2000) NOT NULL,
  hidden tinyint(1) NOT NULL DEFAULT 0,
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
  CONSTRAINT builds_user FOREIGN KEY (steam_id) REFERENCES users (steam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS builds_season ON builds (season, created_at);

CREATE TABLE IF NOT EXISTS build_votes (
  build_id bigint NOT NULL,
  steam_id varchar(20) NOT NULL,
  useful tinyint(1) NOT NULL,
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (build_id, steam_id),
  CONSTRAINT votes_build FOREIGN KEY (build_id) REFERENCES builds (id) ON DELETE CASCADE,
  CONSTRAINT votes_user FOREIGN KEY (steam_id) REFERENCES users (steam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS build_notes (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  build_id bigint NOT NULL,
  steam_id varchar(20) NOT NULL,
  kind varchar(20) NOT NULL,
  body text NOT NULL,
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
  CONSTRAINT notes_build FOREIGN KEY (build_id) REFERENCES builds (id) ON DELETE CASCADE,
  CONSTRAINT notes_user FOREIGN KEY (steam_id) REFERENCES users (steam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS build_notes_build ON build_notes (build_id, created_at);

ALTER TABLE squads ADD COLUMN IF NOT EXISTS about varchar(700) NOT NULL DEFAULT '';
ALTER TABLE squads ADD COLUMN IF NOT EXISTS criteria varchar(700) NOT NULL DEFAULT '';
