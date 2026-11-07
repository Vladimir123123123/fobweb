const f=document.querySelector("#profile"),j=new URLSearchParams(location.search),m=j.get("id")??"",d=j.get("sync")??"",D=j.get("job")??"",i=a=>String(a??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]??t);function T(a){return a==null?"—":`$${new Intl.NumberFormat("ru-RU").format(a)}`}const N=a=>a==null?"—":new Intl.NumberFormat("ru-RU").format(a);function k(a){const t=new Date(String(a??""));return Number.isNaN(t.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(t)}function v(a,t){if(a==null||t==null)return"";const c=Number(a)-Number(t);if(!c)return"";const e=c>0?"+":"−";return`<em class="${c>0?"up":"down"}">${e}${new Intl.NumberFormat("ru-RU").format(Math.abs(c))}</em>`}function H(a){const t=a.map(r=>r.wardog_level??0);if(t.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const c=Math.max(...t,1),e=Math.min(...t),o=Math.max(c-e,1),n=640,u=160,y=n/(t.length-1),_=r=>16+(1-(r-e)/o)*(u-36),w=t.map((r,x)=>`${x===0?"M":"L"}${x*y},${_(r)}`).join(" "),b=`${w} L${n},${u} L0,${u} Z`,g=t.at(-1)??0;return`<svg class="dossier-chart" viewBox="0 0 ${n} ${u}" role="img" aria-label="Уровень по снимкам">
      <defs><linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4b04a" stop-opacity="0.45"/><stop offset="1" stop-color="#e4b04a" stop-opacity="0"/></linearGradient></defs>
      <path d="${b}" fill="url(#lvl)"></path>
      <path d="${w}" fill="none" stroke="#e4b04a" stroke-width="2.5"></path>
      <circle cx="${n}" cy="${_(g)}" r="4" fill="#e4b04a"></circle>
    </svg>
    <p class="dossier-axis"><span>${i(k(a[0]?.created_at))}</span><span>${i(k(a.at(-1)?.created_at))} · ${N(g)} ур.</span></p>`}async function A(){f.innerHTML="<p>Обновляем статистику через API. Не закрывай вкладку.</p>";for(let a=0;a<45;a++){const t=await fetch(`/api/auth/status?job=${encodeURIComponent(D)}`).then(o=>o.json()).catch(()=>null);if(!t||t.status==="pending"){await new Promise(o=>setTimeout(o,2e3));continue}const c=t.next||(m?`/p/?id=${m}`:"/ratings"),e=new URL(c,location.origin);t.status==="ok"?(t.flag?e.searchParams.set("sync",t.flag):e.searchParams.delete("sync"),!e.searchParams.get("id")&&t.steamId&&e.searchParams.set("id",t.steamId)):e.searchParams.set("sync",t.sync||"expired"),e.searchParams.delete("job"),location.replace(e.pathname+e.search);return}location.replace(m?`/p/?id=${m}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(d==="wait")await A();else if(/^\d{17}$/.test(m)){const[a,t,c]=await Promise.all([fetch(`/api/players/${m}`).then(async e=>e.ok?e.json():null),fetch("/api/me").then(e=>e.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async e=>e.ok?e.json():null).catch(()=>null)]);if(!a)f.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const e=a.user,o=a.history,n=o.at(-1),u=o.length>1?o.at(-2):void 0,y=t.user?.steam_id===m,_=!o.length,b=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([s,l,h])=>({key:s,name:l,icon:h,level:Number(n?.[s]??0)||0})),g=Math.max(...b.map(s=>s.level),1),r=b.reduce((s,l)=>l.level>s.level?l:s,b[0]),L=(c?.players??[]).findIndex(s=>String(s.steam_id)===m),P=!!e.hide_leaderboard||!e.cis_opt_in,R=L>=0?`место #${L+1}`:P?"скрыт из топа":"вне топ-200";let p=a.squad;if(p?.id&&!("banner"in a.squad)){const l=(await fetch(`/api/squads/${p.id}`).then(h=>h.ok?h.json():null).catch(()=>null))?.squad;l&&(p={...p,logo:l.logo??"",banner:l.banner??""})}const q=s=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(s??""))?String(s):"",S=q(p?.banner),I=q(p?.logo),M=d==="game_running"?"WARDOGS была открыта — цифры не пришли. Закрой игру и нажми «Обновить через Steam».":d==="empty"||_?"Цифр ещё нет. Закрой WARDOGS и нажми «Обновить через Steam».":d==="token_timeout"||d==="token_err"||d&&d.startsWith("token_")?"Tracker не ответил. Закрой игру и нажми «Обновить через Steam» ещё раз.":d==="access_denied"?"Вход отменён.":d==="expired"?"Сессия входа истекла. Войди через Steam и обнови статистику.":d?`Не вышло (${d}). Закрой игру и нажми «Обновить через Steam».`:"";f.innerHTML=`
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
                  ${r.level?`<span class="pill now">${i(r.name)} ${r.level}</span>`:""}
                  ${p?`<a class="pill" href="/squad/?id=${p.id}">[${i(p.tag)}] ${i(p.name)}</a>`:'<span class="pill old">без сквада</span>'}
                  ${e.country?`<span class="pill">${i(e.country)}</span>`:""}
                  ${e.discord_name?`<span class="pill">Discord ${i(e.discord_name)}</span>`:""}
                </div>
              </div>
              <div class="dossier-level">
                <img src="/art/t_ui_icon_careerlevel_600.webp" alt="" />
                <b>${n?.wardog_level??"—"}</b>
                <span>уровень ${v(n?.wardog_level,u?.wardog_level)}</span>
              </div>
            </div>
          </header>
          ${M?`<p class="note dossier-alert" id="sync-note">${i(M)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${v(n?.xp,u?.xp)}</span><b>${N(n?.xp)}</b></div>
            <div><span>Деньги ${v(n?.cash,u?.cash)}</span><b>${T(n?.cash)}</b></div>
            <div><span>Золото ${v(n?.gold,u?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${n?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${n?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${T(n?.account_value)}</b></div>
            <div><span>Снимков</span><b>${o.length}</b></div>
          </section>
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${r.level?i(r.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${b.map(s=>`
                  <div class="lane${s.name===r.name&&s.level?" lead":""}">
                    <img src="${s.icon}" alt="" />
                    <span>${s.name}</span>
                    <i><b style="width:${Math.round(s.level/g*100)}%"></b></i>
                    <strong>${s.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${o.length>1?v(n?.wardog_level,o[0]?.wardog_level)?`${v(n?.wardog_level,o[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${H(o)}
              <p class="note">Последний снимок: ${i(k(n?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${m}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${y?`<div class="dossier-own">
            <a class="btn small" href="/auth/wardogs/start?next=/p&steamId=${m}">Обновить через Steam</a>
            <label class="check"><input id="show-top" type="checkbox" ${e.cis_opt_in&&!e.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${t.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Игра должна быть закрыта. Кнопка открывает Steam и снимает цифры.</p>
          </div>`:""}
        </article>
      `;const U=async()=>{const s=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:s})})};document.querySelector("#show-top")?.addEventListener("change",U),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const s=document.querySelector("#copy-profile");if(!s)return;const l=location.href;let h=!1;try{await navigator.clipboard.writeText(l),h=!0}catch{const $=document.createElement("textarea");$.value=l,$.setAttribute("readonly",""),$.style.position="fixed",$.style.left="-9999px",document.body.append($),$.select();try{h=document.execCommand("copy")}catch{h=!1}$.remove()}s.textContent=h?"Ссылка скопирована":"Не скопировалось"})}}else try{const t=(await fetch("/api/me").then(c=>c.json()))?.user?.steam_id;/^\d{17}$/.test(t||"")?location.replace(`/p/?id=${t}`):f.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{f.innerHTML="<h1>Такой страницы нет</h1>"}
