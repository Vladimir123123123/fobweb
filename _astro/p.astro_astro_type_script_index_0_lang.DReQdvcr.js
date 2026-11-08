const v=document.querySelector("#profile"),j=new URLSearchParams(location.search),m=j.get("id")??"",p=j.get("sync")??"",C=j.get("job")??"",i=s=>String(s??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]??t);function M(s){return s==null?"—":`$${new Intl.NumberFormat("ru-RU").format(s)}`}const P=s=>s==null?"—":new Intl.NumberFormat("ru-RU").format(s);function k(s){const t=new Date(String(s??""));return Number.isNaN(t.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(t)}function f(s,t){if(s==null||t==null)return"";const r=Number(s)-Number(t);if(!r)return"";const e=r>0?"+":"−";return`<em class="${r>0?"up":"down"}">${e}${new Intl.NumberFormat("ru-RU").format(Math.abs(r))}</em>`}function D(s){const t=s.map(l=>l.wardog_level??0);if(t.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const r=Math.max(...t,1),e=Math.min(...t),o=Math.max(r-e,1),n=640,h=160,g=n/(t.length-1),y=l=>16+(1-(l-e)/o)*(h-36),w=t.map((l,S)=>`${S===0?"M":"L"}${S*g},${y(l)}`).join(" "),b=`${w} L${n},${h} L0,${h} Z`,_=t.at(-1)??0;return`<svg class="dossier-chart" viewBox="0 0 ${n} ${h}" role="img" aria-label="Уровень по снимкам">
      <defs><linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4b04a" stop-opacity="0.45"/><stop offset="1" stop-color="#e4b04a" stop-opacity="0"/></linearGradient></defs>
      <path d="${b}" fill="url(#lvl)"></path>
      <path d="${w}" fill="none" stroke="#e4b04a" stroke-width="2.5"></path>
      <circle cx="${n}" cy="${y(_)}" r="4" fill="#e4b04a"></circle>
    </svg>
    <p class="dossier-axis"><span>${i(k(s[0]?.created_at))}</span><span>${i(k(s.at(-1)?.created_at))} · ${P(_)} ур.</span></p>`}async function A(){v.innerHTML="<p>Обновляем статистику через API. Не закрывай вкладку.</p>";for(let s=0;s<45;s++){const t=await fetch(`/api/auth/status?job=${encodeURIComponent(C)}`).then(o=>o.json()).catch(()=>null);if(!t||t.status==="pending"){await new Promise(o=>setTimeout(o,2e3));continue}const r=t.next||(m?`/p/?id=${m}`:"/ratings"),e=new URL(r,location.origin);t.status==="ok"?(t.flag?e.searchParams.set("sync",t.flag):e.searchParams.delete("sync"),!e.searchParams.get("id")&&t.steamId&&e.searchParams.set("id",t.steamId)):e.searchParams.set("sync",t.sync||"expired"),e.searchParams.delete("job"),location.replace(e.pathname+e.search);return}location.replace(m?`/p/?id=${m}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(p==="wait")await A();else if(/^\d{17}$/.test(m)){const[s,t,r]=await Promise.all([fetch(`/api/players/${m}`).then(async e=>e.ok?e.json():null),fetch("/api/me").then(e=>e.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async e=>e.ok?e.json():null).catch(()=>null)]);if(!s)v.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const e=s.user,o=s.history,n=o.at(-1),h=o.length>1?o.at(-2):void 0,g=t.user?.steam_id===m,y=!o.length,b=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([a,c,d])=>({key:a,name:c,icon:d,level:Number(n?.[a]??0)||0})),_=Math.max(...b.map(a=>a.level),1),l=b.reduce((a,c)=>c.level>a.level?c:a,b[0]),q=(r?.players??[]).findIndex(a=>String(a.steam_id)===m),N=!!e.hide_leaderboard||!e.cis_opt_in,R=q>=0?`место #${q+1}`:N?"скрыт из топа":"вне топ-200";let u=s.squad;if(u?.id&&!("banner"in s.squad)){const c=(await fetch(`/api/squads/${u.id}`).then(d=>d.ok?d.json():null).catch(()=>null))?.squad;c&&(u={...u,logo:c.logo??"",banner:c.banner??""})}const L=a=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(a??""))?String(a):"",x=L(u?.banner),T=L(u?.logo),I=p==="game_running"?"WARDOGS была открыта — цифры не пришли. Закрой игру и нажми «Обновить через Steam».":p==="empty"||y?"Цифр ещё нет. Закрой WARDOGS и нажми «Обновить через Steam».":p==="token_timeout"||p==="token_err"||p&&p.startsWith("token_")?"Tracker не ответил. Закрой игру и нажми «Обновить через Steam» ещё раз.":p==="access_denied"?"Вход отменён.":p==="expired"?"Сессия входа истекла. Войди через Steam и обнови статистику.":p?`Не вышло (${p}). Закрой игру и нажми «Обновить через Steam».`:"";v.innerHTML=`
        <article class="dossier">
          <header class="dossier-hero${x?" has-banner":""}">
            ${x?`<div class="dossier-banner" style="background-image:url('${i(x)}')"></div>`:""}
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${i(e.avatar??"")}" />
                ${T?`<img class="dossier-clan" alt="" src="${i(T)}" />`:""}
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
                <span>уровень ${f(n?.wardog_level,h?.wardog_level)}</span>
              </div>
            </div>
          </header>
          ${I?`<p class="note dossier-alert" id="sync-note">${i(I)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${f(n?.xp,h?.xp)}</span><b>${P(n?.xp)}</b></div>
            <div><span>Деньги ${f(n?.cash,h?.cash)}</span><b>${M(n?.cash)}</b></div>
            <div><span>Золото ${f(n?.gold,h?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${n?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${n?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${M(n?.account_value)}</b></div>
            <div><span>Снимков</span><b>${o.length}</b></div>
          </section>
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${l.level?i(l.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${b.map(a=>`
                  <div class="lane${a.name===l.name&&a.level?" lead":""}">
                    <img src="${a.icon}" alt="" />
                    <span>${a.name}</span>
                    <i><b style="width:${Math.round(a.level/_*100)}%"></b></i>
                    <strong>${a.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${o.length>1?f(n?.wardog_level,o[0]?.wardog_level)?`${f(n?.wardog_level,o[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${D(o)}
              <p class="note">Последний снимок: ${i(k(n?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${m}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${g?`<div class="dossier-own">
            <button class="btn small" id="resync" type="button">Обновить статистику</button>
            <label class="check"><input id="show-top" type="checkbox" ${e.cis_opt_in&&!e.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${t.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Вход на сайт — через Steam в шапке. Цифры снимает кнопка выше, игра должна быть закрыта.</p>
          </div>`:""}
        </article>
      `;const U=async()=>{const a=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:a})})};document.querySelector("#show-top")?.addEventListener("change",U),document.querySelector("#resync")?.addEventListener("click",async()=>{const a=document.querySelector("#sync-note"),c=document.querySelector("#resync");c.disabled=!0,a.textContent="Обновляю статистику…";const d=await fetch("/api/me/sync",{method:"POST"});if(d.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${m}`)}`;return}if((await d.json().catch(()=>({}))).saved){location.href=`/p/?id=${m}`;return}c.disabled=!1,a.textContent="Цифры не пришли. Полностью закрой WARDOGS и нажми ещё раз."}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const a=document.querySelector("#copy-profile");if(!a)return;const c=location.href;let d=!1;try{await navigator.clipboard.writeText(c),d=!0}catch{const $=document.createElement("textarea");$.value=c,$.setAttribute("readonly",""),$.style.position="fixed",$.style.left="-9999px",document.body.append($),$.select();try{d=document.execCommand("copy")}catch{d=!1}$.remove()}a.textContent=d?"Ссылка скопирована":"Не скопировалось"})}}else try{const t=(await fetch("/api/me").then(r=>r.json()))?.user?.steam_id;/^\d{17}$/.test(t||"")?location.replace(`/p/?id=${t}`):v.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{v.innerHTML="<h1>Такой страницы нет</h1>"}
