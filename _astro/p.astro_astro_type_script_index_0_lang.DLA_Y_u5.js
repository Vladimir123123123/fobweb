const l=document.querySelector("#profile"),_=new URLSearchParams(location.search),i=_.get("id")??"",r=_.get("sync")??"";function h(s){return s==null?"—":`$${new Intl.NumberFormat("ru-RU").format(s)}`}function v(s){const n=s.map(o=>o.wardog_level??0);if(n.length<2)return"";const t=Math.max(...n,1),a=280/(n.length-1);return`<svg class="chart" viewBox="0 0 280 90"><path d="${n.map((o,c)=>`${c===0?"M":"L"}${c*a},${80-o/t*70}`).join(" ")}" fill="none" stroke="#e6b34d" stroke-width="2"/></svg>`}if(!/^\d{17}$/.test(i))l.innerHTML="<h1>Такой страницы нет</h1>";else{const[s,n]=await Promise.all([fetch(`/api/players/${i}`).then(async t=>t.ok?t.json():null),fetch("/api/me").then(t=>t.json()).catch(()=>({user:null}))]);if(!s)l.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const t=s.user,a=s.history.at(-1),d=n.user?.steam_id===i,o=!s.history.length,c=e=>e==null?"—":new Intl.NumberFormat("ru-RU").format(e),p=r==="game_running"?"Закрой WARDOGS и войди ещё раз: пока игра открыта, цифры не отдаются.":r==="empty"||o?"Steam не отдаёт уровень и роли. Цифры появятся после входа, когда игра отдаст снимок карьеры.":r==="access_denied"?"Вход отменён.":r?"Игра не отдала цифры. Закрой её и войди ещё раз.":"";l.innerHTML=`
        <div class="who"><img alt="" src="${t.avatar??""}" /><h1>${t.persona??t.steam_id}</h1></div>
        <p>Steam ${t.steam_id}${t.country?` · ${t.country}`:""}${t.discord_name?` · Discord ${t.discord_name}`:""}</p>
        ${p?`<p class="note" id="sync-note">${p}</p>`:'<p class="note" id="sync-note"></p>'}
        <div class="stats">
          <div class="stat"><b>${a?.wardog_level??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_careerlevel_600.webp" alt="" />Уровень</span></div>
          <div class="stat"><b>${c(a?.xp)}</b><span>Опыт</span></div>
          <div class="stat"><b>${h(a?.cash??null)}</b><span>Деньги</span></div>
          <div class="stat"><b>${a?.gold??"—"}</b><span><img class="stat-ico" src="/art/t_ui_goldbars_icon.webp" alt="" />Золото</span></div>
          <div class="stat"><b>${a?.unlocks??"—"}</b><span>Открытия</span></div>
          <div class="stat"><b>${h(a?.account_value??null)}</b><span>Стоимость</span></div>
          <div class="stat"><b>${a?.role_assault??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_infantry.webp" alt="" />Штурм</span></div>
          <div class="stat"><b>${a?.role_medic??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_medic.webp" alt="" />Медик</span></div>
          <div class="stat"><b>${a?.role_recon??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_recon.webp" alt="" />Разведка</span></div>
          <div class="stat"><b>${a?.role_support??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_support.webp" alt="" />Поддержка</span></div>
          <div class="stat"><b>${a?.role_driver??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_driver.webp" alt="" />Водитель</span></div>
          <div class="stat"><b>${a?.role_pilot??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_pilot.webp" alt="" />Пилот</span></div>
        </div>
        ${v(s.history)}
        <p class="note">Снимков: ${s.history.length}.</p>
        <p>${s.squad?`Сквад [${s.squad.tag}] ${s.squad.name}`:"Сквада нет."}</p>
        ${d?`<div class="row">
          <button class="btn small" id="resync" type="button">Обновить цифры</button>
          <label><input id="show-top" type="checkbox" ${t.cis_opt_in&&!t.hide_leaderboard?"checked":""}/> Показывать в топе</label>
          ${n.discordLink?'<a class="btn ghost" href="/auth/discord">Привязать Discord</a>':'<span class="note">Привязка Discord на сервере выключена. На вход она не влияет.</span>'}
        </div>`:""}
      `;const b=async()=>{const e=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:e})})};document.querySelector("#show-top")?.addEventListener("change",b),document.querySelector("#resync")?.addEventListener("click",async()=>{const e=document.querySelector("#sync-note");e.textContent="Обновляю…";const u=await fetch("/api/me/sync",{method:"POST"});if(u.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}const m=await u.json().catch(()=>({}));if(m.saved){location.href=`/p?id=${i}`;return}e.textContent=m.careerConnect?"Закрой WARDOGS и войди ещё раз — тогда игра отдаст снимок.":"Steam не отдаёт эти цифры. Нужен вход, при котором игра сама отдаёт снимок карьеры."})}}
