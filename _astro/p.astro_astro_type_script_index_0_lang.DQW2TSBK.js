const d=document.querySelector("#profile"),_=new URLSearchParams(location.search),i=_.get("id")??"",o=_.get("sync")??"";function h(s){return s==null?"—":`$${new Intl.NumberFormat("ru-RU").format(s)}`}function $(s){const e=s.map(c=>c.wardog_level??0);if(e.length<2)return"";const t=Math.max(...e,1),a=280/(e.length-1);return`<svg class="chart" viewBox="0 0 280 90"><path d="${e.map((c,r)=>`${r===0?"M":"L"}${r*a},${80-c/t*70}`).join(" ")}" fill="none" stroke="#e6b34d" stroke-width="2"/></svg>`}if(!/^\d{17}$/.test(i))d.innerHTML="<h1>Такой страницы нет</h1>";else{const[s,e]=await Promise.all([fetch(`/api/players/${i}`).then(async t=>t.ok?t.json():null),fetch("/api/me").then(t=>t.json()).catch(()=>({user:null}))]);if(!s)d.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const t=s.user,a=s.history.at(-1),p=e.user?.steam_id===i,c=!s.history.length,r=n=>n==null?"—":new Intl.NumberFormat("ru-RU").format(n),m=o==="game_running"?"WARDOGS была открыта — Tracker не отдал цифры. Полностью закрой игру и снова нажми «Подтянуть карьеру».":o.startsWith("token_")?"Вход в Tracker не завершился (код обмена). Закрой игру и нажми «Подтянуть карьеру» ещё раз.":o==="empty"||c?"Цифр ещё нет. Закрой WARDOGS → «Подтянуть карьеру» → Steam. Обычный вход через Steam цифры не даёт.":o==="access_denied"?"Вход отменён.":o==="expired"?"Сессия входа истекла. Нажми «Подтянуть карьеру» снова.":o?`Не вышло (${o}). Закрой игру и повтори «Подтянуть карьеру».`:"";d.innerHTML=`
        <div class="who"><img alt="" src="${t.avatar??""}" /><h1>${t.persona??t.steam_id}</h1></div>
        <p>Steam ${t.steam_id}${t.country?` · ${t.country}`:""}${t.discord_name?` · Discord ${t.discord_name}`:""}</p>
        ${m?`<p class="note" id="sync-note">${m}</p>`:'<p class="note" id="sync-note"></p>'}
        <div class="stats">
          <div class="stat"><b>${a?.wardog_level??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_careerlevel_600.webp" alt="" />Уровень</span></div>
          <div class="stat"><b>${r(a?.xp)}</b><span>Опыт</span></div>
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
        ${$(s.history)}
        <p class="note">Снимков: ${s.history.length}.</p>
        <p>${s.squad?`Сквад [${s.squad.tag}] ${s.squad.name}`:"Сквада нет."}</p>
        ${p?`<div class="row">
          ${c?`<a class="btn small" href="/auth/wardogs/start?next=${encodeURIComponent(`/p?id=${i}`)}">Подтянуть карьеру</a>`:'<button class="btn small" id="resync" type="button">Обновить цифры</button>'}
          <label><input id="show-top" type="checkbox" ${t.cis_opt_in&&!t.hide_leaderboard?"checked":""}/> Показывать в топе</label>
          ${e.discordLink?'<a class="btn ghost" href="/auth/discord">Привязать Discord</a>':""}
        </div>
        <p class="note">Цифры даёт WARDOGS Tracker: закрой игру → «Подтянуть карьеру» → Steam. Обычный «Войти через Steam» цифры не приносит.</p>`:""}
      `;const b=async()=>{const n=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:n})})};document.querySelector("#show-top")?.addEventListener("change",b),document.querySelector("#resync")?.addEventListener("click",async()=>{const n=document.querySelector("#sync-note"),l=`/p?id=${i}`;n.textContent="Обновляю…";const u=await fetch("/api/me/sync",{method:"POST"});if(u.status===401){location.href=`/auth/steam?next=${encodeURIComponent(l)}`;return}if((await u.json().catch(()=>({}))).saved){location.href=l;return}location.href=`/auth/wardogs/start?next=${encodeURIComponent(l)}`})}}
