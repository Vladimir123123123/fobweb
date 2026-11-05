const l=document.querySelector("#profile"),_=new URLSearchParams(location.search),i=_.get("id")??"",r=_.get("sync")??"";function b(s){return s==null?"—":`$${new Intl.NumberFormat("ru-RU").format(s)}`}function v(s){const a=s.map(c=>c.wardog_level??0);if(a.length<2)return"";const t=Math.max(...a,1),e=280/(a.length-1);return`<svg class="chart" viewBox="0 0 280 90"><path d="${a.map((c,o)=>`${o===0?"M":"L"}${o*e},${80-c/t*70}`).join(" ")}" fill="none" stroke="#e6b34d" stroke-width="2"/></svg>`}if(!/^\d{17}$/.test(i))l.innerHTML="<h1>Такой страницы нет</h1>";else{const[s,a]=await Promise.all([fetch(`/api/players/${i}`).then(async t=>t.ok?t.json():null),fetch("/api/me").then(t=>t.json()).catch(()=>({user:null}))]);if(!s)l.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const t=s.user,e=s.history.at(-1),d=a.user?.steam_id===i,c=!s.history.length,o=n=>n==null?"—":new Intl.NumberFormat("ru-RU").format(n),p=r==="game_running"?"Закрой WARDOGS и войди ещё раз: пока игра открыта, цифры не отдаются.":r==="empty"||c?"Steam не отдаёт уровень и роли. Цифры появятся после входа, когда игра отдаст снимок карьеры.":r==="access_denied"?"Вход отменён.":r?"Игра не отдала цифры. Закрой её и войди ещё раз.":"";l.innerHTML=`
        <div class="who"><img alt="" src="${t.avatar??""}" /><h1>${t.persona??t.steam_id}</h1></div>
        <p>Steam ${t.steam_id}${t.country?` · ${t.country}`:""}${t.discord_name?` · Discord ${t.discord_name}`:""}</p>
        ${p?`<p class="note" id="sync-note">${p}</p>`:'<p class="note" id="sync-note"></p>'}
        <div class="stats">
          <div class="stat"><b>${e?.wardog_level??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_careerlevel_600.webp" alt="" />Уровень</span></div>
          <div class="stat"><b>${o(e?.xp)}</b><span>Опыт</span></div>
          <div class="stat"><b>${b(e?.cash??null)}</b><span>Деньги</span></div>
          <div class="stat"><b>${e?.gold??"—"}</b><span><img class="stat-ico" src="/art/t_ui_goldbars_icon.webp" alt="" />Золото</span></div>
          <div class="stat"><b>${e?.unlocks??"—"}</b><span>Открытия</span></div>
          <div class="stat"><b>${b(e?.account_value??null)}</b><span>Стоимость</span></div>
          <div class="stat"><b>${e?.role_assault??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_infantry.webp" alt="" />Штурм</span></div>
          <div class="stat"><b>${e?.role_medic??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_medic.webp" alt="" />Медик</span></div>
          <div class="stat"><b>${e?.role_recon??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_recon.webp" alt="" />Разведка</span></div>
          <div class="stat"><b>${e?.role_support??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_support.webp" alt="" />Поддержка</span></div>
          <div class="stat"><b>${e?.role_driver??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_driver.webp" alt="" />Водитель</span></div>
          <div class="stat"><b>${e?.role_pilot??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_pilot.webp" alt="" />Пилот</span></div>
        </div>
        ${v(s.history)}
        <p class="note">Снимков: ${s.history.length}.</p>
        <p>${s.squad?`Сквад [${s.squad.tag}] ${s.squad.name}`:"Сквада нет."}</p>
        ${d?`<div class="row">
          <button class="btn small" id="resync" type="button">Обновить цифры</button>
          <label><input id="cis" type="checkbox" ${t.cis_opt_in?"checked":""}/> Участвовать в топе СНГ</label>
          <label><input id="hide" type="checkbox" ${t.hide_leaderboard?"checked":""}/> Скрыть из топа</label>
          ${a.discordLink?'<a class="btn ghost" href="/auth/discord">Привязать Discord</a>':'<span class="note">Привязка Discord на сервере выключена. На вход она не влияет.</span>'}
        </div>`:""}
      `;const u=async()=>{await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({cisOptIn:document.querySelector("#cis").checked,hideLeaderboard:document.querySelector("#hide").checked})})};document.querySelector("#cis")?.addEventListener("change",u),document.querySelector("#hide")?.addEventListener("change",u),document.querySelector("#resync")?.addEventListener("click",async()=>{const n=document.querySelector("#sync-note");n.textContent="Обновляю…";const m=await fetch("/api/me/sync",{method:"POST"});if(m.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}const h=await m.json().catch(()=>({}));if(h.saved){location.href=`/p?id=${i}`;return}n.textContent=h.careerConnect?"Закрой WARDOGS и войди ещё раз — тогда игра отдаст снимок.":"Steam не отдаёт эти цифры. Нужен вход, при котором игра сама отдаёт снимок карьеры."})}}
