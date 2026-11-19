const a=document.querySelector("#gate"),j=new URLSearchParams(location.search).get("invite");let p;try{p=await fetch("/api/admin/session")}catch{p=new Response(null,{status:404})}p.status===404&&j&&(a.innerHTML=`<h1>Подтверждение Steam</h1><p>Ссылка одноразовая. После входа через Steam она погаснет, а доступ останется на вашем SteamID.</p><a class="btn" href="/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}">Подтвердить Steam</a>`,(await fetch("/api/me").then(c=>c.json()).catch(()=>null))?.user&&((await fetch("/api/admin/invites/redeem",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:j})})).ok?location.href=location.pathname:a.innerHTML="<h1>Такой страницы нет</h1><p>Проверьте адрес.</p>"));if(p.ok){const s=await fetch("/api/admin/overview").then(t=>t.json()),c=t=>s.sync.find(e=>e.status===t)?.count??0,n=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]??e),y=(s.assets??[]).length+(s.reports??[]).length+s.squads.filter(t=>t.status!=="approved"&&t.status!=="rejected").length,h=t=>`<div class="desk-meter">${t.map(e=>`<p><span>${n(e.label)}</span><b>${e.count}</b></p>`).join("")||"<p><span>Пока пусто</span><b>0</b></p>"}</div>`;a.innerHTML=`
      <h1>Сводка</h1>
      <nav class="desk-nav" id="desk-nav">
        <button type="button" data-desk="home" class="on">Сводка</button>
        <button type="button" data-desk="guides">Гайды</button>
        <button type="button" data-desk="players">Игроки</button>
        <button type="button" data-desk="squads">Сквады${y?` ${y}`:""}</button>
        <button type="button" data-desk="builds">Сборки</button>
        <button type="button" data-desk="access">Доступ</button>
      </nav>
      <section class="desk" data-desk="home">
        <div class="stats">
          <div class="stat"><b>${s.liveCis}</b><span>Живые профили СНГ, 7 дней</span></div>
          <div class="stat"><b>${s.views7d}</b><span>Просмотры, 7 дней</span></div>
          <div class="stat"><b>${s.discordClicks7d}</b><span>Клики в Discord, 7 дней</span></div>
          <div class="stat"><b>${s.shares7d}</b><span>Ссылки сборок, 7 дней</span></div>
        </div>
        <p class="note">Входы за 7 дней: ${s.logins7d}. Клики по баннерам сквадов: ${s.squadBannerClicks7d??0}. Сессии синка: живые ${c("active")}, погасшие ${c("expired")}.</p>
        <h2>Откуда пришли</h2>
        ${h(s.sources.map(t=>({label:t.source,count:t.count})))}
        <h2>По дням</h2>
        ${h(s.days.map(t=>({label:t.day,count:t.count})))}
        <h2>Запросы в поиске</h2>
        <p class="note">Страницы подписаны под эти формулировки. Ниже — слова, которые поисковик передал вместе с переходом. Google часто их не отдаёт.</p>
        <p class="tags">${(s.searchTags??[]).map(t=>`<span>${n(t)}</span>`).join("")}</p>
        ${h((s.searchHits??[]).map(t=>({label:`${t.engine?t.engine+" · ":""}${t.query||"без текста"}`,count:t.count})))}
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
          ${s.players.map(t=>{const e=!!t.hide_leaderboard||t.cis_opt_in===!1;return`<div class="desk-row"><a class="grow" href="/p?id=${t.steam_id}">${t.persona??t.steam_id}</a><span class="desk-state">${e?"скрыт":"в топе"}</span><button class="btn ghost small" data-hide="${t.steam_id}" data-on="${e?"1":"0"}" type="button">${e?"Показать в топе":"Скрыть из топа"}</button></div>`}).join("")}
        </div>
      </section>
      <section class="desk" data-desk="squads" hidden>
        <h2>Картинки сквадов</h2>
        <div class="desk-cards" id="assets">${(s.assets??[]).map(t=>`<article class="panel"><img class="${t.kind==="logo"?"asset-preview logo":"asset-preview"}" src="/api/media/${n(t.path)}" alt="" /><p>[${n(t.tag)}] ${n(t.name)} · ${t.kind==="logo"?"логотип":"баннер"}</p>${t.discord_url?`<p>${n(t.discord_url)}</p>`:""}<button class="btn small" data-asset="${t.id}" data-accept="1" type="button">Одобрить</button> <button class="btn ghost small" data-asset="${t.id}" data-accept="0" type="button">Отклонить</button></article>`).join("")||"<p>Новых картинок нет.</p>"}</div>
        <h2>Жалобы на участников</h2>
        <div class="desk-list" id="reports">${(s.reports??[]).map(t=>`<div class="desk-row"><p class="grow">[${n(t.tag)}] ${n(t.name)} · на <a href="/p?id=${t.target_steam_id}">${n(t.target_name??t.target_steam_id)}</a> · от ${n(t.reporter_name??"игрока")}<br>${n(t.note)}</p><button class="btn ghost small" data-report="${t.id}" type="button">Закрыть</button></div>`).join("")||"<p>Открытых жалоб нет.</p>"}</div>
        <h2>Сквады</h2>
        <div class="desk-list" id="squads">${s.squads.map(t=>`<div class="desk-row"><p class="grow">[${n(t.tag)}] ${n(t.name)} · ${n(t.persona??"")}</p><span class="desk-state">${t.status==="approved"?"в списке":t.status==="rejected"?"отклонён":"ждёт проверки"}</span>${t.status==="approved"?`<button class="btn ghost small" data-review="${t.id}" data-accept="0" type="button">Убрать из списка</button>`:`<button class="btn small" data-review="${t.id}" data-accept="1" type="button">Одобрить сквад</button>`}${t.closed?'<span class="desk-state">набор закрыт</span>':`<button class="btn ghost small" data-close="${t.id}" type="button">Закрыть набор</button>`}${t.has_banner?`<button class="btn ghost small" data-clear="${t.id}" data-kind="banner" type="button">Снять баннер</button>`:""}${t.has_logo?`<button class="btn ghost small" data-clear="${t.id}" data-kind="logo" type="button">Скрыть логотип</button>`:""}</div>`).join("")}</div>
      </section>
      <section class="desk" data-desk="builds" hidden>
        <h2>Сборки</h2>
        <div class="desk-list" id="builds">${(s.builds??[]).map(t=>`<div class="desk-row"><p class="grow"><a href="/b?id=${t.id}">${n(t.title)}</a> · сезон ${n(String(t.season))} · ${n(t.persona??"")}</p>${t.hidden?`<button class="btn ghost small" data-build="${t.id}" data-on="1" type="button">Вернуть</button>`:`<button class="btn ghost small" data-build="${t.id}" data-on="0" type="button">Скрыть</button>`}</div>`).join("")||"<p>Сборок нет.</p>"}</div>
      </section>
      <section class="desk" data-desk="access" hidden>
        <h2>Топ сезона ${n(String(s.season??""))}</h2>
        <p class="note">В этом сезоне снимков: ${s.seasonPlayers??0}. Кнопка стирает только текущий сезон. Сезон 2 остаётся.</p>
        <button class="btn" id="reset-season" type="button">Обнулить топ сезона</button>
        <p id="reset-note" class="note"></p>
        <h2>Ссылка доступа</h2>
        <button class="btn" id="invite" type="button">Выдать ссылку на 48 часов</button>
        <p id="invite-url"></p>
      </section>
    `;const q=[...a.querySelectorAll(".desk")],L=t=>{for(const e of q)e.hidden=e.dataset.desk!==t;a.querySelectorAll("#desk-nav button").forEach(e=>e.classList.toggle("on",e.dataset.desk===t))};a.querySelector("#desk-nav")?.addEventListener("click",t=>{const e=t.target.closest("button");e?.dataset.desk&&L(e.dataset.desk)});const v=s.guides??[],b=a.querySelector("#guide-form"),g=a.querySelector("#guide-list"),$=a.querySelector("#guide-note"),m=a.querySelector("#guide-cancel"),r=a.querySelector("#guide-save");let l=0;const d=t=>a.querySelector(t),O=()=>{g&&(g.innerHTML=v.map(t=>`<div class="desk-row"><p class="grow"><b>${n(t.title)}</b> · ${n(t.rubric||"без рубрики")}</p><span class="desk-state">${t.hidden?"скрыт":"на сайте"}</span><button class="btn ghost small" data-guide-edit="${t.id}" type="button">Править</button><button class="btn ghost small" data-guide-hide="${t.id}" type="button">${t.hidden?"Показать":"Скрыть"}</button><button class="btn ghost small" data-guide-delete="${t.id}" type="button">Удалить</button></div>`).join("")||"<p>Пока пусто.</p>")},_=()=>{l=0,b?.reset(),r&&(r.textContent="Добавить"),m?.setAttribute("hidden","")};O(),b?.addEventListener("submit",async t=>{t.preventDefault();const e={rubric:d("#guide-rubric")?.value??"",title:d("#guide-title")?.value??"",body:d("#guide-body")?.value??"",href:d("#guide-href")?.value??"",sort:Number(d("#guide-sort")?.value||0),hidden:a.querySelector("#guide-hidden")?.checked===!0};if(!(await fetch(l?`/api/admin/guides/${l}`:"/api/admin/guides",{method:l?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(e)})).ok){$&&($.textContent="Не сохранилось. Нужны заголовок и текст.");return}location.reload()}),m?.addEventListener("click",_),g?.addEventListener("click",async t=>{const e=t.target.closest("button");if(!e)return;const o=Number(e.dataset.guideEdit||e.dataset.guideHide||e.dataset.guideDelete),i=v.find(u=>u.id===o);if(i){if(e.dataset.guideEdit){l=i.id;const u=d("#guide-rubric"),f=d("#guide-title"),k=d("#guide-body"),S=d("#guide-href"),w=d("#guide-sort"),E=a.querySelector("#guide-hidden");u&&(u.value=i.rubric||""),f&&(f.value=i.title),k&&(k.value=i.body),S&&(S.value=i.href||""),w&&(w.value=String(i.sort_order||0)),E&&(E.checked=!!i.hidden),r&&(r.textContent="Сохранить"),m?.removeAttribute("hidden"),b?.scrollIntoView({block:"center"});return}if(e.dataset.guideHide){await fetch(`/api/admin/guides/${i.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({...i,sort:i.sort_order,hidden:!i.hidden})}),location.reload();return}e.dataset.guideDelete&&confirm(`Удалить «${i.title}»?`)&&(await fetch(`/api/admin/guides/${i.id}`,{method:"DELETE"}),location.reload())}}),a.querySelector("#reset-season")?.addEventListener("click",async()=>{if(!confirm(`Обнулить топ сезона ${s.season}? Снимки сезона 2 не удаляются.`)||prompt("Для подтверждения напишите ОБНУЛИТЬ")!=="ОБНУЛИТЬ")return;const e=await fetch("/api/admin/season/reset",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({confirm:"ОБНУЛИТЬ"})}),o=await e.json().catch(()=>({})),i=a.querySelector("#reset-note");if(!e.ok){i&&(i.textContent=o.error==="season_locked"?"Сезон 2 не обнуляется. На сервере API в GAME_SEASON должен быть 03, затем перезапуск Node.":"Не вышло.");return}i&&(i.textContent=`Снято снимков: ${o.removed}. Сезон ${o.season}.`),location.reload()}),a.querySelector("#invite")?.addEventListener("click",async()=>{const e=await(await fetch("/api/admin/invites",{method:"POST"})).json(),o=a.querySelector("#invite-url");o&&(o.textContent=e.url??"")}),a.querySelectorAll("[data-hide]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/players/${t.dataset.hide}/hide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({hide:t.dataset.on!=="1"})}),location.reload()})}),a.querySelectorAll("[data-close]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${t.dataset.close}/close`,{method:"POST"}),location.reload()})}),a.querySelectorAll("[data-review]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${t.dataset.review}/review`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accept:t.dataset.accept==="1"})}),location.reload()})}),a.querySelectorAll("[data-clear]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${t.dataset.clear}/clear`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind:t.dataset.kind})}),location.reload()})}),a.querySelectorAll("[data-asset]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/assets/${t.dataset.asset}/review`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accept:t.dataset.accept==="1"})}),location.reload()})}),a.querySelectorAll("[data-report]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/reports/${t.dataset.report}/close`,{method:"POST"}),location.reload()})}),a.querySelectorAll("[data-build]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/builds/${t.dataset.build}/hide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({hide:t.dataset.on!=="1"})}),location.reload()})})}
