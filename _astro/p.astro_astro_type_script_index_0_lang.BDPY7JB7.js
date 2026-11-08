const y=document.querySelector("#profile"),T=new URLSearchParams(location.search),m=T.get("id")??"",u=T.get("sync")??"",U=T.get("job")??"",i=s=>String(s??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]??t);function D(s){return s==null?"—":`$${new Intl.NumberFormat("ru-RU").format(s)}`}const M=s=>s==null?"—":new Intl.NumberFormat("ru-RU").format(s);function k(s){const t=new Date(String(s??""));return Number.isNaN(t.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(t)}function f(s,t){if(s==null||t==null)return"";const l=Number(s)-Number(t);if(!l)return"";const e=l>0?"+":"−";return`<em class="${l>0?"up":"down"}">${e}${new Intl.NumberFormat("ru-RU").format(Math.abs(l))}</em>`}function C(s){const t=s.map(d=>d.wardog_level??0);if(t.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const l=Math.max(...t,1),e=Math.min(...t),o=Math.max(l-e,1),n=640,$=160,_=n/(t.length-1),v=d=>16+(1-(d-e)/o)*($-36),w=t.map((d,S)=>`${S===0?"M":"L"}${S*_},${v(d)}`).join(" "),b=`${w} L${n},${$} L0,${$} Z`,g=t.at(-1)??0;return`<svg class="dossier-chart" viewBox="0 0 ${n} ${$}" role="img" aria-label="Уровень по снимкам">
      <defs><linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4b04a" stop-opacity="0.45"/><stop offset="1" stop-color="#e4b04a" stop-opacity="0"/></linearGradient></defs>
      <path d="${b}" fill="url(#lvl)"></path>
      <path d="${w}" fill="none" stroke="#e4b04a" stroke-width="2.5"></path>
      <circle cx="${n}" cy="${v(g)}" r="4" fill="#e4b04a"></circle>
    </svg>
    <p class="dossier-axis"><span>${i(k(s[0]?.created_at))}</span><span>${i(k(s.at(-1)?.created_at))} · ${M(g)} ур.</span></p>`}async function G(){y.innerHTML="<p>Обновляем статистику через API. Не закрывай вкладку.</p>";for(let s=0;s<45;s++){const t=await fetch(`/api/auth/status?job=${encodeURIComponent(U)}`).then(o=>o.json()).catch(()=>null);if(!t||t.status==="pending"){await new Promise(o=>setTimeout(o,2e3));continue}const l=t.next||(m?`/p/?id=${m}`:"/ratings"),e=new URL(l,location.origin);t.status==="ok"?(t.flag?e.searchParams.set("sync",t.flag):e.searchParams.delete("sync"),!e.searchParams.get("id")&&t.steamId&&e.searchParams.set("id",t.steamId)):e.searchParams.set("sync",t.sync||"expired"),e.searchParams.delete("job"),location.replace(e.pathname+e.search);return}location.replace(m?`/p/?id=${m}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(u==="wait")await G();else if(/^\d{17}$/.test(m)){const[s,t,l]=await Promise.all([fetch(`/api/players/${m}`).then(async e=>e.ok?e.json():null),fetch("/api/me").then(e=>e.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async e=>e.ok?e.json():null).catch(()=>null)]);if(!s)y.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const e=s.user,o=s.history,n=o.at(-1),$=o.length>1?o.at(-2):void 0,_=t.user?.steam_id===m,v=!o.length,b=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([a,c,p])=>({key:a,name:c,icon:p,level:Number(n?.[a]??0)||0})),g=Math.max(...b.map(a=>a.level),1),d=b.reduce((a,c)=>c.level>a.level?c:a,b[0]),j=(l?.players??[]).findIndex(a=>String(a.steam_id)===m),P=!!e.hide_leaderboard||!e.cis_opt_in,A=j>=0?`место #${j+1}`:P?"скрыт из топа":"вне топ-200";let h=s.squad;if(h?.id&&!("banner"in s.squad)){const c=(await fetch(`/api/squads/${h.id}`).then(p=>p.ok?p.json():null).catch(()=>null))?.squad;c&&(h={...h,logo:c.logo??"",banner:c.banner??""})}const q=a=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(a??""))?String(a):"",x=q(h?.banner),L=q(h?.logo),R=u==="game_running"?"WARDOGS была открыта — цифры не пришли. Закрой игру и нажми «Обновить через Steam».":u==="empty"||v?"Цифр ещё нет. Закрой WARDOGS и нажми «Обновить через Steam».":u==="token_timeout"||u==="token_err"||u&&u.startsWith("token_")?"Tracker не ответил. Закрой игру и нажми «Обновить через Steam» ещё раз.":u==="access_denied"?"Вход отменён.":u==="expired"?"Сессия входа истекла. Войди через Steam и обнови статистику.":u?`Не вышло (${u}). Закрой игру и нажми «Обновить через Steam».`:"";y.innerHTML=`
        <article class="dossier">
          <header class="dossier-hero${x?" has-banner":""}">
            ${x?`<div class="dossier-banner" style="background-image:url('${i(x)}')"></div>`:""}
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${i(e.avatar??"")}" />
                ${L?`<img class="dossier-clan" alt="" src="${i(L)}" />`:""}
              </div>
              <div>
                <p class="eyebrow">Досье · сезон 02</p>
                <h1>${i(e.persona??e.steam_id)}</h1>
                <div class="dossier-tags">
                  <span class="pill">${i(A)}</span>
                  ${d.level?`<span class="pill now">${i(d.name)} ${d.level}</span>`:""}
                  ${h?`<a class="pill" href="/squad/?id=${h.id}">[${i(h.tag)}] ${i(h.name)}</a>`:'<span class="pill old">без сквада</span>'}
                  ${e.country?`<span class="pill">${i(e.country)}</span>`:""}
                  ${e.discord_name?`<span class="pill">Discord ${i(e.discord_name)}</span>`:""}
                </div>
              </div>
              <div class="dossier-level">
                <img src="/art/t_ui_icon_careerlevel_600.webp" alt="" />
                <b>${n?.wardog_level??"—"}</b>
                <span>уровень ${f(n?.wardog_level,$?.wardog_level)}</span>
              </div>
            </div>
          </header>
          ${R?`<p class="note dossier-alert" id="sync-note">${i(R)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${f(n?.xp,$?.xp)}</span><b>${M(n?.xp)}</b></div>
            <div><span>Деньги ${f(n?.cash,$?.cash)}</span><b>${D(n?.cash)}</b></div>
            <div><span>Золото ${f(n?.gold,$?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${n?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${n?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${D(n?.account_value)}</b></div>
            <div><span>Снимков</span><b>${o.length}</b></div>
          </section>
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${d.level?i(d.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${b.map(a=>`
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
              <h2>${o.length>1?f(n?.wardog_level,o[0]?.wardog_level)?`${f(n?.wardog_level,o[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${C(o)}
              <p class="note">Последний снимок: ${i(k(n?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${m}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${_?`<div class="dossier-own">
            <button class="btn small" id="resync" type="button">Обновить статистику</button>
            <a class="btn ghost small" href="/auth/wardogs/start?next=/p&steamId=${m}">Снять из игры</a>
            <label class="check"><input id="show-top" type="checkbox" ${e.cis_opt_in&&!e.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${t.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">«Обновить» берёт последние цифры Tracker. «Снять из игры» читает карьеру сейчас — WARDOGS должна быть закрыта.</p>
          </div>`:""}
        </article>
      `;const N=async()=>{const a=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:a})})};document.querySelector("#show-top")?.addEventListener("change",N),document.querySelector("#resync")?.addEventListener("click",async()=>{const a=document.querySelector("#sync-note"),c=document.querySelector("#resync");c.disabled=!0,a.classList.add("dossier-alert"),a.textContent="Обновляю статистику…";const p=await fetch("/api/me/sync",{method:"POST"});if(p.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${m}`)}`;return}const r=await p.json().catch(()=>({}));if(r.saved&&!r.unchanged){location.href=`/p/?id=${m}`;return}if(c.disabled=!1,r.unchanged){const I=r.syncedAt?new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(r.syncedAt)):"";a.textContent=I?`Tracker всё ещё держит снимок с ${I}. Закрой WARDOGS и нажми «Снять из игры».`:"Цифры те же. Закрой WARDOGS и нажми «Снять из игры».";return}a.textContent=r.reason==="tracker_down"?"Сервер не достучался до Tracker. Нажми ещё раз через минуту.":"Живых цифр нет. Закрой WARDOGS и нажми «Снять из игры»."}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const a=document.querySelector("#copy-profile");if(!a)return;const c=location.href;let p=!1;try{await navigator.clipboard.writeText(c),p=!0}catch{const r=document.createElement("textarea");r.value=c,r.setAttribute("readonly",""),r.style.position="fixed",r.style.left="-9999px",document.body.append(r),r.select();try{p=document.execCommand("copy")}catch{p=!1}r.remove()}a.textContent=p?"Ссылка скопирована":"Не скопировалось"})}}else try{const t=(await fetch("/api/me").then(l=>l.json()))?.user?.steam_id;/^\d{17}$/.test(t||"")?location.replace(`/p/?id=${t}`):y.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{y.innerHTML="<h1>Такой страницы нет</h1>"}
