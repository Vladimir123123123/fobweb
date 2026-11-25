import { sql } from "./db.js";

export type ShopSettings = { seedCoins: number; seedCap: number; seedBelow: number };
export type ProductInput = { title: string; body: string; price: number; kind: "vip" | "clanvip" | "note"; days: number; hidden: boolean };

const DEFAULTS: ShopSettings = { seedCoins: 1, seedCap: 60, seedBelow: 20 };
export const STAT_REFRESH_COINS = 10;

function moscowDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function clip(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function whole(value: unknown, max: number) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number) || number < 0 || number > max) return null;
  return number;
}

export function seedPayout(unpaidSeconds: number, rate: number, already: number, cap: number) {
  if (rate < 1 || cap < 1) return { coins: 0, seconds: 0 };
  const minutes = Math.floor(Math.max(0, unpaidSeconds) / 60);
  const roomMinutes = Math.floor(Math.max(0, cap - already) / rate);
  const giveMinutes = Math.min(minutes, roomMinutes);
  return { coins: giveMinutes * rate, seconds: giveMinutes * 60 };
}

export function productInput(body: Record<string, unknown> | null): ProductInput | null {
  if (!body) return null;
  const title = clip(body.title, 80);
  const text = clip(body.body, 300);
  const price = whole(body.price, 1_000_000);
  const days = whole(body.days, 366);
  const kind = body.kind === "clanvip" || body.kind === "note" ? body.kind : "vip";
  if (!title || price == null || price < 1 || days == null) return null;
  if (kind !== "note" && days < 1) return null;
  return { title, body: text, price, kind, days, hidden: body.hidden === true };
}

export async function ensureShop() {
  await sql`
    INSERT IGNORE INTO shop_settings (id, seed_coins, seed_cap, seed_below)
    VALUES (1, ${DEFAULTS.seedCoins}, ${DEFAULTS.seedCap}, ${DEFAULTS.seedBelow})
  `;
  await sql`
    UPDATE shop_products
    SET price = 4800,
        title = ${"Клановый слот на 30 дней"},
        body = ${"Один слот на 30 дней. Лидер или заместитель покупает его из казны сквада и выбирает, кому выдать. Личный VIP за очки дешевле, в тикете за 200 ₽ быстрее."}
    WHERE kind = 'clanvip' AND price = 1600
  `;
  const rows = await sql<Array<{ n: number }>>`SELECT CAST(COUNT(*) AS SIGNED) AS n FROM shop_products`;
  if (Number(rows[0]?.n)) return;
  await sql`
    INSERT INTO shop_products (title, body, price, kind, days, hidden, sort_order) VALUES
    (${"VIP на 30 дней"}, ${"Роль Спонсор в Discord на 30 дней. За 300 ₽ в тикете это быстрее, чем копить."}, 2400, ${"vip"}, 30, 0, 1),
    (${"Клановый слот на 30 дней"}, ${"Один слот на 30 дней. Лидер или заместитель покупает его из казны сквада и выбирает, кому выдать. Личный VIP за очки дешевле, в тикете за 200 ₽ быстрее."}, 4800, ${"clanvip"}, 30, 0, 2)
  `;
}

export async function readSettings(): Promise<ShopSettings> {
  const rows = await sql<Array<{ seed_coins: number; seed_cap: number; seed_below: number }>>`
    SELECT seed_coins, seed_cap, seed_below FROM shop_settings WHERE id = 1
  `;
  const row = rows[0];
  if (!row) return DEFAULTS;
  return {
    seedCoins: Math.max(0, Number(row.seed_coins) || 0),
    seedCap: Math.max(0, Number(row.seed_cap) || 0),
    seedBelow: Math.max(1, Number(row.seed_below) || DEFAULTS.seedBelow),
  };
}

export async function saveSettings(input: ShopSettings) {
  await sql`
    UPDATE shop_settings
    SET seed_coins = ${input.seedCoins}, seed_cap = ${input.seedCap}, seed_below = ${input.seedBelow}
    WHERE id = 1
  `;
}

export function settingsInput(body: Record<string, unknown> | null): ShopSettings | null {
  if (!body) return null;
  const seedCoins = whole(body.seedCoins, 100);
  const seedCap = whole(body.seedCap, 100_000);
  const seedBelow = whole(body.seedBelow, 200);
  if (seedCoins == null || seedCap == null || seedBelow == null || seedBelow < 1) return null;
  return { seedCoins, seedCap, seedBelow };
}

