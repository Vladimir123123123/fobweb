const PATHS: Record<string, string> = {
  AR: "M4 30h62l10-6h28v5h8v7h-8v-2H78l-8 8H28v-6H4zm34-6h18v4H38z",
  DMR: "M4 29h78l6-5h22v4h6v6h-6v-1H90l-6 8H22v-6H4zm48-7h22v4H52z",
  Sniper: "M2 28h96l4-4h14v3h4v5h-4v-1H104l-4 7H18v-5H2zm58-8h28v3H60z",
  SMG: "M8 27h46l6-4h16v4h6v6h-6v-1H62l-6 8H22v-7H8zm18 8h8v8h-8z",
  Shotgun: "M4 26h70l4-3h28v4h6v8h-6v-2H80l-4 6H16v-6H4zm22 10h10v7H26z",
  LMG: "M2 27h86l8-5h16v4h6v7h-6v-2H98l-6 8H20v-6H2zm24 8h16v9H26z",
  Pistol: "M28 20h34l6 4v6H58v12h-8V30H28z",
  Bow: "M34 8c10 10 10 22 0 32M34 24h28l16-6v12L62 24M78 16l6 8-6 8",
};

export const KIND_LABEL: Record<string, string> = {
  AR: "Штурмовые",
  DMR: "Марксмен",
  Sniper: "Снайперские",
  SMG: "Пистолеты-пулемёты",
  Shotgun: "Дробовики",
  LMG: "Пулемёты",
  Pistol: "Пистолеты",
  Bow: "Луки",
};

export const ROLE_LABEL: Record<string, string> = {
  Assault: "Штурм",
  Medic: "Медик",
  Recon: "Разведка",
  Support: "Поддержка",
  Engineer: "Инженер",
  Driver: "Водитель",
  Pilot: "Пилот",
  Infantry: "Пехота",
  Wardog: "Вардог",
};

export const SUBTITLE: Record<string, string> = {
  "Assault Rifle": "Штурмовая винтовка",
  "Marksman Rifle": "Марксменская винтовка",
  "Sniper Rifle": "Снайперская винтовка",
  "Submachine Gun": "Пистолет-пулемёт",
  "Light Machine Gun": "Пулемёт",
  Shotgun: "Дробовик",
  Pistol: "Пистолет",
  Equipment: "Снаряжение",
  Weapon: "Оружие",
};

export function gunMark(kind: string) {
  const path = PATHS[kind] ?? PATHS.AR;
  return `<svg class="gun" viewBox="0 0 120 48" aria-hidden="true"><path d="${path}" fill="currentColor"/></svg>`;
}

export function itemArt(icon: string | null | undefined, fallback: string) {
  if (!icon || !/^[a-z0-9_]+\.webp$/.test(icon)) return fallback;
  return `<img class="art" src="/art/${icon}" alt="" decoding="async" />`;
}
