const C=document.querySelector("#profile"),wt=JSON.parse(C.getAttribute("data-guns")||"{}"),U=new URLSearchParams(location.search),b=U.get("id")??"",L=U.get("sync")??"",kt=U.get("job")??"",ct=U.get("reward")??"",n=o=>String(o??"").replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r]??r);function lt(o){return o==null?"—":`$${new Intl.NumberFormat("ru-RU").format(o)}`}const h=o=>o==null?"—":new Intl.NumberFormat("ru-RU").format(o);function S(o){const r=new Date(String(o??""));return Number.isNaN(r.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(r)}function X(o){const r=new Date(String(o??""));return Number.isNaN(r.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(r)}function R(o,r){if(o==null||r==null)return"";const p=Number(o)-Number(r);if(!p)return"";const s=p>0?"+":"−";return`<em class="${p>0?"up":"down"}">${s}${new Intl.NumberFormat("ru-RU").format(Math.abs(p))}</em>`}function xt(o,r="#e4b04a"){const p=o.map(u=>u.wardog_level??0);if(p.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const s=Math.max(...p,1),m=Math.min(...p),$=Math.max(s-m,1),x=640,y=180,O=x/(p.length-1),Y=u=>18+(1-(u-m)/$)*(y-44),f=p.map((u,w)=>[w*O,Y(u)]);let D=`M${f[0][0]},${f[0][1]}`;for(let u=0;u<f.length-1;u++){const w=f[u-1]??f[u],q=f[u],k=f[u+1],G=f[u+2]??k,P=q[0]+(k[0]-w[0])/6,H=k[0]-(G[0]-q[0])/6,I=Math.min(Math.max(q[1]+(k[1]-w[1])/6,0),y),i=Math.min(Math.max(k[1]-(G[1]-q[1])/6,0),y);D+=` C${P.toFixed(1)},${I.toFixed(1)} ${H.toFixed(1)},${i.toFixed(1)} ${k[0].toFixed(1)},${k[1].toFixed(1)}`}const _=`${D} L${x},${y} L0,${y} Z`,K=p.at(-1)??0,F=`lvl${Math.random().toString(36).slice(2,7)}`,B=[.25,.5,.75].map(u=>`<line class="grid-line" x1="0" x2="${x}" y1="${(y*u).toFixed(0)}" y2="${(y*u).toFixed(0)}"></line>`).join("");return`<svg class="dossier-chart" viewBox="0 0 ${x} ${y}" preserveAspectRatio="none" role="img" aria-label="Уровень по снимкам">
      <defs>
        <linearGradient id="${F}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb703" stop-opacity="0.55"/><stop offset="1" stop-color="#ffb703" stop-opacity="0"/></linearGradient>
        <filter id="${F}g" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      ${B}
      <path d="${_}" fill="url(#${F})"></path>
      <path d="${D}" fill="none" stroke="#ffb703" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" filter="url(#${F}g)"></path>
    </svg>
    <p class="dossier-axis"><span>${n(X(o[0]?.created_at))}</span><span>${n(X(o.at(-1)?.created_at))} · ${h(K)} ур.</span></p>`}async function St(){C.innerHTML="<p>Steam забирает карьеру из игры. WARDOGS должен быть закрыт. Не закрывай вкладку.</p>";for(let o=0;o<45;o++){const r=await fetch(`/api/auth/status?job=${encodeURIComponent(kt)}`).then(m=>m.json()).catch(()=>null);if(!r||r.status==="pending"){await new Promise(m=>setTimeout(m,2e3));continue}const p=r.next||(b?`/p/?id=${b}`:"/ratings"),s=new URL(p,location.origin);r.status==="ok"?(r.flag?s.searchParams.set("sync",r.flag):s.searchParams.delete("sync"),r.coins>0?s.searchParams.set("reward",String(r.coins)):r.already&&s.searchParams.set("reward","done"),!s.searchParams.get("id")&&r.steamId&&s.searchParams.set("id",r.steamId)):s.searchParams.set("sync",r.sync||"expired"),s.searchParams.delete("job"),location.replace(s.pathname+s.search);return}location.replace(b?`/p/?id=${b}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(L==="wait")await St();else if(/^\d{17}$/.test(b)){const[o,r,p]=await Promise.all([fetch(`/api/players/${b}`).then(async s=>s.ok?s.json():null),fetch("/api/me").then(s=>s.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async s=>s.ok?s.json():null).catch(()=>null)]);if(!o)C.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const s=o.user,m=o.history,$=m.at(-1),x=m.length>1?m.at(-2):void 0,y=r.user?.steam_id===b,O=!m.length,f=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([t,e,a])=>({key:t,name:e,icon:a,level:Number($?.[t]??0)||0})),D=Math.max(...f.map(t=>t.level),1),_=f.reduce((t,e)=>e.level>t.level?e:t,f[0]),F=(p?.players??[]).findIndex(t=>String(t.steam_id)===b),B=!!s.hide_leaderboard||!s.cis_opt_in,u=F>=0?`место #${F+1}`:B?"скрыт из топа":"вне топ-200",w=o.squad,k=(t=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(t??""))?String(t):"")(w?.logo),P=["orange","gold","blue","red","green"].find(t=>t===s.accent)??"",H={orange:"#ff4d1c",gold:"#e4b04a",blue:"#6ea2ff",red:"#ff5a4a",green:"#3dba7a"},I=String(s.motto??"").trim(),i=o.combat,dt=t=>t==="win"?"Выиграно":t==="loss"?"Потеряно":t==="leave"?"Досрочный выход":"—",pt=t=>t==="win"?"win":t==="loss"?"loss":"",v=(i?.history??[]).filter(t=>String(t.map||"").trim()||String(t.result||"").trim()),E=v.length<40?v.length:i?.matches??v.length,Q=o.punishments??[],ut=t=>t.untilAt?`до ${S(t.untilAt)}`:t.active?"до снятия":t.liftedAt?`снято ${S(t.liftedAt)}`:"—",z={lone:"/brand/operators/lone.webp",valk:"/brand/operators/valk.webp",mant:"/brand/operators/mant.webp"}[String(i?.side||"")]??"",tt=t=>{const e=t.toLowerCase();return e.includes("valk")?"valk":e.includes("mant")?"mant":e.includes("lone")?"lone":""},ht=t=>{const e=t.toLowerCase();return e.includes("valk")?"/brand/factions/vk.png":e.includes("mant")?"/brand/factions/mc.png":e.includes("lone")||e.includes("star")?"/brand/factions/ls.png":""},mt=t=>{const e=t.trim(),a=e.toLowerCase();return!e||a==="white"||a==="unknown"?"":e},et=t=>{const e=t.toLowerCase();return e.includes("ozet")||e.includes("madrid")||e.includes("europe")?{file:"ozeti",title:"Ozeti"}:e.includes("sabat")||e.includes("moscow")||e.includes("russia")?{file:"sabatulo",title:"Sabatulo"}:e.includes("bakur")||e.includes("kavkaz")?{file:"bakurani",title:"Bakurani"}:e.includes("zesta")||e.includes("america")||e.includes("detroit")?{file:"zestafona",title:"Zestafona"}:null},Z=t=>{const e=t.trim().toLowerCase();return!e||e==="default"||e==="неизвестно"?"":wt[e]||""},J=(t,e,a="")=>`<span class="piece${a?` ${a}`:""}">${t?`<img src="${t}" alt="" />`:""}<span>${n(e)}</span></span>`,st=t=>t?.name?`${n(t.name)} · ${h(t.count)}×`:"—",W=i?.weapons??[],$t=Math.max(...W.map(t=>Number(t.kills)||0),1),at=i?.since||i?.last?`Играет здесь с ${n(S(i?.since)||"—")} · последний раз ${n(S(i?.last)||"—")}`:"",M=(t,e=0,a="")=>{if(t==null||t===""||!Number.isFinite(Number(t)))return"<b>—</b>";const c=Number(t),d=c.toLocaleString("ru-RU",{minimumFractionDigits:e,maximumFractionDigits:e});return`<b data-count="${c}" data-dec="${e}" data-suffix="${n(a)}">${d}${n(a)}</b>`},nt={crosshair:'<circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 20h8"/>',ruler:'<path d="M3 15 15 3l6 6L9 21 3 15Z"/><path d="m7 11 2 2M10 8l2 2M13 5l2 2"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',swords:'<path d="m5 19 9-9M14 5h5v5M5 5l14 14"/>',shield:'<path d="M12 3 4 6v6c0 4.500 3.400 7.700 8 9 4.600-1.300 8-4.500 8-9V6l-8-3Z"/>'},A=t=>`<svg class="tile-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${nt[t]??""}</svg>`,gt=[...v].sort((t,e)=>(Date.parse(String(t.endedAt))||0)-(Date.parse(String(e.endedAt))||0)),V=t=>{const e=gt.map(l=>l[t]==null?Number.NaN:Number(l[t])).filter(l=>Number.isFinite(l)).slice(-14);if(e.length<2)return"";const a=Math.max(...e),c=Math.min(...e),d=Math.max(a-c,1e-6),g=e.map((l,j)=>`${j?"L":"M"}${(j*(100/(e.length-1))).toFixed(1)},${(34-(l-c)/d*28).toFixed(1)}`).join(" ");return`<svg class="spark" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true"><path class="spark-fill" d="${g} L100,36 L0,36 Z"/><path class="spark-line" d="${g}" vector-effect="non-scaling-stroke"/></svg>`},ft=v.map(t=>et(String(t.map||""))).find(Boolean)?.file??"ozeti",ot=Number(ct),rt=[ot>0?`За обновление статистики начислено ${ot} очков. Следующие — завтра.`:ct==="done"?"Сегодняшние 10 очков за обновление статистики уже начислены.":"",L==="same"?"Цифры те же, что уже были. Свежее игра отдаст, если закрыть WARDOGS и снять ещё раз.":L==="game_running"?"Игра была запущена. Полностью закрой WARDOGS и нажми «Снять из игры».":L==="stale"?"Игра не отдала свежий снимок. Записали последние известные цифры. Закрой клиент и сними ещё раз.":L==="access_denied"?"Steam отменён. Нажми «Снять из игры» и подтверди вход.":O&&!i?"Цифр ещё нет. Закрой WARDOGS и нажми «Снять из игры» — откроется Steam, мы запишем карьеру.":L==="expired"?"Код входа истёк. Нажми «Снять из игры» ещё раз.":L&&L!=="ok"?"Не вышло снять карьеру. Закрой игру и нажми ещё раз.":""].filter(Boolean).join(" ");C.innerHTML=`
        <article class="dossier"${P?` data-accent="${P}"`:""}>
          <header class="dossier-hero${z?" has-op":""}">
            <img class="dossier-bg dossier-map" alt="" src="/brand/maps/${ft}.webp" />
            ${s.avatar?`<img class="dossier-bg dossier-tint" alt="" src="${n(s.avatar)}" />`:""}
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${n(s.avatar??"")}" />
                ${k?`<img class="dossier-clan" alt="" src="${n(k)}" />`:""}
              </div>
              <div>
                <p class="eyebrow">Досье · сезон ${n(String(p?.season||"03"))}</p>
                <h1>${n(s.persona??s.steam_id)}</h1>
                ${I?`<p class="dossier-line">${n(I)}</p>`:""}
                <div class="dossier-tags">
                  <span class="pill">${n(u)}</span>
                  ${_.level?`<span class="pill now">${n(_.name)} ${_.level}</span>`:""}
                  ${w?`<a class="pill" href="/squad/?id=${w.id}">[${n(w.tag)}] ${n(w.name)}</a>`:'<span class="pill old">без сквада</span>'}
                  ${s.country?`<span class="pill">${n(s.country)}</span>`:""}
                  ${s.discord_name?`<span class="pill">Discord ${n(s.discord_name)}</span>`:""}
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
          ${rt?`<p class="note dossier-alert" id="sync-note">${n(rt)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${R($?.xp,x?.xp)}</span><b>${h($?.xp)}</b></div>
            <div><span>Деньги ${R($?.cash,x?.cash)}</span><b>${lt($?.cash)}</b></div>
            <div><span>Золото ${R($?.gold,x?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${$?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${$?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${lt($?.account_value)}</b></div>
            <div><span>Снимков</span><b>${m.length}</b></div>
          </section>
          ${i?`<section class="fight-card">
            <header>
              <p class="eyebrow">Статистика игрока</p>
              <p>Этот сервер, за всё время</p>
            </header>
            <div class="bento">
              <div class="tile tile-kd">
                <span>К/Д</span>
                ${M(i.kd,2)}
                <small>${h(i.kills)} убийств · ${h(i.deaths)} смертей</small>
                <em>Место #${h(i.place)} из ${h(i.of)}</em>
                ${V("kd")}
              </div>
              <div class="tile tile-win">
                <i class="tile-ring" style="--p:${Math.max(0,Math.min(100,Number(i.winrate)||0))}"></i>
                <span>Винрейт</span>
                ${M(i.winrate,1,"%")}
              </div>
              <div class="tile"><span>Хедшоты</span>${M(i.headshotPct,1,"%")}<small>${i.headshots==null?"":`${h(i.headshots)} шт.`}</small>${V("headshots")||A("crosshair")}</div>
              <div class="tile"><span>Лучший матч</span>${M(i.bestMatch)}<small>убийств</small>${V("kills")||A("trophy")}</div>
              <div class="tile"><span>Самое дальнее</span>${M(i.longest,0," м")}${A("ruler")}</div>
              <div class="tile"><span>Ср. дистанция</span>${M(i.average,0," м")}${A("target")}</div>
              <div class="tile"><span>Матчи</span>${E?M(E):"<b>—</b>"}<small>${E?`по ${i.perMatch??"—"} убийств`:""}</small>${A("swords")}</div>
              <div class="tile"><span>Основная сторона</span><b class="${tt(String(i.faction||""))}">${n(String(i.faction||"").trim())||"—"}</b>${A("shield")}</div>
              <div class="tile"><span>Убийства своих</span>${M(i.teamkills)}${A("shield")}</div>
              <div class="tile tile-wide">
                <p><span>Заклятый враг</span><b>${st(i.enemy)}</b></p>
                <p><span>Любимая цель</span><b>${st(i.target)}</b></p>
              </div>
            </div>
            ${W.length?`<div class="fight-card-guns">
              <p class="eyebrow">Оружие</p>
              ${W.map((t,e)=>{const a=String(t.name||"неизвестно"),c=Z(a),d=Number(t.kills)||0,l=d>=10&&(Number(t.headshots)||0)/d>=.2?`<svg class="gun-tag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" role="img" aria-label="Много хедшотов"><title>Много хедшотов</title>${nt.crosshair}</svg>`:"";return`<p class="gun-bar">${c?`<img src="/art/${c}" alt="" />`:'<span class="ico-gap">—</span>'}<span class="gun-body"><b>${n(a)}${l}</b><i><u style="--w:${Math.max(3,Math.round(d/$t*100))}%;--d:${e*90}ms"></u></i></span><span class="gun-num"><strong>${h(t.kills)}</strong> · ${h(t.headshots)} HS</span></p>`}).join("")}
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
                  ${v.map(t=>{const e=et(String(t.map||"")),a=e?.title||String(t.map||""),c=a?J(e?`/brand/maps/${e.file}.webp`:"",`${a}${t.minutes?` · ${h(t.minutes)} мин`:""}`,"map"):"—",d=mt(String(t.faction||"")),g=d?J(ht(d),d):"—",l=String(t.weapon||"").trim(),j=l&&l.toLowerCase()!=="default"?J(Z(l)?`/art/${Z(l)}`:"",l,"gun"):"—";return`<tr>
                    ${S(t.endedAt)||v.some(T=>S(T.endedAt))?`<td>${n(S(t.endedAt)||"—")}</td>`:""}
                    ${String(t.server||"").trim()||v.some(T=>String(T.server||"").trim())?`<td>${n(t.server||"—")}</td>`:""}
                    <td>${c}</td>
                    <td class="${tt(d)}">${g}</td>
                    <td class="${pt(t.result)}">${dt(t.result)}</td>
                    <td>${t.place?`#${h(t.place)}${t.field?` из ${h(t.field)}`:""}`:"—"}</td>
                    <td>${h(t.kills)}</td>
                    <td>${h(t.deaths)}</td>
                    <td>${t.kd==null?"—":Number(t.kd).toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td>${h(t.headshots)}</td>
                    <td>${h(t.teamkills)}</td>
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
                  <td>${n(t.reason||"не указана")}</td>
                  <td>${n(S(t.startedAt)||"—")}</td>
                  <td>${n(ut(t))}</td>
                </tr>`).join("")}
              </tbody>
            </table>
          </section>`:""}
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${_.level?n(_.name):"Классов пока нет"}</h2>
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
              <h2>${m.length>1?R($?.wardog_level,m[0]?.wardog_level)?`${R($?.wardog_level,m[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${xt(m,H[P]??"#e4b04a")}
              <p class="note">Последний снимок: ${n(X($?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${b}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${y?`<form class="dossier-tune" id="tune">
            <label>Строка под ником
              <input id="motto" maxlength="80" value="${n(I)}" placeholder="Коротко о себе, до 80 знаков" />
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
            <a class="btn small" href="/auth/wardogs/start?next=/p&steamId=${n(b)}">Снять из игры</a>
            <button class="btn ghost small" id="resync" type="button">Из открытой базы</button>
            <label class="check"><input id="show-top" type="checkbox" ${s.cis_opt_in&&!s.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${r.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Закрой WARDOGS, нажми «Снять из игры», подтверди Steam — мы только запишем цифры. Вход на сайт в шапке отдельно.</p>
          </div>`:""}
        </article>
      `;const it=window.matchMedia("(prefers-reduced-motion: reduce)").matches,N=C.querySelector(".dossier-hero");N&&!it&&(N.addEventListener("pointermove",t=>{const e=N.getBoundingClientRect();N.style.setProperty("--px",((t.clientX-e.left)/e.width-.5).toFixed(3)),N.style.setProperty("--py",((t.clientY-e.top)/e.height-.5).toFixed(3))}),N.addEventListener("pointerleave",()=>{N.style.setProperty("--px","0"),N.style.setProperty("--py","0")}));const bt=t=>{const e=Number(t.dataset.count),a=Number(t.dataset.dec)||0,c=t.dataset.suffix??"",d=performance.now(),g=l=>{const j=Math.min(1,(l-d)/1200),T=1-Math.pow(1-j,3);t.textContent=`${(e*T).toLocaleString("ru-RU",{minimumFractionDigits:a,maximumFractionDigits:a})}${c}`,j<1&&requestAnimationFrame(g)};requestAnimationFrame(g)},vt=C.querySelectorAll("[data-count]");if(!it&&"IntersectionObserver"in window){const t=new IntersectionObserver(e=>{for(const a of e)a.isIntersecting&&(t.unobserve(a.target),bt(a.target))},{threshold:.4});vt.forEach(e=>t.observe(e))}const yt=async()=>{const t=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:t})})};document.querySelector("#show-top")?.addEventListener("change",yt),document.querySelector("#tune")?.addEventListener("submit",async t=>{t.preventDefault();const e=document.querySelector("#tune-note"),a=document.querySelector("#motto"),c=document.querySelector('input[name="accent"]:checked'),d=await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({motto:a?.value??"",accent:c?.value??""})});if(d.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}if(!d.ok){e.textContent="Не сохранилось. Выбери цвет из списка и укороти строку.";return}location.reload()}),document.querySelector("#resync")?.addEventListener("click",async()=>{const t=document.querySelector("#sync-note"),e=document.querySelector("#resync");e.disabled=!0,t.classList.add("dossier-alert"),t.textContent="Обновляю статистику…";try{const a=await fetch(`https://wardogstracker.gg/api/v1/players/${b}`,{signal:AbortSignal.timeout(8e3)}),c=a.ok?await a.json().catch(()=>null):null,d=await fetch("/api/me/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(c&&c.player?{player:c.player}:{}),signal:AbortSignal.timeout(8e3)});if(d.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${b}`)}`;return}const g=await d.json().catch(()=>({}));if(g.saved){const l=new URL("/p/",location.origin);l.searchParams.set("id",b),g.unchanged&&l.searchParams.set("sync","same"),g.coins?l.searchParams.set("reward",String(g.coins)):g.already&&l.searchParams.set("reward","done"),location.href=l.pathname+l.search;return}t.textContent=g.reason==="tracker_down"?"База карьеры не ответила. Нажми ещё раз.":"В открытой базе этого игрока ещё нет."}catch{t.textContent="Слишком долго. Нажми ещё раз — запрос оборвался."}e.disabled=!1}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const t=document.querySelector("#copy-profile");if(!t)return;const e=location.href;let a=!1;try{await navigator.clipboard.writeText(e),a=!0}catch{const c=document.createElement("textarea");c.value=e,c.setAttribute("readonly",""),c.style.position="fixed",c.style.left="-9999px",document.body.append(c),c.select();try{a=document.execCommand("copy")}catch{a=!1}c.remove()}t.textContent=a?"Ссылка скопирована":"Не скопировалось"})}}else try{const r=(await fetch("/api/me").then(p=>p.json()))?.user?.steam_id;/^\d{17}$/.test(r||"")?location.replace(`/p/?id=${r}`):C.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{C.innerHTML="<h1>Такой страницы нет</h1>"}
