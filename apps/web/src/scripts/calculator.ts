import catalog from "../data/catalog.json";
import { gunMark, itemArt, KIND_LABEL, ROLE_LABEL, SUBTITLE } from "./guns.ts";
import { track } from "./site.ts";

type Piece = { id: string; name: string; weight: number | null; price: number | null; subtitle?: string; unlock?: { role: string; level: number } | null; icon?: string };
type Slot = { id: string; label: string; options: Piece[] };
type Gun = Piece & { rpm: number | null; caliber: string | null; range: number | null; archetype?: string; slots: Slot[] };
type RackId = "weapon" | "sidearm" | "helmet" | "armor" | "vest" | "backpack";
type Tab = "overview" | "guns" | "gear" | "mods";

const data = catalog as {
  gameBuild: string;
  weightClasses: { id: string; label: string; minKg: number; speed: number }[];
  weapons: Gun[];
  sidearms: Gun[];
  helmets: Piece[];
  armors: Piece[];
  vests: Piece[];
  backpacks: Piece[];
};

const build = document.querySelector("#build");
if (build) build.textContent = data.gameBuild;

function money(value: number) {
  return `$${new Intl.NumberFormat("ru-RU").format(value)}`;
}

function fill(select: HTMLSelectElement, items: Piece[], placeholder: string) {
  select.innerHTML = `<option value="">${placeholder}</option>` + items.map((item) => {
    const price = item.price === null ? "нет цены в билде" : money(item.price);
    return `<option value="${item.id}">${item.name} · ${price}</option>`;
  }).join("");
}

function gunById(id: string) {
  return data.weapons.find((gun) => gun.id === id) ?? data.sidearms.find((gun) => gun.id === id) ?? null;
}

const weapon = document.querySelector<HTMLSelectElement>("#weapon");
const sidearm = document.querySelector<HTMLSelectElement>("#sidearm");
const helmet = document.querySelector<HTMLSelectElement>("#helmet");
const armor = document.querySelector<HTMLSelectElement>("#armor");
const vest = document.querySelector<HTMLSelectElement>("#vest");
const backpack = document.querySelector<HTMLSelectElement>("#backpack");
const slots = document.querySelector<HTMLElement>("#slots");
const sideSlots = document.querySelector<HTMLElement>("#side-slots");
if (!weapon || !sidearm || !helmet || !armor || !vest || !backpack || !slots || !sideSlots) {
  throw new Error("calculator markup");
}

fill(weapon, data.weapons, "Основное оружие");
fill(sidearm, data.sidearms, "Пистолет");
fill(helmet, data.helmets, "Шлем");
fill(armor, data.armors, "Броня");
fill(vest, data.vests, "Разгрузка");
fill(backpack, data.backpacks, "Рюкзак");

function renderSlots(host: HTMLElement, gun: Gun | null, prefix: string) {
  host.innerHTML = "";
  if (!gun) return;
  for (const slot of gun.slots) {
    const label = document.createElement("label");
    label.textContent = slot.label;
    const select = document.createElement("select");
    select.dataset.slot = slot.id;
    select.dataset.prefix = prefix;
    fill(select, slot.options, "Не ставить");
    select.addEventListener("change", publish);
    label.append(select);
    host.append(label);
  }
}

function selectedPiece(select: HTMLSelectElement, list: Piece[]) {
  return list.find((item) => item.id === select.value) ?? null;
}

function chosenSlots(host: HTMLElement, gun: Gun | null) {
  const pieces: Piece[] = [];
  if (!gun) return pieces;
  host.querySelectorAll<HTMLSelectElement>("select").forEach((select) => {
    const slot = gun.slots.find((item) => item.id === select.dataset.slot);
    const piece = slot?.options.find((item) => item.id === select.value);
    if (piece) pieces.push(piece);
  });
  return pieces;
}