export async function creditStatRefresh(steamId: string) {
  if (!/^\d{17}$/.test(steamId)) return 0;
  const day = moscowDay();
  return sql.begin(async (tx) => {
    const inserted = await tx`
      INSERT IGNORE INTO stat_days (steam_id, day, coins)
      VALUES (${steamId}, ${day}, ${STAT_REFRESH_COINS})
    `;
    if (!inserted.length) return 0;
    await tx`
      INSERT INTO community (steam_id, xp, coins) VALUES (${steamId}, 0, ${STAT_REFRESH_COINS})
      ON DUPLICATE KEY UPDATE coins = coins + ${STAT_REFRESH_COINS}
    `;
    return STAT_REFRESH_COINS;
  });
}

export async function creditSeed(steamIds: string[], online: number) {
  const settings = await readSettings();
  if (online < 1 || online >= settings.seedBelow || settings.seedCoins < 1 || settings.seedCap < 1) return;
  const day = moscowDay();
  for (const steamId of steamIds) {
    if (!/^\d{17}$/.test(steamId)) continue;
    await sql`
      INSERT INTO seed_days (steam_id, day, seconds, paid_seconds, coins, last_seen)
      VALUES (${steamId}, ${day}, 20, 0, 0, NOW())
      ON DUPLICATE KEY UPDATE
        seconds = seconds + LEAST(90, GREATEST(1, TIMESTAMPDIFF(SECOND, last_seen, NOW()))),
        last_seen = NOW()
    `;
    const rows = await sql<Array<{ seconds: number; paid_seconds: number; coins: number }>>`
      SELECT seconds, paid_seconds, coins FROM seed_days WHERE steam_id = ${steamId} AND day = ${day}
    `;
    const row = rows[0];
    if (!row) continue;
    const payout = seedPayout(Number(row.seconds) - Number(row.paid_seconds), settings.seedCoins, Number(row.coins), settings.seedCap);
    if (payout.coins < 1) continue;
    await sql`
      UPDATE seed_days
      SET paid_seconds = paid_seconds + ${payout.seconds}, coins = coins + ${payout.coins}
      WHERE steam_id = ${steamId} AND day = ${day}
    `;
    await sql`
      INSERT INTO community (steam_id, xp, coins) VALUES (${steamId}, 0, ${payout.coins})
      ON DUPLICATE KEY UPDATE coins = coins + ${payout.coins}
    `;
  }
}

type ProductRow = { id: number; title: string; body: string; price: number; kind: string; days: number; hidden: boolean | number; sort_order: number };

function card(row: ProductRow) {
  return {
    id: Number(row.id),
    title: row.title,
    body: row.body,
    price: Number(row.price),
    kind: row.kind,
    days: Number(row.days) || 0,
    hidden: Boolean(row.hidden),
    sort: Number(row.sort_order) || 0,
  };
}

async function wallet(steamId: string | null) {
  if (!steamId) return { coins: 0, seedToday: 0, statToday: false };
  const settings = await readSettings();
  const money = await sql<Array<{ coins: number }>>`SELECT coins FROM community WHERE steam_id = ${steamId}`;
  const day = moscowDay();
  const seed = await sql<Array<{ coins: number }>>`
    SELECT coins FROM seed_days WHERE steam_id = ${steamId} AND day = ${day}
  `;
  const stat = await sql<Array<{ coins: number }>>`
    SELECT coins FROM stat_days WHERE steam_id = ${steamId} AND day = ${day}
  `;
  return {
    coins: Number(money[0]?.coins) || 0,
    seedToday: Math.min(settings.seedCap, Number(seed[0]?.coins) || 0),
    statToday: Number(stat[0]?.coins) > 0,
  };
}

export async function publicShop(steamId: string | null) {
  const settings = await readSettings();
  const products = await sql<ProductRow[]>`
    SELECT id, title, body, price, kind, days, hidden, sort_order
    FROM shop_products WHERE hidden = 0 AND kind <> 'clanvip' ORDER BY sort_order, id
  `;
  const mine = await wallet(steamId);
  return { signedIn: Boolean(steamId), ...settings, ...mine, statCoins: STAT_REFRESH_COINS, products: products.map(card) };
}

