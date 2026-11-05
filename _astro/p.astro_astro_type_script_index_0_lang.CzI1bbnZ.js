const d=document.querySelector("#profile"),_=new URLSearchParams(location.search),c=_.get("id")??"",r=_.get("sync")??"";function h(s){return s==null?"—":`$${new Intl.NumberFormat("ru-RU").format(s)}`}function v(s){const e=s.map(o=>o.wardog_level??0);if(e.length<2)return"";const t=Math.max(...e,1),a=280/(e.length-1);return`<svg class="chart" viewBox="0 0 280 90"><path d="${e.map((o,i)=>`${i===0?"M":"L"}${i*a},${80-o/t*70}`).join(" ")}" fill="none" stroke="#e6b34d" stroke-width="2"/></svg>`}if(!/^\d{17}$/.test(c))d.innerHTML="<h1>Такой страницы нет</h1>";else{const[s,e]=await Promise.all([fetch(`/api/players/${c}`).then(async t=>t.ok?t.json():null),fetch("/api/me").then(t=>t.json()).catch(()=>({user:null}))]);if(!s)d.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const t=s.user,a=s.history.at(-1),p=e.user?.steam_id===c,o=!s.history.length,i=n=>n==null?"—":new Intl.NumberFormat("ru-RU").format(n),u=r==="game_running"?"Закрой WARDOGS и нажми «Подтянуть карьеру» ещё раз — пока игра открыта, цифры не отдаются.":r==="empty"||o?"Цифр ещё нет. Нужен вход через WARDOGS Tracker: закрой игру и нажми «Подтянуть карьеру».":r==="access_denied"?"Вход отменён.":r?"Игра не отдала цифры. Закрой WARDOGS и нажми «Подтянуть карьеру» снова.":"";d.innerHTML=`
        <div class="who"><img alt="" src="${t.avatar??""}" /><h1>${t.persona??t.steam_id}</h1></div>
        <p>Steam ${t.steam_id}${t.country?` · ${t.country}`:""}${t.discord_name?` · Discord ${t.discord_name}`:""}</p>
        ${u?`<p class="note" id="sync-note">${u}</p>`:'<p class="note" id="sync-note"></p>'}
        <div class="stats">
          <div class="stat"><b>${a?.wardog_level??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_careerlevel_600.webp" alt="" />Уровень</span></div>
          <div class="stat"><b>${i(a?.xp)}</b><span>Опыт</span></div>
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
        ${p?`<div class="row">
          ${o?`<a class="btn small" href="/auth/wardogs/start?next=${encodeURIComponent(`/p?id=${c}`)}">Подтянуть карьеру</a>`:'<button class="btn small" id="resync" type="button">Обновить цифры</button>'}
          <label><input id="show-top" type="checkbox" ${t.cis_opt_in&&!t.hide_leaderboard?"checked":""}/> Показывать в топе</label>
          ${e.discordLink?'<a class="btn ghost" href="/auth/discord">Привязать Discord</a>':""}
        </div>
        <p class="note">Цифры даёт WARDOGS Tracker: закрой игру → «Подтянуть карьеру» → Steam. Обычный «Войти через Steam» цифры не приносит.</p>`:""}
      `;const b=async()=>{const n=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:n})})};document.querySelector("#show-top")?.addEventListener("change",b),document.querySelector("#resync")?.addEventListener("click",async()=>{const n=document.querySelector("#sync-note"),l=`/p?id=${c}`;n.textContent="Обновляю…";const m=await fetch("/api/me/sync",{method:"POST"});if(m.status===401){location.href=`/auth/steam?next=${encodeURIComponent(l)}`;return}if((await m.json().catch(()=>({}))).saved){location.href=l;return}location.href=`/auth/wardogs/start?next=${encodeURIComponent(l)}`})}}
