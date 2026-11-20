import { sql, type Sql } from "./db.js";

export type Office = "leader" | "deputy";

type SlotRow = { id: number; until_at: Date | string; holder_steam: string | null; persona: string | null };

function asDate(value: Date | string) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function slotCard(row: SlotRow) {
  const until = asDate(row.until_at);
  return {
    id: Number(row.id),
    until: until ? until.toISOString() : "",
    holder: row.holder_steam || "",
    holderName: row.persona || row.holder_steam || "",
  };
}

export async function officerOf(squadId: number, steamId: string): Promise<Office | null> {
  const rows = await sql<Array<{ role: string; owner_steam_id: string }>>`
    SELECT m.role, s.owner_steam_id
    FROM squad_members m
    JOIN squads s ON s.id = m.squad_id
    WHERE m.squad_id = ${squadId} AND m.steam_id = ${steamId} AND m.status = 'member'
  `;
  const row = rows[0];
  if (!row) return null;
  if (row.owner_steam_id === steamId || row.role === "leader") return "leader";
  if (row.role === "deputy") return "deputy";
  return null;
}

export async function creditClanQuest(tx: Sql, steamId: string, coins: number) {
  if (coins < 1) return;
  const rows = await tx<Array<{ squad_id: number }>>`
    SELECT m.squad_id
    FROM squad_members m
    JOIN squads s ON s.id = m.squad_id
    WHERE m.steam_id = ${steamId} AND m.status = 'member' AND s.status <> 'rejected'
    LIMIT 1
  `;
  const squadId = Number(rows[0]?.squad_id || 0);
  if (!squadId) return;
  await tx`
    INSERT INTO squad_wallets (squad_id, coins) VALUES (${squadId}, ${coins})
    ON DUPLICATE KEY UPDATE coins = coins + ${coins}
  `;
}

