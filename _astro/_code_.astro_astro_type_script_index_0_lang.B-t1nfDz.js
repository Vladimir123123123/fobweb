const n=document.querySelector("#gate"),P=new URLSearchParams(location.search).get("invite");let g;try{g=await fetch("/api/admin/session")}catch{g=new Response(null,{status:404})}g.status===404&&P&&(n.innerHTML=`<h1>Подтверждение Steam</h1><p>Ссылка одноразовая. После входа через Steam она погаснет, а доступ останется на вашем SteamID.</p><a class="btn" href="/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}">Подтвердить Steam</a>`,(await fetch("/api/me").then(h=>h.json()).catch(()=>null))?.user&&((await fetch("/api/admin/invites/redeem",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:P})})).ok?location.href=location.pathname:n.innerHTML="<h1>Такой страницы нет</h1><p>Проверьте адрес.</p>"));if(g.ok){const d=await fetch("/api/admin/overview").then(e=>e.json()),h=e=>d.sync.find(t=>t.status===e)?.count??0,i=e=>e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]??t),x=(d.assets??[]).length+(d.reports??[]).length+d.squads.filter(e=>e.status!=="approved"&&e.status!=="rejected").length,f=e=>`<div class="desk-meter">${e.map(t=>`<p><span>${i(t.label)}</span><b>${t.count}</b></p>`).join("")||"<p><span>Пока пусто</span><b>0</b></p>"}</div>`;n.innerHTML=`
      <h1>Сводка</h1>
      <nav class="desk-nav" id="desk-nav">
        <button type="button" data-desk="home" class="on">Сводка</button>
        <button type="button" data-desk="guides">Гайды</button>
        <button type="button" data-desk="players">Игроки</button>
        <button type="button" data-desk="squads">Сквады${x?` ${x}`:""}</button>
        <button type="button" data-desk="builds">Сборки</button>
        <button type="button" data-desk="quests">Квесты</button>
        <button type="button" data-desk="access">Доступ</button>
      </nav>
      <section class="desk" data-desk="home">
        <div class="stats">
          <div class="stat"><b>${d.liveCis}</b><span>Живые профили СНГ, 7 дней</span></div>
          <div class="stat"><b>${d.views7d}</b><span>Просмотры, 7 дней</span></div>
          <div class="stat"><b>${d.discordClicks7d}</b><span>Клики в Discord, 7 дней</span></div>
          <div class="stat"><b>${d.shares7d}</b><span>Ссылки сборок, 7 дней</span></div>
        </div>
        <p class="note">Входы за 7 дней: ${d.logins7d}. Клики по баннерам сквадов: ${d.squadBannerClicks7d??0}. Сессии синка: живые ${h("active")}, погасшие ${h("expired")}.</p>
        <h2>Откуда пришли</h2>
        ${f(d.sources.map(e=>({label:e.source,count:e.count})))}
        <h2>По дням</h2>
        ${f(d.days.map(e=>({label:e.day,count:e.count})))}
        <h2>Запросы в поиске</h2>
        <p class="note">Страницы подписаны под эти формулировки. Ниже — слова, которые поисковик передал вместе с переходом. Google часто их не отдаёт.</p>
        <p class="tags">${(d.searchTags??[]).map(e=>`<span>${i(e)}</span>`).join("")}</p>
        ${f((d.searchHits??[]).map(e=>({label:`${e.engine?e.engine+" · ":""}${e.query||"без текста"}`,count:e.count})))}
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
          ${d.players.map(e=>{const t=!!e.hide_leaderboard||e.cis_opt_in===!1;return`<div class="desk-row"><a class="grow" href="/p?id=${e.steam_id}">${e.persona??e.steam_id}</a><span class="desk-state">${t?"скрыт":"в топе"}</span><button class="btn ghost small" data-hide="${e.steam_id}" data-on="${t?"1":"0"}" type="button">${t?"Показать в топе":"Скрыть из топа"}</button></div>`}).join("")}
        </div>
      </section>
      <section class="desk" data-desk="squads" hidden>
        <h2>Картинки сквадов</h2>
        <div class="desk-cards" id="assets">${(d.assets??[]).map(e=>`<article class="panel"><img class="${e.kind==="logo"?"asset-preview logo":"asset-preview"}" src="/api/media/${i(e.path)}" alt="" /><p>[${i(e.tag)}] ${i(e.name)} · ${e.kind==="logo"?"логотип":"баннер"}</p>${e.discord_url?`<p>${i(e.discord_url)}</p>`:""}<button class="btn small" data-asset="${e.id}" data-accept="1" type="button">Одобрить</button> <button class="btn ghost small" data-asset="${e.id}" data-accept="0" type="button">Отклонить</button></article>`).join("")||"<p>Новых картинок нет.</p>"}</div>
        <h2>Жалобы на участников</h2>
        <div class="desk-list" id="reports">${(d.reports??[]).map(e=>`<div class="desk-row"><p class="grow">[${i(e.tag)}] ${i(e.name)} · на <a href="/p?id=${e.target_steam_id}">${i(e.target_name??e.target_steam_id)}</a> · от ${i(e.reporter_name??"игрока")}<br>${i(e.note)}</p><button class="btn ghost small" data-report="${e.id}" type="button">Закрыть</button></div>`).join("")||"<p>Открытых жалоб нет.</p>"}</div>
        <h2>Сквады</h2>
        <div class="desk-list" id="squads">${d.squads.map(e=>`<div class="desk-row"><p class="grow">[${i(e.tag)}] ${i(e.name)} · ${i(e.persona??"")}</p><span class="desk-state">${e.status==="approved"?"в списке":e.status==="rejected"?"отклонён":"ждёт проверки"}</span>${e.status==="approved"?`<button class="btn ghost small" data-review="${e.id}" data-accept="0" type="button">Убрать из списка</button>`:`<button class="btn small" data-review="${e.id}" data-accept="1" type="button">Одобрить сквад</button>`}${e.closed?'<span class="desk-state">набор закрыт</span>':`<button class="btn ghost small" data-close="${e.id}" type="button">Закрыть набор</button>`}${e.has_banner?`<button class="btn ghost small" data-clear="${e.id}" data-kind="banner" type="button">Снять баннер</button>`:""}${e.has_logo?`<button class="btn ghost small" data-clear="${e.id}" data-kind="logo" type="button">Скрыть логотип</button>`:""}</div>`).join("")}</div>
      </section>
      <section class="desk" data-desk="builds" hidden>
        <h2>Сборки</h2>
        <div class="desk-list" id="builds">${(d.builds??[]).map(e=>`<div class="desk-row"><p class="grow"><a href="/b?id=${e.id}">${i(e.title)}</a> · сезон ${i(String(e.season))} · ${i(e.persona??"")}</p>${e.hidden?`<button class="btn ghost small" data-build="${e.id}" data-on="1" type="button">Вернуть</button>`:`<button class="btn ghost small" data-build="${e.id}" data-on="0" type="button">Скрыть</button>`}</div>`).join("")||"<p>Сборок нет.</p>"}</div>
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
      <section class="desk" data-desk="access" hidden>
        <h2>Топ сезона ${i(String(d.season??""))}</h2>
        <p class="note">В этом сезоне снимков: ${d.seasonPlayers??0}. Кнопка стирает только текущий сезон. Сезон 2 остаётся.</p>
        <button class="btn" id="reset-season" type="button">Обнулить топ сезона</button>
        <p id="reset-note" class="note"></p>
        <h2>Ссылка доступа</h2>
        <button class="btn" id="invite" type="button">Выдать ссылку на 48 часов</button>
        <p id="invite-url"></p>
      </section>
    `;const M=[...n.querySelectorAll(".desk")],C=e=>{for(const t of M)t.hidden=t.dataset.desk!==e;n.querySelectorAll("#desk-nav button").forEach(t=>t.classList.toggle("on",t.dataset.desk===e)),e==="quests"&&w()};n.querySelector("#desk-nav")?.addEventListener("click",e=>{const t=e.target.closest("button");t?.dataset.desk&&C(t.dataset.desk)});const E=d.guides??[],q=n.querySelector("#guide-form"),$=n.querySelector("#guide-list"),L=n.querySelector("#guide-note"),k=n.querySelector("#guide-cancel"),v=n.querySelector("#guide-save");let m=0;const c=e=>n.querySelector(e),D=()=>{$&&($.innerHTML=E.map(e=>`<div class="desk-row"><p class="grow"><b>${i(e.title)}</b> · ${i(e.rubric||"без рубрики")}</p><span class="desk-state">${e.hidden?"скрыт":"на сайте"}</span><button class="btn ghost small" data-guide-edit="${e.id}" type="button">Править</button><button class="btn ghost small" data-guide-hide="${e.id}" type="button">${e.hidden?"Показать":"Скрыть"}</button><button class="btn ghost small" data-guide-delete="${e.id}" type="button">Удалить</button></div>`).join("")||"<p>Пока пусто.</p>")},H=()=>{m=0,q?.reset(),v&&(v.textContent="Добавить"),k?.setAttribute("hidden","")};D(),q?.addEventListener("submit",async e=>{e.preventDefault();const t={rubric:c("#guide-rubric")?.value??"",title:c("#guide-title")?.value??"",body:c("#guide-body")?.value??"",href:c("#guide-href")?.value??"",sort:Number(c("#guide-sort")?.value||0),hidden:n.querySelector("#guide-hidden")?.checked===!0};if(!(await fetch(m?`/api/admin/guides/${m}`:"/api/admin/guides",{method:m?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(t)})).ok){L&&(L.textContent="Не сохранилось. Нужны заголовок и текст.");return}location.reload()}),k?.addEventListener("click",H),$?.addEventListener("click",async e=>{const t=e.target.closest("button");if(!t)return;const l=Number(t.dataset.guideEdit||t.dataset.guideHide||t.dataset.guideDelete),o=E.find(s=>s.id===l);if(o){if(t.dataset.guideEdit){m=o.id;const s=c("#guide-rubric"),p=c("#guide-title"),y=c("#guide-body"),N=c("#guide-href"),O=c("#guide-sort"),_=n.querySelector("#guide-hidden");s&&(s.value=o.rubric||""),p&&(p.value=o.title),y&&(y.value=o.body),N&&(N.value=o.href||""),O&&(O.value=String(o.sort_order||0)),_&&(_.checked=!!o.hidden),v&&(v.textContent="Сохранить"),k?.removeAttribute("hidden"),q?.scrollIntoView({block:"center"});return}if(t.dataset.guideHide){await fetch(`/api/admin/guides/${o.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({...o,sort:o.sort_order,hidden:!o.hidden})}),location.reload();return}t.dataset.guideDelete&&confirm(`Удалить «${o.title}»?`)&&(await fetch(`/api/admin/guides/${o.id}`,{method:"DELETE"}),location.reload())}}),n.querySelector("#reset-season")?.addEventListener("click",async()=>{if(!confirm(`Обнулить топ сезона ${d.season}? Снимки сезона 2 не удаляются.`)||prompt("Для подтверждения напишите ОБНУЛИТЬ")!=="ОБНУЛИТЬ")return;const t=await fetch("/api/admin/season/reset",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({confirm:"ОБНУЛИТЬ"})}),l=await t.json().catch(()=>({})),o=n.querySelector("#reset-note");if(!t.ok){o&&(o.textContent=l.error==="season_locked"?"Сезон 2 не обнуляется. На сервере API в GAME_SEASON должен быть 03, затем перезапуск Node.":"Не вышло.");return}o&&(o.textContent=`Снято снимков: ${l.removed}. Сезон ${l.season}.`),location.reload()}),n.querySelector("#invite")?.addEventListener("click",async()=>{const t=await(await fetch("/api/admin/invites",{method:"POST"})).json(),l=n.querySelector("#invite-url");l&&(l.textContent=t.url??"")}),n.querySelectorAll("[data-hide]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/players/${e.dataset.hide}/hide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({hide:e.dataset.on!=="1"})}),location.reload()})}),n.querySelectorAll("[data-close]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${e.dataset.close}/close`,{method:"POST"}),location.reload()})}),n.querySelectorAll("[data-review]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${e.dataset.review}/review`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accept:e.dataset.accept==="1"})}),location.reload()})}),n.querySelectorAll("[data-clear]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${e.dataset.clear}/clear`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind:e.dataset.kind})}),location.reload()})}),n.querySelectorAll("[data-asset]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/assets/${e.dataset.asset}/review`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accept:e.dataset.accept==="1"})}),location.reload()})}),n.querySelectorAll("[data-report]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/reports/${e.dataset.report}/close`,{method:"POST"}),location.reload()})}),n.querySelectorAll("[data-build]").forEach(e=>{e.addEventListener("click",async()=>{await fetch(`/api/admin/builds/${e.dataset.build}/hide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({hide:e.dataset.on!=="1"})}),location.reload()})});let u=0,S=[];const a=e=>n.querySelector(e),r=n.querySelector("#quest-form"),b=n.querySelector("#quest-template-list"),T=e=>{if(!e)return"";const t=new Date(String(e).replace(" ","T")+(String(e).endsWith("Z")?"":"Z"));if(Number.isNaN(t.getTime()))return"";const l=o=>String(o).padStart(2,"0");return`${t.getFullYear()}-${l(t.getMonth()+1)}-${l(t.getDate())}T${l(t.getHours())}:${l(t.getMinutes())}`},j=e=>{r?.removeAttribute("hidden"),a("#quest-title")&&(a("#quest-title").value=e.title),a("#quest-body")&&(a("#quest-body").value=e.body),a("#quest-kills")&&(a("#quest-kills").value=String(e.kills)),a("#quest-difficulty")&&(a("#quest-difficulty").value=e.difficulty),a("#quest-repeat")&&(a("#quest-repeat").value=e.repeat),a("#quest-xp")&&(a("#quest-xp").value=String(e.xp)),a("#quest-coins")&&(a("#quest-coins").value=String(e.coins)),a("#quest-min")&&(a("#quest-min").value=String(e.minMeters||0)),a("#quest-max")&&(a("#quest-max").value=String(e.maxMeters||0)),a("#quest-weapon")&&(a("#quest-weapon").value=e.weapon||"");const t=n.querySelector("#quest-head");t&&(t.checked=!!e.headshot),a("#quest-start")&&(a("#quest-start").value=T(e.startsAt)),a("#quest-end")&&(a("#quest-end").value=T(e.endsAt))},J=e=>({title:a("#quest-title")?.value??"",body:a("#quest-body")?.value??"",kills:Number(a("#quest-kills")?.value||0),difficulty:a("#quest-difficulty")?.value||"mid",repeat:a("#quest-repeat")?.value||"once",xp:Number(a("#quest-xp")?.value||0),coins:Number(a("#quest-coins")?.value||0),minMeters:Number(a("#quest-min")?.value||0),maxMeters:Number(a("#quest-max")?.value||0),weapon:a("#quest-weapon")?.value??"",headshot:n.querySelector("#quest-head")?.checked===!0,startsAt:a("#quest-start")?.value?new Date(a("#quest-start").value).toISOString():null,endsAt:a("#quest-end")?.value?new Date(a("#quest-end").value).toISOString():null,status:e}),A=async e=>{const t=n.querySelector("#quest-note"),l=J(e);if(!(await fetch(u?`/api/admin/quests/${u}`:"/api/admin/quests",{method:u?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(l)})).ok){t&&(t.textContent="Проверь заголовок, описание и число убийств.");return}u=0,r?.reset(),r?.setAttribute("hidden",""),w()},w=async()=>{const e=await fetch("/api/admin/quests").then(s=>s.ok?s.json():null),t=n.querySelector("#quest-admin");if(!e||!t||!b)return;S=e.templates??[];const l={easy:"Легкая",mid:"Средняя",hard:"Сложная"},o={once:"Один раз",weekly:"Еженедельно",monthly:"Ежемесячно"};b.innerHTML=S.map((s,p)=>`<article class="panel"><p class="eyebrow">${l[s.difficulty]||"Средняя"}</p><h3>${i(s.title)}</h3><p>${i(s.body)}</p><p class="note">${s.kills} убийств · ${s.xp} опыта · ${s.coins} очков</p><button class="btn small" data-template="${p}" type="button">Использовать как черновик</button></article>`).join(""),t.innerHTML=e.quests.map(s=>`<article class="quest-line"><div><b>${i(s.title)}</b><p>${i(s.body)}</p></div><p><span class="pill">${s.status==="live"?"Идёт":"Черновик"}</span> <span class="pill">${l[s.difficulty]||""}</span> <span class="pill">${o[s.repeat]||""}</span></p><p class="note">${s.kills} убийств${s.headshot?" · в голову":""}${s.minMeters?` · от ${s.minMeters} м`:""}${s.maxMeters?` · до ${s.maxMeters} м`:""}${s.weapon?` · ${i(s.weapon)}`:""}</p><p>Начато ${s.started||0}<br>Завершено ${s.finished||0}</p><p>${s.xp} опыта<br>${s.coins} очков</p><p><button class="btn ghost small" data-quest-edit="${s.id}" type="button">Изменить</button> <button class="btn ghost small" data-quest-delete="${s.id}" type="button">Удалить</button></p></article>`).join("")||"<p>Квестов пока нет. Шаблон можно запустить как есть.</p>",t.querySelectorAll("[data-quest-edit]").forEach(s=>{s.addEventListener("click",()=>{const p=e.quests.find(y=>y.id===Number(s.dataset.questEdit));p&&(u=Number(p.id),j(p))})}),t.querySelectorAll("[data-quest-delete]").forEach(s=>{s.addEventListener("click",async()=>{await fetch(`/api/admin/quests/${s.dataset.questDelete}`,{method:"DELETE"}),w()})})};n.querySelector("#quest-templates")?.addEventListener("click",()=>{b&&(b.hidden=!b.hidden)}),b?.addEventListener("click",e=>{const t=e.target.closest("[data-template]");if(!t)return;const l=S[Number(t.dataset.template)];l&&(u=0,j(l))}),n.querySelector("#quest-new")?.addEventListener("click",()=>{u=0,r?.reset(),r?.removeAttribute("hidden")}),n.querySelector("#quest-cancel")?.addEventListener("click",()=>{u=0,r?.reset(),r?.setAttribute("hidden","")}),r?.addEventListener("submit",e=>{e.preventDefault(),A("live")}),n.querySelector("#quest-draft")?.addEventListener("click",()=>A("draft"))}
