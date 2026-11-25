// Живой фон: параллакс слоёв от мыши + лёгкие частицы на canvas. Без библиотек.
const root = document.querySelector<HTMLElement>(".bg");
if (root) start(root);

function start(bg: HTMLElement) {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const canvas = bg.querySelector<HTMLCanvasElement>(".bg-dust canvas");
  const ctx = canvas?.getContext("2d") ?? null;

  // Случайная карта для разнообразия, как у профиля
  const img = bg.querySelector<HTMLImageElement>(".bg-map img");
  if (img) {
    const maps = ["bakurani", "ozeti", "sabatulo", "zestafona"];
    const pick = maps[Math.floor(Math.random() * maps.length)];
    const ready = () => bg.classList.add("is-ready");
    img.addEventListener("load", ready, { once: true });
    img.addEventListener("error", ready, { once: true });
    img.src = `/brand/maps/${pick}.webp`;
    if (img.complete) ready();
  }

  // ───── Параллакс: карта медленнее всех, частицы быстрее всех ─────
  let tx = 0, ty = 0, cx = 0, cy = 0;
  if (fine && !still) {
    addEventListener("pointermove", (e) => {
      tx = (e.clientX / innerWidth) * 2 - 1;
      ty = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
    document.addEventListener("pointerleave", () => { tx = 0; ty = 0; });
  }

  // ───── Частицы ─────
  type P = { x: number; y: number; r: number; vy: number; ph: number; sw: number; a: number; c: string; tail: number };
  const palette = ["255,170,0", "255,140,40", "224,160,70", "255,200,90"];
  let w = 0, h = 0, dpr = 1;
  let parts: P[] = [];
  const MARGIN = 60;

  const spawn = (anywhere: boolean): P => {
    const spark = Math.random() < 0.14;
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10 + Math.random() * 40,
      r: spark ? 1.1 + Math.random() * 1.1 : 0.6 + Math.random() * 1.5,
      vy: spark ? 22 + Math.random() * 30 : 8 + Math.random() * 18,
      ph: Math.random() * Math.PI * 2,
      sw: 6 + Math.random() * 18,
      a: 0.2 + Math.random() * 0.1,
      c: palette[Math.floor(Math.random() * palette.length)],
      tail: spark ? 6 + Math.random() * 8 : 0,
    };
  };

  const resize = () => {
    if (!canvas || !ctx) return;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = innerWidth + MARGIN * 2;
    h = innerHeight + MARGIN * 2;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(18, Math.min(70, Math.round((w * h) / 30000)));
    parts = Array.from({ length: count }, () => spawn(true));
  };

  const draw = (dt: number, t: number) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.y -= p.vy * dt;
      const x = p.x + Math.sin(t / 1800 + p.ph) * p.sw;
      if (p.y < -20) Object.assign(p, spawn(false));
      // Плавное появление снизу и затухание у верхнего края
      const edge = Math.min(1, Math.max(0, (h - p.y) / 90), Math.max(0, p.y / 120));
      const alpha = p.a * edge;
      if (alpha <= 0.01) continue;
      ctx.fillStyle = `rgba(${p.c},${alpha.toFixed(3)})`;
      if (p.tail) {
        ctx.fillRect(x - p.r / 2, p.y, p.r, p.tail);
      }
      ctx.beginPath();
      ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  resize();
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = window.setTimeout(resize, 150); });

  if (still) {
    draw(0, 0);
    return;
  }

  // ───── Единый цикл: параллакс + частицы ─────
  let last = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    cx += (tx - cx) * Math.min(1, dt * 4);
    cy += (ty - cy) * Math.min(1, dt * 4);
    bg.style.setProperty("--mx", cx.toFixed(4));
    bg.style.setProperty("--my", cy.toFixed(4));
    draw(dt, now);
    raf = requestAnimationFrame(frame);
  };
  const run = () => { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else run();
  });
  run();
}
