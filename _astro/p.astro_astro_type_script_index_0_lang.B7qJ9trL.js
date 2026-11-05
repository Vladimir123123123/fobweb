const r=document.querySelector("#profile"),v=new URLSearchParams(location.search),i=v.get("id")??"",l=v.get("sync")??"";function b(t){return t==null?"—":`$${new Intl.NumberFormat("ru-RU").format(t)}`}function _(t){const e=t.map(n=>n.wardog_level??0);if(e.length<2)return"";const s=Math.max(...e,1),a=280/(e.length-1);return`<svg class="chart" viewBox="0 0 280 90"><path d="${e.map((n,o)=>`${o===0?"M":"L"}${o*a},${80-n/s*70}`).join(" ")}" fill="none" stroke="#e6b34d" stroke-width="2"/></svg>`}if(!/^\d{17}$/.test(i))r.innerHTML="<h1>Такой страницы нет</h1>";else{const[t,e]=await Promise.all([fetch(`/api/players/${i}`).then(async s=>s.ok?s.json():null),fetch("/api/me").then(s=>s.json()).catch(()=>({user:null}))]);if(!t)r.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const s=t.user,a=t.history.at(-1),d=e.user?.steam_id===i,n=!t.history.length,o=c=>c==null?"—":new Intl.NumberFormat("ru-RU").format(c),p=l==="game_running"?"Закрой WARDOGS и войди ещё раз: пока игра открыта, цифры не отдаются.":l==="empty"||n?"Steam не отдаёт уровень и роли. Цифры появятся после входа, когда игра отдаст снимок карьеры.":l==="access_denied"?"Вход отменён.":l?"Игра не отдала цифры. Закрой её и войди ещё раз.":"";r.innerHTML=`
        <div class="who"><img alt="" src="${s.avatar??""}" /><h1>${s.persona??s.steam_id}</h1></div>
        <p>Steam ${s.steam_id}${s.country?` · ${s.country}`:""}${s.discord_name?` · Discord ${s.discord_name}`:""}</p>
        ${p?`<p class="note" id="sync-note">${p}</p>`:'<p class="note" id="sync-note"></p>'}
        <div class="stats">
          <div class="stat"><b>${a?.wardog_level??"—"}</b><span><img class="stat-ico" src="/icons/stat-level.svg" alt="" />Уровень</span></div>
          <div class="stat"><b>${o(a?.xp)}</b><span><img class="stat-ico" src="/icons/stat-xp.svg" alt="" />Опыт</span></div>
          <div class="stat"><b>${b(a?.cash??null)}</b><span><img class="stat-ico" src="/icons/stat-cash.svg" alt="" />Деньги</span></div>
          <div class="stat"><b>${a?.gold??"—"}</b><span><img class="stat-ico" src="/icons/game/t_ui_goldbars_icon.webp" alt="" />Золото</span></div>
          <div class="stat"><b>${a?.unlocks??"—"}</b><span><img class="stat-ico" src="/icons/stat-unlocks.svg" alt="" />Открытия</span></div>
          <div class="stat"><b>${b(a?.account_value??null)}</b><span><img class="stat-ico" src="/icons/stat-value.svg" alt="" />Стоимость</span></div>
          <div class="stat"><b>${a?.role_assault??"—"}</b><span><img class="stat-ico" src="/icons/game/t_ui_icon_role_infantry.webp" alt="" />Штурм</span></div>
          <div class="stat"><b>${a?.role_medic??"—"}</b><span><img class="stat-ico" src="/icons/game/t_ui_icon_role_medic.webp" alt="" />Медик</span></div>
          <div class="stat"><b>${a?.role_recon??"—"}</b><span><img class="stat-ico" src="/icons/game/t_ui_icon_role_recon.webp" alt="" />Разведка</span></div>
          <div class="stat"><b>${a?.role_support??"—"}</b><span><img class="stat-ico" src="/icons/game/t_ui_icon_role_support.webp" alt="" />Поддержка</span></div>
          <div class="stat"><b>${a?.role_driver??"—"}</b><span><img class="stat-ico" src="/icons/game/t_ui_icon_role_driver.webp" alt="" />Водитель</span></div>
          <div class="stat"><b>${a?.role_pilot??"—"}</b><span><img class="stat-ico" src="/icons/game/t_ui_icon_role_pilot.webp" alt="" />Пилот</span></div>
        </div>
        ${_(t.history)}
        <p class="note">Снимков: ${t.history.length}.</p>
        <p>${t.squad?`Сквад [${t.squad.tag}] ${t.squad.name}`:"Сквада нет."}</p>
        ${d?`<div class="row">
          <button class="btn small" id="resync" type="button">Обновить цифры</button>
          <label><input id="cis" type="checkbox" ${s.cis_opt_in?"checked":""}/> Участвовать в топе СНГ</label>
          <label><input id="hide" type="checkbox" ${s.hide_leaderboard?"checked":""}/> Скрыть из топа</label>
          ${e.discordLink?'<a class="btn ghost" href="/auth/discord">Привязать Discord</a>':'<span class="note">Привязка Discord на сервере выключена. На вход она не влияет.</span>'}
        </div>`:""}
      `;const m=async()=>{await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({cisOptIn:document.querySelector("#cis").checked,hideLeaderboard:document.querySelector("#hide").checked})})};document.querySelector("#cis")?.addEventListener("change",m),document.querySelector("#hide")?.addEventListener("change",m),document.querySelector("#resync")?.addEventListener("click",async()=>{const c=document.querySelector("#sync-note");c.textContent="Обновляю…";const u=await fetch("/api/me/sync",{method:"POST"});if(u.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}const h=await u.json().catch(()=>({}));if(h.saved){location.href=`/p?id=${i}`;return}c.textContent=h.careerConnect?"Закрой WARDOGS и войди ещё раз — тогда игра отдаст снимок.":"Steam не отдаёт эти цифры. Нужен вход, при котором игра сама отдаёт снимок карьеры."})}}
