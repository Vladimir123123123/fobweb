CREATE TABLE IF NOT EXISTS users (
  steam_id varchar(20) PRIMARY KEY,
  persona varchar(80),
  avatar varchar(300),
  country varchar(8),
  cis_opt_in tinyint(1) NOT NULL DEFAULT 1,
  hide_leaderboard tinyint(1) NOT NULL DEFAULT 0,
  discord_id varchar(32),
  discord_name varchar(80),
  motto varchar(80),
  accent varchar(16),
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

CREATE TABLE IF NOT EXISTS server_combat (
  steam_id varchar(20) PRIMARY KEY,
  persona varchar(80),
  avatar varchar(300),
  kills int NOT NULL DEFAULT 0,
  deaths int NOT NULL DEFAULT 0,
  match_kills int NOT NULL DEFAULT 0,
  match_deaths int NOT NULL DEFAULT 0,
  faction varchar(40),
  seen_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
  first_seen datetime(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS server_kills (
  event_id varchar(64) PRIMARY KEY,
  match_id varchar(80) NOT NULL DEFAULT '',
  killed_at datetime(3) NULL,
  killer_steam varchar(20) NOT NULL DEFAULT '',
  killer_name varchar(80) NOT NULL DEFAULT '',
  victim_steam varchar(20) NOT NULL DEFAULT '',
  victim_name varchar(80) NOT NULL DEFAULT '',
  weapon varchar(80) NOT NULL DEFAULT '',
  meters int NULL,
  headshot tinyint(1) NOT NULL DEFAULT 0,
  suicide tinyint(1) NOT NULL DEFAULT 0,
  teamkill tinyint(1) NOT NULL DEFAULT 0,
  received_at datetime(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS server_kills_killer ON server_kills (killer_steam);
CREATE INDEX IF NOT EXISTS server_kills_victim ON server_kills (victim_steam);
CREATE INDEX IF NOT EXISTS server_kills_match ON server_kills (match_id);

CREATE TABLE IF NOT EXISTS match_clock (
  match_id varchar(80) PRIMARY KEY,
  map_name varchar(80) NOT NULL DEFAULT '',
  server_name varchar(80) NOT NULL DEFAULT '',
  state varchar(40) NOT NULL DEFAULT '',
  started_at datetime(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS match_presence (
  match_id varchar(80) NOT NULL,
  steam_id varchar(20) NOT NULL,
  name varchar(80) NOT NULL DEFAULT '',
  faction varchar(40) NOT NULL DEFAULT '',
  left_at datetime(3) NULL,
  PRIMARY KEY (match_id, steam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS played_matches (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  steam_id varchar(20) NOT NULL,
  match_key varchar(80) NOT NULL,
  ended_at datetime(3) NULL,
  server_name varchar(80) NOT NULL DEFAULT '',
  map_name varchar(80) NOT NULL DEFAULT '',
  minutes int NULL,
  faction varchar(40) NOT NULL DEFAULT '',
  result varchar(16) NOT NULL DEFAULT '',
  place int NULL,
  field_size int NULL,
  kills int NOT NULL DEFAULT 0,
  deaths int NOT NULL DEFAULT 0,
  headshots int NOT NULL DEFAULT 0,
  teamkills int NOT NULL DEFAULT 0,
  weapon varchar(80) NOT NULL DEFAULT '',
  UNIQUE KEY played_match_player (steam_id, match_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS server_matches (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  steam_id varchar(20) NOT NULL,
  persona varchar(80),
  kills int NOT NULL DEFAULT 0,
  deaths int NOT NULL DEFAULT 0,
  faction varchar(40),
  ended_at datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS server_matches_player ON server_matches (steam_id, ended_at);

CREATE TABLE IF NOT EXISTS server_punishments (
  steam_id varchar(20) NOT NULL,
  kind varchar(16) NOT NULL,
  started_at datetime(3) NOT NULL,
  reason varchar(240) NOT NULL DEFAULT '',
  until_at datetime(3) NULL,
  active tinyint(1) NOT NULL DEFAULT 1,
  lifted_at datetime(3) NULL,
  PRIMARY KEY (steam_id, kind, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

CREATE TABLE IF NOT EXISTS squad_reports (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  squad_id bigint NOT NULL,
  target_steam_id varchar(20) NOT NULL,
  reporter_steam_id varchar(20) NOT NULL,
  note varchar(400) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'open',
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
  CONSTRAINT reports_squad FOREIGN KEY (squad_id) REFERENCES squads (id) ON DELETE CASCADE,
  CONSTRAINT reports_target FOREIGN KEY (target_steam_id) REFERENCES users (steam_id),
  CONSTRAINT reports_reporter FOREIGN KEY (reporter_steam_id) REFERENCES users (steam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS squad_reports_open ON squad_reports (status, created_at);

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

CREATE TABLE IF NOT EXISTS auth_jobs (
  ticket varchar(80) PRIMARY KEY,
  oauth_code varchar(4000) NOT NULL DEFAULT '',
  next_path varchar(200) NOT NULL DEFAULT '/ratings',
  status varchar(20) NOT NULL,
  fail varchar(40) NOT NULL DEFAULT '',
  steam_id varchar(20) NOT NULL DEFAULT '',
  flag varchar(40) NOT NULL DEFAULT '',
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

CREATE TABLE IF NOT EXISTS guides (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  rubric varchar(40) NOT NULL DEFAULT '',
  title varchar(120) NOT NULL,
  body text NOT NULL,
  href varchar(200) NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  hidden tinyint(1) NOT NULL DEFAULT 0,
  updated_at datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS presence_days (
  steam_id varchar(20) NOT NULL,
  day date NOT NULL,
  seconds int NOT NULL DEFAULT 0,
  kills int NOT NULL DEFAULT 0,
  last_seen datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (steam_id, day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS feed_keys (
  name varchar(40) PRIMARY KEY,
  value varchar(80) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS feed_samples (
  kind varchar(40) PRIMARY KEY,
  body text NOT NULL,
  seen_at datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE squads ADD COLUMN IF NOT EXISTS about varchar(700) NOT NULL DEFAULT '';
ALTER TABLE squads ADD COLUMN IF NOT EXISTS criteria varchar(700) NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS home_side (
  id tinyint NOT NULL PRIMARY KEY,
  streams text NOT NULL,
  vips text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO home_side (id, streams, vips) VALUES (1, '[]', '[]');

CREATE TABLE IF NOT EXISTS community (
  steam_id varchar(20) NOT NULL PRIMARY KEY,
  xp int NOT NULL DEFAULT 0,
  coins decimal(12,2) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kill_streaks (
  steam_id varchar(20) NOT NULL PRIMARY KEY,
  streak int NOT NULL DEFAULT 0,
  updated_at datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quests (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title varchar(120) NOT NULL,
  body varchar(500) NOT NULL,
  kills int NOT NULL,
  difficulty varchar(8) NOT NULL DEFAULT 'mid',
  repeat_kind varchar(8) NOT NULL DEFAULT 'once',
  xp int NOT NULL DEFAULT 0,
  coins int NOT NULL DEFAULT 0,
  min_meters int NOT NULL DEFAULT 0,
  max_meters int NOT NULL DEFAULT 0,
  headshot tinyint(1) NOT NULL DEFAULT 0,
  weapon varchar(120) NOT NULL DEFAULT '',
  status varchar(8) NOT NULL DEFAULT 'live',
  starts_at datetime(3) NULL,
  ends_at datetime(3) NULL,
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quest_runs (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  quest_id bigint NOT NULL,
  steam_id varchar(20) NOT NULL,
  period_key varchar(16) NOT NULL,
  started_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
  status varchar(8) NOT NULL DEFAULT 'active',
  announced tinyint NOT NULL DEFAULT 0,
  done_at datetime(3) NULL,
  UNIQUE KEY quest_run (quest_id, steam_id, period_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shop_settings (
  id tinyint NOT NULL PRIMARY KEY,
  seed_coins int NOT NULL DEFAULT 1,
  seed_cap int NOT NULL DEFAULT 60,
  seed_below int NOT NULL DEFAULT 20
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shop_products (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title varchar(80) NOT NULL,
  body varchar(300) NOT NULL DEFAULT '',
  price int NOT NULL,
  kind varchar(16) NOT NULL,
  days int NOT NULL DEFAULT 0,
  hidden tinyint(1) NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shop_orders (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  steam_id varchar(20) NOT NULL,
  product_id bigint NOT NULL,
  title varchar(80) NOT NULL,
  price int NOT NULL,
  kind varchar(16) NOT NULL,
  days int NOT NULL DEFAULT 0,
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shop_grants (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id bigint NOT NULL,
  steam_id varchar(20) NOT NULL,
  discord_id varchar(32) NOT NULL,
  kind varchar(16) NOT NULL,
  days int NOT NULL,
  status varchar(12) NOT NULL DEFAULT 'pending',
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS seed_days (
  steam_id varchar(20) NOT NULL,
  day date NOT NULL,
  seconds int NOT NULL DEFAULT 0,
  paid_seconds int NOT NULL DEFAULT 0,
  coins int NOT NULL DEFAULT 0,
  last_seen datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (steam_id, day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stat_days (
  steam_id varchar(20) NOT NULL,
  day date NOT NULL,
  coins int NOT NULL DEFAULT 0,
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (steam_id, day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS squad_wallets (
  squad_id bigint NOT NULL PRIMARY KEY,
  coins int NOT NULL DEFAULT 0,
  CONSTRAINT wallet_squad FOREIGN KEY (squad_id) REFERENCES squads (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS squad_slots (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  squad_id bigint NOT NULL,
  until_at datetime(3) NOT NULL,
  holder_steam varchar(20) NULL,
  CONSTRAINT slots_squad FOREIGN KEY (squad_id) REFERENCES squads (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS squad_slots_squad ON squad_slots (squad_id, until_at);

CREATE TABLE IF NOT EXISTS shop_revokes (
  id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  discord_id varchar(32) NOT NULL,
  until_at datetime(3) NOT NULL,
  status varchar(12) NOT NULL DEFAULT 'pending',
  created_at datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
