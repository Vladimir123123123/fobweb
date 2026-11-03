/**
 * Снимок предметов из файлов игры (warpuppies/wardogs-data) в один JSON для калькулятора.
 * Живой API при открытии страницы не вызывается.
 */
const SOURCE = "https://warpuppies.github.io/wardogs-data/v1";
const SLOT_LABEL = {
  Sight: "Прицел",
  Magazine: "Магазин",
  Underbarrel: "Подствольник",
  Chamber: "Патронник",
  Muzzle: "Дуло",
  Grip: "Рукоять",
  Stock: "Приклад",
  Barrel: "Ствол",
  Handguard: "Цевьё",
};

const WEIGHT_LABEL = {
  Lightest: "Самое лёгкое",
  Light: "Лёгкое",
  Medium: "Среднее",
  Heavy: "Тяжёлое",
  SuperHeavy: "Сверхтяжёлое",
};

async function load(name) {
  const response = await fetch(`${SOURCE}/${name}`);
  if (!response.ok) throw new Error(`${name} ${response.status}`);
  return response.json();
}

function vendorPrice(item) {
  const prices = (item?.vendor ?? [])
    .map((row) => Number(row.price))
    .filter((price) => Number.isFinite(price) && price > 0);
  if (!prices.length) return null;
  return Math.min(...prices);
}

function skipItem(item) {
  const name = item?.name ?? "";
  return /\(Dead\)|\bTest\b/i.test(name);
}

function bySlot(items, slot) {
  return items
    .filter((item) => (item.tags ?? []).includes(slot) && !skipItem(item))
    .map((item) => ({
      id: item.id,
      name: item.name,
      weight: typeof item.weight === "number" ? item.weight : null,
      price: vendorPrice(item),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

function attachmentFits(slot, attachment) {
  const blocked = new Set((slot.blockedItems ?? []).map((id) => id.toLowerCase()));
  const blockedContexts = new Set(slot.blockedContexts ?? []);
  if (blocked.has(attachment.id.toLowerCase())) return false;
  if ((attachment.contexts ?? []).some((context) => blockedContexts.has(context))) return false;

  const allowIds = new Set((slot.items ?? []).map((id) => id.toLowerCase()));
  const contexts = slot.contexts ?? [];
  const contextHit = contexts.length > 0 && (attachment.contexts ?? []).some((context) => contexts.includes(context));

  if (slot.filter === "AllowList") {
    return allowIds.has(attachment.id.toLowerCase()) || contextHit;
  }
  if (attachment.type !== slot.slot) return false;
  if (contexts.length > 0 && !contextHit) return false;
  return true;
}

function weaponRecord(gun, item, attachments, itemById) {
  const slots = [];
  for (const slot of gun.slots ?? []) {
    if (slot.hidden) continue;
    const options = [];
    const seen = new Set();
    for (const attachment of attachments) {
      if (!attachmentFits(slot, attachment) || seen.has(attachment.id)) continue;
      seen.add(attachment.id);
      const linked = itemById.get(attachment.id);
      options.push({
        id: attachment.id,
        name: attachment.name,
        weight: typeof linked?.weight === "number" ? linked.weight : null,
        price: vendorPrice(linked),
      });
    }
    options.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    if (!options.length) continue;
    slots.push({
      id: slot.slot,
      label: SLOT_LABEL[slot.slot] ?? slot.slot,
      options,
    });
  }

  const archetype = (item?.tags ?? [])
    .map(String)
    .find((tag) => tag.startsWith("Item.Archetype."))
    ?.slice("Item.Archetype.".length) ?? "";
  const unlock = item?.unlock && typeof item.unlock.level === "number"
    ? { role: String(item.unlock.role ?? ""), level: item.unlock.level }
    : null;
  return {
    id: gun.id,
    name: gun.name,
    rpm: gun.rpm ?? null,
    caliber: (gun.calibers ?? [])[0] ?? null,
    range: gun.effectiveRange ?? null,
    weight: typeof item?.weight === "number" ? item.weight : null,
    price: vendorPrice(item),
    archetype,
    subtitle: typeof item?.subtitle === "string" ? item.subtitle : "",
    unlock,
    slots,
  };
}

const [weaponsFile, attachmentsFile, itemsFile, equipmentFile, vehiclesFile] = await Promise.all([
  load("weapons.json"),
  load("attachments.json"),
  load("items.json"),
  load("equipment.json"),
  load("vehicles.json"),
]);

const itemById = new Map(itemsFile.items.map((item) => [item.id, item]));
const guns = weaponsFile.weapons.filter((gun) => !skipItem(gun));
const attachments = attachmentsFile.attachments.filter((attachment) => attachment?.id && attachment?.name);

function recordsFor(slot) {
  const ids = new Set(bySlot(itemsFile.items, slot).map((item) => item.id));
  return guns
    .filter((gun) => ids.has(gun.id))
    .map((gun) => weaponRecord(gun, itemById.get(gun.id), attachments, itemById))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

const catalog = {
  source: "warpuppies/wardogs-data",
  sourceUrl: SOURCE,
  gameBuild: weaponsFile.gameBuild,
  weightClasses: (equipmentFile.weightClasses ?? []).map((row) => {
    const speed = (row.modifiers ?? []).find((modifier) => modifier.attribute === "Movement.MaxSpeedMultiplier");
    return {
      id: row.name,
      label: WEIGHT_LABEL[row.name] ?? row.name,
      minKg: row.minWeightKg,
      speed: typeof speed?.value === "number" ? speed.value : 1,
    };
  }),
  weapons: recordsFor("Inventory.Slot.Primary"),
  sidearms: recordsFor("Inventory.Slot.Sidearm"),
  helmets: bySlot(itemsFile.items, "Inventory.Slot.Helmet"),
  armors: bySlot(itemsFile.items, "Inventory.Slot.Armor"),
  vests: bySlot(itemsFile.items, "Inventory.Slot.Vest"),
  backpacks: bySlot(itemsFile.items, "Inventory.Slot.Backpack"),
  vehicles: (vehiclesFile.vehicles ?? [])
    .filter((vehicle) => vehicle?.name && !skipItem(vehicle))
    .map((vehicle) => ({
      id: vehicle.id,
      name: vehicle.name,
      speed: vehicle.maxSpeed ?? null,
      seats: vehicle.seats ?? null,
      health: vehicle.health?.initial ?? null,
      weapons: vehicle.weapons ?? [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ru")),
};

const fs = await import("node:fs/promises");
try {
  const icons = JSON.parse(await fs.readFile(new URL("./icon-map.json", import.meta.url), "utf8"));
  const stamp = (value) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.id === "string" && typeof icons[value.id] === "string") value.icon = icons[value.id];
    for (const child of Object.values(value)) stamp(child);
  };
  stamp(catalog);
} catch {
  // Карта иконок появляется после scripts/fetch-icons.mjs.
}

const out = new URL("../apps/web/src/data/catalog.json", import.meta.url);
await fs.mkdir(new URL(".", out), { recursive: true });
await fs.writeFile(out, JSON.stringify(catalog));
console.log(
  `build ${catalog.gameBuild}: ${catalog.weapons.length} weapons, ${catalog.sidearms.length} sidearms, ${catalog.vehicles.length} vehicles`,
);
