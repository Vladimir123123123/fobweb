const VISITOR = "wd_visitor";

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

export function track(name: string) {
  const payload = JSON.stringify({
    name,
    visitorId: visitorId(),
    path: location.pathname,
    ...utm(),
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
    return;
  }
  fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: payload }).catch(() => {});
}

async function paintAccount() {
  const slot = document.querySelector("#account");
  if (!slot) return;
  try {
    const response = await fetch("/api/me");
    if (!response.ok) throw new Error("api");
    const data = await response.json();
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

utm();
const seen = `pv:${location.pathname}`;
if (!sessionStorage.getItem(seen)) {
  sessionStorage.setItem(seen, "1");
  track("page_view");
}
paintAccount();

const menu = document.querySelector<HTMLButtonElement>(".menu");
menu?.addEventListener("click", () => {
  const open = document.body.classList.toggle("nav-open");
  menu.setAttribute("aria-expanded", String(open));
});
document.querySelectorAll(".nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    menu?.setAttribute("aria-expanded", "false");
  });
});
