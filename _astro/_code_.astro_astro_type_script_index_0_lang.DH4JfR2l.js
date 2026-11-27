const s=document.querySelector("#gate"),J=new URLSearchParams(location.search).get("invite");let E;try{E=await fetch("/api/admin/session")}catch{E=new Response(null,{status:404})}E.status===404&&J&&(s.innerHTML=`<h1>Подтверждение Steam</h1><p>Ссылка одноразовая. После входа через Steam она погаснет, а доступ останется на вашем SteamID.</p><a class="btn" href="/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}">Подтвердить Steam</a>`,(await fetch("/api/me").then(m=>m.json()).catch(()=>null))?.user&&((await fetch("/api/admin/invites/redeem",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:J})})).ok?location.href=location.pathname:s.innerHTML="<h1>Такой страницы нет</h1><p>Проверьте адрес.</p>"));if(E.ok){const c=await fetch("/api/admin/overview").then(e=>e.json()),m=e=>c.sync.find(t=>t.status===e)?.count??0,d=e=>e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]??t),O=(c.assets??[]).length+(c.reports??[]).length+c.squads.filter(e=>e.status!=="approved"&&e.status!=="rejected").length,I=e=>`<div class="desk-meter">${e.map(t=>`<p><span>${d(t.label)}</span><b>${t.count}</b></p>`).join("")||"<p><span>Пока пусто</span><b>0</b></p>"}</div>`,$=e=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${e}</svg>`,k={users:$('<circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.2 2.7-5.500 6-5.500s6 2.300 6 5.500"/><circle cx="17" cy="9" r="2.400"/><path d="M17 14c2.400 0 4 1.700 4 4.500"/>'),eye:$('<path d="M2 12s3.600-6.500 10-6.500S22 12 22 12s-3.600 6.500-10 6.500S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),chat:$('<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8.500 10h7"/>'),link:$('<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>')},B=e=>{if(!e.length)return'<p class="note">Просмотров за две недели пока нет.</p>';const t=Math.max(...e.map(a=>a.count),1),o=e.map((a,r)=>{const l=e.length===1?50:r/(e.length-1)*100,b=100-Math.max(4,Math.round(a.count/t*92));return`${l},${b}`});return`<div class="activity-chart area-chart">
        <svg class="area-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffc107" stop-opacity="0.45"/><stop offset="100%" stop-color="#ffc107" stop-opacity="0"/></linearGradient></defs>
          <polygon points="${`0,100 ${o.join(" ")} 100,100`}" fill="url(#areaFill)"/>
          <polyline points="${o.join(" ")}" fill="none" stroke="#ffc107" stroke-width="1.8" vector-effect="non-scaling-stroke"/>
        </svg>
        <div class="bars" role="img" aria-label="Просмотры по дням">${e.map(a=>`<div class="bar" title="${d(a.day)}: ${a.count}"><span class="bar-value">${a.count}</span><div class="bar-track"><div class="bar-fill" style="height:${Math.max(3,Math.round(a.count/t*100))}%"></div></div><span class="bar-day">${d(a.day.slice(5).split("-").reverse().join("."))}</span></div>`).join("")}</div>
      </div>`},F=(e,t)=>{const o=Math.max(...e.map(r=>r.count),1),n=e.map(r=>`<span style="--w:${1+Math.round(r.count/o*4)}">${d(`${r.query||"без текста"}`)}<sup>${r.count}</sup></span>`),a=t.map(r=>`<span style="--w:0;opacity:.7">${d(r)}</span>`);return`<div class="tag-cloud">${[...n,...a].join("")||"<span>Пока пусто</span>"}</div>`};s.innerHTML=`
      <h1>Сводка</h1>
      <nav class="desk-nav" id="desk-nav">
        <button type="button" data-desk="home" class="on">Сводка</button>
        <button type="button" data-desk="guides">Гайды</button>
        <button type="button" data-desk="players">Игроки</button>
        <button type="button" data-desk="squads">Сквады${O?` ${O}`:""}</button>
        <button type="button" data-desk="builds">Сборки</button>
        <button type="button" data-desk="quests">Квесты</button>
        <button type="button" data-desk="shop">Магазин</button>
        <button type="button" data-desk="access">Доступ</button>
      </nav>
      <section class="desk" data-desk="home">
        <div class="stats">
          <div class="stat"><span class="stat-icon">${k.users}</span><b>${c.liveCis}</b><span>Живые профили СНГ, 7 дней</span></div>
          <div class="stat"><span class="stat-icon">${k.eye}</span><b>${c.views7d}</b><span>Просмотры, 7 дней</span></div>
          <div class="stat"><span class="stat-icon">${k.chat}</span><b>${c.discordClicks7d}</b><span>Клики в Discord, 7 дней</span></div>
          <div class="stat"><span class="stat-icon">${k.link}</span><b>${c.shares7d}</b><span>Ссылки сборок, 7 дней</span></div>
        </div>
        <p class="note">Входы за 7 дней: ${c.logins7d}. Клики по баннерам сквадов: ${c.squadBannerClicks7d??0}. Сессии синка: живые ${m("active")}, погасшие ${m("expired")}.</p>
        <h2>Откуда пришли</h2>
        ${I(c.sources.map(e=>({label:e.source,count:e.count})))}
        <h2>По дням</h2>
        ${B(c.days)}
        <h2>Поисковые запросы</h2>
        <p class="note">Крупнее — чаще. Серые — формулировки, под которые подписаны страницы. Яркие — слова, которые поисковик передал вместе с переходом. Google часто их не отдаёт.</p>
        ${F(c.searchHits??[],c.searchTags??[])}
      </section>
      <section class="desk" data-desk="guides" hidden>
        <h2>Гайды</h2>
        <p class="note">Пустая строка начинает абзац. Строка с «- » — пункт списка. **так** выделяет слово. Ссылка необязательна: страница сайта вроде /ratings или адрес https://…</p>
        <form id="guide-form" class="guide-form">
          <div class="desk-split">
            <label>Рубрика<input id="guide-rubric" maxlength="40" placeholder="Steam"></label>
            <label>Порядок<input id="guide-sort" type="number" min="0" max="9999" value="0"></label>
          </div>
          <label>Заголовок<input id="guide-title" maxlength="120" required></label>
          <label>Текст<textarea id="guide-body" maxlength="8000" required></textarea></label>
          <label>Ссылка<input id="guide-href" maxlength="200" placeholder="/ratings"></label>
          <label class="check"><input id="guide-hidden" type="checkbox"> Скрыть с сайта</label>
          <div class="row">
            <button class="btn" id="guide-save" type="submit">Добавить</button>
            <button class="btn ghost" id="guide-cancel" type="button" hidden>Отмена</button>
          </div>
          <p id="guide-note" class="note"></p>
        </form>
        <div class="desk-list" id="guide-list"></div>
      </section>
      <section class="desk" data-desk="players" hidden>
        <h2>Игроки в топе</h2>
        <p class="note">По умолчанию все в рейтинге. Здесь можно скрыть или вернуть вручную.</p>
        <div class="desk-list" id="players">
          ${c.players.map(e=>{const t=!!e.hide_leaderboard||e.cis_opt_in===!1;return`<div class="desk-row"><a class="grow" href="/p?id=${e.steam_id}">${e.persona??e.steam_id}</a><span class="desk-state">${t?"скрыт":"в топе"}</span><button class="btn ghost small" data-hide="${e.steam_id}" data-on="${t?"1":"0"}" type="button">${t?"Показать в топе":"Скрыть из топа"}</button></div>`}).join("")}
        </div>
      </section>
      <section class="desk" data-desk="squads" hidden>
        <h2>Картинки сквадов</h2>
        <div class="desk-cards" id="assets">${(c.assets??[]).map(e=>`<article class="panel"><img class="${e.kind==="logo"?"asset-preview logo":"asset-preview"}" src="/api/media/${d(e.path)}" alt="" /><p>[${d(e.tag)}] ${d(e.name)} · ${e.kind==="logo"?"логотип":"баннер"}</p>${e.discord_url?`<p>${d(e.discord_url)}</p>`:""}<button class="btn small" data-asset="${e.id}" data-accept="1" type="button">Одобрить</button> <button class="btn ghost small" data-asset="${e.id}" data-accept="0" type="button">Отклонить</button></article>`).join("")||"<p>Новых картинок нет.</p>"}</div>
        <h2>Жалобы на участников</h2>
        <div class="desk-list" id="reports">${(c.reports??[]).map(e=>`<div class="desk-row"><p class="grow">[${d(e.tag)}] ${d(e.name)} · на <a href="/p?id=${e.target_steam_id}">${d(e.target_name??e.target_steam_id)}</a> · от ${d(e.reporter_name??"игрока")}<br>${d(e.note)}</p><button class="btn ghost small" data-report="${e.id}" type="button">Закрыть</button></div>`).join("")||"<p>Открытых жалоб нет.</p>"}</div>
        <h2>Сквады</h2>
        <div class="desk-list" id="squads">${c.squads.map(e=>`<div class="desk-row"><p class="grow">[${d(e.tag)}] ${d(e.name)} · ${d(e.persona??"")}</p><span class="desk-state">${e.status==="approved"?"в списке":e.status==="rejected"?"отклонён":"ждёт проверки"}</span>${e.status==="approved"?`<button class="btn ghost small" data-review="${e.id}" data-accept="0" type="button">Убрать из списка</button>`:`<button class="btn small" data-review="${e.id}" data-accept="1" type="button">Одобрить сквад</button>`}${e.closed?'<span class="desk-state">набор закрыт</span>':`<button class="btn ghost small" data-close="${e.id}" type="button">Закрыть набор</button>`}${e.has_banner?`<button class="btn ghost small" data-clear="${e.id}" data-kind="banner" type="button">Снять баннер</button>`:""}${e.has_logo?`<button class="btn ghost small" data-clear="${e.id}" data-kind="logo" type="button">Скрыть логотип</button>`:""}</div>`).join("")}</div>
      </section>
      <section class="desk" data-desk="builds" hidden>
        <h2>Сборки</h2>
        <div class="desk-list" id="builds">${(c.builds??[]).map(e=>`<div class="desk-row"><p class="grow"><a href="/b?id=${e.id}">${d(e.title)}</a> · сезон ${d(String(e.season))} · ${d(e.persona??"")}</p>${e.hidden?`<button class="btn ghost small" data-build="${e.id}" data-on="1" type="button">Вернуть</button>`:`<button class="btn ghost small" data-build="${e.id}" data-on="0" type="button">Скрыть</button>`}</div>`).join("")||"<p>Сборок нет.</p>"}</div>
      </section>
      <section class="desk" data-desk="quests" hidden>
        <h2>Квесты</h2>
        <p class="note">Игроки запускают их на <a href="/quests">/quests</a> после входа через Steam. Считаются чужие убийства после кнопки «Начать»: свои и самоубийства не входят. Опыт и очки — сообщества, не карьера в игре. 50 опыта поднимают уровень на 1, потолок 600.</p>
        <div class="row">
          <button class="btn ghost" id="quest-templates" type="button">Шаблоны</button>
          <button class="btn" id="quest-new" type="button">Новый квест</button>
        </div>
        <div id="quest-template-list" class="quest-templates" hidden></div>
        <form id="quest-form" class="guide-form" hidden>
          <div class="desk-split">
            <label>Заголовок<input id="quest-title" maxlength="120" required></label>
            <label>Убийства<input id="quest-kills" type="number" min="1" max="500" value="10" required></label>
          </div>
          <div class="desk-split">
            <label>Сложность<select id="quest-difficulty"><option value="easy">Легкая</option><option value="mid" selected>Средняя</option><option value="hard">Сложная</option></select></label>
            <label>Повтор<select id="quest-repeat"><option value="once">Один раз</option><option value="weekly">Еженедельно</option><option value="monthly">Ежемесячно</option></select></label>
          </div>
          <label>Описание для игроков<textarea id="quest-body" maxlength="500" required></textarea></label>
          <div class="desk-split">
            <label>Опыт<input id="quest-xp" type="number" min="0" max="2000" value="100"></label>
            <label>Очки<input id="quest-coins" type="number" min="0" max="5000" value="40"></label>
          </div>
          <div class="desk-split">
            <label>Не ближе, м<input id="quest-min" type="number" min="0" max="2000" value="0"></label>
            <label>Не дальше, м<input id="quest-max" type="number" min="0" max="2000" value="0"></label>
          </div>
          <label>Оружие, слова через запятую<input id="quest-weapon" maxlength="120" placeholder="пусто — любое"></label>
          <label class="check"><input id="quest-head" type="checkbox"> Только в голову</label>
          <div class="desk-split">
            <label>Начало<input id="quest-start" type="datetime-local"></label>
            <label>Конец<input id="quest-end" type="datetime-local"></label>
          </div>
          <div class="row">
            <button class="btn" id="quest-live" type="submit">Сохранить и запустить</button>
            <button class="btn ghost" id="quest-draft" type="button">Сохранить черновик</button>
            <button class="btn ghost" id="quest-cancel" type="button">Отмена</button>
          </div>
          <p id="quest-note" class="note"></p>
        </form>
        <div class="quest-table" id="quest-admin"></div>
      </section>
      <section class="desk" data-desk="shop" hidden>
        <h2>Магазин</h2>
        <p class="note">Очки берутся из квестов и из сида: игрок на сервере, пока онлайн ниже порога. Минута даёт очки, день ограничен, чтобы простой сид не обгонял оплату. Кнопка «Обновить статистику» даёт 10 очков раз в московские сутки и в казну их не копирует. Очки за квест ещё раз пишутся в казну сквада. Клановый слот не продаётся игроку: его цену и срок берёт казна на странице сквада. Скрытый клановый товар отключает покупку слота. VIP за 300 ₽ и клановый за 200 ₽ в тикете Discord остаются быстрее. Роль Спонсор выдаёт бот, если у игрока привязан Discord.</p>
        <form id="shop-settings" class="guide-form">
          <div class="desk-split">
            <label>Очков за минуту сида<input id="seed-coins" type="number" min="0" max="100" required></label>
            <label>Потолок в день<input id="seed-cap" type="number" min="0" max="100000" required></label>
          </div>
          <label>Сид, пока на сервере меньше<input id="seed-below" type="number" min="1" max="200" required></label>
          <button class="btn" type="submit">Сохранить сид</button>
          <p id="shop-settings-note" class="note"></p>
        </form>
        <h2>Товар</h2>
        <form id="shop-form" class="guide-form">
          <label>Название<input id="shop-title" maxlength="80" required></label>
          <label>Текст<textarea id="shop-body" maxlength="300"></textarea></label>
          <div class="desk-split">
            <label>Цена, очки<input id="shop-price" type="number" min="1" max="1000000" required></label>
            <label>Дней роли<input id="shop-days" type="number" min="0" max="366" value="30"></label>
          </div>
          <label>Что выдаёт<select id="shop-kind"><option value="vip">VIP, роль Спонсор</option><option value="clanvip">Клановый слот, покупает казна сквада</option><option value="note">Просто записать покупку</option></select></label>
          <label class="check"><input id="shop-hidden" type="checkbox"> Скрыть с сайта</label>
          <div class="row">
            <button class="btn" type="submit">Сохранить товар</button>
            <button class="btn ghost" id="shop-cancel" type="button" hidden>Отмена</button>
          </div>
          <p id="shop-form-note" class="note"></p>
        </form>
        <div class="quest-table" id="shop-admin"></div>
        <h2>Последние покупки</h2>
        <div class="desk-list" id="shop-orders"></div>
      </section>
      <section class="desk" data-desk="access" hidden>
        <h2>Топ сезона ${d(String(c.season??""))}</h2>
        <p class="note">В этом сезоне снимков: ${c.seasonPlayers??0}. Кнопка стирает только текущий сезон. Сезон 2 остаётся.</p>
        <button class="btn" id="reset-season" type="button">Обнулить топ сезона</button>
        <p id="reset-note" class="note"></p>
        <h2>Ссылка доступа</h2>
        <button class="btn" id="invite" type="button">Выдать ссылку на 48 часов</button>
        <p id="invite-url"></p>
      </section>
    `;const V=[...s.querySelectorAll(".desk")],G=e=>{for(const t of V)t.hidden=t.dataset.desk!==e;s.querySelectorAll("#desk-nav button").forEach(t=>t.classList.toggle("on",t.dataset.desk===e)),e==="quests"&&A(),e==="shop"&&x()};s.querySelector("#desk-nav")?.addEventListener("click",e=>{const t=e.target.closest("button");t?.dataset.desk&&G(t.dataset.desk)});const P=c.guides??[],L=s.querySelector("#guide-form"),j=s.querySelector("#guide-list"),C=s.querySelector("#guide-note"),N=s.querySelector("#guide-cancel"),S=s.querySelector("#guide-save");let f=0;const u=e=>s.querySelector(e),R=()=>{j&&(j.innerHTML=P.map(e=>`<div class="desk-row"><p class="grow"><b>${d(e.title)}</b> · ${d(e.rubric||"без рубрики")}</p><span class="desk-state">${e.hidden?"скрыт":"на сайте"}</span><button class="btn ghost small" data-guide-edit="${e.id}" type="button">Править</button><button class="btn ghost small" data-guide-hide="${e.id}" type="button">${e.hidden?"Показать":"Скрыть"}</button><button class="btn ghost small" data-guide-delete="${e.id}" type="button">Удалить</button></div>`).join("")||"<p>Пока пусто.</p>")},Z=()=>{f=0,L?.reset(),S&&(S.textContent="Добавить"),N?.setAttribute("hidden","")};R(),L?.addEventListener("submit",async e=>{e.preventDefault();const t={rubric:u("#guide-rubric")?.value??"",title:u("#guide-title")?.value??"",body:u("#guide-body")?.value??"",href:u("#guide-href")?.value??"",sort:Number(u("#guide-sort")?.value||0),hidden:s.querySelector("#guide-hidden")?.checked===!0};if(!(await fetch(f?`/api/admin/guides/${f}`:"/api/admin/guides",{method:f?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(t)})).ok){C&&(C.textContent="Не сохранилось. Нужны заголовок и текст.");return}location.reload()}),N?.addEventListener("click",Z),j?.addEventListener("click",async e=>{const t=e.target.closest("button");if(!t)return;const o=Number(t.dataset.guideEdit||t.dataset.guideHide||t.dataset.guideDelete),n=P.find(a=>a.id===o);if(n){if(t.dataset.guideEdit){f=n.id;const a=u("#guide-rubric"),r=u("#guide-title"),l=u("#guide-body"),b=u("#guide-href"),g=u("#guide-sort"),q=s.querySelector("#guide-hidden");a&&(a.value=n.rubric||""),r&&(r.value=n.title),l&&(l.value=n.body),b&&(b.value=n.href||""),g&&(g.value=String(n.sort_order||0)),q&&(q.checked=!!n.hidden),S&&(S.textContent="Сохранить"),N?.removeAttribute("hidden"),L?.scrollIntoView({block:"center"});return}if(t.dataset.guideHide){await fetch(`/api/admin/guides/${n.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({...n,sort:n.sort_order,hidden:!n.hidden})}),location.reload();return}t.dataset.guideDelete&&confirm(`Удалить «${n.title}»?`)&&(await fetch(`/api/admin/guides/${n.id}`,{method:"DELETE"}),location.reload())}}),s.querySelector("#reset-season")?.addEventListener("click",async()=>{if(!confirm(`Обнулить топ сезона ${c.season}? Снимки сезона 2 не удаляются.`)||prompt("Для подтверждения напишите ОБНУЛИТЬ")!=="ОБНУЛИТЬ")return;const t=await fetch("/api/admin/season/reset",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({confirm:"ОБНУЛИТЬ"})}),o=await t.json().catch(()=>({})),n=s.querySelector("#reset-note");if(!t.ok){n&&(n.textContent=o.error==="season_locked"?"Сезон 2 не обнуляется. На сервере API в GAME_SEASON должен быть 03, затем перезапуск Node.":"Не вышло.");return}n&&(n.textContent=`Снято снимков: ${o.removed}. Сезон ${o.season}.`),location.reload()}),s.querySelector("#invite")?.addEventListener("click",async()=>{const t=await(await fetch("/api/admin/invites",{method:"POST"})).json(),o=s.querySelector("#invite-url");o&&(o.textContent=t.url??"")}),s.querySelectorAll("[data-hide]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/players/${e.dataset.hide}/hide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({hide:e.dataset.on!=="1"})}),location.reload()})}),s.querySelectorAll("[data-close]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${e.dataset.close}/close`,{method:"POST"}),location.reload()})}),s.querySelectorAll("[data-review]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${e.dataset.review}/review`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accept:e.dataset.accept==="1"})}),location.reload()})}),s.querySelectorAll("[data-clear]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${e.dataset.clear}/clear`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind:e.dataset.kind})}),location.reload()})}),s.querySelectorAll("[data-asset]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/assets/${e.dataset.asset}/review`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accept:e.dataset.accept==="1"})}),location.reload()})}),s.querySelectorAll("[data-report]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/reports/${e.dataset.report}/close`,{method:"POST"}),location.reload()})}),s.querySelectorAll("[data-build]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/builds/${e.dataset.build}/hide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({hide:e.dataset.on!=="1"})}),location.reload()})});let p=0,T=[];const i=e=>s.querySelector(e),h=s.querySelector("#quest-form"),y=s.querySelector("#quest-template-list"),D=e=>{if(!e)return"";const t=new Date(String(e).replace(" ","T")+(String(e).endsWith("Z")?"":"Z"));if(Number.isNaN(t.getTime()))return"";const o=n=>String(n).padStart(2,"0");return`${t.getFullYear()}-${o(t.getMonth()+1)}-${o(t.getDate())}T${o(t.getHours())}:${o(t.getMinutes())}`},_=e=>{h?.removeAttribute("hidden"),i("#quest-title")&&(i("#quest-title").value=e.title),i("#quest-body")&&(i("#quest-body").value=e.body),i("#quest-kills")&&(i("#quest-kills").value=String(e.kills)),i("#quest-difficulty")&&(i("#quest-difficulty").value=e.difficulty),i("#quest-repeat")&&(i("#quest-repeat").value=e.repeat),i("#quest-xp")&&(i("#quest-xp").value=String(e.xp)),i("#quest-coins")&&(i("#quest-coins").value=String(e.coins)),i("#quest-min")&&(i("#quest-min").value=String(e.minMeters||0)),i("#quest-max")&&(i("#quest-max").value=String(e.maxMeters||0)),i("#quest-weapon")&&(i("#quest-weapon").value=e.weapon||"");const t=s.querySelector("#quest-head");t&&(t.checked=!!e.headshot),i("#quest-start")&&(i("#quest-start").value=D(e.startsAt)),i("#quest-end")&&(i("#quest-end").value=D(e.endsAt))},Q=e=>({title:i("#quest-title")?.value??"",body:i("#quest-body")?.value??"",kills:Number(i("#quest-kills")?.value||0),difficulty:i("#quest-difficulty")?.value||"mid",repeat:i("#quest-repeat")?.value||"once",xp:Number(i("#quest-xp")?.value||0),coins:Number(i("#quest-coins")?.value||0),minMeters:Number(i("#quest-min")?.value||0),maxMeters:Number(i("#quest-max")?.value||0),weapon:i("#quest-weapon")?.value??"",headshot:s.querySelector("#quest-head")?.checked===!0,startsAt:i("#quest-start")?.value?new Date(i("#quest-start").value).toISOString():null,endsAt:i("#quest-end")?.value?new Date(i("#quest-end").value).toISOString():null,status:e}),H=async e=>{const t=s.querySelector("#quest-note"),o=Q(e);if(!(await fetch(p?`/api/admin/quests/${p}`:"/api/admin/quests",{method:p?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(o)})).ok){t&&(t.textContent="Проверь заголовок, описание и число убийств.");return}p=0,h?.reset(),h?.setAttribute("hidden",""),A()},A=async()=>{const e=await fetch("/api/admin/quests").then(a=>a.ok?a.json():null),t=s.querySelector("#quest-admin");if(!e||!t||!y)return;T=e.templates??[];const o={easy:"Легкая",mid:"Средняя",hard:"Сложная"},n={once:"Один раз",weekly:"Еженедельно",monthly:"Ежемесячно"};y.innerHTML=T.map((a,r)=>`<article class="panel"><p class="eyebrow">${o[a.difficulty]||"Средняя"}</p><h3>${d(a.title)}</h3><p>${d(a.body)}</p><p class="note">${a.kills} убийств · ${a.xp} опыта · ${a.coins} очков</p><button class="btn small" data-template="${r}" type="button">Использовать как черновик</button></article>`).join(""),t.innerHTML=e.quests.map(a=>`<article class="quest-line"><div><b>${d(a.title)}</b><p>${d(a.body)}</p></div><p><span class="pill">${a.status==="live"?"Идёт":"Черновик"}</span> <span class="pill">${o[a.difficulty]||""}</span> <span class="pill">${n[a.repeat]||""}</span></p><p class="note">${a.kills} убийств${a.headshot?" · в голову":""}${a.minMeters?` · от ${a.minMeters} м`:""}${a.maxMeters?` · до ${a.maxMeters} м`:""}${a.weapon?` · ${d(a.weapon)}`:""}</p><p>Начато ${a.started||0}<br>Завершено ${a.finished||0}</p><p>${a.xp} опыта<br>${a.coins} очков</p><p><button class="btn ghost small" data-quest-edit="${a.id}" type="button">Изменить</button> <button class="btn ghost small" data-quest-delete="${a.id}" type="button">Удалить</button></p></article>`).join("")||"<p>Квестов пока нет. Шаблон можно запустить как есть.</p>",t.querySelectorAll("[data-quest-edit]").forEach(a=>{a.addEventListener("click",()=>{const r=e.quests.find(l=>l.id===Number(a.dataset.questEdit));r&&(p=Number(r.id),_(r))})}),t.querySelectorAll("[data-quest-delete]").forEach(a=>{a.addEventListener("click",async()=>{await fetch(`/api/admin/quests/${a.dataset.questDelete}`,{method:"DELETE"}),A()})})};s.querySelector("#quest-templates")?.addEventListener("click",()=>{y&&(y.hidden=!y.hidden)}),y?.addEventListener("click",e=>{const t=e.target.closest("[data-template]");if(!t)return;const o=T[Number(t.dataset.template)];o&&(p=0,_(o))}),s.querySelector("#quest-new")?.addEventListener("click",()=>{p=0,h?.reset(),h?.removeAttribute("hidden")}),s.querySelector("#quest-cancel")?.addEventListener("click",()=>{p=0,h?.reset(),h?.setAttribute("hidden","")}),h?.addEventListener("submit",e=>{e.preventDefault(),H("live")}),s.querySelector("#quest-draft")?.addEventListener("click",()=>H("draft"));let v=0,M=[];const U={vip:"VIP",clanvip:"Клановый слот",note:"Запись"},w=s.querySelector("#shop-form"),x=async()=>{const e=await fetch("/api/admin/shop").then(l=>l.ok?l.json():null);if(!e)return;const t=s.querySelector("#seed-coins"),o=s.querySelector("#seed-cap"),n=s.querySelector("#seed-below");t&&(t.value=String(e.seedCoins??1)),o&&(o.value=String(e.seedCap??60)),n&&(n.value=String(e.seedBelow??20)),M=e.products??[];const a=s.querySelector("#shop-admin");a&&(a.innerHTML=M.map(l=>`<article class="quest-line"><div><b>${d(l.title)}</b><p>${d(l.body)}</p></div><p>${l.price} очков<br>${l.days||0} дней</p><p><span class="pill">${U[l.kind]||"VIP"}</span>${l.hidden?' <span class="pill">Скрыт</span>':""}</p><p><button class="btn ghost small" data-shop-edit="${l.id}" type="button">Изменить</button> <button class="btn ghost small" data-shop-delete="${l.id}" type="button">Удалить</button></p></article>`).join("")||"<p>Товаров нет.</p>");const r=s.querySelector("#shop-orders");r&&(r.innerHTML=(e.orders??[]).map(l=>`<div class="desk-row"><p class="grow">${d(l.name)} · ${d(l.title)} · ${l.price} очков${l.days?` · ${l.days} дней`:""}</p></div>`).join("")||"<p>Покупок ещё нет.</p>")};s.querySelector("#shop-settings")?.addEventListener("submit",async e=>{e.preventDefault();const t=s.querySelector("#shop-settings-note"),o=await fetch("/api/admin/shop",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({seedCoins:Number(s.querySelector("#seed-coins")?.value),seedCap:Number(s.querySelector("#seed-cap")?.value),seedBelow:Number(s.querySelector("#seed-below")?.value)})});t&&(t.textContent=o.ok?"Сид сохранён.":"Проверь числа."),o.ok&&x()}),w?.addEventListener("submit",async e=>{e.preventDefault();const t=s.querySelector("#shop-form-note"),o={title:s.querySelector("#shop-title")?.value??"",body:s.querySelector("#shop-body")?.value??"",price:Number(s.querySelector("#shop-price")?.value),days:Number(s.querySelector("#shop-days")?.value),kind:s.querySelector("#shop-kind")?.value??"vip",hidden:!!s.querySelector("#shop-hidden")?.checked};if(!(await fetch(v?`/api/admin/shop/${v}`:"/api/admin/shop",{method:v?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(o)})).ok){t&&(t.textContent="Проверь название и цену. Для VIP нужны дни.");return}v=0,w.reset(),s.querySelector("#shop-cancel")?.setAttribute("hidden",""),t&&(t.textContent="Товар сохранён."),x()}),s.querySelector("#shop-cancel")?.addEventListener("click",()=>{v=0,w?.reset(),s.querySelector("#shop-cancel")?.setAttribute("hidden","")}),s.querySelector("#shop-admin")?.addEventListener("click",async e=>{const t=e.target.closest("[data-shop-edit]"),o=e.target.closest("[data-shop-delete]");if(t){const n=M.find(W=>W.id===Number(t.dataset.shopEdit));if(!n||!w)return;v=n.id;const a=s.querySelector("#shop-title"),r=s.querySelector("#shop-body"),l=s.querySelector("#shop-price"),b=s.querySelector("#shop-days"),g=s.querySelector("#shop-kind"),q=s.querySelector("#shop-hidden");a&&(a.value=n.title),r&&(r.value=n.body),l&&(l.value=String(n.price)),b&&(b.value=String(n.days)),g&&(g.value=n.kind),q&&(q.checked=n.hidden),s.querySelector("#shop-cancel")?.removeAttribute("hidden")}o&&(await fetch(`/api/admin/shop/${o.dataset.shopDelete}`,{method:"DELETE"}),x())})}
