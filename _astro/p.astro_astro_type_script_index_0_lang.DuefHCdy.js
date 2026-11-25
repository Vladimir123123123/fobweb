const C=document.querySelector("#profile"),wt=JSON.parse(C.getAttribute("data-guns")||"{}"),G=new URLSearchParams(location.search),b=G.get("id")??"",L=G.get("sync")??"",kt=G.get("job")??"",ct=G.get("reward")??"",o=r=>String(r??"").replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i]??i);function lt(r){return r==null?"—":`$${new Intl.NumberFormat("ru-RU").format(r)}`}const m=r=>r==null?"—":new Intl.NumberFormat("ru-RU").format(r);function S(r){const i=new Date(String(r??""));return Number.isNaN(i.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(i)}function X(r){const i=new Date(String(r??""));return Number.isNaN(i.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(i)}function R(r,i){if(r==null||i==null)return"";const p=Number(r)-Number(i);if(!p)return"";const s=p>0?"+":"−";return`<em class="${p>0?"up":"down"}">${s}${new Intl.NumberFormat("ru-RU").format(Math.abs(p))}</em>`}function xt(r,i="#e4b04a"){const p=r.map(u=>u.wardog_level??0);if(p.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const s=Math.max(...p,1),h=Math.min(...p),$=Math.max(s-h,1),x=640,y=180,U=x/(p.length-1),Y=u=>18+(1-(u-h)/$)*(y-44),f=p.map((u,w)=>[w*U,Y(u)]);let D=`M${f[0][0]},${f[0][1]}`;for(let u=0;u<f.length-1;u++){const w=f[u-1]??f[u],q=f[u],k=f[u+1],B=f[u+2]??k,P=q[0]+(k[0]-w[0])/6,H=k[0]-(B[0]-q[0])/6,I=Math.min(Math.max(q[1]+(k[1]-w[1])/6,0),y),a=Math.min(Math.max(k[1]-(B[1]-q[1])/6,0),y);D+=` C${P.toFixed(1)},${I.toFixed(1)} ${H.toFixed(1)},${a.toFixed(1)} ${k[0].toFixed(1)},${k[1].toFixed(1)}`}const _=`${D} L${x},${y} L0,${y} Z`,K=p.at(-1)??0,F=`lvl${Math.random().toString(36).slice(2,7)}`,O=[.25,.5,.75].map(u=>`<line class="grid-line" x1="0" x2="${x}" y1="${(y*u).toFixed(0)}" y2="${(y*u).toFixed(0)}"></line>`).join("");return`<svg class="dossier-chart" viewBox="0 0 ${x} ${y}" preserveAspectRatio="none" role="img" aria-label="Уровень по снимкам">
      <defs>
        <linearGradient id="${F}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb703" stop-opacity="0.55"/><stop offset="1" stop-color="#ffb703" stop-opacity="0"/></linearGradient>
        <filter id="${F}g" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      ${O}
      <path d="${_}" fill="url(#${F})"></path>
      <path d="${D}" fill="none" stroke="#ffb703" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" filter="url(#${F}g)"></path>
    </svg>
    <p class="dossier-axis"><span>${o(X(r[0]?.created_at))}</span><span>${o(X(r.at(-1)?.created_at))} · ${m(K)} ур.</span></p>`}async function St(){C.innerHTML="<p>Steam забирает карьеру из игры. WARDOGS должен быть закрыт. Не закрывай вкладку.</p>";for(let r=0;r<45;r++){const i=await fetch(`/api/auth/status?job=${encodeURIComponent(kt)}`).then(h=>h.json()).catch(()=>null);if(!i||i.status==="pending"){await new Promise(h=>setTimeout(h,2e3));continue}const p=i.next||(b?`/p/?id=${b}`:"/ratings"),s=new URL(p,location.origin);i.status==="ok"?(i.flag?s.searchParams.set("sync",i.flag):s.searchParams.delete("sync"),i.coins>0?s.searchParams.set("reward",String(i.coins)):i.already&&s.searchParams.set("reward","done"),!s.searchParams.get("id")&&i.steamId&&s.searchParams.set("id",i.steamId)):s.searchParams.set("sync",i.sync||"expired"),s.searchParams.delete("job"),location.replace(s.pathname+s.search);return}location.replace(b?`/p/?id=${b}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(L==="wait")await St();else if(/^\d{17}$/.test(b)){const[r,i,p]=await Promise.all([fetch(`/api/players/${b}`).then(async s=>s.ok?s.json():null),fetch("/api/me").then(s=>s.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async s=>s.ok?s.json():null).catch(()=>null)]);if(!r)C.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const s=r.user,h=r.history,$=h.at(-1),x=h.length>1?h.at(-2):void 0,y=i.user?.steam_id===b,U=!h.length,f=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([t,e,n])=>({key:t,name:e,icon:n,level:Number($?.[t]??0)||0})),D=Math.max(...f.map(t=>t.level),1),_=f.reduce((t,e)=>e.level>t.level?e:t,f[0]),F=(p?.players??[]).findIndex(t=>String(t.steam_id)===b),O=!!s.hide_leaderboard||!s.cis_opt_in,u=F>=0?`место #${F+1}`:O?"скрыт из топа":"вне топ-200",w=r.squad,k=(t=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(t??""))?String(t):"")(w?.logo),P=["orange","gold","blue","red","green"].find(t=>t===s.accent)??"",H={orange:"#ff4d1c",gold:"#e4b04a",blue:"#6ea2ff",red:"#ff5a4a",green:"#3dba7a"},I=String(s.motto??"").trim(),a=r.combat,dt=t=>t==="win"?"Выиграно":t==="loss"?"Потеряно":t==="leave"?"Досрочный выход":"—",pt=t=>t==="win"?"win":t==="loss"?"loss":"",v=(a?.history??[]).filter(t=>String(t.map||"").trim()||String(t.result||"").trim()),E=v.length<40?v.length:a?.matches??v.length,Q=r.punishments??[],ut=t=>t.untilAt?`до ${S(t.untilAt)}`:t.active?"до снятия":t.liftedAt?`снято ${S(t.liftedAt)}`:"—",z={lone:"/brand/operators/lone.webp",valk:"/brand/operators/valk.webp",mant:"/brand/operators/mant.webp"}[String(a?.side||"")]??"",tt=t=>{const e=t.toLowerCase();return e.includes("valk")?"valk":e.includes("mant")?"mant":e.includes("lone")?"lone":""},mt=t=>{const e=t.toLowerCase();return e.includes("valk")?"/brand/factions/vk.png":e.includes("mant")?"/brand/factions/mc.png":e.includes("lone")||e.includes("star")?"/brand/factions/ls.png":""},ht=t=>{const e=t.trim(),n=e.toLowerCase();return!e||n==="white"||n==="unknown"?"":e},et=t=>{const e=t.toLowerCase();return e.includes("ozet")||e.includes("madrid")||e.includes("europe")?{file:"ozeti",title:"Ozeti"}:e.includes("sabat")||e.includes("moscow")||e.includes("russia")?{file:"sabatulo",title:"Sabatulo"}:e.includes("bakur")||e.includes("kavkaz")?{file:"bakurani",title:"Bakurani"}:e.includes("zesta")||e.includes("america")||e.includes("detroit")?{file:"zestafona",title:"Zestafona"}:null},Z=t=>{const e=t.trim().toLowerCase();return!e||e==="default"||e==="неизвестно"?"":wt[e]||""},J=(t,e,n="")=>`<span class="piece${n?` ${n}`:""}">${t?`<img src="${t}" alt="" />`:""}<span>${o(e)}</span></span>`,st=t=>t?.name?`${o(t.name)} · ${m(t.count)}×`:"—",W=a?.weapons??[],$t=Math.max(...W.map(t=>Number(t.kills)||0),1),at=a?.since||a?.last?`Играет здесь с ${o(S(a?.since)||"—")} · последний раз ${o(S(a?.last)||"—")}`:"",M=(t,e=0,n="")=>{if(t==null||t===""||!Number.isFinite(Number(t)))return"<b>—</b>";const c=Number(t),d=c.toLocaleString("ru-RU",{minimumFractionDigits:e,maximumFractionDigits:e});return`<b data-count="${c}" data-dec="${e}" data-suffix="${o(n)}">${d}${o(n)}</b>`},nt={crosshair:'<circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 20h8"/>',ruler:'<path d="M3 15 15 3l6 6L9 21 3 15Z"/><path d="m7 11 2 2M10 8l2 2M13 5l2 2"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',swords:'<path d="m5 19 9-9M14 5h5v5M5 5l14 14"/>',shield:'<path d="M12 3 4 6v6c0 4.500 3.400 7.700 8 9 4.600-1.300 8-4.500 8-9V6l-8-3Z"/>'},A=t=>`<svg class="tile-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${nt[t]??""}</svg>`,gt=[...v].sort((t,e)=>(Date.parse(String(t.endedAt))||0)-(Date.parse(String(e.endedAt))||0)),V=t=>{const e=gt.map(l=>l[t]==null?Number.NaN:Number(l[t])).filter(l=>Number.isFinite(l)).slice(-14);if(e.length<2)return"";const n=Math.max(...e),c=Math.min(...e),d=Math.max(n-c,1e-6),g=e.map((l,j)=>`${j?"L":"M"}${(j*(100/(e.length-1))).toFixed(1)},${(34-(l-c)/d*28).toFixed(1)}`).join(" ");return`<svg class="spark" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true"><path class="spark-fill" d="${g} L100,36 L0,36 Z"/><path class="spark-line" d="${g}" vector-effect="non-scaling-stroke"/></svg>`},ft=v.map(t=>et(String(t.map||""))).find(Boolean)?.file??"ozeti",ot=Number(ct),rt=[ot>0?`За обновление статистики начислено ${ot} очков. Следующие — завтра.`:ct==="done"?"Сегодняшние 10 очков за обновление статистики уже начислены.":"",L==="same"?"Цифры те же, что уже были. Свежее игра отдаст, если закрыть WARDOGS и снять ещё раз.":L==="game_running"?"Игра была запущена. Полностью закрой WARDOGS и нажми «Снять из игры».":L==="stale"?"Игра не отдала свежий снимок. Записали последние известные цифры. Закрой клиент и сними ещё раз.":L==="access_denied"?"Steam отменён. Нажми «Снять из игры» и подтверди вход.":U&&!a?"Цифр ещё нет. Закрой WARDOGS и нажми «Снять из игры» — откроется Steam, мы запишем карьеру.":L==="expired"?"Код входа истёк. Нажми «Снять из игры» ещё раз.":L&&L!=="ok"?"Не вышло снять карьеру. Закрой игру и нажми ещё раз.":""].filter(Boolean).join(" ");C.innerHTML=`
        <article class="dossier"${P?` data-accent="${P}"`:""}>
          <header class="dossier-hero${z?" has-op":""}">
            <img class="dossier-bg dossier-map" alt="" src="/brand/maps/${ft}.webp" />
            ${s.avatar?`<img class="dossier-bg dossier-tint" alt="" src="${o(s.avatar)}" />`:""}
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${o(s.avatar??"")}" />
                ${k?`<img class="dossier-clan" alt="" src="${o(k)}" />`:""}
              </div>
              <div>
                <p class="eyebrow">Досье · сезон ${o(String(p?.season||"03"))}</p>
                <h1>${o(s.persona??s.steam_id)}</h1>
                ${I?`<p class="dossier-line">${o(I)}</p>`:""}
                <div class="dossier-tags">
                  <span class="pill">${o(u)}</span>
                  ${_.level?`<span class="pill now">${o(_.name)} ${_.level}</span>`:""}
                  ${w?`<a class="pill" href="/squad/?id=${w.id}">[${o(w.tag)}] ${o(w.name)}</a>`:'<span class="pill old">без сквада</span>'}
                  ${s.country?`<span class="pill">${o(s.country)}</span>`:""}
                  ${s.discord_name?`<span class="pill">Discord ${o(s.discord_name)}</span>`:""}
                </div>
              </div>
              <div class="dossier-level">
                <img src="/art/t_ui_icon_careerlevel_600.webp" alt="" />
                <b>${$?.wardog_level??"—"}</b>
                <span>уровень ${R($?.wardog_level,x?.wardog_level)}</span>
              </div>
            </div>
            ${z?`<div class="dossier-op-wrap"><img class="dossier-op" alt="" src="${z}" /></div>`:""}
          </header>
          ${rt?`<p class="note dossier-alert" id="sync-note">${o(rt)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${R($?.xp,x?.xp)}</span><b>${m($?.xp)}</b></div>
            <div><span>Деньги ${R($?.cash,x?.cash)}</span><b>${lt($?.cash)}</b></div>
            <div><span>Золото ${R($?.gold,x?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${$?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${$?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${lt($?.account_value)}</b></div>
            <div><span>Снимков</span><b>${h.length}</b></div>
          </section>
          ${a?`<section class="fight-card">
            <header>
              <p class="eyebrow">Статистика игрока</p>
              <p>Этот сервер, за всё время</p>
            </header>
            <div class="bento">
              <div class="tile tile-kd">
                <span>К/Д</span>
                ${M(a.kd,2)}
                <small>${m(a.kills)} убийств · ${m(a.deaths)} смертей</small>
                <em>Место #${m(a.place)} из ${m(a.of)}</em>
                ${V("kd")}
              </div>
              <div class="tile tile-win">
                <i class="tile-ring" style="--p:${Math.max(0,Math.min(100,Number(a.winrate)||0))}"></i>
                <span>Винрейт · последние 10</span>
                ${M(a.winrate,1,"%")}
                <small>${Number(a.winGames)>0?`${m(a.winGames)} ${Number(a.winGames)===1?"игра":Number(a.winGames)<5?"игры":"игр"} с итогом`:"Появится после первого матча с итогом"}</small>
                ${(a.form??[]).length?`<div class="form" role="img" aria-label="Последние игры">${(a.form??[]).slice().reverse().map(t=>`<i class="${t==="win"?"win":"loss"}" title="${t==="win"?"Победа":"Поражение"}"></i>`).join("")}</div>`:""}
              </div>
              <div class="tile"><span>Хедшоты</span>${M(a.headshotPct,1,"%")}<small>${a.headshots==null?"":`${m(a.headshots)} шт.`}</small>${V("headshots")||A("crosshair")}</div>
              <div class="tile"><span>Лучший матч</span>${M(a.bestMatch)}<small>убийств</small>${V("kills")||A("trophy")}</div>
              <div class="tile"><span>Самое дальнее</span>${M(a.longest,0," м")}${A("ruler")}</div>
              <div class="tile"><span>Ср. дистанция</span>${M(a.average,0," м")}${A("target")}</div>
              <div class="tile"><span>Матчи</span>${E?M(E):"<b>—</b>"}<small>${E?`по ${a.perMatch??"—"} убийств`:""}</small>${A("swords")}</div>
              <div class="tile"><span>Основная сторона</span><b class="${tt(String(a.faction||""))}">${o(String(a.faction||"").trim())||"—"}</b>${A("shield")}</div>
              <div class="tile"><span>Убийства своих</span>${M(a.teamkills)}${A("shield")}</div>
              <div class="tile tile-wide">
                <p><span>Заклятый враг</span><b>${st(a.enemy)}</b></p>
                <p><span>Любимая цель</span><b>${st(a.target)}</b></p>
              </div>
            </div>
            ${W.length?`<div class="fight-card-guns">
              <p class="eyebrow">Оружие</p>
              ${W.map((t,e)=>{const n=String(t.name||"неизвестно"),c=Z(n),d=Number(t.kills)||0,l=d>=10&&(Number(t.headshots)||0)/d>=.2?`<svg class="gun-tag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" role="img" aria-label="Много хедшотов"><title>Много хедшотов</title>${nt.crosshair}</svg>`:"";return`<p class="gun-bar">${c?`<img src="/art/${c}" alt="" />`:'<span class="ico-gap">—</span>'}<span class="gun-body"><b>${o(n)}${l}</b><i><u style="--w:${Math.max(3,Math.round(d/$t*100))}%;--d:${e*90}ms"></u></i></span><span class="gun-num"><strong>${m(t.kills)}</strong> · ${m(t.headshots)} HS</span></p>`}).join("")}
            </div>`:'<p class="note">Оружие, хедшоты и дистанция появятся со следующими убийствами, которые пришлёт сервер.</p>'}
            ${at?`<p class="note">${at}</p>`:""}
          </section>
          ${v.length?`<section class="match-log">
            <header>
              <p class="eyebrow">Матчи</p>
              <p>Этот сервер, хранить навсегда</p>
            </header>
            <div class="match-scroll">
              <table>
                <thead>
                  <tr>${v.some(t=>S(t.endedAt))?"<th>Завершено</th>":""}${v.some(t=>String(t.server||"").trim())?"<th>Сервер</th>":""}<th>Карта</th><th>Сторона</th><th>Результат</th><th>Место</th><th>У</th><th>С</th><th>К/Д</th><th>ХШ</th><th>ТК</th><th>Оружие</th></tr>
                </thead>
                <tbody>
                  ${v.map(t=>{const e=et(String(t.map||"")),n=e?.title||String(t.map||""),c=n?J(e?`/brand/maps/${e.file}.webp`:"",`${n}${t.minutes?` · ${m(t.minutes)} мин`:""}`,"map"):"—",d=ht(String(t.faction||"")),g=d?J(mt(d),d):"—",l=String(t.weapon||"").trim(),j=l&&l.toLowerCase()!=="default"?J(Z(l)?`/art/${Z(l)}`:"",l,"gun"):"—";return`<tr>
                    ${S(t.endedAt)||v.some(T=>S(T.endedAt))?`<td>${o(S(t.endedAt)||"—")}</td>`:""}
                    ${String(t.server||"").trim()||v.some(T=>String(T.server||"").trim())?`<td>${o(t.server||"—")}</td>`:""}
                    <td>${c}</td>
                    <td class="${tt(d)}">${g}</td>
                    <td class="${pt(t.result)}">${dt(t.result)}</td>
                    <td>${t.place?`#${m(t.place)}${t.field?` из ${m(t.field)}`:""}`:"—"}</td>
                    <td>${m(t.kills)}</td>
                    <td>${m(t.deaths)}</td>
                    <td>${t.kd==null?"—":Number(t.kd).toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td>${m(t.headshots)}</td>
                    <td>${m(t.teamkills)}</td>
                    <td>${j}</td>
                  </tr>`}).join("")}
                </tbody>
              </table>
            </div>
          </section>`:""}`:""}
          ${Q.length?`<section class="punishments">
            <header>
              <p class="eyebrow">Наказания</p>
              <p>Этот сервер</p>
            </header>
            <table>
              <thead><tr><th>Что</th><th>За что</th><th>Когда</th><th>Срок</th></tr></thead>
              <tbody>
                ${Q.map(t=>`<tr>
                  <td>${t.kind==="ban"?"Бан":"Наказание"}</td>
                  <td>${o(t.reason||"не указана")}</td>
                  <td>${o(S(t.startedAt)||"—")}</td>
                  <td>${o(ut(t))}</td>
                </tr>`).join("")}
              </tbody>
            </table>
          </section>`:""}
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${_.level?o(_.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${f.map(t=>`
                  <div class="lane${t.name===_.name&&t.level?" lead":""}">
                    <img src="${t.icon}" alt="" />
                    <span>${t.name}</span>
                    <i><b style="width:${Math.round(t.level/D*100)}%"></b></i>
                    <strong>${t.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${h.length>1?R($?.wardog_level,h[0]?.wardog_level)?`${R($?.wardog_level,h[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${xt(h,H[P]??"#e4b04a")}
              <p class="note">Последний снимок: ${o(X($?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${b}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${y?`<form class="dossier-tune" id="tune">
            <label>Строка под ником
              <input id="motto" maxlength="80" value="${o(I)}" placeholder="Коротко о себе, до 80 знаков" />
            </label>
            <div class="swatches" role="radiogroup" aria-label="Цвет досье">
              ${[["","Как есть"],["orange","Огонь"],["gold","Золото"],["blue","Синий"],["red","Красный"],["green","Зелёный"]].map(([t,e])=>`
                <label class="swatch">
                  <input type="radio" name="accent" value="${t}" ${P===t?"checked":""} />
                  <i class="dot ${t||"plain"}"></i>
                  <span>${e}</span>
                </label>`).join("")}
            </div>
            <button class="btn small" type="submit">Сохранить вид</button>
            <p class="note" id="tune-note">Строку и цвет видят все, кто откроет это досье. Баннер сквада здесь не показывается.</p>
          </form>
          <div class="dossier-own">
            <a class="btn small" href="/auth/wardogs/start?next=/p&steamId=${o(b)}">Снять из игры</a>
            <button class="btn ghost small" id="resync" type="button">Из открытой базы</button>
            <label class="check"><input id="show-top" type="checkbox" ${s.cis_opt_in&&!s.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${i.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Закрой WARDOGS, нажми «Снять из игры», подтверди Steam — мы только запишем цифры. Вход на сайт в шапке отдельно.</p>
          </div>`:""}
        </article>
      `;const it=window.matchMedia("(prefers-reduced-motion: reduce)").matches,N=C.querySelector(".dossier-hero");N&&!it&&(N.addEventListener("pointermove",t=>{const e=N.getBoundingClientRect();N.style.setProperty("--px",((t.clientX-e.left)/e.width-.5).toFixed(3)),N.style.setProperty("--py",((t.clientY-e.top)/e.height-.5).toFixed(3))}),N.addEventListener("pointerleave",()=>{N.style.setProperty("--px","0"),N.style.setProperty("--py","0")}));const bt=t=>{const e=Number(t.dataset.count),n=Number(t.dataset.dec)||0,c=t.dataset.suffix??"",d=performance.now(),g=l=>{const j=Math.min(1,(l-d)/1200),T=1-Math.pow(1-j,3);t.textContent=`${(e*T).toLocaleString("ru-RU",{minimumFractionDigits:n,maximumFractionDigits:n})}${c}`,j<1&&requestAnimationFrame(g)};requestAnimationFrame(g)},vt=C.querySelectorAll("[data-count]");if(!it&&"IntersectionObserver"in window){const t=new IntersectionObserver(e=>{for(const n of e)n.isIntersecting&&(t.unobserve(n.target),bt(n.target))},{threshold:.4});vt.forEach(e=>t.observe(e))}const yt=async()=>{const t=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:t})})};document.querySelector("#show-top")?.addEventListener("change",yt),document.querySelector("#tune")?.addEventListener("submit",async t=>{t.preventDefault();const e=document.querySelector("#tune-note"),n=document.querySelector("#motto"),c=document.querySelector('input[name="accent"]:checked'),d=await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({motto:n?.value??"",accent:c?.value??""})});if(d.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}if(!d.ok){e.textContent="Не сохранилось. Выбери цвет из списка и укороти строку.";return}location.reload()}),document.querySelector("#resync")?.addEventListener("click",async()=>{const t=document.querySelector("#sync-note"),e=document.querySelector("#resync");e.disabled=!0,t.classList.add("dossier-alert"),t.textContent="Обновляю статистику…";try{const n=await fetch(`https://wardogstracker.gg/api/v1/players/${b}`,{signal:AbortSignal.timeout(8e3)}),c=n.ok?await n.json().catch(()=>null):null,d=await fetch("/api/me/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(c&&c.player?{player:c.player}:{}),signal:AbortSignal.timeout(8e3)});if(d.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${b}`)}`;return}const g=await d.json().catch(()=>({}));if(g.saved){const l=new URL("/p/",location.origin);l.searchParams.set("id",b),g.unchanged&&l.searchParams.set("sync","same"),g.coins?l.searchParams.set("reward",String(g.coins)):g.already&&l.searchParams.set("reward","done"),location.href=l.pathname+l.search;return}t.textContent=g.reason==="tracker_down"?"База карьеры не ответила. Нажми ещё раз.":"В открытой базе этого игрока ещё нет."}catch{t.textContent="Слишком долго. Нажми ещё раз — запрос оборвался."}e.disabled=!1}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const t=document.querySelector("#copy-profile");if(!t)return;const e=location.href;let n=!1;try{await navigator.clipboard.writeText(e),n=!0}catch{const c=document.createElement("textarea");c.value=e,c.setAttribute("readonly",""),c.style.position="fixed",c.style.left="-9999px",document.body.append(c),c.select();try{n=document.execCommand("copy")}catch{n=!1}c.remove()}t.textContent=n?"Ссылка скопирована":"Не скопировалось"})}}else try{const i=(await fetch("/api/me").then(p=>p.json()))?.user?.steam_id;/^\d{17}$/.test(i||"")?location.replace(`/p/?id=${i}`):C.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{C.innerHTML="<h1>Такой страницы нет</h1>"}