export async function buyProduct(steamId: string, productId: number) {
  return sql.begin(async (tx) => {
    const products = await tx<ProductRow[]>`
      SELECT id, title, body, price, kind, days, hidden, sort_order
      FROM shop_products WHERE id = ${productId} AND hidden = 0
    `;
    const product = products[0];
    if (!product) return { error: "closed" as const };
    if (product.kind === "clanvip") return { error: "clan" as const };
    const price = Number(product.price);
    const linked = await tx<Array<{ discord_id: string | null }>>`
      SELECT discord_id FROM users WHERE steam_id = ${steamId}
    `;
    const discordId = String(linked[0]?.discord_id || "");
    if (product.kind !== "note" && !/^\d+$/.test(discordId)) return { error: "discord" as const };
    const updated = await tx<{ affected?: number }[]>`
      UPDATE community SET coins = coins - ${price}
      WHERE steam_id = ${steamId} AND coins >= ${price}
    `;
    if (!updated[0]?.affected) return { error: "poor" as const };
    const order = await tx`
      INSERT INTO shop_orders (steam_id, product_id, title, price, kind, days)
      VALUES (${steamId}, ${product.id}, ${product.title}, ${price}, ${product.kind}, ${product.days})
    `;
    if (product.kind !== "note" && Number(product.days) > 0) {
      await tx`
        INSERT INTO shop_grants (order_id, steam_id, discord_id, kind, days, status)
        VALUES (${Number(order[0]?.id ?? 0)}, ${steamId}, ${discordId}, ${product.kind}, ${product.days}, ${"pending"})
      `;
    }
    return { error: "" as const };
  });
}

export async function adminShop() {
  const settings = await readSettings();
  const products = await sql<ProductRow[]>`
    SELECT id, title, body, price, kind, days, hidden, sort_order
    FROM shop_products ORDER BY sort_order, id
  `;
  const orders = await sql<Array<{ id: number; steam_id: string; title: string; price: number; kind: string; days: number; persona: string | null; created_at: string }>>`
    SELECT o.id, o.steam_id, o.title, o.price, o.kind, o.days, u.persona, o.created_at
    FROM shop_orders o
    LEFT JOIN users u ON u.steam_id = o.steam_id
    ORDER BY o.id DESC
    LIMIT 30
  `;
  return {
    ...settings,
    products: products.map(card),
    orders: orders.map((row) => ({
      id: Number(row.id),
      steamId: row.steam_id,
      name: row.persona || row.steam_id,
      title: row.title,
      price: Number(row.price),
      kind: row.kind,
      days: Number(row.days) || 0,
    })),
  };
}

export async function insertProduct(input: ProductInput) {
  const sort = Number((await sql<Array<{ n: number }>>`SELECT CAST(COALESCE(MAX(sort_order), 0) + 1 AS SIGNED) AS n FROM shop_products`)[0]?.n ?? 1);
  const inserted = await sql`
    INSERT INTO shop_products (title, body, price, kind, days, hidden, sort_order)
    VALUES (${input.title}, ${input.body}, ${input.price}, ${input.kind}, ${input.days}, ${input.hidden ? 1 : 0}, ${sort})
  `;
  return Number(inserted[0]?.id ?? 0);
}

export async function saveProduct(id: number, input: ProductInput) {
  const updated = await sql<{ affected?: number }[]>`
    UPDATE shop_products
    SET title = ${input.title}, body = ${input.body}, price = ${input.price}, kind = ${input.kind},
        days = ${input.days}, hidden = ${input.hidden ? 1 : 0}
    WHERE id = ${id}
  `;
  return Boolean(updated[0]?.affected);
}

export async function removeProduct(id: number) {
  const removed = await sql<{ affected?: number }[]>`DELETE FROM shop_products WHERE id = ${id}`;
  return Boolean(removed[0]?.affected);
}

export async function pendingGrants() {
  const rows = await sql<Array<{ id: number; discord_id: string; kind: string; days: number; title: string; until_at: Date | string | null; squad_tag: string | null }>>`
    SELECT g.id, g.discord_id, g.kind, g.days, g.until_at, o.title, s.tag AS squad_tag
    FROM shop_grants g
    JOIN shop_orders o ON o.id = g.order_id
    LEFT JOIN squad_members m ON m.steam_id = g.steam_id AND m.status = 'member'
    LEFT JOIN squads s ON s.id = m.squad_id AND s.status = 'approved'
    WHERE g.status = 'pending'
    ORDER BY g.id
    LIMIT 20
  `;
  return rows.map((row) => {
    const until = row.until_at instanceof Date ? row.until_at : row.until_at ? new Date(row.until_at) : null;
    return {
      id: Number(row.id),
      discordId: String(row.discord_id),
      kind: row.kind === "clanvip" ? "clanvip" : "vip",
      days: Number(row.days) || 0,
      title: row.title,
      squadTag: row.squad_tag ? String(row.squad_tag) : "",
      until: until && !Number.isNaN(until.getTime()) ? until.toISOString() : "",
    };
  });
}

export async function finishGrant(id: number) {
  const updated = await sql<{ affected?: number }[]>`
    UPDATE shop_grants SET status = 'done' WHERE id = ${id} AND status = 'pending'
  `;
  return Boolean(updated[0]?.affected);
}
