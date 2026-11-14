const S=document.querySelector("#profile"),I=new URLSearchParams(location.search),l=I.get("id")??"",h=I.get("sync")??"",F=I.get("job")??"",n=a=>String(a??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s]??s);function P(a){return a==null?"—":`$${new Intl.NumberFormat("ru-RU").format(a)}`}const k=a=>a==null?"—":new Intl.NumberFormat("ru-RU").format(a);function G(a){if(a==null||a==="")return"—";const s=Number(a);return Number.isFinite(s)?s.toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2}):"—"}function T(a){const s=new Date(String(a??""));return Number.isNaN(s.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(s)}function g(a,s){if(a==null||s==null)return"";const o=Number(a)-Number(s);if(!o)return"";const t=o>0?"+":"−";return`<em class="${o>0?"up":"down"}">${t}${new Intl.NumberFormat("ru-RU").format(Math.abs(o))}</em>`}function H(a,s="#e4b04a"){const o=a.map(f=>f.wardog_level??0);if(o.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const t=Math.max(...o,1),c=Math.min(...o),i=Math.max(t-c,1),m=640,b=160,j=m/(o.length-1),L=f=>16+(1-(f-c)/i)*(b-36),$=o.map((f,y)=>`${y===0?"M":"L"}${y*j},${L(f)}`).join(" "),q=`${$} L${m},${b} L0,${b} Z`,u=o.at(-1)??0;return`<svg class="dossier-chart" viewBox="0 0 ${m} ${b}" role="img" aria-label="Уровень по снимкам">
      <defs><linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s}" stop-opacity="0.45"/><stop offset="1" stop-color="${s}" stop-opacity="0"/></linearGradient></defs>
      <path d="${q}" fill="url(#lvl)"></path>
      <path d="${$}" fill="none" stroke="${s}" stroke-width="2.5"></path>
      <circle cx="${m}" cy="${L(u)}" r="4" fill="${s}"></circle>
    </svg>
    <p class="dossier-axis"><span>${n(T(a[0]?.created_at))}</span><span>${n(T(a.at(-1)?.created_at))} · ${k(u)} ур.</span></p>`}async function E(){S.innerHTML="<p>Steam забирает карьеру из игры. WARDOGS должен быть закрыт. Не закрывай вкладку.</p>";for(let a=0;a<45;a++){const s=await fetch(`/api/auth/status?job=${encodeURIComponent(F)}`).then(c=>c.json()).catch(()=>null);if(!s||s.status==="pending"){await new Promise(c=>setTimeout(c,2e3));continue}const o=s.next||(l?`/p/?id=${l}`:"/ratings"),t=new URL(o,location.origin);s.status==="ok"?(s.flag?t.searchParams.set("sync",s.flag):t.searchParams.delete("sync"),!t.searchParams.get("id")&&s.steamId&&t.searchParams.set("id",s.steamId)):t.searchParams.set("sync",s.sync||"expired"),t.searchParams.delete("job"),location.replace(t.pathname+t.search);return}location.replace(l?`/p/?id=${l}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(h==="wait")await E();else if(/^\d{17}$/.test(l)){const[a,s,o]=await Promise.all([fetch(`/api/players/${l}`).then(async t=>t.ok?t.json():null),fetch("/api/me").then(t=>t.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async t=>t.ok?t.json():null).catch(()=>null)]);if(!a)S.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const t=a.user,c=a.history,i=c.at(-1),m=c.length>1?c.at(-2):void 0,b=s.user?.steam_id===l,j=!c.length,$=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([e,r,p])=>({key:e,name:r,icon:p,level:Number(i?.[e]??0)||0})),q=Math.max(...$.map(e=>e.level),1),u=$.reduce((e,r)=>r.level>e.level?r:e,$[0]),y=(o?.players??[]).findIndex(e=>String(e.steam_id)===l),C=!!t.hide_leaderboard||!t.cis_opt_in,A=y>=0?`место #${y+1}`:C?"скрыт из топа":"вне топ-200",v=a.squad,D=(e=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(e??""))?String(e):"")(v?.logo),x=["orange","gold","blue","red","green"].find(e=>e===t.accent)??"",U={orange:"#ff4d1c",gold:"#e4b04a",blue:"#6ea2ff",red:"#ff5a4a",green:"#3dba7a"},N=String(t.motto??"").trim(),_=a.combat,M=h==="same"?"Цифры те же, что уже были. Свежее игра отдаст, если закрыть WARDOGS и снять ещё раз.":h==="game_running"?"Игра была запущена. Полностью закрой WARDOGS и нажми «Снять из игры».":h==="stale"?"Игра не отдала свежий снимок. Записали последние известные цифры. Закрой клиент и сними ещё раз.":h==="access_denied"?"Steam отменён. Нажми «Снять из игры» и подтверди вход.":j&&!_?"Цифр ещё нет. Закрой WARDOGS и нажми «Снять из игры» — откроется Steam, мы запишем карьеру.":h==="expired"?"Код входа истёк. Нажми «Снять из игры» ещё раз.":h&&h!=="ok"?"Не вышло снять карьеру. Закрой игру и нажми ещё раз.":"";S.innerHTML=`
        <article class="dossier"${x?` data-accent="${x}"`:""}>
          <header class="dossier-hero">
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${n(t.avatar??"")}" />
                ${D?`<img class="dossier-clan" alt="" src="${n(D)}" />`:""}
              </div>
              <div>
                <p class="eyebrow">Досье · сезон ${n(String(o?.season||"03"))}</p>
                <h1>${n(t.persona??t.steam_id)}</h1>
                ${N?`<p class="dossier-line">${n(N)}</p>`:""}
                <div class="dossier-tags">
                  <span class="pill">${n(A)}</span>
                  ${u.level?`<span class="pill now">${n(u.name)} ${u.level}</span>`:""}
                  ${v?`<a class="pill" href="/squad/?id=${v.id}">[${n(v.tag)}] ${n(v.name)}</a>`:'<span class="pill old">без сквада</span>'}
                  ${t.country?`<span class="pill">${n(t.country)}</span>`:""}
                  ${t.discord_name?`<span class="pill">Discord ${n(t.discord_name)}</span>`:""}
                </div>
              </div>
              <div class="dossier-level">
                <img src="/art/t_ui_icon_careerlevel_600.webp" alt="" />
                <b>${i?.wardog_level??"—"}</b>
                <span>уровень ${g(i?.wardog_level,m?.wardog_level)}</span>
              </div>
            </div>
          </header>
          ${M?`<p class="note dossier-alert" id="sync-note">${n(M)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${g(i?.xp,m?.xp)}</span><b>${k(i?.xp)}</b></div>
            <div><span>Деньги ${g(i?.cash,m?.cash)}</span><b>${P(i?.cash)}</b></div>
            <div><span>Золото ${g(i?.gold,m?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${i?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${i?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${P(i?.account_value)}</b></div>
            <div><span>Снимков</span><b>${c.length}</b></div>
          </section>
          <section class="dossier-meters server">
            <div><span>Убийства</span><b>${k(_?.kills)}</b></div>
            <div><span>Смерти</span><b>${k(_?.deaths)}</b></div>
            <div><span>К/Д</span><b>${G(_?.kd)}</b></div>
            <div><span>Фракция</span><b>${n(String(_?.faction??"").trim())||"—"}</b></div>
          </section>
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${u.level?n(u.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${$.map(e=>`
                  <div class="lane${e.name===u.name&&e.level?" lead":""}">
                    <img src="${e.icon}" alt="" />
                    <span>${e.name}</span>
                    <i><b style="width:${Math.round(e.level/q*100)}%"></b></i>
                    <strong>${e.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${c.length>1?g(i?.wardog_level,c[0]?.wardog_level)?`${g(i?.wardog_level,c[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${H(c,U[x]??"#e4b04a")}
              <p class="note">Последний снимок: ${n(T(i?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${l}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${b?`<form class="dossier-tune" id="tune">
            <label>Строка под ником
              <input id="motto" maxlength="80" value="${n(N)}" placeholder="Коротко о себе, до 80 знаков" />
            </label>
            <div class="swatches" role="radiogroup" aria-label="Цвет досье">
              ${[["","Как есть"],["orange","Огонь"],["gold","Золото"],["blue","Синий"],["red","Красный"],["green","Зелёный"]].map(([e,r])=>`
                <label class="swatch">
                  <input type="radio" name="accent" value="${e}" ${x===e?"checked":""} />
                  <i class="dot ${e||"plain"}"></i>
                  <span>${r}</span>
                </label>`).join("")}
            </div>
            <button class="btn small" type="submit">Сохранить вид</button>
            <p class="note" id="tune-note">Строку и цвет видят все, кто откроет это досье. Баннер сквада здесь не показывается.</p>
          </form>
          <div class="dossier-own">
            <a class="btn small" href="/auth/wardogs/start?next=/p&steamId=${n(l)}">Снять из игры</a>
            <button class="btn ghost small" id="resync" type="button">Из открытой базы</button>
            <label class="check"><input id="show-top" type="checkbox" ${t.cis_opt_in&&!t.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${s.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Закрой WARDOGS, нажми «Снять из игры», подтверди Steam — мы только запишем цифры. Вход на сайт в шапке отдельно.</p>
          </div>`:""}
        </article>
      `;const O=async()=>{const e=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:e})})};document.querySelector("#show-top")?.addEventListener("change",O),document.querySelector("#tune")?.addEventListener("submit",async e=>{e.preventDefault();const r=document.querySelector("#tune-note"),p=document.querySelector("#motto"),d=document.querySelector('input[name="accent"]:checked'),w=await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({motto:p?.value??"",accent:d?.value??""})});if(w.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}if(!w.ok){r.textContent="Не сохранилось. Выбери цвет из списка и укороти строку.";return}location.reload()}),document.querySelector("#resync")?.addEventListener("click",async()=>{const e=document.querySelector("#sync-note"),r=document.querySelector("#resync");r.disabled=!0,e.classList.add("dossier-alert"),e.textContent="Обновляю статистику…";try{const p=await fetch(`https://wardogstracker.gg/api/v1/players/${l}`,{signal:AbortSignal.timeout(8e3)}),d=p.ok?await p.json().catch(()=>null):null,w=await fetch("/api/me/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(d&&d.player?{player:d.player}:{}),signal:AbortSignal.timeout(8e3)});if(w.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${l}`)}`;return}const R=await w.json().catch(()=>({}));if(R.saved){location.href=R.unchanged?`/p/?id=${l}&sync=same`:`/p/?id=${l}`;return}e.textContent=R.reason==="tracker_down"?"База карьеры не ответила. Нажми ещё раз.":"В открытой базе этого игрока ещё нет."}catch{e.textContent="Слишком долго. Нажми ещё раз — запрос оборвался."}r.disabled=!1}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const e=document.querySelector("#copy-profile");if(!e)return;const r=location.href;let p=!1;try{await navigator.clipboard.writeText(r),p=!0}catch{const d=document.createElement("textarea");d.value=r,d.setAttribute("readonly",""),d.style.position="fixed",d.style.left="-9999px",document.body.append(d),d.select();try{p=document.execCommand("copy")}catch{p=!1}d.remove()}e.textContent=p?"Ссылка скопирована":"Не скопировалось"})}}else try{const s=(await fetch("/api/me").then(o=>o.json()))?.user?.steam_id;/^\d{17}$/.test(s||"")?location.replace(`/p/?id=${s}`):S.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{S.innerHTML="<h1>Такой страницы нет</h1>"}