async function offer(tx: Sql = sql) {
  const rows = await tx<Array<{ id: number; price: number; days: number; title: string }>>`
    SELECT id, price, days, title
    FROM shop_products
    WHERE kind = 'clanvip' AND hidden = 0
    ORDER BY sort_order, id
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || Number(row.price) < 1 || Number(row.days) < 1) return null;
  return { id: Number(row.id), price: Number(row.price), days: Number(row.days), title: row.title };
}

async function liveSlots(squadId: number) {
  return sql<SlotRow[]>`
    SELECT sl.id, sl.until_at, sl.holder_steam, u.persona
    FROM squad_slots sl
    LEFT JOIN users u ON u.steam_id = sl.holder_steam
    WHERE sl.squad_id = ${squadId} AND sl.until_at > NOW(3)
    ORDER BY sl.until_at, sl.id
  `;
}

export async function clanView(squadId: number, office: Office | null) {
  const slots = (await liveSlots(squadId)).map(slotCard).filter((slot) => slot.until);
  if (!office) return { slots };
  const money = await sql<Array<{ coins: number }>>`SELECT coins FROM squad_wallets WHERE squad_id = ${squadId}`;
  const product = await offer();
  return {
    slots,
    coins: Number(money[0]?.coins) || 0,
    price: product?.price ?? 0,
    days: product?.days ?? 0,
  };
}

async function queueRevoke(tx: Sql, steamId: string, until: Date) {
  const users = await tx<Array<{ discord_id: string | null }>>`
    SELECT discord_id FROM users WHERE steam_id = ${steamId}
  `;
  const discordId = String(users[0]?.discord_id || "");
  if (!/^\d+$/.test(discordId)) return;
  await tx`
    INSERT INTO shop_revokes (discord_id, until_at, status)
    VALUES (${discordId}, ${until}, ${"pending"})
  `;
}

async function clearHolder(tx: Sql, squadId: number, steamId: string) {
  const slots = await tx<SlotRow[]>`
    SELECT id, until_at, holder_steam, NULL AS persona
    FROM squad_slots
    WHERE squad_id = ${squadId} AND holder_steam = ${steamId}
    FOR UPDATE
  `;
  for (const slot of slots) {
    const until = asDate(slot.until_at);
    if (until) await queueRevoke(tx, steamId, until);
    await tx`UPDATE squad_slots SET holder_steam = NULL WHERE id = ${slot.id}`;
  }
}

export async function buyClanSlot(squadId: number, steamId: string) {
  const office = await officerOf(squadId, steamId);
  if (!office) return { error: "forbidden" as const };
  return sql.begin(async (tx) => {
    const product = await offer(tx);
    if (!product) return { error: "closed" as const };
    const paid = await tx<{ affected?: number }[]>`
      UPDATE squad_wallets SET coins = coins - ${product.price}
      WHERE squad_id = ${squadId} AND coins >= ${product.price}
    `;
    if (!paid[0]?.affected) return { error: "poor" as const };
    const until = new Date(Date.now() + product.days * 86_400_000);
    await tx`
      INSERT INTO squad_slots (squad_id, until_at, holder_steam)
      VALUES (${squadId}, ${until}, NULL)
    `;
    await tx`
      INSERT INTO shop_orders (steam_id, product_id, title, price, kind, days)
      VALUES (${steamId}, ${product.id}, ${product.title}, ${product.price}, ${"clanvip"}, ${product.days})
    `;
    return { error: "" as const };
  });
}

export async function assignClanSlot(squadId: number, actor: string, slotId: number, target: string) {
  const office = await officerOf(squadId, actor);
  if (!office) return { error: "forbidden" as const };
  if (!/^\d{17}$/.test(target)) return { error: "bad_request" as const };
  return sql.begin(async (tx) => {
    const slots = await tx<SlotRow[]>`
      SELECT id, until_at, holder_steam, NULL AS persona
      FROM squad_slots
      WHERE id = ${slotId} AND squad_id = ${squadId}
      FOR UPDATE
    `;
    const slot = slots[0];
    const until = slot ? asDate(slot.until_at) : null;
    if (!slot || !until || until.getTime() <= Date.now()) return { error: "gone" as const };
    if (slot.holder_steam) return { error: "taken" as const };
    const members = await tx<Array<{ role: string }>>`
      SELECT role FROM squad_members
      WHERE squad_id = ${squadId} AND steam_id = ${target} AND status = 'member'
      FOR UPDATE
    `;
    if (!members.length) return { error: "gone" as const };
    const held = await tx<Array<{ id: number }>>`
      SELECT id FROM squad_slots
      WHERE squad_id = ${squadId} AND holder_steam = ${target} AND until_at > NOW(3)
      LIMIT 1
    `;
    if (held.length) return { error: "held" as const };
    const linked = await tx<Array<{ discord_id: string | null }>>`
      SELECT discord_id FROM users WHERE steam_id = ${target}
    `;
    const discordId = String(linked[0]?.discord_id || "");
    if (!/^\d+$/.test(discordId)) return { error: "discord" as const };
    const product = await offer(tx);
    const days = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 86_400_000));
    const order = await tx`
      INSERT INTO shop_orders (steam_id, product_id, title, price, kind, days)
      VALUES (${target}, ${product?.id ?? 0}, ${"Клановый слот"}, 0, ${"clanvip"}, ${days})
    `;
    await tx`
      INSERT INTO shop_grants (order_id, steam_id, discord_id, kind, days, status, until_at)
      VALUES (${Number(order[0]?.id ?? 0)}, ${target}, ${discordId}, ${"clanvip"}, ${days}, ${"pending"}, ${until})
    `;
    await tx`UPDATE squad_slots SET holder_steam = ${target} WHERE id = ${slotId}`;
    return { error: "" as const };
  });
}

export async function clearClanSlot(squadId: number, actor: string, slotId: number) {
  const office = await officerOf(squadId, actor);
  if (!office) return { error: "forbidden" as const };
  return sql.begin(async (tx) => {
    const slots = await tx<SlotRow[]>`
      SELECT id, until_at, holder_steam, NULL AS persona
      FROM squad_slots WHERE id = ${slotId} AND squad_id = ${squadId} FOR UPDATE
    `;
    const slot = slots[0];
    const until = slot ? asDate(slot.until_at) : null;
    if (!slot || !until) return { error: "gone" as const };
    if (!slot.holder_steam) return { error: "" as const };
    await queueRevoke(tx, slot.holder_steam, until);
    await tx`UPDATE squad_slots SET holder_steam = NULL WHERE id = ${slotId}`;
    return { error: "" as const };
  });
}

export async function setDeputy(squadId: number, actor: string, target: string, deputy: boolean) {
  const office = await officerOf(squadId, actor);
  if (!office) return { error: "forbidden" as const };
  if (!/^\d{17}$/.test(target) || target === actor) return { error: "bad_request" as const };
  const role = deputy ? "deputy" : "member";
  const updated = await sql<{ affected?: number }[]>`
    UPDATE squad_members SET role = ${role}
    WHERE squad_id = ${squadId} AND steam_id = ${target} AND status = 'member' AND role <> 'leader'
  `;
  if (!updated[0]?.affected) return { error: "gone" as const };
  return { error: "" as const };
}

export async function removeMember(squadId: number, actor: string, target: string) {
  const office = await officerOf(squadId, actor);
  if (!office) return { error: "forbidden" as const };
  if (!/^\d{17}$/.test(target) || target === actor) return { error: "bad_request" as const };
  return sql.begin(async (tx) => {
    const rows = await tx<Array<{ role: string }>>`
      SELECT role FROM squad_members
      WHERE squad_id = ${squadId} AND steam_id = ${target} AND status = 'member'
      FOR UPDATE
    `;
    if (!rows.length || rows[0].role === "leader") return { error: "gone" as const };
    await clearHolder(tx, squadId, target);
    await tx`
      DELETE FROM squad_members
      WHERE squad_id = ${squadId} AND steam_id = ${target} AND role <> 'leader'
    `;
    return { error: "" as const };
  });
}

export async function disbandSquad(squadId: number, actor: string) {
  const office = await officerOf(squadId, actor);
  if (office !== "leader") return { error: "forbidden" as const };
  return sql.begin(async (tx) => {
    const slots = await tx<SlotRow[]>`
      SELECT id, until_at, holder_steam, NULL AS persona
      FROM squad_slots
      WHERE squad_id = ${squadId} AND holder_steam IS NOT NULL
      FOR UPDATE
    `;
    for (const slot of slots) {
      const until = asDate(slot.until_at);
      if (slot.holder_steam && until) await queueRevoke(tx, slot.holder_steam, until);
    }
    const removed = await tx<{ affected?: number }[]>`DELETE FROM squads WHERE id = ${squadId}`;
    if (!removed[0]?.affected) return { error: "gone" as const };
    return { error: "" as const };
  });
}

export async function pendingRevokes() {
  const rows = await sql<Array<{ id: number; discord_id: string; until_at: Date | string }>>`
    SELECT id, discord_id, until_at
    FROM shop_revokes
    WHERE status = 'pending'
    ORDER BY id
    LIMIT 20
  `;
  return rows.flatMap((row) => {
    const until = asDate(row.until_at);
    if (!until) return [];
    return [{ id: Number(row.id), discordId: String(row.discord_id), until: until.toISOString() }];
  });
}

export async function finishRevoke(id: number) {
  const updated = await sql<{ affected?: number }[]>`
    UPDATE shop_revokes SET status = 'done' WHERE id = ${id} AND status = 'pending'
  `;
  return Boolean(updated[0]?.affected);
}
