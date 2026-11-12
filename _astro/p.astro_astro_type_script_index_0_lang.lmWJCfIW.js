const w=document.querySelector("#profile"),I=new URLSearchParams(location.search),r=I.get("id")??"",h=I.get("sync")??"",U=I.get("job")??"",o=s=>String(s??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a]??a);function M(s){return s==null?"—":`$${new Intl.NumberFormat("ru-RU").format(s)}`}const P=s=>s==null?"—":new Intl.NumberFormat("ru-RU").format(s);function R(s){const a=new Date(String(s??""));return Number.isNaN(a.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(a)}function b(s,a){if(s==null||a==null)return"";const n=Number(s)-Number(a);if(!n)return"";const t=n>0?"+":"−";return`<em class="${n>0?"up":"down"}">${t}${new Intl.NumberFormat("ru-RU").format(Math.abs(n))}</em>`}function G(s,a="#e4b04a"){const n=s.map(y=>y.wardog_level??0);if(n.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const t=Math.max(...n,1),c=Math.min(...n),i=Math.max(t-c,1),u=640,f=160,x=u/(n.length-1),k=y=>16+(1-(y-c)/i)*(f-36),$=n.map((y,g)=>`${g===0?"M":"L"}${g*x},${k(y)}`).join(" "),j=`${$} L${u},${f} L0,${f} Z`,m=n.at(-1)??0;return`<svg class="dossier-chart" viewBox="0 0 ${u} ${f}" role="img" aria-label="Уровень по снимкам">
      <defs><linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}" stop-opacity="0.45"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></linearGradient></defs>
      <path d="${j}" fill="url(#lvl)"></path>
      <path d="${$}" fill="none" stroke="${a}" stroke-width="2.5"></path>
      <circle cx="${u}" cy="${k(m)}" r="4" fill="${a}"></circle>
    </svg>
    <p class="dossier-axis"><span>${o(R(s[0]?.created_at))}</span><span>${o(R(s.at(-1)?.created_at))} · ${P(m)} ур.</span></p>`}async function H(){w.innerHTML="<p>Steam забирает карьеру из игры. WARDOGS должен быть закрыт. Не закрывай вкладку.</p>";for(let s=0;s<45;s++){const a=await fetch(`/api/auth/status?job=${encodeURIComponent(U)}`).then(c=>c.json()).catch(()=>null);if(!a||a.status==="pending"){await new Promise(c=>setTimeout(c,2e3));continue}const n=a.next||(r?`/p/?id=${r}`:"/ratings"),t=new URL(n,location.origin);a.status==="ok"?(a.flag?t.searchParams.set("sync",a.flag):t.searchParams.delete("sync"),!t.searchParams.get("id")&&a.steamId&&t.searchParams.set("id",a.steamId)):t.searchParams.set("sync",a.sync||"expired"),t.searchParams.delete("job"),location.replace(t.pathname+t.search);return}location.replace(r?`/p/?id=${r}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(h==="wait")await H();else if(/^\d{17}$/.test(r)){const[s,a,n]=await Promise.all([fetch(`/api/players/${r}`).then(async t=>t.ok?t.json():null),fetch("/api/me").then(t=>t.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async t=>t.ok?t.json():null).catch(()=>null)]);if(!s)w.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const t=s.user,c=s.history,i=c.at(-1),u=c.length>1?c.at(-2):void 0,f=a.user?.steam_id===r,x=!c.length,$=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([e,l,p])=>({key:e,name:l,icon:p,level:Number(i?.[e]??0)||0})),j=Math.max(...$.map(e=>e.level),1),m=$.reduce((e,l)=>l.level>e.level?l:e,$[0]),g=(n?.players??[]).findIndex(e=>String(e.steam_id)===r),C=!!t.hide_leaderboard||!t.cis_opt_in,A=g>=0?`место #${g+1}`:C?"скрыт из топа":"вне топ-200",v=s.squad,N=(e=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(e??""))?String(e):"")(v?.logo),S=["orange","gold","blue","red","green"].find(e=>e===t.accent)??"",D={orange:"#ff4d1c",gold:"#e4b04a",blue:"#6ea2ff",red:"#ff5a4a",green:"#3dba7a"},q=String(t.motto??"").trim(),T=h==="same"?"Цифры те же, что уже были. Свежее игра отдаст, если закрыть WARDOGS и снять ещё раз.":h==="game_running"?"Игра была запущена. Полностью закрой WARDOGS и нажми «Снять из игры».":h==="stale"?"Игра не отдала свежий снимок. Записали последние известные цифры. Закрой клиент и сними ещё раз.":h==="access_denied"?"Steam отменён. Нажми «Снять из игры» и подтверди вход.":x?"Цифр ещё нет. Закрой WARDOGS и нажми «Снять из игры» — откроется Steam, мы запишем карьеру.":h==="expired"?"Код входа истёк. Нажми «Снять из игры» ещё раз.":h&&h!=="ok"?"Не вышло снять карьеру. Закрой игру и нажми ещё раз.":"";w.innerHTML=`
        <article class="dossier"${S?` data-accent="${S}"`:""}>
          <header class="dossier-hero">
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${o(t.avatar??"")}" />
                ${N?`<img class="dossier-clan" alt="" src="${o(N)}" />`:""}
              </div>
              <div>
                <p class="eyebrow">Досье · сезон ${o(String(n?.season||"03"))}</p>
                <h1>${o(t.persona??t.steam_id)}</h1>
                ${q?`<p class="dossier-line">${o(q)}</p>`:""}
                <div class="dossier-tags">
                  <span class="pill">${o(A)}</span>
                  ${m.level?`<span class="pill now">${o(m.name)} ${m.level}</span>`:""}
                  ${v?`<a class="pill" href="/squad/?id=${v.id}">[${o(v.tag)}] ${o(v.name)}</a>`:'<span class="pill old">без сквада</span>'}
                  ${t.country?`<span class="pill">${o(t.country)}</span>`:""}
                  ${t.discord_name?`<span class="pill">Discord ${o(t.discord_name)}</span>`:""}
                </div>
              </div>
              <div class="dossier-level">
                <img src="/art/t_ui_icon_careerlevel_600.webp" alt="" />
                <b>${i?.wardog_level??"—"}</b>
                <span>уровень ${b(i?.wardog_level,u?.wardog_level)}</span>
              </div>
            </div>
          </header>
          ${T?`<p class="note dossier-alert" id="sync-note">${o(T)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${b(i?.xp,u?.xp)}</span><b>${P(i?.xp)}</b></div>
            <div><span>Деньги ${b(i?.cash,u?.cash)}</span><b>${M(i?.cash)}</b></div>
            <div><span>Золото ${b(i?.gold,u?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${i?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${i?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${M(i?.account_value)}</b></div>
            <div><span>Снимков</span><b>${c.length}</b></div>
          </section>
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${m.level?o(m.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${$.map(e=>`
                  <div class="lane${e.name===m.name&&e.level?" lead":""}">
                    <img src="${e.icon}" alt="" />
                    <span>${e.name}</span>
                    <i><b style="width:${Math.round(e.level/j*100)}%"></b></i>
                    <strong>${e.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${c.length>1?b(i?.wardog_level,c[0]?.wardog_level)?`${b(i?.wardog_level,c[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${G(c,D[S]??"#e4b04a")}
              <p class="note">Последний снимок: ${o(R(i?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${r}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${f?`<form class="dossier-tune" id="tune">
            <label>Строка под ником
              <input id="motto" maxlength="80" value="${o(q)}" placeholder="Коротко о себе, до 80 знаков" />
            </label>
            <div class="swatches" role="radiogroup" aria-label="Цвет досье">
              ${[["","Как есть"],["orange","Огонь"],["gold","Золото"],["blue","Синий"],["red","Красный"],["green","Зелёный"]].map(([e,l])=>`
                <label class="swatch">
                  <input type="radio" name="accent" value="${e}" ${S===e?"checked":""} />
                  <i class="dot ${e||"plain"}"></i>
                  <span>${l}</span>
                </label>`).join("")}
            </div>
            <button class="btn small" type="submit">Сохранить вид</button>
            <p class="note" id="tune-note">Строку и цвет видят все, кто откроет это досье. Баннер сквада здесь не показывается.</p>
          </form>
          <div class="dossier-own">
            <a class="btn small" href="/auth/wardogs/start?next=/p&steamId=${o(r)}">Снять из игры</a>
            <button class="btn ghost small" id="resync" type="button">Из открытой базы</button>
            <label class="check"><input id="show-top" type="checkbox" ${t.cis_opt_in&&!t.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${a.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Закрой WARDOGS, нажми «Снять из игры», подтверди Steam — мы только запишем цифры. Вход на сайт в шапке отдельно.</p>
          </div>`:""}
        </article>
      `;const O=async()=>{const e=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:e})})};document.querySelector("#show-top")?.addEventListener("change",O),document.querySelector("#tune")?.addEventListener("submit",async e=>{e.preventDefault();const l=document.querySelector("#tune-note"),p=document.querySelector("#motto"),d=document.querySelector('input[name="accent"]:checked'),_=await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({motto:p?.value??"",accent:d?.value??""})});if(_.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}if(!_.ok){l.textContent="Не сохранилось. Выбери цвет из списка и укороти строку.";return}location.reload()}),document.querySelector("#resync")?.addEventListener("click",async()=>{const e=document.querySelector("#sync-note"),l=document.querySelector("#resync");l.disabled=!0,e.classList.add("dossier-alert"),e.textContent="Обновляю статистику…";try{const p=await fetch(`https://wardogstracker.gg/api/v1/players/${r}`,{signal:AbortSignal.timeout(8e3)}),d=p.ok?await p.json().catch(()=>null):null,_=await fetch("/api/me/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(d&&d.player?{player:d.player}:{}),signal:AbortSignal.timeout(8e3)});if(_.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${r}`)}`;return}const L=await _.json().catch(()=>({}));if(L.saved){location.href=L.unchanged?`/p/?id=${r}&sync=same`:`/p/?id=${r}`;return}e.textContent=L.reason==="tracker_down"?"База карьеры не ответила. Нажми ещё раз.":"В открытой базе этого игрока ещё нет."}catch{e.textContent="Слишком долго. Нажми ещё раз — запрос оборвался."}l.disabled=!1}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const e=document.querySelector("#copy-profile");if(!e)return;const l=location.href;let p=!1;try{await navigator.clipboard.writeText(l),p=!0}catch{const d=document.createElement("textarea");d.value=l,d.setAttribute("readonly",""),d.style.position="fixed",d.style.left="-9999px",document.body.append(d),d.select();try{p=document.execCommand("copy")}catch{p=!1}d.remove()}e.textContent=p?"Ссылка скопирована":"Не скопировалось"})}}else try{const a=(await fetch("/api/me").then(n=>n.json()))?.user?.steam_id;/^\d{17}$/.test(a||"")?location.replace(`/p/?id=${a}`):w.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{w.innerHTML="<h1>Такой страницы нет</h1>"}