function publish() {
  const gun = gunById(weapon.value);
  const pistol = gunById(sidearm.value);
  const parts = [
    gun,
    pistol,
    selectedPiece(helmet, data.helmets),
    selectedPiece(armor, data.armors),
    selectedPiece(vest, data.vests),
    selectedPiece(backpack, data.backpacks),
    ...chosenSlots(slots, gun),
    ...chosenSlots(sideSlots, pistol),
  ].filter((part): part is Piece => Boolean(part));

  let price = 0;
  let weight = 0;
  let missingPrice = 0;
  let missingWeight = 0;
  for (const part of parts) {
    if (part.price === null) missingPrice += 1;
    else price += part.price;
    if (part.weight === null) missingWeight += 1;
    else weight += part.weight;
  }
  const klass = [...data.weightClasses].reverse().find((item) => weight >= item.minKg) ?? data.weightClasses[0];
  const priceNode = document.querySelector("#price");
  const weightNode = document.querySelector("#weight");
  const classNode = document.querySelector("#class");
  const speedNode = document.querySelector("#speed");
  const gapNode = document.querySelector("#gaps");
  if (priceNode) priceNode.textContent = money(price);
  if (weightNode) weightNode.textContent = `${weight.toFixed(1)} кг`;
  if (classNode) classNode.textContent = klass?.label ?? "—";
  if (speedNode) speedNode.textContent = klass ? `${Math.round(klass.speed * 100)}%` : "—";
  for (const node of [priceNode, weightNode, classNode, speedNode]) {
    if (!(node instanceof HTMLElement)) continue;
    node.classList.remove("tick");
    void node.offsetWidth;
    node.classList.add("tick");
  }
  if (gapNode) {
    const bits = [];
    if (missingPrice) bits.push(`без цены в билде: ${missingPrice}`);
    if (missingWeight) bits.push(`без веса в билде: ${missingWeight}`);
    gapNode.textContent = bits.join(" · ");
  }

  const payload = {
    w: weapon.value,
    s: sidearm.value,
    h: helmet.value,
    a: armor.value,
    v: vest.value,
    b: backpack.value,
    t: Object.fromEntries([...slots.querySelectorAll<HTMLSelectElement>("select")].map((select) => [select.dataset.slot, select.value])),
    u: Object.fromEntries([...sideSlots.querySelectorAll<HTMLSelectElement>("select")].map((select) => [select.dataset.slot, select.value])),
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  const url = new URL(location.href);
  url.searchParams.set("k", encoded);
  history.replaceState(null, "", url);
  paintShop();
}

function applyShare() {
  const raw = new URLSearchParams(location.search).get("k");
  if (!raw) return;
  try {
    const json = decodeURIComponent(escape(atob(raw.replaceAll("-", "+").replaceAll("_", "/"))));
    const payload = JSON.parse(json) as { w?: string; s?: string; h?: string; a?: string; v?: string; b?: string; t?: Record<string, string>; u?: Record<string, string> };
    weapon.value = payload.w ?? "";
    sidearm.value = payload.s ?? "";
    helmet.value = payload.h ?? "";
    armor.value = payload.a ?? "";
    vest.value = payload.v ?? "";
    backpack.value = payload.b ?? "";
    renderSlots(slots, gunById(weapon.value), "t");
    renderSlots(sideSlots, gunById(sidearm.value), "u");
    for (const [slot, id] of Object.entries(payload.t ?? {})) {
      const select = slots.querySelector<HTMLSelectElement>(`select[data-slot="${slot}"]`);
      if (select) select.value = id;
    }
    for (const [slot, id] of Object.entries(payload.u ?? {})) {
      const select = sideSlots.querySelector<HTMLSelectElement>(`select[data-slot="${slot}"]`);
      if (select) select.value = id;
    }
  } catch {
    /* битая ссылка просто открывает пустую сборку */
  }
}

weapon.addEventListener("change", () => {
  renderSlots(slots, gunById(weapon.value), "t");
  publish();
});
sidearm.addEventListener("change", () => {
  renderSlots(sideSlots, gunById(sidearm.value), "u");
  publish();
});
for (const select of [helmet, armor, vest, backpack]) select.addEventListener("change", publish);

const KIND_ORDER = ["AR", "SMG", "Shotgun", "LMG", "DMR", "Sniper", "Bow", "Pistol"];
let tab: Tab = "overview";
let rack: RackId = "weapon";
let kind = "";
const shop = document.querySelector<HTMLElement>("#shop")!;
const chips = document.querySelector<HTMLElement>("#shop-chips")!;
const tools = document.querySelector<HTMLElement>("#shop-tools")!;
const racks = document.querySelector<HTMLElement>("#racks")!;
const shopQuery = document.querySelector<HTMLInputElement>("#shop-q")!;
const esc = (value: string) => value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch);
const gearMark = `<svg class="gun" viewBox="0 0 120 48" aria-hidden="true"><path d="M44 6h32l12 12v24H32V18z" fill="currentColor"/></svg>`;

function racksOf() {
  return [
    { id: "weapon" as const, label: "Основное", select: weapon, list: data.weapons as Piece[] },
    { id: "sidearm" as const, label: "Пистолет", select: sidearm, list: data.sidearms as Piece[] },
    { id: "helmet" as const, label: "Шлем", select: helmet, list: data.helmets },
    { id: "armor" as const, label: "Броня", select: armor, list: data.armors },
    { id: "vest" as const, label: "Разгрузка", select: vest, list: data.vests },
    { id: "backpack" as const, label: "Рюкзак", select: backpack, list: data.backpacks },
  ];
}

