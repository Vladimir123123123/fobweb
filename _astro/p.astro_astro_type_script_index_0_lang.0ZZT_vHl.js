const F=document.querySelector("#profile"),xe=JSON.parse(F.getAttribute("data-guns")||"{}"),G=new URLSearchParams(location.search),v=G.get("id")??"",f=G.get("sync")??"",_e=G.get("job")??"",ce=G.get("reward")??"",o=r=>String(r??"").replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i]??i);function le(r){return r==null?"—":`$${new Intl.NumberFormat("ru-RU").format(r)}`}const p=r=>r==null?"—":new Intl.NumberFormat("ru-RU").format(r);function S(r){const i=new Date(String(r??""));return Number.isNaN(i.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(i)}function X(r){const i=new Date(String(r??""));return Number.isNaN(i.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(i)}function R(r,i){if(r==null||i==null)return"";const u=Number(r)-Number(i);if(!u)return"";const a=u>0?"+":"−";return`<em class="${u>0?"up":"down"}">${a}${new Intl.NumberFormat("ru-RU").format(Math.abs(u))}</em>`}function Se(r,i="#e4b04a"){const u=r.map(m=>m.wardog_level??0);if(u.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const a=Math.max(...u,1),h=Math.min(...u),$=Math.max(a-h,1),x=640,y=180,O=x/(u.length-1),Y=m=>18+(1-(m-h)/$)*(y-44),b=u.map((m,w)=>[w*O,Y(m)]);let D=`M${b[0][0]},${b[0][1]}`;for(let m=0;m<b.length-1;m++){const w=b[m-1]??b[m],q=b[m],k=b[m+1],B=b[m+2]??k,P=q[0]+(k[0]-w[0])/6,E=k[0]-(B[0]-q[0])/6,T=Math.min(Math.max(q[1]+(k[1]-w[1])/6,0),y),s=Math.min(Math.max(k[1]-(B[1]-q[1])/6,0),y);D+=` C${P.toFixed(1)},${T.toFixed(1)} ${E.toFixed(1)},${s.toFixed(1)} ${k[0].toFixed(1)},${k[1].toFixed(1)}`}const M=`${D} L${x},${y} L0,${y} Z`,K=u.at(-1)??0,A=`lvl${Math.random().toString(36).slice(2,7)}`,U=[.25,.5,.75].map(m=>`<line class="grid-line" x1="0" x2="${x}" y1="${(y*m).toFixed(0)}" y2="${(y*m).toFixed(0)}"></line>`).join("");return`<svg class="dossier-chart" viewBox="0 0 ${x} ${y}" preserveAspectRatio="none" role="img" aria-label="Уровень по снимкам">
      <defs>
        <linearGradient id="${A}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb703" stop-opacity="0.55"/><stop offset="1" stop-color="#ffb703" stop-opacity="0"/></linearGradient>
        <filter id="${A}g" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      ${U}
      <path d="${M}" fill="url(#${A})"></path>
      <path d="${D}" fill="none" stroke="#ffb703" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" filter="url(#${A}g)"></path>
    </svg>
    <p class="dossier-axis"><span>${o(X(r[0]?.created_at))}</span><span>${o(X(r.at(-1)?.created_at))} · ${p(K)} ур.</span></p>`}async function Me(){F.innerHTML="<p>Steam забирает карьеру из игры. WARDOGS должен быть закрыт. Не закрывай вкладку.</p>";for(let r=0;r<45;r++){const i=await fetch(`/api/auth/status?job=${encodeURIComponent(_e)}`).then(h=>h.json()).catch(()=>null);if(!i||i.status==="pending"){await new Promise(h=>setTimeout(h,2e3));continue}const u=i.next||(v?`/p/?id=${v}`:"/ratings"),a=new URL(u,location.origin);i.status==="ok"?(i.flag?a.searchParams.set("sync",i.flag):a.searchParams.delete("sync"),i.coins>0?a.searchParams.set("reward",String(i.coins)):i.already&&a.searchParams.set("reward","done"),!a.searchParams.get("id")&&i.steamId&&a.searchParams.set("id",i.steamId)):a.searchParams.set("sync",i.sync||"expired"),a.searchParams.delete("job"),location.replace(a.pathname+a.search);return}location.replace(v?`/p/?id=${v}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(f==="wait")await Me();else if(/^\d{17}$/.test(v)){const[r,i,u]=await Promise.all([fetch(`/api/players/${v}`).then(async a=>a.ok?a.json():null),fetch("/api/me").then(a=>a.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async a=>a.ok?a.json():null).catch(()=>null)]);if(!r)F.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const a=r.user,h=r.history,$=h.at(-1),x=h.length>1?h.at(-2):void 0,y=i.user?.steam_id===v,O=!h.length,b=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([e,t,n])=>({key:e,name:t,icon:n,level:Number($?.[e]??0)||0})),D=Math.max(...b.map(e=>e.level),1),M=b.reduce((e,t)=>t.level>e.level?t:e,b[0]),A=(u?.players??[]).findIndex(e=>String(e.steam_id)===v),U=!!a.hide_leaderboard||!a.cis_opt_in,m=A>=0?`место #${A+1}`:U?"скрыт из топа":"вне топ-200",w=r.squad,k=(e=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(e??""))?String(e):"")(w?.logo),P=["orange","gold","blue","red","green"].find(e=>e===a.accent)??"",E={orange:"#ff4d1c",gold:"#e4b04a",blue:"#6ea2ff",red:"#ff5a4a",green:"#3dba7a"},T=String(a.motto??"").trim(),s=r.combat,de=e=>e==="win"?"Победа":e==="loss"?"Поражение":e==="leave"?"Досрочный выход":"—",pe=e=>e==="win"?"win":e==="loss"?"loss":"",_=(s?.history??[]).filter(e=>e.result==="win"||e.result==="loss"),H=_.length,Q=r.punishments??[],ue=e=>e.untilAt?`до ${S(e.untilAt)}`:e.active?"до снятия":e.liftedAt?`снято ${S(e.liftedAt)}`:"—",z={lone:"/brand/operators/lone.webp",valk:"/brand/operators/valk.webp",mant:"/brand/operators/mant.webp"}[String(s?.side||"")]??"",ee=e=>{const t=e.toLowerCase();return t.includes("valk")?"valk":t.includes("mant")?"mant":t.includes("lone")?"lone":""},me=e=>{const t=e.toLowerCase();return t.includes("valk")?"/brand/factions/vk.png":t.includes("mant")?"/brand/factions/mc.png":t.includes("lone")||t.includes("star")?"/brand/factions/ls.png":""},he=e=>{const t=e.trim(),n=t.toLowerCase();return!t||n==="white"||n==="unknown"?"":t},te=e=>{const t=e.toLowerCase();return t.includes("ozet")||t.includes("madrid")||t.includes("europe")?{file:"ozeti",title:"Ozeti"}:t.includes("sabat")||t.includes("moscow")||t.includes("russia")?{file:"sabatulo",title:"Sabatulo"}:t.includes("bakur")||t.includes("kavkaz")?{file:"bakurani",title:"Bakurani"}:t.includes("zesta")||t.includes("america")||t.includes("detroit")?{file:"zestafona",title:"Zestafona"}:null},W=e=>{const t=e.trim().toLowerCase();return!t||t==="default"||t==="неизвестно"?"":xe[t]||""},Z=(e,t,n="")=>`<span class="piece${n?` ${n}`:""}">${e?`<img src="${e}" alt="" />`:""}<span>${o(t)}</span></span>`,se=e=>e?.name?`${o(e.name)} · ${p(e.count)}×`:"—",J=s?.weapons??[],$e=Math.max(...J.map(e=>Number(e.kills)||0),1),ae=s?.since||s?.last?`Играет здесь с ${o(S(s?.since)||"—")} · последний раз ${o(S(s?.last)||"—")}`:"",N=(e,t=0,n="")=>{if(e==null||e===""||!Number.isFinite(Number(e)))return"<b>—</b>";const c=Number(e),d=c.toLocaleString("ru-RU",{minimumFractionDigits:t,maximumFractionDigits:t});return`<b data-count="${c}" data-dec="${t}" data-suffix="${o(n)}">${d}${o(n)}</b>`},ne={crosshair:'<circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 20h8"/>',ruler:'<path d="M3 15 15 3l6 6L9 21 3 15Z"/><path d="m7 11 2 2M10 8l2 2M13 5l2 2"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',swords:'<path d="m5 19 9-9M14 5h5v5M5 5l14 14"/>',shield:'<path d="M12 3 4 6v6c0 4.500 3.400 7.700 8 9 4.600-1.300 8-4.500 8-9V6l-8-3Z"/>'},C=e=>`<svg class="tile-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ne[e]??""}</svg>`,ge=[..._].sort((e,t)=>(Date.parse(String(e.endedAt))||0)-(Date.parse(String(t.endedAt))||0)),V=e=>{const t=ge.map(l=>l[e]==null?Number.NaN:Number(l[e])).filter(l=>Number.isFinite(l)).slice(-14);if(t.length<2)return"";const n=Math.max(...t),c=Math.min(...t),d=Math.max(n-c,1e-6),g=t.map((l,j)=>`${j?"L":"M"}${(j*(100/(t.length-1))).toFixed(1)},${(34-(l-c)/d*28).toFixed(1)}`).join(" ");return`<svg class="spark" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true"><path class="spark-fill" d="${g} L100,36 L0,36 Z"/><path class="spark-line" d="${g}" vector-effect="non-scaling-stroke"/></svg>`},be=_.map(e=>te(String(e.map||""))).find(Boolean)?.file??"ozeti",oe=Number(ce),fe=oe>0?`За обновление статистики начислено ${oe} очков. Следующие — завтра.`:ce==="done"?"Сегодняшние 10 очков за обновление статистики уже начислены.":"",ve=f==="same"?"Цифры те же, что уже были. Свежее игра отдаст, если закрыть WARDOGS и снять ещё раз.":f==="game_running"?"Игра была запущена — карьеру так не снять. Полностью закрой WARDOGS (не сверни), потом «Снять из игры» или «Обновить статистику».":f==="stale"?"Игра не отдала свежий снимок. Записали последние известные цифры. Закрой клиент и сними ещё раз.":f==="access_denied"?"Steam отменён. Нажми «Снять из игры» и подтверди вход.":f==="expired"?"Код входа истёк. Нажми «Снять из игры» ещё раз.":f==="token_timeout"||f==="token_err"||f&&f.startsWith("token_")?"Tracker не успел отдать карьеру. Закрой WARDOGS и нажми «Снять из игры» ещё раз.":f&&f!=="ok"&&f!=="wait"?"Не вышло снять карьеру. Закрой игру и нажми ещё раз.":O&&!s?"Цифр ещё нет. Сделай по шагам: 1) полностью закрой WARDOGS; 2) нажми «Обновить статистику» или «Снять из игры»; 3) подтверди Steam. Пока игра открыта — снимок не пишется.":"",re=[fe,ve].filter(Boolean).join(" ");F.innerHTML=`
        <article class="dossier"${P?` data-accent="${P}"`:""}>
          <header class="dossier-hero${z?" has-op":""}">
            <img class="dossier-bg dossier-map" alt="" src="/brand/maps/${be}.webp" />
            ${a.avatar?`<img class="dossier-bg dossier-tint" alt="" src="${o(a.avatar)}" />`:""}
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${o(a.avatar??"")}" />
                ${k?`<img class="dossier-clan" alt="" src="${o(k)}" />`:""}
              </div>
              <div>
                <p class="eyebrow">Досье · сезон ${o(String(u?.season||"03"))}</p>
                <h1>${o(a.persona??a.steam_id)}</h1>
                ${T?`<p class="dossier-line">${o(T)}</p>`:""}
                <div class="dossier-tags">
                  <span class="pill">${o(m)}</span>
                  ${M.level?`<span class="pill now">${o(M.name)} ${M.level}</span>`:""}
                  ${w?`<a class="pill" href="/squad/?id=${w.id}">[${o(w.tag)}] ${o(w.name)}</a>`:'<span class="pill old">без сквада</span>'}
                  ${a.country?`<span class="pill">${o(a.country)}</span>`:""}
                  ${a.discord_name?`<span class="pill">Discord ${o(a.discord_name)}</span>`:""}
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
          ${re?`<p class="note dossier-alert" id="sync-note">${o(re)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${R($?.xp,x?.xp)}</span><b>${p($?.xp)}</b></div>
            <div><span>Деньги ${R($?.cash,x?.cash)}</span><b>${le($?.cash)}</b></div>
            <div><span>Золото ${R($?.gold,x?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${$?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${$?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${le($?.account_value)}</b></div>
            <div><span>Снимков</span><b>${h.length}</b></div>
          </section>
          ${s?`<section class="fight-card">
            <header>
              <p class="eyebrow">Статистика игрока</p>
              <p>Этот сервер, за всё время</p>
            </header>
            <div class="bento">
              <div class="tile tile-kd">
                <span>К/Д</span>
                ${N(s.kd,2)}
                <small>${p(s.kills)} убийств · ${p(s.deaths)} смертей</small>
                <em>Место #${p(s.place)} из ${p(s.of)}</em>
                ${V("kd")}
              </div>
              <div class="tile tile-win">
                <div class="tile-ring" style="--p:${Math.max(0,Math.min(100,Number(s.winrate)||0))}" aria-hidden="true">
                  <b>${s.winrate==null?"—":`${Number(s.winrate).toFixed(0)}%`}</b>
                </div>
                <span>Винрейт · последние 10</span>
                <small>${Number(s.winGames)>0?`${p(s.winGames)} ${Number(s.winGames)===1?"матч":Number(s.winGames)<5?"матча":"матчей"} · от 80 игроков`:"Матчи от 80 игроков, 15+ мин"}</small>
                ${(s.form??[]).length?`<div class="form" role="img" aria-label="Последние игры">${(s.form??[]).slice().reverse().map(e=>`<i class="${e==="win"?"win":"loss"}" title="${e==="win"?"Победа":"Поражение"}"></i>`).join("")}</div>`:""}
              </div>
              <div class="tile">
                <span>ELO · FOB</span>
                ${N(s.elo)}
                <small>${s.eloLevel!=null?`уровень ${p(s.eloLevel)}`:"после побед на сервере"}${Number(s.eloGames)>0?` · ${p(s.eloGames)} игр`:""}</small>
              </div>
              <div class="tile"><span>Хедшоты</span>${N(s.headshotPct,1,"%")}<small>${s.headshots==null?"":`${p(s.headshots)} шт.`}</small>${V("headshots")||C("crosshair")}</div>
              <div class="tile"><span>Лучший матч</span>${N(s.bestMatch)}<small>убийств</small>${V("kills")||C("trophy")}</div>
              <div class="tile"><span>Самое дальнее</span>${N(s.longest,0," м")}${C("ruler")}</div>
              <div class="tile"><span>Ср. дистанция</span>${N(s.average,0," м")}${C("target")}</div>
              <div class="tile"><span>Матчи</span>${H?N(H):"<b>—</b>"}<small>${H?`по ${s.perMatch??"—"} убийств`:""}</small>${C("swords")}</div>
              <div class="tile"><span>Основная сторона</span><b class="${ee(String(s.faction||""))}">${o(String(s.faction||"").trim())||"—"}</b>${C("shield")}</div>
              <div class="tile"><span>Убийства своих</span>${N(s.teamkills)}${C("shield")}</div>
              <div class="tile tile-wide">
                <p><span>Заклятый враг</span><b>${se(s.enemy)}</b></p>
                <p><span>Любимая цель</span><b>${se(s.target)}</b></p>
              </div>
            </div>
            ${J.length?`<div class="fight-card-guns">
              <p class="eyebrow">Оружие</p>
              ${J.map((e,t)=>{const n=String(e.name||"неизвестно"),c=W(n),d=Number(e.kills)||0,l=d>=10&&(Number(e.headshots)||0)/d>=.2?`<svg class="gun-tag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" role="img" aria-label="Много хедшотов"><title>Много хедшотов</title>${ne.crosshair}</svg>`:"";return`<p class="gun-bar">${c?`<img src="/art/${c}" alt="" />`:'<span class="ico-gap">—</span>'}<span class="gun-body"><b>${o(n)}${l}</b><i><u style="--w:${Math.max(3,Math.round(d/$e*100))}%;--d:${t*90}ms"></u></i></span><span class="gun-num"><strong>${p(e.kills)}</strong> · ${p(e.headshots)} HS</span></p>`}).join("")}
            </div>`:'<p class="note">Оружие, хедшоты и дистанция появятся со следующими убийствами, которые пришлёт сервер.</p>'}
            ${ae?`<p class="note">${ae}</p>`:""}
          </section>
          ${_.length?`<section class="match-log">
            <header>
              <p class="eyebrow">Матчи</p>
              <p>Сезон · от 80 игроков · 15+ мин · этот сервер</p>
            </header>
            <div class="match-scroll">
              <table>
                <thead>
                  <tr>${_.some(e=>S(e.endedAt))?"<th>Завершено</th>":""}${_.some(e=>String(e.server||"").trim())?"<th>Сервер</th>":""}<th>Карта</th><th>Сторона</th><th>Результат</th><th>Место</th><th>У</th><th>С</th><th>К/Д</th><th>ХШ</th><th>ТК</th><th>Оружие</th></tr>
                </thead>
                <tbody>
                  ${_.map(e=>{const t=te(String(e.map||"")),n=t?.title||String(e.map||""),c=n?Z(t?`/brand/maps/${t.file}.webp`:"",`${n}${e.minutes?` · ${p(e.minutes)} мин`:""}`,"map"):"—",d=he(String(e.faction||"")),g=d?Z(me(d),d):"—",l=String(e.weapon||"").trim(),j=l&&l.toLowerCase()!=="default"?Z(W(l)?`/art/${W(l)}`:"",l,"gun"):"—";return`<tr>
                    ${S(e.endedAt)||_.some(I=>S(I.endedAt))?`<td>${o(S(e.endedAt)||"—")}</td>`:""}
                    ${String(e.server||"").trim()||_.some(I=>String(I.server||"").trim())?`<td>${o(e.server||"—")}</td>`:""}
                    <td>${c}</td>
                    <td class="${ee(d)}">${g}</td>
                    <td class="${pe(e.result)}">${de(e.result)}</td>
                    <td>${e.place?`#${p(e.place)}${e.field?` из ${p(e.field)}`:""}`:"—"}</td>
                    <td>${p(e.kills)}</td>
                    <td>${p(e.deaths)}</td>
                    <td>${e.kd==null?"—":Number(e.kd).toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td>${p(e.headshots)}</td>
                    <td>${p(e.teamkills)}</td>
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
                ${Q.map(e=>`<tr>
                  <td>${e.kind==="ban"?"Бан":"Наказание"}</td>
                  <td>${o(e.reason||"не указана")}</td>
                  <td>${o(S(e.startedAt)||"—")}</td>
                  <td>${o(ue(e))}</td>
                </tr>`).join("")}
              </tbody>
            </table>
          </section>`:""}
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${M.level?o(M.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${b.map(e=>`
                  <div class="lane${e.name===M.name&&e.level?" lead":""}">
                    <img src="${e.icon}" alt="" />
                    <span>${e.name}</span>
                    <i><b style="width:${Math.round(e.level/D*100)}%"></b></i>
                    <strong>${e.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${h.length>1?R($?.wardog_level,h[0]?.wardog_level)?`${R($?.wardog_level,h[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${Se(h,E[P]??"#e4b04a")}
              <p class="note">Последний снимок: ${o(X($?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${v}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${y?`<form class="dossier-tune" id="tune">
            <label>Строка под ником
              <input id="motto" maxlength="80" value="${o(T)}" placeholder="Коротко о себе, до 80 знаков" />
            </label>
            <div class="swatches" role="radiogroup" aria-label="Цвет досье">
              ${[["","Как есть"],["orange","Огонь"],["gold","Золото"],["blue","Синий"],["red","Красный"],["green","Зелёный"]].map(([e,t])=>`
                <label class="swatch">
                  <input type="radio" name="accent" value="${e}" ${P===e?"checked":""} />
                  <i class="dot ${e||"plain"}"></i>
                  <span>${t}</span>
                </label>`).join("")}
            </div>
            <button class="btn small" type="submit">Сохранить вид</button>
            <p class="note" id="tune-note">Строку и цвет видят все, кто откроет это досье. Баннер сквада здесь не показывается.</p>
          </form>
          <div class="dossier-own">
            <a class="btn small" href="/auth/wardogs/start?next=/p&steamId=${o(v)}">Снять из игры</a>
            <button class="btn ghost small" id="resync" type="button">Из открытой базы</button>
            <label class="check"><input id="show-top" type="checkbox" ${a.cis_opt_in&&!a.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${i.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Закрой WARDOGS, нажми «Снять из игры», подтверди Steam — мы только запишем цифры. Вход на сайт в шапке отдельно.</p>
          </div>`:""}
        </article>
      `;const ie=window.matchMedia("(prefers-reduced-motion: reduce)").matches,L=F.querySelector(".dossier-hero");L&&!ie&&(L.addEventListener("pointermove",e=>{const t=L.getBoundingClientRect();L.style.setProperty("--px",((e.clientX-t.left)/t.width-.5).toFixed(3)),L.style.setProperty("--py",((e.clientY-t.top)/t.height-.5).toFixed(3))}),L.addEventListener("pointerleave",()=>{L.style.setProperty("--px","0"),L.style.setProperty("--py","0")}));const ye=e=>{const t=Number(e.dataset.count),n=Number(e.dataset.dec)||0,c=e.dataset.suffix??"",d=performance.now(),g=l=>{const j=Math.min(1,(l-d)/1200),I=1-Math.pow(1-j,3);e.textContent=`${(t*I).toLocaleString("ru-RU",{minimumFractionDigits:n,maximumFractionDigits:n})}${c}`,j<1&&requestAnimationFrame(g)};requestAnimationFrame(g)},we=F.querySelectorAll("[data-count]");if(!ie&&"IntersectionObserver"in window){const e=new IntersectionObserver(t=>{for(const n of t)n.isIntersecting&&(e.unobserve(n.target),ye(n.target))},{threshold:.4});we.forEach(t=>e.observe(t))}const ke=async()=>{const e=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:e})})};document.querySelector("#show-top")?.addEventListener("change",ke),document.querySelector("#tune")?.addEventListener("submit",async e=>{e.preventDefault();const t=document.querySelector("#tune-note"),n=document.querySelector("#motto"),c=document.querySelector('input[name="accent"]:checked'),d=await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({motto:n?.value??"",accent:c?.value??""})});if(d.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}if(!d.ok){t.textContent="Не сохранилось. Выбери цвет из списка и укороти строку.";return}location.reload()}),document.querySelector("#resync")?.addEventListener("click",async()=>{const e=document.querySelector("#sync-note"),t=document.querySelector("#resync");t.disabled=!0,e.classList.add("dossier-alert"),e.textContent="Обновляю статистику…";try{const n=await fetch(`https://wardogstracker.gg/api/v1/players/${v}`,{signal:AbortSignal.timeout(8e3)}),c=n.ok?await n.json().catch(()=>null):null,d=await fetch("/api/me/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(c&&c.player?{player:c.player}:{}),signal:AbortSignal.timeout(8e3)});if(d.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${v}`)}`;return}const g=await d.json().catch(()=>({}));if(g.saved){const l=new URL("/p/",location.origin);l.searchParams.set("id",v),g.unchanged&&l.searchParams.set("sync","same"),g.coins?l.searchParams.set("reward",String(g.coins)):g.already&&l.searchParams.set("reward","done"),location.href=l.pathname+l.search;return}e.textContent=g.reason==="tracker_down"?"База карьеры не ответила. Нажми ещё раз.":"В открытой базе этого игрока ещё нет."}catch{e.textContent="Слишком долго. Нажми ещё раз — запрос оборвался."}t.disabled=!1}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const e=document.querySelector("#copy-profile");if(!e)return;const t=location.href;let n=!1;try{await navigator.clipboard.writeText(t),n=!0}catch{const c=document.createElement("textarea");c.value=t,c.setAttribute("readonly",""),c.style.position="fixed",c.style.left="-9999px",document.body.append(c),c.select();try{n=document.execCommand("copy")}catch{n=!1}c.remove()}e.textContent=n?"Ссылка скопирована":"Не скопировалось"})}}else try{const i=(await fetch("/api/me").then(u=>u.json()))?.user?.steam_id;/^\d{17}$/.test(i||"")?location.replace(`/p/?id=${i}`):F.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{F.innerHTML="<h1>Такой страницы нет</h1>"}
