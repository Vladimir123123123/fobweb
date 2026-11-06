const l=document.querySelector("#profile"),p=new URLSearchParams(location.search),i=p.get("id")??"",n=p.get("sync")??"",_=p.get("job")??"";function h(e){return e==null?"—":`$${new Intl.NumberFormat("ru-RU").format(e)}`}function b(e){const a=e.map(c=>c.wardog_level??0);if(a.length<2)return"";const s=Math.max(...a,1),t=280/(a.length-1);return`<svg class="chart" viewBox="0 0 280 90"><path d="${a.map((c,d)=>`${d===0?"M":"L"}${d*t},${80-c/s*70}`).join(" ")}" fill="none" stroke="#e6b34d" stroke-width="2"/></svg>`}async function $(){l.innerHTML="<p>Обновляем статистику через API. Не закрывай вкладку.</p>";for(let e=0;e<45;e++){const a=await fetch(`/api/auth/status?job=${encodeURIComponent(_)}`).then(o=>o.json()).catch(()=>null);if(!a||a.status==="pending"){await new Promise(o=>setTimeout(o,2e3));continue}const s=a.next||(i?`/p/?id=${i}`:"/ratings"),t=new URL(s,location.origin);a.status==="ok"?(a.flag?t.searchParams.set("sync",a.flag):t.searchParams.delete("sync"),!t.searchParams.get("id")&&a.steamId&&t.searchParams.set("id",a.steamId)):t.searchParams.set("sync",a.sync||"expired"),t.searchParams.delete("job"),location.replace(t.pathname+t.search);return}location.replace(i?`/p/?id=${i}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(n==="wait")await $();else if(/^\d{17}$/.test(i)){const[e,a]=await Promise.all([fetch(`/api/players/${i}`).then(async s=>s.ok?s.json():null),fetch("/api/me").then(s=>s.json()).catch(()=>({user:null}))]);if(!e)l.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const s=e.user,t=e.history.at(-1),o=a.user?.steam_id===i,c=!e.history.length,d=r=>r==null?"—":new Intl.NumberFormat("ru-RU").format(r),m=n==="game_running"?"WARDOGS была открыта — цифры не пришли. Закрой игру и нажми «Обновить через Steam».":n==="empty"||c?"Цифр ещё нет. Закрой WARDOGS и нажми «Обновить через Steam».":n==="token_timeout"||n==="token_err"||n&&n.startsWith("token_")?"Tracker не ответил. Закрой игру и нажми «Обновить через Steam» ещё раз.":n==="access_denied"?"Вход отменён.":n==="expired"?"Сессия входа истекла. Войди через Steam и обнови статистику.":n?`Не вышло (${n}). Закрой игру и нажми «Обновить через Steam».`:"";l.innerHTML=`
        <div class="who"><img alt="" src="${s.avatar??""}" /><h1>${s.persona??s.steam_id}</h1></div>
        <p>Steam ${s.steam_id}${s.country?` · ${s.country}`:""}${s.discord_name?` · Discord ${s.discord_name}`:""}</p>
        ${m?`<p class="note" id="sync-note">${m}</p>`:'<p class="note" id="sync-note"></p>'}
        <div class="stats">
          <div class="stat"><b>${t?.wardog_level??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_careerlevel_600.webp" alt="" />Уровень</span></div>
          <div class="stat"><b>${d(t?.xp)}</b><span>Опыт</span></div>
          <div class="stat"><b>${h(t?.cash??null)}</b><span>Деньги</span></div>
          <div class="stat"><b>${t?.gold??"—"}</b><span><img class="stat-ico" src="/art/t_ui_goldbars_icon.webp" alt="" />Золото</span></div>
          <div class="stat"><b>${t?.unlocks??"—"}</b><span>Открытия</span></div>
          <div class="stat"><b>${h(t?.account_value??null)}</b><span>Стоимость</span></div>
          <div class="stat"><b>${t?.role_assault??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_infantry.webp" alt="" />Штурм</span></div>
          <div class="stat"><b>${t?.role_medic??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_medic.webp" alt="" />Медик</span></div>
          <div class="stat"><b>${t?.role_recon??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_recon.webp" alt="" />Разведка</span></div>
          <div class="stat"><b>${t?.role_support??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_support.webp" alt="" />Поддержка</span></div>
          <div class="stat"><b>${t?.role_driver??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_driver.webp" alt="" />Водитель</span></div>
          <div class="stat"><b>${t?.role_pilot??"—"}</b><span><img class="stat-ico" src="/art/t_ui_icon_role_pilot.webp" alt="" />Пилот</span></div>
        </div>
        ${b(e.history)}
        <p class="note">Снимков: ${e.history.length}.</p>
        <p>${e.squad?`Сквад [${e.squad.tag}] ${e.squad.name}`:"Сквада нет."}</p>
        ${o?`<div class="row">
          <a class="btn small" href="/auth/wardogs/start?next=/p&steamId=${i}">Обновить через Steam</a>
          <label><input id="show-top" type="checkbox" ${s.cis_opt_in&&!s.hide_leaderboard?"checked":""}/> Показывать в топе</label>
          ${a.discordLink?'<a class="btn ghost" href="/auth/discord">Привязать Discord</a>':""}
        </div>
        <p class="note">Игра должна быть закрыта. Кнопка открывает Steam и снимает цифры.</p>`:""}
      `;const u=async()=>{const r=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:r})})};document.querySelector("#show-top")?.addEventListener("change",u)}}else try{const a=(await fetch("/api/me").then(s=>s.json()))?.user?.steam_id;/^\d{17}$/.test(a||"")?location.replace(`/p/?id=${a}`):l.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{l.innerHTML="<h1>Такой страницы нет</h1>"}
