const s=document.querySelector("#gate"),H=new URLSearchParams(location.search).get("invite");let w;try{w=await fetch("/api/admin/session")}catch{w=new Response(null,{status:404})}w.status===404&&H&&(s.innerHTML=`<h1>Подтверждение Steam</h1><p>Ссылка одноразовая. После входа через Steam она погаснет, а доступ останется на вашем SteamID.</p><a class="btn" href="/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}">Подтвердить Steam</a>`,(await fetch("/api/me").then(m=>m.json()).catch(()=>null))?.user&&((await fetch("/api/admin/invites/redeem",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:H})})).ok?location.href=location.pathname:s.innerHTML="<h1>Такой страницы нет</h1><p>Проверьте адрес.</p>"));if(w.ok){const c=await fetch("/api/admin/overview").then(e=>e.json()),m=e=>c.sync.find(t=>t.status===e)?.count??0,d=e=>e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]??t),O=(c.assets??[]).length+(c.reports??[]).length+c.squads.filter(e=>e.status!=="approved"&&e.status!=="rejected").length,x=e=>`<div class="desk-meter">${e.map(t=>`<p><span>${d(t.label)}</span><b>${t.count}</b></p>`).join("")||"<p><span>Пока пусто</span><b>0</b></p>"}</div>`;s.innerHTML=`
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
          <div class="stat"><b>${c.liveCis}</b><span>Живые профили СНГ, 7 дней</span></div>
          <div class="stat"><b>${c.views7d}</b><span>Просмотры, 7 дней</span></div>
          <div class="stat"><b>${c.discordClicks7d}</b><span>Клики в Discord, 7 дней</span></div>
          <div class="stat"><b>${c.shares7d}</b><span>Ссылки сборок, 7 дней</span></div>
        </div>
        <p class="note">Входы за 7 дней: ${c.logins7d}. Клики по баннерам сквадов: ${c.squadBannerClicks7d??0}. Сессии синка: живые ${m("active")}, погасшие ${m("expired")}.</p>
        <h2>Откуда пришли</h2>
        ${x(c.sources.map(e=>({label:e.source,count:e.count})))}
        <h2>По дням</h2>
        ${x(c.days.map(e=>({label:e.day,count:e.count})))}
        <h2>Запросы в поиске</h2>
        <p class="note">Страницы подписаны под эти формулировки. Ниже — слова, которые поисковик передал вместе с переходом. Google часто их не отдаёт.</p>
        <p class="tags">${(c.searchTags??[]).map(e=>`<span>${d(e)}</span>`).join("")}</p>
        ${x((c.searchHits??[]).map(e=>({label:`${e.engine?e.engine+" · ":""}${e.query||"без текста"}`,count:e.count})))}
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
        <p class="note">Очки берутся из квестов и из сида: игрок на сервере, пока онлайн ниже порога. Минута даёт очки, день ограничен, чтобы простой сид не обгонял оплату. Очки за квест ещё раз пишутся в казну сквада. Клановый слот не продаётся игроку: его цену и срок берёт казна на странице сквада. Скрытый клановый товар отключает покупку слота. VIP за 300 ₽ и клановый за 200 ₽ в тикете Discord остаются быстрее. Роль Спонсор выдаёт бот, если у игрока привязан Discord.</p>
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
    `;const J=[...s.querySelectorAll(".desk")],I=e=>{for(const t of J)t.hidden=t.dataset.desk!==e;s.querySelectorAll("#desk-nav button").forEach(t=>t.classList.toggle("on",t.dataset.desk===e)),e==="quests"&&j(),e==="shop"&&S()};s.querySelector("#desk-nav")?.addEventListener("click",e=>{const t=e.target.closest("button");t?.dataset.desk&&I(t.dataset.desk)});const P=c.guides??[],E=s.querySelector("#guide-form"),L=s.querySelector("#guide-list"),C=s.querySelector("#guide-note"),N=s.querySelector("#guide-cancel"),$=s.querySelector("#guide-save");let v=0;const u=e=>s.querySelector(e),B=()=>{L&&(L.innerHTML=P.map(e=>`<div class="desk-row"><p class="grow"><b>${d(e.title)}</b> · ${d(e.rubric||"без рубрики")}</p><span class="desk-state">${e.hidden?"скрыт":"на сайте"}</span><button class="btn ghost small" data-guide-edit="${e.id}" type="button">Править</button><button class="btn ghost small" data-guide-hide="${e.id}" type="button">${e.hidden?"Показать":"Скрыть"}</button><button class="btn ghost small" data-guide-delete="${e.id}" type="button">Удалить</button></div>`).join("")||"<p>Пока пусто.</p>")},V=()=>{v=0,E?.reset(),$&&($.textContent="Добавить"),N?.setAttribute("hidden","")};B(),E?.addEventListener("submit",async e=>{e.preventDefault();const t={rubric:u("#guide-rubric")?.value??"",title:u("#guide-title")?.value??"",body:u("#guide-body")?.value??"",href:u("#guide-href")?.value??"",sort:Number(u("#guide-sort")?.value||0),hidden:s.querySelector("#guide-hidden")?.checked===!0};if(!(await fetch(v?`/api/admin/guides/${v}`:"/api/admin/guides",{method:v?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(t)})).ok){C&&(C.textContent="Не сохранилось. Нужны заголовок и текст.");return}location.reload()}),N?.addEventListener("click",V),L?.addEventListener("click",async e=>{const t=e.target.closest("button");if(!t)return;const o=Number(t.dataset.guideEdit||t.dataset.guideHide||t.dataset.guideDelete),i=P.find(a=>a.id===o);if(i){if(t.dataset.guideEdit){v=i.id;const a=u("#guide-rubric"),r=u("#guide-title"),l=u("#guide-body"),f=u("#guide-href"),q=u("#guide-sort"),g=s.querySelector("#guide-hidden");a&&(a.value=i.rubric||""),r&&(r.value=i.title),l&&(l.value=i.body),f&&(f.value=i.href||""),q&&(q.value=String(i.sort_order||0)),g&&(g.checked=!!i.hidden),$&&($.textContent="Сохранить"),N?.removeAttribute("hidden"),E?.scrollIntoView({block:"center"});return}if(t.dataset.guideHide){await fetch(`/api/admin/guides/${i.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({...i,sort:i.sort_order,hidden:!i.hidden})}),location.reload();return}t.dataset.guideDelete&&confirm(`Удалить «${i.title}»?`)&&(await fetch(`/api/admin/guides/${i.id}`,{method:"DELETE"}),location.reload())}}),s.querySelector("#reset-season")?.addEventListener("click",async()=>{if(!confirm(`Обнулить топ сезона ${c.season}? Снимки сезона 2 не удаляются.`)||prompt("Для подтверждения напишите ОБНУЛИТЬ")!=="ОБНУЛИТЬ")return;const t=await fetch("/api/admin/season/reset",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({confirm:"ОБНУЛИТЬ"})}),o=await t.json().catch(()=>({})),i=s.querySelector("#reset-note");if(!t.ok){i&&(i.textContent=o.error==="season_locked"?"Сезон 2 не обнуляется. На сервере API в GAME_SEASON должен быть 03, затем перезапуск Node.":"Не вышло.");return}i&&(i.textContent=`Снято снимков: ${o.removed}. Сезон ${o.season}.`),location.reload()}),s.querySelector("#invite")?.addEventListener("click",async()=>{const t=await(await fetch("/api/admin/invites",{method:"POST"})).json(),o=s.querySelector("#invite-url");o&&(o.textContent=t.url??"")}),s.querySelectorAll("[data-hide]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/players/${e.dataset.hide}/hide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({hide:e.dataset.on!=="1"})}),location.reload()})}),s.querySelectorAll("[data-close]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${e.dataset.close}/close`,{method:"POST"}),location.reload()})}),s.querySelectorAll("[data-review]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${e.dataset.review}/review`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accept:e.dataset.accept==="1"})}),location.reload()})}),s.querySelectorAll("[data-clear]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${e.dataset.clear}/clear`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind:e.dataset.kind})}),location.reload()})}),s.querySelectorAll("[data-asset]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/assets/${e.dataset.asset}/review`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accept:e.dataset.accept==="1"})}),location.reload()})}),s.querySelectorAll("[data-report]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/reports/${e.dataset.report}/close`,{method:"POST"}),location.reload()})}),s.querySelectorAll("[data-build]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/builds/${e.dataset.build}/hide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({hide:e.dataset.on!=="1"})}),location.reload()})});let p=0,T=[];const n=e=>s.querySelector(e),b=s.querySelector("#quest-form"),h=s.querySelector("#quest-template-list"),D=e=>{if(!e)return"";const t=new Date(String(e).replace(" ","T")+(String(e).endsWith("Z")?"":"Z"));if(Number.isNaN(t.getTime()))return"";const o=i=>String(i).padStart(2,"0");return`${t.getFullYear()}-${o(t.getMonth()+1)}-${o(t.getDate())}T${o(t.getHours())}:${o(t.getMinutes())}`},_=e=>{b?.removeAttribute("hidden"),n("#quest-title")&&(n("#quest-title").value=e.title),n("#quest-body")&&(n("#quest-body").value=e.body),n("#quest-kills")&&(n("#quest-kills").value=String(e.kills)),n("#quest-difficulty")&&(n("#quest-difficulty").value=e.difficulty),n("#quest-repeat")&&(n("#quest-repeat").value=e.repeat),n("#quest-xp")&&(n("#quest-xp").value=String(e.xp)),n("#quest-coins")&&(n("#quest-coins").value=String(e.coins)),n("#quest-min")&&(n("#quest-min").value=String(e.minMeters||0)),n("#quest-max")&&(n("#quest-max").value=String(e.maxMeters||0)),n("#quest-weapon")&&(n("#quest-weapon").value=e.weapon||"");const t=s.querySelector("#quest-head");t&&(t.checked=!!e.headshot),n("#quest-start")&&(n("#quest-start").value=D(e.startsAt)),n("#quest-end")&&(n("#quest-end").value=D(e.endsAt))},F=e=>({title:n("#quest-title")?.value??"",body:n("#quest-body")?.value??"",kills:Number(n("#quest-kills")?.value||0),difficulty:n("#quest-difficulty")?.value||"mid",repeat:n("#quest-repeat")?.value||"once",xp:Number(n("#quest-xp")?.value||0),coins:Number(n("#quest-coins")?.value||0),minMeters:Number(n("#quest-min")?.value||0),maxMeters:Number(n("#quest-max")?.value||0),weapon:n("#quest-weapon")?.value??"",headshot:s.querySelector("#quest-head")?.checked===!0,startsAt:n("#quest-start")?.value?new Date(n("#quest-start").value).toISOString():null,endsAt:n("#quest-end")?.value?new Date(n("#quest-end").value).toISOString():null,status:e}),M=async e=>{const t=s.querySelector("#quest-note"),o=F(e);if(!(await fetch(p?`/api/admin/quests/${p}`:"/api/admin/quests",{method:p?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(o)})).ok){t&&(t.textContent="Проверь заголовок, описание и число убийств.");return}p=0,b?.reset(),b?.setAttribute("hidden",""),j()},j=async()=>{const e=await fetch("/api/admin/quests").then(a=>a.ok?a.json():null),t=s.querySelector("#quest-admin");if(!e||!t||!h)return;T=e.templates??[];const o={easy:"Легкая",mid:"Средняя",hard:"Сложная"},i={once:"Один раз",weekly:"Еженедельно",monthly:"Ежемесячно"};h.innerHTML=T.map((a,r)=>`<article class="panel"><p class="eyebrow">${o[a.difficulty]||"Средняя"}</p><h3>${d(a.title)}</h3><p>${d(a.body)}</p><p class="note">${a.kills} убийств · ${a.xp} опыта · ${a.coins} очков</p><button class="btn small" data-template="${r}" type="button">Использовать как черновик</button></article>`).join(""),t.innerHTML=e.quests.map(a=>`<article class="quest-line"><div><b>${d(a.title)}</b><p>${d(a.body)}</p></div><p><span class="pill">${a.status==="live"?"Идёт":"Черновик"}</span> <span class="pill">${o[a.difficulty]||""}</span> <span class="pill">${i[a.repeat]||""}</span></p><p class="note">${a.kills} убийств${a.headshot?" · в голову":""}${a.minMeters?` · от ${a.minMeters} м`:""}${a.maxMeters?` · до ${a.maxMeters} м`:""}${a.weapon?` · ${d(a.weapon)}`:""}</p><p>Начато ${a.started||0}<br>Завершено ${a.finished||0}</p><p>${a.xp} опыта<br>${a.coins} очков</p><p><button class="btn ghost small" data-quest-edit="${a.id}" type="button">Изменить</button> <button class="btn ghost small" data-quest-delete="${a.id}" type="button">Удалить</button></p></article>`).join("")||"<p>Квестов пока нет. Шаблон можно запустить как есть.</p>",t.querySelectorAll("[data-quest-edit]").forEach(a=>{a.addEventListener("click",()=>{const r=e.quests.find(l=>l.id===Number(a.dataset.questEdit));r&&(p=Number(r.id),_(r))})}),t.querySelectorAll("[data-quest-delete]").forEach(a=>{a.addEventListener("click",async()=>{await fetch(`/api/admin/quests/${a.dataset.questDelete}`,{method:"DELETE"}),j()})})};s.querySelector("#quest-templates")?.addEventListener("click",()=>{h&&(h.hidden=!h.hidden)}),h?.addEventListener("click",e=>{const t=e.target.closest("[data-template]");if(!t)return;const o=T[Number(t.dataset.template)];o&&(p=0,_(o))}),s.querySelector("#quest-new")?.addEventListener("click",()=>{p=0,b?.reset(),b?.removeAttribute("hidden")}),s.querySelector("#quest-cancel")?.addEventListener("click",()=>{p=0,b?.reset(),b?.setAttribute("hidden","")}),b?.addEventListener("submit",e=>{e.preventDefault(),M("live")}),s.querySelector("#quest-draft")?.addEventListener("click",()=>M("draft"));let y=0,A=[];const R={vip:"VIP",clanvip:"Клановый слот",note:"Запись"},k=s.querySelector("#shop-form"),S=async()=>{const e=await fetch("/api/admin/shop").then(l=>l.ok?l.json():null);if(!e)return;const t=s.querySelector("#seed-coins"),o=s.querySelector("#seed-cap"),i=s.querySelector("#seed-below");t&&(t.value=String(e.seedCoins??1)),o&&(o.value=String(e.seedCap??60)),i&&(i.value=String(e.seedBelow??20)),A=e.products??[];const a=s.querySelector("#shop-admin");a&&(a.innerHTML=A.map(l=>`<article class="quest-line"><div><b>${d(l.title)}</b><p>${d(l.body)}</p></div><p>${l.price} очков<br>${l.days||0} дней</p><p><span class="pill">${R[l.kind]||"VIP"}</span>${l.hidden?' <span class="pill">Скрыт</span>':""}</p><p><button class="btn ghost small" data-shop-edit="${l.id}" type="button">Изменить</button> <button class="btn ghost small" data-shop-delete="${l.id}" type="button">Удалить</button></p></article>`).join("")||"<p>Товаров нет.</p>");const r=s.querySelector("#shop-orders");r&&(r.innerHTML=(e.orders??[]).map(l=>`<div class="desk-row"><p class="grow">${d(l.name)} · ${d(l.title)} · ${l.price} очков${l.days?` · ${l.days} дней`:""}</p></div>`).join("")||"<p>Покупок ещё нет.</p>")};s.querySelector("#shop-settings")?.addEventListener("submit",async e=>{e.preventDefault();const t=s.querySelector("#shop-settings-note"),o=await fetch("/api/admin/shop",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({seedCoins:Number(s.querySelector("#seed-coins")?.value),seedCap:Number(s.querySelector("#seed-cap")?.value),seedBelow:Number(s.querySelector("#seed-below")?.value)})});t&&(t.textContent=o.ok?"Сид сохранён.":"Проверь числа."),o.ok&&S()}),k?.addEventListener("submit",async e=>{e.preventDefault();const t=s.querySelector("#shop-form-note"),o={title:s.querySelector("#shop-title")?.value??"",body:s.querySelector("#shop-body")?.value??"",price:Number(s.querySelector("#shop-price")?.value),days:Number(s.querySelector("#shop-days")?.value),kind:s.querySelector("#shop-kind")?.value??"vip",hidden:!!s.querySelector("#shop-hidden")?.checked};if(!(await fetch(y?`/api/admin/shop/${y}`:"/api/admin/shop",{method:y?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(o)})).ok){t&&(t.textContent="Проверь название и цену. Для VIP нужны дни.");return}y=0,k.reset(),s.querySelector("#shop-cancel")?.setAttribute("hidden",""),t&&(t.textContent="Товар сохранён."),S()}),s.querySelector("#shop-cancel")?.addEventListener("click",()=>{y=0,k?.reset(),s.querySelector("#shop-cancel")?.setAttribute("hidden","")}),s.querySelector("#shop-admin")?.addEventListener("click",async e=>{const t=e.target.closest("[data-shop-edit]"),o=e.target.closest("[data-shop-delete]");if(t){const i=A.find(G=>G.id===Number(t.dataset.shopEdit));if(!i||!k)return;y=i.id;const a=s.querySelector("#shop-title"),r=s.querySelector("#shop-body"),l=s.querySelector("#shop-price"),f=s.querySelector("#shop-days"),q=s.querySelector("#shop-kind"),g=s.querySelector("#shop-hidden");a&&(a.value=i.title),r&&(r.value=i.body),l&&(l.value=String(i.price)),f&&(f.value=String(i.days)),q&&(q.value=i.kind),g&&(g.checked=i.hidden),s.querySelector("#shop-cancel")?.removeAttribute("hidden")}o&&(await fetch(`/api/admin/shop/${o.dataset.shopDelete}`,{method:"DELETE"}),S())})}
