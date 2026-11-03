const e=document.querySelector("#gate"),c=new URLSearchParams(location.search).get("invite");let d;try{d=await fetch("/api/admin/session")}catch{d=new Response(null,{status:404})}d.status===404&&c&&(e.innerHTML=`<h1>Подтверждение Steam</h1><p>Ссылка одноразовая. После входа через Steam она погаснет, а доступ останется на вашем SteamID.</p><a class="btn" href="/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}">Подтвердить Steam</a>`,(await fetch("/api/me").then(n=>n.json()).catch(()=>null))?.user&&((await fetch("/api/admin/invites/redeem",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:c})})).ok?location.href=location.pathname:e.innerHTML="<h1>Такой страницы нет</h1><p>Проверьте адрес.</p>"));if(d.ok){const a=await fetch("/api/admin/overview").then(t=>t.json()),n=t=>a.sync.find(i=>i.status===t)?.count??0,s=t=>t.replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i]??i);e.innerHTML=`
      <h1>Сводка</h1>
      <div class="stats">
        <div class="stat"><b>${a.liveCis}</b><span>Живые профили СНГ, 7 дней</span></div>
        <div class="stat"><b>${a.views7d}</b><span>Просмотры, 7 дней</span></div>
        <div class="stat"><b>${a.discordClicks7d}</b><span>Клики в Discord, 7 дней</span></div>
        <div class="stat"><b>${a.shares7d}</b><span>Ссылки сборок, 7 дней</span></div>
      </div>
      <p class="note">Входы за 7 дней: ${a.logins7d}. Клики по баннерам сквадов: ${a.squadBannerClicks7d??0}. Сессии синка: живые ${n("active")}, погасшие ${n("expired")}.</p>
      <h2>Откуда пришли</h2>
      <div class="scroll"><table><tbody>
        ${a.sources.map(t=>`<tr><td>${t.source}</td><td>${t.count}</td></tr>`).join("")}
      </tbody></table></div>
      <h2>По дням</h2>
      <div class="scroll"><table><tbody>
        ${a.days.map(t=>`<tr><td>${t.day}</td><td>${t.count}</td></tr>`).join("")}
      </tbody></table></div>
      <h2>Игроки</h2>
      <div class="scroll"><table><tbody id="players">
        ${a.players.map(t=>`<tr><td><a href="/p?id=${t.steam_id}">${t.persona??t.steam_id}</a></td><td><button class="btn ghost small" data-hide="${t.steam_id}" data-on="${t.hide_leaderboard?"1":"0"}" type="button">${t.hide_leaderboard?"Вернуть в топ":"Скрыть"}</button></td></tr>`).join("")}
      </tbody></table></div>
      <h2>Картинки сквадов</h2>
      <div id="assets">${(a.assets??[]).map(t=>`<article class="panel"><img class="${t.kind==="logo"?"asset-preview logo":"asset-preview"}" src="/api/media/${s(t.path)}" alt="" /><p>[${s(t.tag)}] ${s(t.name)} · ${t.kind==="logo"?"логотип":"баннер"}</p>${t.discord_url?`<p>${s(t.discord_url)}</p>`:""}<button class="btn small" data-asset="${t.id}" data-accept="1" type="button">Одобрить</button> <button class="btn ghost small" data-asset="${t.id}" data-accept="0" type="button">Отклонить</button></article>`).join("")||"<p>Новых картинок нет.</p>"}</div>
      <h2>Сквады</h2>
      <div id="squads">${a.squads.map(t=>`<p>[${s(t.tag)}] ${s(t.name)} · ${s(t.persona??"")} · ${t.status==="approved"?"в списке":t.status==="rejected"?"отклонён":"ждёт проверки"} ${t.status==="approved"?`<button class="btn ghost small" data-review="${t.id}" data-accept="0" type="button">Убрать из списка</button>`:`<button class="btn small" data-review="${t.id}" data-accept="1" type="button">Одобрить сквад</button>`} ${t.closed?"набор закрыт":`<button class="btn ghost small" data-close="${t.id}" type="button">Закрыть набор</button>`} ${t.has_banner?`<button class="btn ghost small" data-clear="${t.id}" data-kind="banner" type="button">Снять баннер</button>`:""} ${t.has_logo?`<button class="btn ghost small" data-clear="${t.id}" data-kind="logo" type="button">Скрыть логотип</button>`:""}</p>`).join("")}</div>
      <h2>Сборки</h2>
      <div id="builds">${(a.builds??[]).map(t=>`<p><a href="/b?id=${t.id}">${s(t.title)}</a> · сезон ${s(String(t.season))} · ${s(t.persona??"")} ${t.hidden?`<button class="btn ghost small" data-build="${t.id}" data-on="1" type="button">Вернуть</button>`:`<button class="btn ghost small" data-build="${t.id}" data-on="0" type="button">Скрыть</button>`}</p>`).join("")}</div>
      <h2>Ссылка доступа</h2>
      <button class="btn" id="invite" type="button">Выдать ссылку на 48 часов</button>
      <p id="invite-url"></p>
    `,e.querySelector("#invite")?.addEventListener("click",async()=>{const i=await(await fetch("/api/admin/invites",{method:"POST"})).json(),o=e.querySelector("#invite-url");o&&(o.textContent=i.url??"")}),e.querySelectorAll("[data-hide]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/players/${t.dataset.hide}/hide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({hide:t.dataset.on!=="1"})}),location.reload()})}),e.querySelectorAll("[data-close]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${t.dataset.close}/close`,{method:"POST"}),location.reload()})}),e.querySelectorAll("[data-review]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${t.dataset.review}/review`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accept:t.dataset.accept==="1"})}),location.reload()})}),e.querySelectorAll("[data-clear]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/squads/${t.dataset.clear}/clear`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind:t.dataset.kind})}),location.reload()})}),e.querySelectorAll("[data-asset]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/assets/${t.dataset.asset}/review`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accept:t.dataset.accept==="1"})}),location.reload()})}),e.querySelectorAll("[data-build]").forEach(t=>{t.addEventListener("click",async()=>{await fetch(`/api/admin/builds/${t.dataset.build}/hide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({hide:t.dataset.on!=="1"})}),location.reload()})})}
