import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MEDIA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "squad-media");
const MAX_BYTES = 1_200_000;

export function discordInvite(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return "";
    const host = url.hostname.replace(/^www\./, "");
    const code = host === "discord.gg"
      ? url.pathname.split("/").filter(Boolean)[0] ?? ""
      : host === "discord.com" && url.pathname.startsWith("/invite/")
        ? url.pathname.slice("/invite/".length).split("/")[0] ?? ""
        : "";
    if (!/^[A-Za-z0-9-]{2,32}$/.test(code)) return "";
    return `https://discord.gg/${code}`;
  } catch {
    return "";
  }
}

function kindOf(bytes: Buffer) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg" as const;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png" as const;
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp" as const;
  return "";
}

export function imageFile(input: string) {
  const raw = input.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "").replace(/\s/g, "");
  if (!raw || raw.length > Math.ceil(MAX_BYTES * 4 / 3) + 16) return null;
  const bytes = Buffer.from(raw, "base64");
  if (bytes.length < 16 || bytes.length > MAX_BYTES) return null;
  const ext = kindOf(bytes);
  if (!ext) return null;
  return { bytes, ext };
}

export function saveMedia(bytes: Buffer, ext: "jpg" | "png" | "webp") {
  mkdirSync(MEDIA_DIR, { recursive: true });
  const file = `${randomBytes(16).toString("hex")}.${ext}`;
  writeFileSync(join(MEDIA_DIR, file), bytes);
  return file;
}

export function removeMedia(file: string) {
  if (!/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(file)) return;
  try {
    unlinkSync(join(MEDIA_DIR, file));
  } catch {
    /* file already gone */
  }
}

export function readMedia(file: string) {
  if (!/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(file)) return null;
  try {
    const bytes = readFileSync(join(MEDIA_DIR, file));
    const type = file.endsWith(".png") ? "image/png" : file.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return { bytes, type };
  } catch {
    return null;
  }
}
