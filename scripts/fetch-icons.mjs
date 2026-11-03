/**
 * Иконки интерфейса торговца. В снимке warpuppies их нет — только имена предметов.
 * Берём публичные webp с тем же именем текстуры и кладём рядом с сайтом.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";

const html = await (await fetch("https://wardogs.tools/database")).text();
const pattern = /\\"id\\":\\"(Id\.(?:Item|Vehicle)\.[A-Za-z0-9_.]+)\\"((?:(?!\\"id\\":)[\s\S]){0,8000}?)\\"icon\\":\\"https:\/\/cdn\.pixel6\.tools\/wardogs\/images\/icons\/([a-z0-9_]+)\.webp/g;
const icons = {};
for (const match of html.matchAll(pattern)) icons[match[1]] = `${match[3]}.webp`;

const catalogPath = new URL("../apps/web/src/data/catalog.json", import.meta.url);
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const needed = new Set();

function walk(value) {
  if (!value || typeof value !== "object") return;
  if (typeof value.id === "string" && value.id.startsWith("Id.")) needed.add(value.id);
  for (const child of Object.values(value)) walk(child);
}
walk(catalog);

const hit = [...needed].filter((id) => icons[id]);
const miss = [...needed].filter((id) => !icons[id]);
console.log(`map ${Object.keys(icons).length}, catalog ids ${needed.size}, matched ${hit.length}, missing ${miss.length}`);
if (miss.length) console.log(miss.slice(0, 30).join("\n"));

await writeFile(new URL("./icon-map.json", import.meta.url), JSON.stringify(icons));

function stamp(value) {
  if (!value || typeof value !== "object") return;
  if (typeof value.id === "string" && icons[value.id]) value.icon = icons[value.id];
  for (const child of Object.values(value)) stamp(child);
}
stamp(catalog);
await writeFile(catalogPath, JSON.stringify(catalog));

const dir = new URL("../apps/web/public/icons/", import.meta.url);
await mkdir(dir, { recursive: true });
const files = [...new Set(hit.map((id) => icons[id]))];
let saved = 0;
let failed = 0;
async function pull(file) {
  const response = await fetch(`https://cdn.pixel6.tools/wardogs/images/icons/${file}`, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://wardogs.tools/",
    },
  });
  if (!response.ok) {
    failed += 1;
    console.log("miss", file, response.status);
    return;
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 32) {
    failed += 1;
    console.log("tiny", file);
    return;
  }
  await writeFile(new URL(file, dir), bytes);
  saved += 1;
}
for (let i = 0; i < files.length; i += 8) {
  await Promise.all(files.slice(i, i + 8).map(pull));
}
console.log(`saved ${saved}, failed ${failed}`);
