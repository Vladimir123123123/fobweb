const a=document.querySelector("#gate"),w=new URLSearchParams(location.search).get("invite");let u;try{u=await fetch("/api/admin/session")}catch{u=new Response(null,{status:404})}u.status===404&&w&&(a.innerHTML=`<h1>Подтверждение Steam</h1><p>Ссылка одноразовая. После входа через Steam она погаснет, а доступ останется на вашем SteamID.</p><a class="btn" href="/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}">Подтвердить Steam</a>`,(await fetch("/api/me").then(c=>c.json()).catch(()=>null))?.user&&((await fetch("/api/admin/invites/redeem",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:w})})).ok?location.href=location.pathname:a.innerHTML="<h1>Такой страницы нет</h1><p>Проверьте адрес.</p>"));if(u.ok){const i=await fetch("/api/admin/overview").then(t=>t.json()),c=t=>i.sync.find(e=>e.status===t)?.count??0,n=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]??e);a.innerHTML=`
      <h1>Сводка</h1>
      <div class="stats">
        <div class="stat"><b>${i.liveCis}</b><span>Живые профили СНГ, 7 дней</span></div>
        <div class="stat"><b>${i.views7d}</b><span>Просмотры, 7 дней</span></div>
        <div class="stat"><b>${i.discordClicks7d}</b><span>Клики в Discord, 7 дней</span></div>
        <div class="stat"><b>${i.shares7d}</b><span>Ссылки сборок, 7 дней</span></div>
      </div>
      <p class="note">Входы за 7 дней: ${i.logins7d}. Клики по баннерам сквадов: ${i.squadBannerClicks7d??0}. Сессии синка: живые ${c("active")}, погасшие ${c("expired")}.</p>
      <h2>Гайды</h2>
      <p class="note">Пустая строка начинает абзац. Строка с «- » — пункт списка. **так** выделяет слово. Ссылка необязательна: страница сайта вроде /ratings или адрес https://…</p>
      <form id="guide-form" class="guide-form">
        <label>Рубрика<input id="guide-rubric" maxlength="40" placeholder="Steam"></label>
        <label>Заголовок<input id="guide-title" maxlength="120" required></label>
        <label>Текст<textarea id="guide-body" maxlength="8000" required></textarea></label>
        <label>Ссылка<input id="guide-href" maxlength="200" placeholder="/ratings"></label>
        <label>Порядок<input id="guide-sort" type="number" min="0" max="9999" value="0"></label>
        <label class="check"><input id="guide-hidden" type="checkbox"> Скрыть с сайта</label>
        <div class="row">
          <button class="btn" id="guide-save" type="submit">Добавить</button>
          <button class="btn ghost" id="guide-cancel" type="button" hidden>Отмена</button>
        </div>
        <p id="guide-note" class="note"></p>
      </form>
      <div id="guide-list"></div>
      <h2>Топ сезона ${n(String(i.season??""))}</h2>
      <p class="note">В этом сезоне снимков: ${i.seasonPlayers??0}. Кнопка стирает только текущий сезон. Сезон 2 остаётся.</p>
      <button class="btn" id="reset-season" type="button">Обнулить топ сезона</button>
      <p id="reset-note" class="note"></p>
      <h2>Запросы в поиске</h2>
      <p class="note">Страницы подписаны под эти формулировки. Таблица ниже — слова, которые поисковик передал вместе с переходом. Google часто их не отдаёт.</p>
      <p class="tags">${(i.searchTags??[]).map(t=>`<span>${n(t)}</span>`).join("")}</p>
      <div class="scroll"><table><tbody>
        ${(i.searchHits??[]).map(t=>`<tr><td>${n(t.engine||"")}</td><td>${n(t.query||"")}</td><td>${t.count}</td></tr>`).join("")||"<tr><td>Пока нет перехода, где поисковик передал текст запроса.</td></tr>"}
      </tbody></table></div>
      <h2>Откуда пришли</h2>
      <div class="scroll"><table><tbody>
        ${i.sources.map(t=>`<tr><td>${t.source}</td><td>${t.count}</td></tr>`).join("")}
      </tbody></table></div>
      <h2>По дням</h2>
      <div class="scroll"><table><tbody>
        ${i.days.map(t=>`<tr><td>${t.day}</td><td>${t.count}</td></tr>`).join("")}
      </tbody></table></div>
      <h2>Игроки в топе</h2>
      <p class="note">По умолчанию все в рейтинге. Здесь можно скрыть или вернуть вручную.</p>
      <div class="scroll"><table><tbody id="players">
        ${i.players.map(t=>{const e=!!t.hide_leaderboard||t.cis_opt_in===!1;return`<tr><td><a href="/p?id=${t.steam_id}">${t.persona??t.steam_id}</a></td><td>${e?"скрыт":"в топе"}</td><td><button class="btn ghost small" data-hide="${t.steam_id}" data-on="${e?"1":"0"}" type="button">${e?"Показать в топе":"Скрыть из топа"}</button></td></tr>`}).join("")}
      </tbody></table></div>
      <h2>Картинки сквадов</h2>
      <div id="assets">${(i.assets??[]).map(t=>`<article class="panel"><img class="${t.kind==="logo"?"asset-preview logo":"asset-preview"}" src="/api/media/${n(t.path)}" alt="" /><p>[${n(t.tag)}] ${n(t.name)} · ${t.kind==="logo"?"логотип":"баннер"}</p>${t.discord_url?`<p>${n(t.discord_url)}</p>`:""}<button class="btn small" data-asset="${t.id}" data-accept="1" type="button">Одобрить</button> <button class="btn ghost small" data-asset="${t.id}" data-accept="0" type="button">Отклонить</button></article>`).join("")||"<p>Новых картинок нет.</p>"}</div>
      <h2>Жалобы на участников</h2>
      <div id="reports">${(i.reports??[]).map(t=>`<p>[${n(t.tag)}] ${n(t.name)} · на <a href="/p?id=${t.target_steam_id}">${n(t.target_name??t.target_steam_id)}</a> · от ${n(t.reporter_name??"игрока")}<br>${n(t.note)} <button class="btn ghost small" data-report="${t.id}" type="button">Закрыть</button></p>`).join("")||"<p>Открытых жалоб нет.</p>"}</div>
      <h2>Сквады</h2>
      <div id="squads">${i.squads.map(t=>`<p>[${n(t.tag)}] ${n(t.name)} · ${n(t.persona??"")} · ${t.status==="approved"?"в списке":t.status==="rejected"?"отклонён":"ждёт проверки"} ${t.status==="approved"?`<button class="btn ghost small" data-review="${t.id}" data-accept="0" type="button">Убрать из списка</button>`:`<button class="btn small" data-review="${t.id}" data-accept="1" type="button">Одобрить сквад</button>`} ${t.closed?"набор закрыт":`<button class="btn ghost small" data-close="${t.id}" type="button">Закрыть набор</button>`} ${t.has_banner?`<button class="btn ghost small" data-clear="${t.id}" data-kind="banner" type="button">Снять баннер</button>`:""} ${t.has_logo?`<button class="btn ghost small" data-clear="${t.id}" data-kind="logo" type="button">Скрыть логотип</button>`:""}</p>`).join("")}</div>
      <h2>Сборки</h2>
      <div id="builds">${(i.builds??[]).map(t=>`<p><a href="/b?id=${t.id}">${n(t.title)}</a> · сезон ${n(String(t.season))} · ${n(t.persona??"")} ${t.hidden?`<button class="btn ghost small" data-build="${t.id}" data-on="1" type="button">Вернуть</button>`:`<button class="btn ghost small" data-build="${t.id}" data-on="0" type="button">Скрыть</button>`}</p>`).join("")}</div>
      <h2>Ссылка доступа</h2>
      <button class="btn" id="invite" type="button">Выдать ссылку на 48 часов</button>
      <p id="invite-url"></p>
    `;const y=i.guides??[],h=a.querySelector("#guide-form"),b=a.querySelector("#guide-list"),g=a.querySelector("#guide-note"),m=a.querySelector("#guide-cancel"),r=a.querySelector("#guide-save");let l=0;const s=t=>a.querySelector(t),E=()=>{b&&(b.innerHTML=y.map(t=>`<p><b>${n(t.title)}</b> · ${n(t.rubric||"без рубрики")} · ${t.hidden?"скрыт":"на сайте"} <button class="btn ghost small" data-guide-edit="${t.id}" type="button">Править</button> <button class="btn ghost small" data-guide-hide="${t.id}" type="button">${t.hidden?"Показать":"Скрыть"}</button> <button class="btn ghost small" data-guide-delete="${t.id}" type="button">Удалить</button></p>`).join("")||"<p>Пока пусто.</p>")},j=()=>{l=0,h?.reset(),r&&(r.textContent="Добавить"),m?.setAttribute("hidden","")};E(),h?.addEventListener("submit",async t=>{t.preventDefault();const e={rubric:s("#guide-rubric")?.value??"",title:s("#guide-title")?.value??"",body:s("#guide-body")?.value??"",href:s("#guide-href")?.value??"",sort:Number(s("#guide-sort")?.value||0),hidden:a.querySelector("#guide-hidden")?.checked===!0};if(!(await fetch(l?`/api/admin/guides/${l}`:"/api/admin/guides",{method:l?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(e)})).ok){g&&(g.textContent="Не сохранилось. Нужны заголовок и текст.");return}location.reload()}),m?.addEventListener("click",j),b?.addEventListener("click",async t=>{const e=t.target.closest("button");if(!e)return;const o=Number(e.dataset.guideEdit||e.dataset.guideHide||e.dataset.guideDelete),d=y.find(p=>p.id===o);if(d){if(e.dataset.guideEdit){l=d.id;const p=s("#guide-rubric"),$=s("#guide-title"),f=s("#guide-body"),v=s("#guide-href"),S=s("#guide-sort"),k=a.querySelector("#guide-hidden");p&&(p.value=d.rubric||""),$&&($.value=d.title),f&&(f.value=d.body),v&&(v.value=d.href||""),S&&(S.value=String(d.sort_order||0)),k&&(k.checked=!!d.hidden),r&&(r.textContent="Сохранить"),m?.removeAttribute("hidden"),h?.scrollIntoView({block:"center"});return}if(e.dataset.guideHide){await fetch(`/api/admin/guides/${d.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({...d,sort:d.sort_order,hidden:!d.hidden})}),location.reload();return}e.dataset.guideDelete&&confirm(`Удалить «${d.title}»?`)&&(await fetch(`/api/admin/guides/${d.id}`,{method:"DELETE"}),location.reload())}}),a.querySelector("#reset-season")?.addEventListener("click",async()=>{if(!confirm(`Обнулить топ сезона ${i.season}? Снимки сезона 2 не удаляются.`)||prompt("Для подтверждения напишите ОБНУЛИТЬ")!=="ОБНУЛИТЬ")return;const e=await fetch("/api/admin/season/reset",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({confirm:"ОБНУЛИТЬ"})}),o=await e.json().catch(()=>({})),d=a.querySelector("#reset-note");if(!e.ok){d&&(d.textContent=o.error==="season_locked"?"Сезон 2 не обнуляется. На сервере API в GAME_SEASON должен быть 03, затем перезапуск Node.":"Не вышло.");return}d&&(d.textContent=`Снято снимков: ${o.removed}. Сезон ${o.season}.`),location.reload()}),a.querySelector("#invite")?.addEventListener("click",async()=>{const e=await(await fetch("/api/admin/invites",{method:"POST"})).json(),o=a.querySelector("#invite-url");o&&(o.textContent=e.url??"")}),a.querySelectorAll("[data-hide]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/players/${t.dataset.hide}/hide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({hide:t.dataset.on!=="1"})}),location.reload()})}),a.querySelectorAll("[data-close]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${t.dataset.close}/close`,{method:"POST"}),location.reload()})}),a.querySelectorAll("[data-review]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${t.dataset.review}/review`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accept:t.dataset.accept==="1"})}),location.reload()})}),a.querySelectorAll("[data-clear]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${t.dataset.clear}/clear`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind:t.dataset.kind})}),location.reload()})}),a.querySelectorAll("[data-asset]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/assets/${t.dataset.asset}/review`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accept:t.dataset.accept==="1"})}),location.reload()})}),a.querySelectorAll("[data-report]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/reports/${t.dataset.report}/close`,{method:"POST"}),location.reload()})}),a.querySelectorAll("[data-build]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/builds/${t.dataset.build}/hide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({hide:t.dataset.on!=="1"})}),location.reload()})})}
