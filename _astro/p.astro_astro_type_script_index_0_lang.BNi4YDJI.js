const f=document.querySelector("#profile"),q=new URLSearchParams(location.search),r=q.get("id")??"",y=q.get("sync")??"",H=q.get("job")??"",i=s=>String(s??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]??t);function T(s){return s==null?"—":`$${new Intl.NumberFormat("ru-RU").format(s)}`}const C=s=>s==null?"—":new Intl.NumberFormat("ru-RU").format(s);function j(s){const t=new Date(String(s??""));return Number.isNaN(t.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(t)}function b(s,t){if(s==null||t==null)return"";const l=Number(s)-Number(t);if(!l)return"";const e=l>0?"+":"−";return`<em class="${l>0?"up":"down"}">${e}${new Intl.NumberFormat("ru-RU").format(Math.abs(l))}</em>`}function A(s){const t=s.map(d=>d.wardog_level??0);if(t.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const l=Math.max(...t,1),e=Math.min(...t),o=Math.max(l-e,1),n=640,h=160,_=n/(t.length-1),v=d=>16+(1-(d-e)/o)*(h-36),w=t.map((d,x)=>`${x===0?"M":"L"}${x*_},${v(d)}`).join(" "),$=`${w} L${n},${h} L0,${h} Z`,g=t.at(-1)??0;return`<svg class="dossier-chart" viewBox="0 0 ${n} ${h}" role="img" aria-label="Уровень по снимкам">
      <defs><linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4b04a" stop-opacity="0.45"/><stop offset="1" stop-color="#e4b04a" stop-opacity="0"/></linearGradient></defs>
      <path d="${$}" fill="url(#lvl)"></path>
      <path d="${w}" fill="none" stroke="#e4b04a" stroke-width="2.5"></path>
      <circle cx="${n}" cy="${v(g)}" r="4" fill="#e4b04a"></circle>
    </svg>
    <p class="dossier-axis"><span>${i(j(s[0]?.created_at))}</span><span>${i(j(s.at(-1)?.created_at))} · ${C(g)} ур.</span></p>`}async function E(){f.innerHTML="<p>Обновляем статистику через API. Не закрывай вкладку.</p>";for(let s=0;s<45;s++){const t=await fetch(`/api/auth/status?job=${encodeURIComponent(H)}`).then(o=>o.json()).catch(()=>null);if(!t||t.status==="pending"){await new Promise(o=>setTimeout(o,2e3));continue}const l=t.next||(r?`/p/?id=${r}`:"/ratings"),e=new URL(l,location.origin);t.status==="ok"?(t.flag?e.searchParams.set("sync",t.flag):e.searchParams.delete("sync"),!e.searchParams.get("id")&&t.steamId&&e.searchParams.set("id",t.steamId)):e.searchParams.set("sync",t.sync||"expired"),e.searchParams.delete("job"),location.replace(e.pathname+e.search);return}location.replace(r?`/p/?id=${r}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(y==="wait")await E();else if(/^\d{17}$/.test(r)){const[s,t,l]=await Promise.all([fetch(`/api/players/${r}`).then(async e=>e.ok?e.json():null),fetch("/api/me").then(e=>e.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async e=>e.ok?e.json():null).catch(()=>null)]);if(!s)f.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const e=s.user,o=s.history,n=o.at(-1),h=o.length>1?o.at(-2):void 0,_=t.user?.steam_id===r,v=!o.length,$=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([a,c,p])=>({key:a,name:c,icon:p,level:Number(n?.[a]??0)||0})),g=Math.max(...$.map(a=>a.level),1),d=$.reduce((a,c)=>c.level>a.level?c:a,$[0]),L=(l?.players??[]).findIndex(a=>String(a.steam_id)===r),R=!!e.hide_leaderboard||!e.cis_opt_in,U=L>=0?`место #${L+1}`:R?"скрыт из топа":"вне топ-200";let m=s.squad;if(m?.id&&!("banner"in s.squad)){const c=(await fetch(`/api/squads/${m.id}`).then(p=>p.ok?p.json():null).catch(()=>null))?.squad;c&&(m={...m,logo:c.logo??"",banner:c.banner??""})}const I=a=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(a??""))?String(a):"",S=I(m?.banner),M=I(m?.logo),N=y==="same"?"Это последние цифры из открытой базы. Свежее появятся, когда база снимет карьеру после сессии.":v?"Цифр ещё нет. Нажми «Обновить статистику» — мы сами заберём карьеру по SteamID.":y==="expired"?"Сессия входа истекла. Войди через Steam в шапке.":y&&y!=="ok"?"Не вышло обновить. Нажми «Обновить статистику» ещё раз.":"";f.innerHTML=`
        <article class="dossier">
          <header class="dossier-hero${S?" has-banner":""}">
            ${S?`<div class="dossier-banner" style="background-image:url('${i(S)}')"></div>`:""}
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${i(e.avatar??"")}" />
                ${M?`<img class="dossier-clan" alt="" src="${i(M)}" />`:""}
              </div>
              <div>
                <p class="eyebrow">Досье · сезон 02</p>
                <h1>${i(e.persona??e.steam_id)}</h1>
                <div class="dossier-tags">
                  <span class="pill">${i(U)}</span>
                  ${d.level?`<span class="pill now">${i(d.name)} ${d.level}</span>`:""}
                  ${m?`<a class="pill" href="/squad/?id=${m.id}">[${i(m.tag)}] ${i(m.name)}</a>`:'<span class="pill old">без сквада</span>'}
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
          ${N?`<p class="note dossier-alert" id="sync-note">${i(N)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${b(n?.xp,h?.xp)}</span><b>${C(n?.xp)}</b></div>
            <div><span>Деньги ${b(n?.cash,h?.cash)}</span><b>${T(n?.cash)}</b></div>
            <div><span>Золото ${b(n?.gold,h?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${n?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${n?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${T(n?.account_value)}</b></div>
            <div><span>Снимков</span><b>${o.length}</b></div>
          </section>
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${d.level?i(d.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${$.map(a=>`
                  <div class="lane${a.name===d.name&&a.level?" lead":""}">
                    <img src="${a.icon}" alt="" />
                    <span>${a.name}</span>
                    <i><b style="width:${Math.round(a.level/g*100)}%"></b></i>
                    <strong>${a.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${o.length>1?b(n?.wardog_level,o[0]?.wardog_level)?`${b(n?.wardog_level,o[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${A(o)}
              <p class="note">Последний снимок: ${i(j(n?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${r}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${_?`<div class="dossier-own">
            <button class="btn small" id="resync" type="button">Обновить статистику</button>
            <label class="check"><input id="show-top" type="checkbox" ${e.cis_opt_in&&!e.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${t.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Мы сами забираем карьеру по SteamID из открытой базы. Вход на сайт — Steam в шапке.</p>
          </div>`:""}
        </article>
      `;const D=async()=>{const a=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:a})})};document.querySelector("#show-top")?.addEventListener("change",D),document.querySelector("#resync")?.addEventListener("click",async()=>{const a=document.querySelector("#sync-note"),c=document.querySelector("#resync");c.disabled=!0,a.classList.add("dossier-alert"),a.textContent="Обновляю статистику…";try{const p=await fetch(`https://wardogstracker.gg/api/v1/players/${r}`,{signal:AbortSignal.timeout(8e3)}),u=p.ok?await p.json().catch(()=>null):null,P=await fetch("/api/me/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(u&&u.player?{player:u.player}:{}),signal:AbortSignal.timeout(8e3)});if(P.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${r}`)}`;return}const k=await P.json().catch(()=>({}));if(k.saved){location.href=k.unchanged?`/p/?id=${r}&sync=same`:`/p/?id=${r}`;return}a.textContent=k.reason==="tracker_down"?"База карьеры не ответила. Нажми ещё раз.":"В открытой базе этого игрока ещё нет."}catch{a.textContent="Слишком долго. Нажми ещё раз — запрос оборвался."}c.disabled=!1}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const a=document.querySelector("#copy-profile");if(!a)return;const c=location.href;let p=!1;try{await navigator.clipboard.writeText(c),p=!0}catch{const u=document.createElement("textarea");u.value=c,u.setAttribute("readonly",""),u.style.position="fixed",u.style.left="-9999px",document.body.append(u),u.select();try{p=document.execCommand("copy")}catch{p=!1}u.remove()}a.textContent=p?"Ссылка скопирована":"Не скопировалось"})}}else try{const t=(await fetch("/api/me").then(l=>l.json()))?.user?.steam_id;/^\d{17}$/.test(t||"")?location.replace(`/p/?id=${t}`):f.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{f.innerHTML="<h1>Такой страницы нет</h1>"}
