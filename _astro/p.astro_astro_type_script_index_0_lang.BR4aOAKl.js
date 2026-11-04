const r=document.querySelector("#profile"),v=new URLSearchParams(location.search),i=v.get("id")??"",d=v.get("sync")??"";function b(s){return s==null?"—":`$${new Intl.NumberFormat("ru-RU").format(s)}`}function $(s){const n=s.map(c=>c.wardog_level??0);if(n.length<2)return"";const t=Math.max(...n,1),e=280/(n.length-1);return`<svg class="chart" viewBox="0 0 280 90"><path d="${n.map((c,o)=>`${o===0?"M":"L"}${o*e},${80-c/t*70}`).join(" ")}" fill="none" stroke="#e6b34d" stroke-width="2"/></svg>`}if(!/^\d{17}$/.test(i))r.innerHTML="<h1>Такой страницы нет</h1>";else{const[s,n]=await Promise.all([fetch(`/api/players/${i}`).then(async t=>t.ok?t.json():null),fetch("/api/me").then(t=>t.json()).catch(()=>({user:null}))]);if(!s)r.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const t=s.user,e=s.history.at(-1),l=n.user?.steam_id===i,c=!s.history.length,o=a=>a==null?"—":new Intl.NumberFormat("ru-RU").format(a),p=d==="game_running"?"Закрой WARDOGS и войди ещё раз: пока игра открыта, цифры не отдаются.":d==="empty"||c?"Steam не отдаёт уровень и роли. Цифры появятся после входа, когда игра отдаст снимок карьеры.":d==="access_denied"?"Вход отменён.":d?"Игра не отдала цифры. Закрой её и войди ещё раз.":"";r.innerHTML=`
        <div class="who"><img alt="" src="${t.avatar??""}" /><h1>${t.persona??t.steam_id}</h1></div>
        <p>Steam ${t.steam_id}${t.country?` · ${t.country}`:""}${t.discord_name?` · Discord ${t.discord_name}`:""}</p>
        ${p?`<p class="note" id="sync-note">${p}</p>`:'<p class="note" id="sync-note"></p>'}
        <div class="stats">
          <div class="stat"><b>${e?.wardog_level??"—"}</b><span>Уровень</span></div>
          <div class="stat"><b>${o(e?.xp)}</b><span>Опыт</span></div>
          <div class="stat"><b>${b(e?.cash??null)}</b><span>Деньги</span></div>
          <div class="stat"><b>${e?.gold??"—"}</b><span>Золото</span></div>
          <div class="stat"><b>${e?.unlocks??"—"}</b><span>Открытия</span></div>
          <div class="stat"><b>${b(e?.account_value??null)}</b><span>Стоимость</span></div>
          <div class="stat"><b>${e?.role_assault??"—"}</b><span>Штурм</span></div>
          <div class="stat"><b>${e?.role_medic??"—"}</b><span>Медик</span></div>
          <div class="stat"><b>${e?.role_recon??"—"}</b><span>Разведка</span></div>
          <div class="stat"><b>${e?.role_support??"—"}</b><span>Поддержка</span></div>
          <div class="stat"><b>${e?.role_driver??"—"}</b><span>Водитель</span></div>
          <div class="stat"><b>${e?.role_pilot??"—"}</b><span>Пилот</span></div>
        </div>
        ${$(s.history)}
        <p class="note">Снимков: ${s.history.length}.</p>
        <p>${s.squad?`Сквад [${s.squad.tag}] ${s.squad.name}`:"Сквада нет."}</p>
        ${l?`<div class="row">
          <button class="btn small" id="resync" type="button">Обновить цифры</button>
          <label><input id="cis" type="checkbox" ${t.cis_opt_in?"checked":""}/> Участвовать в топе СНГ</label>
          <label><input id="hide" type="checkbox" ${t.hide_leaderboard?"checked":""}/> Скрыть из топа</label>
          ${n.discordLink?'<a class="btn ghost" href="/auth/discord">Привязать Discord</a>':'<span class="note">Привязка Discord на сервере выключена. На вход она не влияет.</span>'}
        </div>`:""}
      `;const h=async()=>{await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({cisOptIn:document.querySelector("#cis").checked,hideLeaderboard:document.querySelector("#hide").checked})})};document.querySelector("#cis")?.addEventListener("change",h),document.querySelector("#hide")?.addEventListener("change",h),document.querySelector("#resync")?.addEventListener("click",async()=>{const a=document.querySelector("#sync-note");a.textContent="Обновляю…";const u=await fetch("/api/me/sync",{method:"POST"});if(u.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}const m=await u.json().catch(()=>({}));if(m.saved){location.href=`/p?id=${i}`;return}a.textContent=m.careerConnect?"Закрой WARDOGS и войди ещё раз — тогда игра отдаст снимок.":"Steam не отдаёт эти цифры. Нужен вход, при котором игра сама отдаёт снимок карьеры."})}}
