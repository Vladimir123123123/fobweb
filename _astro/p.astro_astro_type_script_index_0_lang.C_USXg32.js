const v=document.querySelector("#profile"),k=new URLSearchParams(location.search),d=k.get("id")??"",l=k.get("sync")??"",q=k.get("job")??"",i=a=>String(a??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]??t);function I(a){return a==null?"—":`$${new Intl.NumberFormat("ru-RU").format(a)}`}const M=a=>a==null?"—":new Intl.NumberFormat("ru-RU").format(a);function S(a){const t=new Date(String(a??""));return Number.isNaN(t.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(t)}function _(a,t){if(a==null||t==null)return"";const c=Number(a)-Number(t);if(!c)return"";const e=c>0?"+":"−";return`<em class="${c>0?"up":"down"}">${e}${new Intl.NumberFormat("ru-RU").format(Math.abs(c))}</em>`}function R(a){const t=a.map(r=>r.wardog_level??0);if(t.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const c=Math.max(...t,1),e=Math.min(...t),o=Math.max(c-e,1),n=640,p=160,g=n/(t.length-1),f=r=>16+(1-(r-e)/o)*(p-36),w=t.map((r,x)=>`${x===0?"M":"L"}${x*g},${f(r)}`).join(" "),u=`${w} L${n},${p} L0,${p} Z`,b=t.at(-1)??0;return`<svg class="dossier-chart" viewBox="0 0 ${n} ${p}" role="img" aria-label="Уровень по снимкам">
      <defs><linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4b04a" stop-opacity="0.45"/><stop offset="1" stop-color="#e4b04a" stop-opacity="0"/></linearGradient></defs>
      <path d="${u}" fill="url(#lvl)"></path>
      <path d="${w}" fill="none" stroke="#e4b04a" stroke-width="2.5"></path>
      <circle cx="${n}" cy="${f(b)}" r="4" fill="#e4b04a"></circle>
    </svg>
    <p class="dossier-axis"><span>${i(S(a[0]?.created_at))}</span><span>${i(S(a.at(-1)?.created_at))} · ${M(b)} ур.</span></p>`}async function U(){v.innerHTML="<p>Обновляем статистику через API. Не закрывай вкладку.</p>";for(let a=0;a<45;a++){const t=await fetch(`/api/auth/status?job=${encodeURIComponent(q)}`).then(o=>o.json()).catch(()=>null);if(!t||t.status==="pending"){await new Promise(o=>setTimeout(o,2e3));continue}const c=t.next||(d?`/p/?id=${d}`:"/ratings"),e=new URL(c,location.origin);t.status==="ok"?(t.flag?e.searchParams.set("sync",t.flag):e.searchParams.delete("sync"),!e.searchParams.get("id")&&t.steamId&&e.searchParams.set("id",t.steamId)):e.searchParams.set("sync",t.sync||"expired"),e.searchParams.delete("job"),location.replace(e.pathname+e.search);return}location.replace(d?`/p/?id=${d}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(l==="wait")await U();else if(/^\d{17}$/.test(d)){const[a,t,c]=await Promise.all([fetch(`/api/players/${d}`).then(async e=>e.ok?e.json():null),fetch("/api/me").then(e=>e.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async e=>e.ok?e.json():null).catch(()=>null)]);if(!a)v.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const e=a.user,o=a.history,n=o.at(-1),p=o.length>1?o.at(-2):void 0,g=t.user?.steam_id===d,f=!o.length,u=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([s,m,$])=>({key:s,name:m,icon:$,level:Number(n?.[s]??0)||0})),b=Math.max(...u.map(s=>s.level),1),r=u.reduce((s,m)=>m.level>s.level?m:s,u[0]),L=(c?.players??[]).findIndex(s=>String(s.steam_id)===d),T=!!e.hide_leaderboard||!e.cis_opt_in,N=L>=0?`место #${L+1}`:T?"скрыт из топа":"вне топ-200",y=a.squad,j=l==="game_running"?"WARDOGS была открыта — цифры не пришли. Закрой игру и нажми «Обновить через Steam».":l==="empty"||f?"Цифр ещё нет. Закрой WARDOGS и нажми «Обновить через Steam».":l==="token_timeout"||l==="token_err"||l&&l.startsWith("token_")?"Tracker не ответил. Закрой игру и нажми «Обновить через Steam» ещё раз.":l==="access_denied"?"Вход отменён.":l==="expired"?"Сессия входа истекла. Войди через Steam и обнови статистику.":l?`Не вышло (${l}). Закрой игру и нажми «Обновить через Steam».`:"";v.innerHTML=`
        <article class="dossier">
          <header class="dossier-hero">
            <img class="dossier-avatar" alt="" src="${i(e.avatar??"")}" />
            <div>
              <p class="eyebrow">Досье · сезон 02</p>
              <h1>${i(e.persona??e.steam_id)}</h1>
              <div class="dossier-tags">
                <span class="pill">${i(N)}</span>
                ${r.level?`<span class="pill now">${i(r.name)} ${r.level}</span>`:""}
                ${y?`<a class="pill" href="/squad/?id=${y.id}">[${i(y.tag)}] ${i(y.name)}</a>`:'<span class="pill old">без сквада</span>'}
                ${e.country?`<span class="pill">${i(e.country)}</span>`:""}
                ${e.discord_name?`<span class="pill">Discord ${i(e.discord_name)}</span>`:""}
              </div>
            </div>
            <div class="dossier-level">
              <img src="/art/t_ui_icon_careerlevel_600.webp" alt="" />
              <b>${n?.wardog_level??"—"}</b>
              <span>уровень ${_(n?.wardog_level,p?.wardog_level)}</span>
            </div>
          </header>
          ${j?`<p class="note dossier-alert" id="sync-note">${i(j)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${_(n?.xp,p?.xp)}</span><b>${M(n?.xp)}</b></div>
            <div><span>Деньги ${_(n?.cash,p?.cash)}</span><b>${I(n?.cash)}</b></div>
            <div><span>Золото ${_(n?.gold,p?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${n?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${n?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${I(n?.account_value)}</b></div>
            <div><span>Снимков</span><b>${o.length}</b></div>
          </section>
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${r.level?i(r.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${u.map(s=>`
                  <div class="lane${s.name===r.name&&s.level?" lead":""}">
                    <img src="${s.icon}" alt="" />
                    <span>${s.name}</span>
                    <i><b style="width:${Math.round(s.level/b*100)}%"></b></i>
                    <strong>${s.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${o.length>1?_(n?.wardog_level,o[0]?.wardog_level)?`${_(n?.wardog_level,o[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${R(o)}
              <p class="note">Последний снимок: ${i(S(n?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${d}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${g?`<div class="dossier-own">
            <a class="btn small" href="/auth/wardogs/start?next=/p&steamId=${d}">Обновить через Steam</a>
            <label class="check"><input id="show-top" type="checkbox" ${e.cis_opt_in&&!e.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${t.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Игра должна быть закрыта. Кнопка открывает Steam и снимает цифры.</p>
          </div>`:""}
        </article>
      `;const P=async()=>{const s=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:s})})};document.querySelector("#show-top")?.addEventListener("change",P),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const s=document.querySelector("#copy-profile");if(!s)return;const m=location.href;let $=!1;try{await navigator.clipboard.writeText(m),$=!0}catch{const h=document.createElement("textarea");h.value=m,h.setAttribute("readonly",""),h.style.position="fixed",h.style.left="-9999px",document.body.append(h),h.select();try{$=document.execCommand("copy")}catch{$=!1}h.remove()}s.textContent=$?"Ссылка скопирована":"Не скопировалось"})}}else try{const t=(await fetch("/api/me").then(c=>c.json()))?.user?.steam_id;/^\d{17}$/.test(t||"")?location.replace(`/p/?id=${t}`):v.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{v.innerHTML="<h1>Такой страницы нет</h1>"}
