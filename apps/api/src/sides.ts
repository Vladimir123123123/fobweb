export type SideKey = "lonestar" | "valkyra" | "manticore";

/** Играбельные стороны. «White», пусто и прочее из игры — не сторона. */
export function sideKeyOf(name: unknown): SideKey | null {
  const key = String(name ?? "").toLowerCase();
  if (key.includes("lone") || key.includes("star")) return "lonestar";
  if (key.includes("valk")) return "valkyra";
  if (key.includes("mant")) return "manticore";
  return null;
}

const NAMES: Record<SideKey, string> = { lonestar: "Lonestar", valkyra: "Valkyra", manticore: "Manticore" };

/** Каноничное имя стороны или пустая строка. */
export function cleanSide(name: unknown): string {
  const key = sideKeyOf(name);
  return key ? NAMES[key] : "";
}
