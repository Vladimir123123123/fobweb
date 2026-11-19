const VISITOR = "wd_visitor";
const CONSENT = "wd_consent";

function visitorId() {
  let id = localStorage.getItem(VISITOR);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR, id);
  }
  return id;
}

function utm() {
  const params = new URLSearchParams(location.search);
  const source = params.get("utm_source");
  if (source) {
    sessionStorage.setItem("utm_source", source);
    sessionStorage.setItem("utm_medium", params.get("utm_medium") ?? "");
    sessionStorage.setItem("utm_campaign", params.get("utm_campaign") ?? "");
  }
  return {
    utmSource: sessionStorage.getItem("utm_source") ?? "",
    utmMedium: sessionStorage.getItem("utm_medium") ?? "",
    utmCampaign: sessionStorage.getItem("utm_campaign") ?? "",
  };
}

export function track(name: string, extra?: { utmSource?: string; utmMedium?: string; utmCampaign?: string }) {
  const marks = utm();
  const payload = JSON.stringify({
    name,
    visitorId: visitorId(),
    path: location.pathname,
    utmSource: extra?.utmSource ?? marks.utmSource,
    utmMedium: extra?.utmMedium ?? marks.utmMedium,
    utmCampaign: extra?.utmCampaign ?? marks.utmCampaign,
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
    return;
  }
  fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: payload }).catch(() => {});
}

function searchQuery() {
  let referrer = "";
  try {
    referrer = document.referrer;
  } catch {
    return null;
  }
  if (!referrer) return null;
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return null;
  }
  const host = url.hostname;
  const pick = (engine: string, key: string) => ({ engine, query: url.searchParams.get(key)?.slice(0, 80) ?? "" });
  if (host.includes("yandex.")) return pick("Яндекс", "text");
  if (host.includes("google.")) return pick("Google", "q");
  if (host.endsWith("mail.ru")) return pick("Mail", "q");
  if (host.includes("bing.")) return pick("Bing", "q");
  if (host.includes("duckduckgo.")) return pick("DuckDuckGo", "q");
  return null;
}

function rememberVisit() {
  const seen = `pv:${location.pathname}`;
  if (!sessionStorage.getItem(seen)) {
    sessionStorage.setItem(seen, "1");
    track("page_view");
  }
  const found = searchQuery();
  if (!found?.query) return;
  const key = `sq:${found.engine}:${found.query}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  track("search_land", { utmSource: found.engine, utmCampaign: found.query });
}

function loadMetrika() {
  const id = document.body.dataset.metrika ?? "";
  if (!id || document.querySelector("script[data-metrika]")) return;
  const win = window as unknown as { ym?: ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number } };
  win.ym = win.ym || function ym(...args: unknown[]) {
    (win.ym!.a = win.ym!.a || []).push(args);
  };
  win.ym.l = Date.now();
  const script = document.createElement("script");
  script.async = true;
  script.dataset.metrika = "1";
  script.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.appendChild(script);
  win.ym(Number(id), "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true });
}

function applyConsent(value: "all" | "necessary") {
  localStorage.setItem(CONSENT, value);
  document.querySelector<HTMLElement>("#consent")?.setAttribute("hidden", "");
  if (value === "all") {
    rememberVisit();
    loadMetrika();
  }
}

async function paintAccount() {
  const slot = document.querySelector("#account");
  if (!slot) return;
  try {
    const response = await fetch("/api/me");
    if (!response.ok) throw new Error("api");
    const data = await response.json();
    const nav = document.querySelector("#site-nav");
    const current = document.querySelector("#admin-link");
    if (data.admin && typeof data.adminPath === "string" && data.adminPath.startsWith("/g/") && nav) {
      const link = current ?? document.createElement("a");
      link.id = "admin-link";
      link.textContent = "Админка";
      link.setAttribute("href", data.adminPath);
      if (location.pathname === data.adminPath) link.setAttribute("aria-current", "page");
      nav.insertBefore(link, nav.querySelector(".account"));
    } else {
      current?.remove();
    }
    const user = data.user;
    if (!user) {
      slot.innerHTML = `<a class="btn small" href="/auth/steam?next=${encodeURIComponent(location.pathname + location.search)}">Войти через Steam</a>`;
      return;
    }
    const name = user.persona || user.steam_id;
    slot.innerHTML = `<a href="/p/?id=${user.steam_id}">${name}</a> <button class="btn ghost small" type="button" id="logout">Выйти</button>`;
    document.querySelector("#logout")?.addEventListener("click", () => {
      location.href = "/auth/logout";
    });
  } catch {
    slot.innerHTML = `<a class="btn small" href="/auth/steam?next=${encodeURIComponent(location.pathname + location.search)}">Войти через Steam</a>`;
  }
}

const saved = localStorage.getItem(CONSENT);
const banner = document.querySelector<HTMLElement>("#consent");
if (saved === "all") applyConsent("all");
else if (saved === "necessary") banner?.setAttribute("hidden", "");
else banner?.removeAttribute("hidden");
document.querySelector("#consent-all")?.addEventListener("click", () => applyConsent("all"));
document.querySelector("#consent-need")?.addEventListener("click", () => applyConsent("necessary"));

paintAccount();

const menu = document.querySelector<HTMLButtonElement>(".menu");
menu?.addEventListener("click", () => {
  const open = document.body.classList.toggle("nav-open");
  menu.setAttribute("aria-expanded", String(open));
});
document.querySelector("#site-nav")?.addEventListener("click", (event) => {
  if (!(event.target instanceof Element) || !event.target.closest("a")) return;
  document.body.classList.remove("nav-open");
  menu?.setAttribute("aria-expanded", "false");
});
