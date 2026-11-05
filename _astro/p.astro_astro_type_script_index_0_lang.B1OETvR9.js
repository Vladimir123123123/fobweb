const p=document.querySelector("#profile"),b=new URLSearchParams(location.search),i=b.get("id")??"",r=b.get("sync")??"";function _(s){return s==null?"—":`$${new Intl.NumberFormat("ru-RU").format(s)}`}function $(s){const n=s.map(o=>o.wardog_level??0);if(n.length<2)return"";const t=Math.max(...n,1),e=280/(n.length-1);return`<svg class="chart" viewBox="0 0 280 90"><path d="${n.map((o,c)=>`${c===0?"M":"L"}${c*e},${80-o/t*70}`).join(" ")}" fill="none" stroke="#e6b34d" stroke-width="2"/></svg>`}if(!/^\d{17}$/.test(i))p.innerHTML="<h1>Такой страницы нет</h1>";else{const[s,n]=await Promise.all([fetch(`/api/players/${i}`).then(async t=>t.ok?t.json():null),fetch("/api/me").then(t=>t.json()).catch(()=>({user:null}))]);if(!s)p.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const t=s.user,e=s.history.at(-1),u=n.user?.steam_id===i,o=!s.history.length,c=a=>a==null?"—":new Intl.NumberFormat("ru-RU").format(a),m=r==="game_running"?"Закрой WARDOGS и нажми «Подтянуть карьеру» ещё раз — пока игра открыта, цифры не отдаются.":r==="empty"||o?"Цифр ещё нет. Нужен вход через WARDOGS Tracker: закрой игру и нажми «Подтянуть карьеру».":r==="access_denied"?"Вход отменён.":r?"Игра не отдала цифры. Закрой WARDOGS и нажми «Подтянуть карьеру» снова.":"";p.innerHTML=`
        <div class="who"><img alt="" src="${t.avatar??""}" /><h1>${t.persona??t.steam_id}</h1></div>
        <p>Steam ${t.steam_id}${t.country?` · ${t.country}`:""}${t.discord_name?` · Discord ${t.discord_name}`:""}</p>
        ${m?`<p class="note" id="sync-note">${m}</p>`:'<p class="note" id="sync-note"></p>'}
        <div class="stats">
          <div class="stat"><b>${e?.wardog_level??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_careerlevel_600.webp" alt="" />Уровень</span></div>
          <div class="stat"><b>${c(e?.xp)}</b><span>Опыт</span></div>
          <div class="stat"><b>${_(e?.cash??null)}</b><span>Деньги</span></div>
          <div class="stat"><b>${e?.gold??"—"}</b><span><img class="stat-ico" src="/art/t_ui_goldbars_icon.webp" alt="" />Золото</span></div>
          <div class="stat"><b>${e?.unlocks??"—"}</b><span>Открытия</span></div>
          <div class="stat"><b>${_(e?.account_value??null)}</b><span>Стоимость</span></div>
          <div class="stat"><b>${e?.role_assault??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_infantry.webp" alt="" />Штурм</span></div>
          <div class="stat"><b>${e?.role_medic??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_medic.webp" alt="" />Медик</span></div>
          <div class="stat"><b>${e?.role_recon??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_recon.webp" alt="" />Разведка</span></div>
          <div class="stat"><b>${e?.role_support??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_support.webp" alt="" />Поддержка</span></div>
          <div class="stat"><b>${e?.role_driver??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_driver.webp" alt="" />Водитель</span></div>
          <div class="stat"><b>${e?.role_pilot??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_pilot.webp" alt="" />Пилот</span></div>
        </div>
        ${$(s.history)}
        <p class="note">Снимков: ${s.history.length}.</p>
        <p>${s.squad?`Сквад [${s.squad.tag}] ${s.squad.name}`:"Сквада нет."}</p>
        ${u?`<div class="row">
          <button class="btn small" id="resync" type="button">${o?"Подтянуть карьеру":"Обновить цифры"}</button>
          <label><input id="show-top" type="checkbox" ${t.cis_opt_in&&!t.hide_leaderboard?"checked":""}/> Показывать в топе</label>
          ${n.discordLink?'<a class="btn ghost" href="/auth/discord">Привязать Discord</a>':""}
        </div>
        <p class="note">Для цифр нужна авторизация WARDOGS Tracker (не обычный Steam). Игра должна быть закрыта.</p>`:""}
      `;const v=async()=>{const a=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:a})})};document.querySelector("#show-top")?.addEventListener("change",v),document.querySelector("#resync")?.addEventListener("click",async()=>{const a=document.querySelector("#sync-note"),l=`/p?id=${i}`;a.textContent="Обновляю…";const h=await fetch("/api/me/sync",{method:"POST"});if(h.status===401){location.href=`/auth/steam?next=${encodeURIComponent(l)}`;return}const d=await h.json().catch(()=>({}));if(d.saved){location.href=l;return}if(d.needConnect||d.careerConnect){a.textContent="Нужен вход через WARDOGS Tracker. Закрой игру — сейчас открою окно входа…",location.href=`/auth/wardogs/start?next=${encodeURIComponent(l)}`;return}a.textContent="Цифры сейчас не отдаются. Закрой WARDOGS и попробуй снова."})}}