function lineOf(item: Piece) {
  const bits: string[] = [];
  if (item.subtitle) bits.push(SUBTITLE[item.subtitle] ?? item.subtitle);
  if (item.weight !== null) bits.push(`${item.weight} кг`);
  if (item.unlock) bits.push(`${ROLE_LABEL[item.unlock.role] ?? item.unlock.role} ${item.unlock.level}`);
  return bits.join(" · ");
}

function offer(item: Piece | null, picked: string, rackId: RackId, mark: string, empty = "Снять со слота") {
  const id = item?.id ?? "";
  const name = item?.name ?? "Пусто";
  const price = !item ? "" : item.price === null ? `<b class="na">нет цены</b>` : `<b class="price">${money(item.price)}</b>`;
  return `<button type="button" class="offer${picked === id ? " on" : ""}" data-rack="${rackId}" data-pick="${esc(id)}">
    <span class="pic">${mark}</span>
    <span><strong>${esc(name)}</strong><small>${esc(item ? lineOf(item) : empty)}</small></span>
    ${price}
  </button>`;
}

function paintShop() {
  const rows = racksOf();
  document.querySelectorAll<HTMLButtonElement>("#vendor-tabs button").forEach((button) => {
    button.classList.toggle("on", button.dataset.tab === tab);
  });
  racks.innerHTML = rows.map((item) => {
    const piece = item.list.find((entry) => entry.id === item.select.value);
    const active = tab !== "overview" && tab !== "mods" && rack === item.id;
    return `<button type="button" class="${active ? "on" : ""}" data-open="${item.id}"><small>${item.label}</small><strong>${esc(piece?.name ?? "Пусто")}</strong></button>`;
  }).join("");

  if (tab === "overview") {
    tools.hidden = true;
    shop.innerHTML = rows.map((item) => {
      const piece = item.list.find((entry) => entry.id === item.select.value) ?? null;
      const fallback = item.id === "weapon" || item.id === "sidearm" ? gunMark((piece as Gun | null)?.archetype ?? (item.id === "sidearm" ? "Pistol" : "AR")) : gearMark;
      const mark = itemArt(piece?.icon, fallback);
      return offer(piece, piece ? item.select.value : "—", item.id, mark, "Выбрать в списке").replace(`data-rack="${item.id}"`, `data-rack="${item.id}" data-jump="${item.id}"`);
    }).join("");
    return;
  }

  if (tab === "mods") {
    tools.hidden = true;
    const blocks = [
      { title: "Обвесы оружия", host: slots, gun: gunById(weapon.value), hostName: "main" },
      { title: "Обвесы пистолета", host: sideSlots, gun: gunById(sidearm.value), hostName: "side" },
    ];
    shop.innerHTML = blocks.map((block) => {
      if (!block.gun) return `<p class="shop-title">${block.title}</p><p class="note">${block.hostName === "side" ? "Сначала выберите пистолет." : "Сначала выберите оружие."}</p>`;
      if (!block.gun.slots.length) return `<p class="shop-title">${block.title}</p><p class="note">У этого оружия обвесов нет.</p>`;
      return `<p class="shop-title">${block.title}</p>` + block.gun.slots.map((slot) => {
        const select = block.host.querySelector<HTMLSelectElement>(`select[data-slot="${slot.id}"]`);
        const picked = select?.value ?? "";
        const options = [{ id: "", name: "Не ставить", weight: null, price: null }, ...slot.options];
        return `<p class="shop-label">${esc(slot.label)}</p>` + options.map((item) => {
          const price = item.id === "" ? "" : item.price === null ? `<b class="na">нет цены</b>` : `<b class="price">${money(item.price)}</b>`;
          return `<button type="button" class="offer${picked === item.id ? " on" : ""}" data-host="${block.hostName}" data-slot="${esc(slot.id)}" data-pick="${esc(item.id)}"><span class="pic">${itemArt(item.icon, gunMark(block.gun?.archetype ?? "AR"))}</span><span><strong>${esc(item.name)}</strong><small>${esc(item.id ? lineOf(item) : "Снять обвес")}</small></span>${price}</button>`;
        }).join("");
      }).join("");
    }).join("");
    return;
  }

  tools.hidden = false;
  const current = rows.find((item) => item.id === rack) ?? rows[0];
  const guns = current.id === "weapon" ? (data.weapons as Gun[]) : [];
  const present = KIND_ORDER.filter((name) => guns.some((gun) => gun.archetype === name));
  chips.innerHTML = current.id === "weapon"
    ? `<button type="button" class="${kind ? "" : "on"}" data-kind="">Все</button>` + present.map((name) => `<button type="button" class="${kind === name ? "on" : ""}" data-kind="${name}">${KIND_LABEL[name]}</button>`).join("")
    : "";
  const q = shopQuery.value.trim().toLowerCase();
  const list = current.list.filter((item) => {
    const gun = item as Gun;
    if (kind && gun.archetype !== kind) return false;
    const hay = `${item.name} ${item.subtitle ?? ""} ${SUBTITLE[item.subtitle ?? ""] ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
  const markOf = (item: Piece) => itemArt(item.icon, current.id === "weapon" || current.id === "sidearm" ? gunMark((item as Gun).archetype ?? "Pistol") : gearMark);
  shop.innerHTML = offer(null, current.select.value, current.id, gearMark) + list.map((item) => offer(item, current.select.value, current.id, markOf(item))).join("");
}

document.querySelectorAll<HTMLButtonElement>("#vendor-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    tab = (button.dataset.tab as Tab) ?? "overview";
    if (tab === "guns" && rack !== "weapon" && rack !== "sidearm") rack = "weapon";
    if (tab === "gear" && !["helmet", "armor", "vest", "backpack"].includes(rack)) rack = "helmet";
    kind = "";
    paintShop();
  });
});
racks.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-open]");
  if (!button?.dataset.open) return;
  rack = button.dataset.open as RackId;
  tab = rack === "weapon" || rack === "sidearm" ? "guns" : "gear";
  kind = "";
  paintShop();
});
chips.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-kind]");
  if (!button) return;
  kind = button.dataset.kind ?? "";
  paintShop();
});
shop.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-pick]");
  if (!button) return;
  if (button.dataset.jump) {
    rack = button.dataset.jump as RackId;
    tab = rack === "weapon" || rack === "sidearm" ? "guns" : "gear";
    kind = "";
    paintShop();
    return;
  }
  if (button.dataset.slot) {
    const host = button.dataset.host === "side" ? sideSlots : slots;
    const select = host.querySelector<HTMLSelectElement>(`select[data-slot="${button.dataset.slot}"]`);
    if (!select) return;
    select.value = button.dataset.pick ?? "";
    select.dispatchEvent(new Event("change"));
    return;
  }
  const row = racksOf().find((item) => item.id === button.dataset.rack);
  if (!row) return;
  row.select.value = button.dataset.pick ?? "";
  row.select.dispatchEvent(new Event("change"));
});
shopQuery.addEventListener("input", paintShop);

document.querySelector("#copy")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
  } catch {
    return;
  }
  track("share_build");
  const button = document.querySelector("#copy");
  if (!button) return;
  button.textContent = "Ссылка скопирована";
  button.classList.add("is-done");
  window.setTimeout(() => {
    button.textContent = "Скопировать ссылку";
    button.classList.remove("is-done");
  }, 1600);
});

document.querySelector("#publish-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const note = document.querySelector("#publish-note");
  const title = document.querySelector<HTMLInputElement>("#build-title")?.value.trim() ?? "";
  const code = new URLSearchParams(location.search).get("k") ?? "";
  const pieceName = (select: HTMLSelectElement) => {
    if (!select.value) return "";
    return select.selectedOptions[0]?.textContent?.split("·")[0]?.trim() ?? "";
  };
  if (!weapon.value) {
    if (note) note.textContent = "Сначала выберите основное оружие.";
    return;
  }
  if (title.length < 3) {
    if (note) note.textContent = "Название — хотя бы 3 символа.";
    return;
  }
  const summary = [pieceName(weapon), pieceName(armor)].filter(Boolean).join(" · ");
  const response = await fetch("/api/builds", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, code, summary }),
  });
  if (response.status === 401) {
    location.href = `/auth/steam?next=${encodeURIComponent(location.pathname + location.search)}`;
    return;
  }
  if (!response.ok) {
    if (note) note.textContent = "Не получилось опубликовать. Проверьте название и оружие.";
    return;
  }
  const data = await response.json() as { id?: string; season?: string };
  if (note && data.id && /^\d+$/.test(String(data.id))) {
    const season = String(data.season ?? "").replace(/[^\d]/g, "");
    note.innerHTML = `Сборка в топе сезона ${season}. <a href="/b?id=${data.id}">Открыть</a>`;
  }
});

applyShare();
publish();
