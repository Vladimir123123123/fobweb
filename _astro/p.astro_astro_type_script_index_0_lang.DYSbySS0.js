const C=document.querySelector("#profile"),ut=JSON.parse(C.getAttribute("data-guns")||"{}"),P=new URLSearchParams(location.search),$=P.get("id")??"",N=P.get("sync")??"",mt=P.get("job")??"",et=P.get("reward")??"",i=a=>String(a??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n]??n);function st(a){return a==null?"—":`$${new Intl.NumberFormat("ru-RU").format(a)}`}const c=a=>a==null?"—":new Intl.NumberFormat("ru-RU").format(a);function ht(a){if(a==null||a==="")return"—";const n=Number(a);return Number.isFinite(n)?n.toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2}):"—"}function k(a){const n=new Date(String(a??""));return Number.isNaN(n.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(n)}function J(a){const n=new Date(String(a??""));return Number.isNaN(n.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(n)}function j(a,n){if(a==null||n==null)return"";const l=Number(a)-Number(n);if(!l)return"";const s=l>0?"+":"−";return`<em class="${l>0?"up":"down"}">${s}${new Intl.NumberFormat("ru-RU").format(Math.abs(l))}</em>`}function $t(a,n="#e4b04a"){const l=a.map(d=>d.wardog_level??0);if(l.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const s=Math.max(...l,1),p=Math.min(...l),u=Math.max(s-p,1),w=640,g=180,T=w/(l.length-1),W=d=>18+(1-(d-p)/u)*(g-44),h=l.map((d,f)=>[f*T,W(d)]);let A=`M${h[0][0]},${h[0][1]}`;for(let d=0;d<h.length-1;d++){const f=h[d-1]??h[d],F=h[d],v=h[d+1],q=h[d+2]??v,L=F[0]+(v[0]-f[0])/6,I=v[0]-(q[0]-F[0])/6,R=Math.min(Math.max(F[1]+(v[1]-f[1])/6,0),g),o=Math.min(Math.max(v[1]-(q[1]-F[1])/6,0),g);A+=` C${L.toFixed(1)},${R.toFixed(1)} ${I.toFixed(1)},${o.toFixed(1)} ${v[0].toFixed(1)},${v[1].toFixed(1)}`}const S=`${A} L${w},${g} L0,${g} Z`,Z=l.at(-1)??0,M=`lvl${Math.random().toString(36).slice(2,7)}`,D=[.25,.5,.75].map(d=>`<line class="grid-line" x1="0" x2="${w}" y1="${(g*d).toFixed(0)}" y2="${(g*d).toFixed(0)}"></line>`).join("");return`<svg class="dossier-chart" viewBox="0 0 ${w} ${g}" preserveAspectRatio="none" role="img" aria-label="Уровень по снимкам">
      <defs>
        <linearGradient id="${M}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb703" stop-opacity="0.55"/><stop offset="1" stop-color="#ffb703" stop-opacity="0"/></linearGradient>
        <filter id="${M}g" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      ${D}
      <path d="${S}" fill="url(#${M})"></path>
      <path d="${A}" fill="none" stroke="#ffb703" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" filter="url(#${M}g)"></path>
    </svg>
    <p class="dossier-axis"><span>${i(J(a[0]?.created_at))}</span><span>${i(J(a.at(-1)?.created_at))} · ${c(Z)} ур.</span></p>`}async function bt(){C.innerHTML="<p>Steam забирает карьеру из игры. WARDOGS должен быть закрыт. Не закрывай вкладку.</p>";for(let a=0;a<45;a++){const n=await fetch(`/api/auth/status?job=${encodeURIComponent(mt)}`).then(p=>p.json()).catch(()=>null);if(!n||n.status==="pending"){await new Promise(p=>setTimeout(p,2e3));continue}const l=n.next||($?`/p/?id=${$}`:"/ratings"),s=new URL(l,location.origin);n.status==="ok"?(n.flag?s.searchParams.set("sync",n.flag):s.searchParams.delete("sync"),n.coins>0?s.searchParams.set("reward",String(n.coins)):n.already&&s.searchParams.set("reward","done"),!s.searchParams.get("id")&&n.steamId&&s.searchParams.set("id",n.steamId)):s.searchParams.set("sync",n.sync||"expired"),s.searchParams.delete("job"),location.replace(s.pathname+s.search);return}location.replace($?`/p/?id=${$}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(N==="wait")await bt();else if(/^\d{17}$/.test($)){const[a,n,l]=await Promise.all([fetch(`/api/players/${$}`).then(async s=>s.ok?s.json():null),fetch("/api/me").then(s=>s.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async s=>s.ok?s.json():null).catch(()=>null)]);if(!a)C.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const s=a.user,p=a.history,u=p.at(-1),w=p.length>1?p.at(-2):void 0,g=n.user?.steam_id===$,T=!p.length,h=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([t,e,r])=>({key:t,name:e,icon:r,level:Number(u?.[t]??0)||0})),A=Math.max(...h.map(t=>t.level),1),S=h.reduce((t,e)=>e.level>t.level?e:t,h[0]),M=(l?.players??[]).findIndex(t=>String(t.steam_id)===$),D=!!s.hide_leaderboard||!s.cis_opt_in,d=M>=0?`место #${M+1}`:D?"скрыт из топа":"вне топ-200",f=a.squad,v=(t=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(t??""))?String(t):"")(f?.logo),L=["orange","gold","blue","red","green"].find(t=>t===s.accent)??"",I={orange:"#ff4d1c",gold:"#e4b04a",blue:"#6ea2ff",red:"#ff5a4a",green:"#3dba7a"},R=String(s.motto??"").trim(),o=a.combat,at=t=>t==="win"?"Выиграно":t==="loss"?"Потеряно":t==="leave"?"Досрочный выход":"—",nt=t=>t==="win"?"win":t==="loss"?"loss":"",_=(o?.history??[]).filter(t=>String(t.map||"").trim()||String(t.result||"").trim()),U=_.length<40?_.length:o?.matches??_.length,K=a.punishments??[],ot=t=>t.untilAt?`до ${k(t.untilAt)}`:t.active?"до снятия":t.liftedAt?`снято ${k(t.liftedAt)}`:"—",O={lone:"/brand/operators/lone.webp",valk:"/brand/operators/valk.webp",mant:"/brand/operators/mant.webp"}[String(o?.side||"")]??"",Q=t=>{const e=t.toLowerCase();return e.includes("valk")?"valk":e.includes("mant")?"mant":e.includes("lone")?"lone":""},it=t=>{const e=t.toLowerCase();return e.includes("valk")?"/brand/factions/vk.png":e.includes("mant")?"/brand/factions/mc.png":e.includes("lone")||e.includes("star")?"/brand/factions/ls.png":""},rt=t=>{const e=t.trim(),r=e.toLowerCase();return!e||r==="white"||r==="unknown"?"":e},ct=t=>{const e=t.toLowerCase();return e.includes("ozet")||e.includes("madrid")||e.includes("europe")?{file:"ozeti",title:"Ozeti"}:e.includes("sabat")||e.includes("moscow")||e.includes("russia")?{file:"sabatulo",title:"Sabatulo"}:e.includes("bakur")||e.includes("kavkaz")?{file:"bakurani",title:"Bakurani"}:e.includes("zesta")||e.includes("america")||e.includes("detroit")?{file:"zestafona",title:"Zestafona"}:null},G=t=>{const e=t.trim().toLowerCase();return!e||e==="default"||e==="неизвестно"?"":ut[e]||""},H=(t,e,r="")=>`<span class="piece${r?` ${r}`:""}">${t?`<img src="${t}" alt="" />`:""}<span>${i(e)}</span></span>`,z=(t,e="")=>t==null?"—":`${c(t)}${e}`,V=t=>t?.name?`${i(t.name)} · ${c(t.count)}×`:"—",B=o?.weapons??[],lt=Math.max(...B.map(t=>Number(t.kills)||0),1),X=o?.since||o?.last?`Играет здесь с ${i(k(o?.since)||"—")} · последний раз ${i(k(o?.last)||"—")}`:"",Y=Number(et),tt=[Y>0?`За обновление статистики начислено ${Y} очков. Следующие — завтра.`:et==="done"?"Сегодняшние 10 очков за обновление статистики уже начислены.":"",N==="same"?"Цифры те же, что уже были. Свежее игра отдаст, если закрыть WARDOGS и снять ещё раз.":N==="game_running"?"Игра была запущена. Полностью закрой WARDOGS и нажми «Снять из игры».":N==="stale"?"Игра не отдала свежий снимок. Записали последние известные цифры. Закрой клиент и сними ещё раз.":N==="access_denied"?"Steam отменён. Нажми «Снять из игры» и подтверди вход.":T&&!o?"Цифр ещё нет. Закрой WARDOGS и нажми «Снять из игры» — откроется Steam, мы запишем карьеру.":N==="expired"?"Код входа истёк. Нажми «Снять из игры» ещё раз.":N&&N!=="ok"?"Не вышло снять карьеру. Закрой игру и нажми ещё раз.":""].filter(Boolean).join(" ");C.innerHTML=`
        <article class="dossier"${L?` data-accent="${L}"`:""}>
          <header class="dossier-hero${O?" has-op":""}">
            ${s.avatar?`<img class="dossier-bg" alt="" src="${i(s.avatar)}" />`:""}
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${i(s.avatar??"")}" />
                ${v?`<img class="dossier-clan" alt="" src="${i(v)}" />`:""}
              </div>
              <div>
                <p class="eyebrow">Досье · сезон ${i(String(l?.season||"03"))}</p>
                <h1>${i(s.persona??s.steam_id)}</h1>
                ${R?`<p class="dossier-line">${i(R)}</p>`:""}
                <div class="dossier-tags">
                  <span class="pill">${i(d)}</span>
                  ${S.level?`<span class="pill now">${i(S.name)} ${S.level}</span>`:""}
                  ${f?`<a class="pill" href="/squad/?id=${f.id}">[${i(f.tag)}] ${i(f.name)}</a>`:'<span class="pill old">без сквада</span>'}
                  ${s.country?`<span class="pill">${i(s.country)}</span>`:""}
                  ${s.discord_name?`<span class="pill">Discord ${i(s.discord_name)}</span>`:""}
                </div>
              </div>
              <div class="dossier-level">
                <img src="/art/t_ui_icon_careerlevel_600.webp" alt="" />
                <b>${u?.wardog_level??"—"}</b>
                <span>уровень ${j(u?.wardog_level,w?.wardog_level)}</span>
              </div>
            </div>
            ${O?`<img class="dossier-op" alt="" src="${O}" />`:""}
          </header>
          ${tt?`<p class="note dossier-alert" id="sync-note">${i(tt)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${j(u?.xp,w?.xp)}</span><b>${c(u?.xp)}</b></div>
            <div><span>Деньги ${j(u?.cash,w?.cash)}</span><b>${st(u?.cash)}</b></div>
            <div><span>Золото ${j(u?.gold,w?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${u?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${u?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${st(u?.account_value)}</b></div>
            <div><span>Снимков</span><b>${p.length}</b></div>
          </section>
          ${o?`<section class="fight-card">
            <header>
              <p class="eyebrow">Статистика игрока</p>
              <p>Этот сервер, за всё время</p>
            </header>
            <div class="bento">
              <div class="tile tile-kd">
                <span>К/Д</span>
                <b>${ht(o.kd)}</b>
                <small>${c(o.kills)} убийств · ${c(o.deaths)} смертей</small>
                <em>Место #${c(o.place)} из ${c(o.of)}</em>
              </div>
              <div class="tile tile-win">
                <i class="tile-ring" style="--p:${Math.max(0,Math.min(100,Number(o.winrate)||0))}"></i>
                <span>Винрейт</span>
                <b>${o.winrate==null?"—":`${Number(o.winrate).toLocaleString("ru-RU",{maximumFractionDigits:1})}%`}</b>
              </div>
              <div class="tile"><span>Хедшоты</span><b>${o.headshotPct==null?"—":`${Number(o.headshotPct).toLocaleString("ru-RU",{maximumFractionDigits:1})}%`}</b><small>${o.headshots==null?"":`${c(o.headshots)} шт.`}</small></div>
              <div class="tile"><span>Лучший матч</span><b>${o.bestMatch==null?"—":c(o.bestMatch)}</b><small>убийств</small></div>
              <div class="tile"><span>Самое дальнее</span><b>${z(o.longest," м")}</b></div>
              <div class="tile"><span>Ср. дистанция</span><b>${z(o.average," м")}</b></div>
              <div class="tile"><span>Матчи</span><b>${U?c(U):"—"}</b><small>${U?`по ${o.perMatch??"—"} убийств`:""}</small></div>
              <div class="tile"><span>Основная сторона</span><b class="${Q(String(o.faction||""))}">${i(String(o.faction||"").trim())||"—"}</b></div>
              <div class="tile"><span>Убийства своих</span><b>${z(o.teamkills)}</b></div>
              <div class="tile tile-wide">
                <p><span>Заклятый враг</span><b>${V(o.enemy)}</b></p>
                <p><span>Любимая цель</span><b>${V(o.target)}</b></p>
              </div>
            </div>
            ${B.length?`<div class="fight-card-guns">
              <p class="eyebrow">Оружие</p>
              ${B.map(t=>{const e=String(t.name||"неизвестно"),r=G(e);return`<p class="gun-bar">${r?`<img src="/art/${r}" alt="" />`:'<span class="ico-gap">—</span>'}<span class="gun-body"><b>${i(e)}</b><i><u style="width:${Math.max(3,Math.round((Number(t.kills)||0)/lt*100))}%"></u></i></span><span class="gun-num"><strong>${c(t.kills)}</strong> · ${c(t.headshots)} HS</span></p>`}).join("")}
            </div>`:'<p class="note">Оружие, хедшоты и дистанция появятся со следующими убийствами, которые пришлёт сервер.</p>'}
            ${X?`<p class="note">${X}</p>`:""}
          </section>
          ${_.length?`<section class="match-log">
            <header>
              <p class="eyebrow">Матчи</p>
              <p>Этот сервер, хранить навсегда</p>
            </header>
            <div class="match-scroll">
              <table>
                <thead>
                  <tr>${_.some(t=>k(t.endedAt))?"<th>Завершено</th>":""}${_.some(t=>String(t.server||"").trim())?"<th>Сервер</th>":""}<th>Карта</th><th>Сторона</th><th>Результат</th><th>Место</th><th>У</th><th>С</th><th>К/Д</th><th>ХШ</th><th>ТК</th><th>Оружие</th></tr>
                </thead>
                <tbody>
                  ${_.map(t=>{const e=ct(String(t.map||"")),r=e?.title||String(t.map||""),m=r?H(e?`/brand/maps/${e.file}.webp`:"",`${r}${t.minutes?` · ${c(t.minutes)} мин`:""}`,"map"):"—",y=rt(String(t.faction||"")),x=y?H(it(y),y):"—",b=String(t.weapon||"").trim(),pt=b&&b.toLowerCase()!=="default"?H(G(b)?`/art/${G(b)}`:"",b,"gun"):"—";return`<tr>
                    ${k(t.endedAt)||_.some(E=>k(E.endedAt))?`<td>${i(k(t.endedAt)||"—")}</td>`:""}
                    ${String(t.server||"").trim()||_.some(E=>String(E.server||"").trim())?`<td>${i(t.server||"—")}</td>`:""}
                    <td>${m}</td>
                    <td class="${Q(y)}">${x}</td>
                    <td class="${nt(t.result)}">${at(t.result)}</td>
                    <td>${t.place?`#${c(t.place)}${t.field?` из ${c(t.field)}`:""}`:"—"}</td>
                    <td>${c(t.kills)}</td>
                    <td>${c(t.deaths)}</td>
                    <td>${t.kd==null?"—":Number(t.kd).toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td>${c(t.headshots)}</td>
                    <td>${c(t.teamkills)}</td>
                    <td>${pt}</td>
                  </tr>`}).join("")}
                </tbody>
              </table>
            </div>
          </section>`:""}`:""}
          ${K.length?`<section class="punishments">
            <header>
              <p class="eyebrow">Наказания</p>
              <p>Этот сервер</p>
            </header>
            <table>
              <thead><tr><th>Что</th><th>За что</th><th>Когда</th><th>Срок</th></tr></thead>
              <tbody>
                ${K.map(t=>`<tr>
                  <td>${t.kind==="ban"?"Бан":"Наказание"}</td>
                  <td>${i(t.reason||"не указана")}</td>
                  <td>${i(k(t.startedAt)||"—")}</td>
                  <td>${i(ot(t))}</td>
                </tr>`).join("")}
              </tbody>
            </table>
          </section>`:""}
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${S.level?i(S.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${h.map(t=>`
                  <div class="lane${t.name===S.name&&t.level?" lead":""}">
                    <img src="${t.icon}" alt="" />
                    <span>${t.name}</span>
                    <i><b style="width:${Math.round(t.level/A*100)}%"></b></i>
                    <strong>${t.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${p.length>1?j(u?.wardog_level,p[0]?.wardog_level)?`${j(u?.wardog_level,p[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${$t(p,I[L]??"#e4b04a")}
              <p class="note">Последний снимок: ${i(J(u?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${$}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${g?`<form class="dossier-tune" id="tune">
            <label>Строка под ником
              <input id="motto" maxlength="80" value="${i(R)}" placeholder="Коротко о себе, до 80 знаков" />
            </label>
            <div class="swatches" role="radiogroup" aria-label="Цвет досье">
              ${[["","Как есть"],["orange","Огонь"],["gold","Золото"],["blue","Синий"],["red","Красный"],["green","Зелёный"]].map(([t,e])=>`
                <label class="swatch">
                  <input type="radio" name="accent" value="${t}" ${L===t?"checked":""} />
                  <i class="dot ${t||"plain"}"></i>
                  <span>${e}</span>
                </label>`).join("")}
            </div>
            <button class="btn small" type="submit">Сохранить вид</button>
            <p class="note" id="tune-note">Строку и цвет видят все, кто откроет это досье. Баннер сквада здесь не показывается.</p>
          </form>
          <div class="dossier-own">
            <a class="btn small" href="/auth/wardogs/start?next=/p&steamId=${i($)}">Снять из игры</a>
            <button class="btn ghost small" id="resync" type="button">Из открытой базы</button>
            <label class="check"><input id="show-top" type="checkbox" ${s.cis_opt_in&&!s.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${n.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Закрой WARDOGS, нажми «Снять из игры», подтверди Steam — мы только запишем цифры. Вход на сайт в шапке отдельно.</p>
          </div>`:""}
        </article>
      `;const dt=async()=>{const t=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:t})})};document.querySelector("#show-top")?.addEventListener("change",dt),document.querySelector("#tune")?.addEventListener("submit",async t=>{t.preventDefault();const e=document.querySelector("#tune-note"),r=document.querySelector("#motto"),m=document.querySelector('input[name="accent"]:checked'),y=await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({motto:r?.value??"",accent:m?.value??""})});if(y.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}if(!y.ok){e.textContent="Не сохранилось. Выбери цвет из списка и укороти строку.";return}location.reload()}),document.querySelector("#resync")?.addEventListener("click",async()=>{const t=document.querySelector("#sync-note"),e=document.querySelector("#resync");e.disabled=!0,t.classList.add("dossier-alert"),t.textContent="Обновляю статистику…";try{const r=await fetch(`https://wardogstracker.gg/api/v1/players/${$}`,{signal:AbortSignal.timeout(8e3)}),m=r.ok?await r.json().catch(()=>null):null,y=await fetch("/api/me/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(m&&m.player?{player:m.player}:{}),signal:AbortSignal.timeout(8e3)});if(y.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${$}`)}`;return}const x=await y.json().catch(()=>({}));if(x.saved){const b=new URL("/p/",location.origin);b.searchParams.set("id",$),x.unchanged&&b.searchParams.set("sync","same"),x.coins?b.searchParams.set("reward",String(x.coins)):x.already&&b.searchParams.set("reward","done"),location.href=b.pathname+b.search;return}t.textContent=x.reason==="tracker_down"?"База карьеры не ответила. Нажми ещё раз.":"В открытой базе этого игрока ещё нет."}catch{t.textContent="Слишком долго. Нажми ещё раз — запрос оборвался."}e.disabled=!1}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const t=document.querySelector("#copy-profile");if(!t)return;const e=location.href;let r=!1;try{await navigator.clipboard.writeText(e),r=!0}catch{const m=document.createElement("textarea");m.value=e,m.setAttribute("readonly",""),m.style.position="fixed",m.style.left="-9999px",document.body.append(m),m.select();try{r=document.execCommand("copy")}catch{r=!1}m.remove()}t.textContent=r?"Ссылка скопирована":"Не скопировалось"})}}else try{const n=(await fetch("/api/me").then(l=>l.json()))?.user?.steam_id;/^\d{17}$/.test(n||"")?location.replace(`/p/?id=${n}`):C.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{C.innerHTML="<h1>Такой страницы нет</h1>"}
