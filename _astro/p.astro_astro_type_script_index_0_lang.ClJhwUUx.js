const v=document.querySelector("#profile"),j=new URLSearchParams(location.search),p=j.get("id")??"",f=j.get("sync")??"",C=j.get("job")??"",i=a=>String(a??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]??t);function P(a){return a==null?"—":`$${new Intl.NumberFormat("ru-RU").format(a)}`}const T=a=>a==null?"—":new Intl.NumberFormat("ru-RU").format(a);function k(a){const t=new Date(String(a??""));return Number.isNaN(t.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(t)}function b(a,t){if(a==null||t==null)return"";const r=Number(a)-Number(t);if(!r)return"";const e=r>0?"+":"−";return`<em class="${r>0?"up":"down"}">${e}${new Intl.NumberFormat("ru-RU").format(Math.abs(r))}</em>`}function D(a){const t=a.map(l=>l.wardog_level??0);if(t.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const r=Math.max(...t,1),e=Math.min(...t),o=Math.max(r-e,1),n=640,h=160,_=n/(t.length-1),y=l=>16+(1-(l-e)/o)*(h-36),w=t.map((l,x)=>`${x===0?"M":"L"}${x*_},${y(l)}`).join(" "),$=`${w} L${n},${h} L0,${h} Z`,g=t.at(-1)??0;return`<svg class="dossier-chart" viewBox="0 0 ${n} ${h}" role="img" aria-label="Уровень по снимкам">
      <defs><linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4b04a" stop-opacity="0.45"/><stop offset="1" stop-color="#e4b04a" stop-opacity="0"/></linearGradient></defs>
      <path d="${$}" fill="url(#lvl)"></path>
      <path d="${w}" fill="none" stroke="#e4b04a" stroke-width="2.5"></path>
      <circle cx="${n}" cy="${y(g)}" r="4" fill="#e4b04a"></circle>
    </svg>
    <p class="dossier-axis"><span>${i(k(a[0]?.created_at))}</span><span>${i(k(a.at(-1)?.created_at))} · ${T(g)} ур.</span></p>`}async function H(){v.innerHTML="<p>Обновляем статистику через API. Не закрывай вкладку.</p>";for(let a=0;a<45;a++){const t=await fetch(`/api/auth/status?job=${encodeURIComponent(C)}`).then(o=>o.json()).catch(()=>null);if(!t||t.status==="pending"){await new Promise(o=>setTimeout(o,2e3));continue}const r=t.next||(p?`/p/?id=${p}`:"/ratings"),e=new URL(r,location.origin);t.status==="ok"?(t.flag?e.searchParams.set("sync",t.flag):e.searchParams.delete("sync"),!e.searchParams.get("id")&&t.steamId&&e.searchParams.set("id",t.steamId)):e.searchParams.set("sync",t.sync||"expired"),e.searchParams.delete("job"),location.replace(e.pathname+e.search);return}location.replace(p?`/p/?id=${p}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(f==="wait")await H();else if(/^\d{17}$/.test(p)){const[a,t,r]=await Promise.all([fetch(`/api/players/${p}`).then(async e=>e.ok?e.json():null),fetch("/api/me").then(e=>e.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async e=>e.ok?e.json():null).catch(()=>null)]);if(!a)v.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const e=a.user,o=a.history,n=o.at(-1),h=o.length>1?o.at(-2):void 0,_=t.user?.steam_id===p,y=!o.length,$=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([s,c,d])=>({key:s,name:c,icon:d,level:Number(n?.[s]??0)||0})),g=Math.max(...$.map(s=>s.level),1),l=$.reduce((s,c)=>c.level>s.level?c:s,$[0]),q=(r?.players??[]).findIndex(s=>String(s.steam_id)===p),N=!!e.hide_leaderboard||!e.cis_opt_in,R=q>=0?`место #${q+1}`:N?"скрыт из топа":"вне топ-200";let u=a.squad;if(u?.id&&!("banner"in a.squad)){const c=(await fetch(`/api/squads/${u.id}`).then(d=>d.ok?d.json():null).catch(()=>null))?.squad;c&&(u={...u,logo:c.logo??"",banner:c.banner??""})}const L=s=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(s??""))?String(s):"",S=L(u?.banner),I=L(u?.logo),M=f==="same"?"Это последние цифры из открытой базы. Свежее появятся, когда база снимет карьеру после сессии.":y?"Цифр ещё нет. Нажми «Обновить статистику» — мы сами заберём карьеру по SteamID.":f==="expired"?"Сессия входа истекла. Войди через Steam в шапке.":f&&f!=="ok"?"Не вышло обновить. Нажми «Обновить статистику» ещё раз.":"";v.innerHTML=`
        <article class="dossier">
          <header class="dossier-hero${S?" has-banner":""}">
            ${S?`<div class="dossier-banner" style="background-image:url('${i(S)}')"></div>`:""}
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${i(e.avatar??"")}" />
                ${I?`<img class="dossier-clan" alt="" src="${i(I)}" />`:""}
              </div>
              <div>
                <p class="eyebrow">Досье · сезон 02</p>
                <h1>${i(e.persona??e.steam_id)}</h1>
                <div class="dossier-tags">
                  <span class="pill">${i(R)}</span>
                  ${l.level?`<span class="pill now">${i(l.name)} ${l.level}</span>`:""}
                  ${u?`<a class="pill" href="/squad/?id=${u.id}">[${i(u.tag)}] ${i(u.name)}</a>`:'<span class="pill old">без сквада</span>'}
                  ${e.country?`<span class="pill">${i(e.country)}</span>`:""}
                  ${e.discord_name?`<span class="pill">Discord ${i(e.discord_name)}</span>`:""}
                </div>
              </div>
              <div class="dossier-level">
                <img src="/art/t_ui_icon_careerlevel_600.webp" alt="" />
                <b>${n?.wardog_level??"—"}</b>
                <span>уровень ${b(n?.wardog_level,h?.wardog_level)}</span>
              </div>
            </div>
          </header>
          ${M?`<p class="note dossier-alert" id="sync-note">${i(M)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${b(n?.xp,h?.xp)}</span><b>${T(n?.xp)}</b></div>
            <div><span>Деньги ${b(n?.cash,h?.cash)}</span><b>${P(n?.cash)}</b></div>
            <div><span>Золото ${b(n?.gold,h?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${n?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${n?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${P(n?.account_value)}</b></div>
            <div><span>Снимков</span><b>${o.length}</b></div>
          </section>
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${l.level?i(l.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${$.map(s=>`
                  <div class="lane${s.name===l.name&&s.level?" lead":""}">
                    <img src="${s.icon}" alt="" />
                    <span>${s.name}</span>
                    <i><b style="width:${Math.round(s.level/g*100)}%"></b></i>
                    <strong>${s.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${o.length>1?b(n?.wardog_level,o[0]?.wardog_level)?`${b(n?.wardog_level,o[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${D(o)}
              <p class="note">Последний снимок: ${i(k(n?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${p}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${_?`<div class="dossier-own">
            <button class="btn small" id="resync" type="button">Обновить статистику</button>
            <label class="check"><input id="show-top" type="checkbox" ${e.cis_opt_in&&!e.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${t.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Мы сами забираем карьеру по SteamID из открытой базы. Вход на сайт — Steam в шапке.</p>
          </div>`:""}
        </article>
      `;const U=async()=>{const s=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:s})})};document.querySelector("#show-top")?.addEventListener("change",U),document.querySelector("#resync")?.addEventListener("click",async()=>{const s=document.querySelector("#sync-note"),c=document.querySelector("#resync");c.disabled=!0,s.classList.add("dossier-alert"),s.textContent="Обновляю статистику…";const d=await fetch("/api/me/sync",{method:"POST"});if(d.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${p}`)}`;return}const m=await d.json().catch(()=>({}));if(m.saved){location.href=m.unchanged?`/p/?id=${p}&sync=same`:`/p/?id=${p}`;return}c.disabled=!1,s.textContent=m.reason==="tracker_down"?"Сейчас не достучались до базы карьеры. Нажми ещё раз через минуту.":"В открытой базе этого игрока ещё нет. Сыграй сессию и обнови позже."}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const s=document.querySelector("#copy-profile");if(!s)return;const c=location.href;let d=!1;try{await navigator.clipboard.writeText(c),d=!0}catch{const m=document.createElement("textarea");m.value=c,m.setAttribute("readonly",""),m.style.position="fixed",m.style.left="-9999px",document.body.append(m),m.select();try{d=document.execCommand("copy")}catch{d=!1}m.remove()}s.textContent=d?"Ссылка скопирована":"Не скопировалось"})}}else try{const t=(await fetch("/api/me").then(r=>r.json()))?.user?.steam_id;/^\d{17}$/.test(t||"")?location.replace(`/p/?id=${t}`):v.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{v.innerHTML="<h1>Такой страницы нет</h1>"}
