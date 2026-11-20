const L=document.querySelector("#profile"),dt=JSON.parse(L.getAttribute("data-guns")||"{}"),A=new URLSearchParams(location.search),m=A.get("id")??"",w=A.get("sync")??"",pt=A.get("job")??"",Q=A.get("reward")??"",r=s=>String(s??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a]??a);function V(s){return s==null?"—":`$${new Intl.NumberFormat("ru-RU").format(s)}`}const c=s=>s==null?"—":new Intl.NumberFormat("ru-RU").format(s);function ut(s){if(s==null||s==="")return"—";const a=Number(s);return Number.isFinite(a)?a.toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2}):"—"}function v(s){const a=new Date(String(s??""));return Number.isNaN(a.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(a)}function G(s){const a=new Date(String(s??""));return Number.isNaN(a.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(a)}function x(s,a){if(s==null||a==null)return"";const l=Number(s)-Number(a);if(!l)return"";const n=l>0?"+":"−";return`<em class="${l>0?"up":"down"}">${n}${new Intl.NumberFormat("ru-RU").format(Math.abs(l))}</em>`}function mt(s,a="#e4b04a"){const l=s.map(k=>k.wardog_level??0);if(l.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const n=Math.max(...l,1),d=Math.min(...l),p=Math.max(n-d,1),b=640,S=160,P=b/(l.length-1),R=k=>16+(1-(k-d)/p)*(S-36),_=l.map((k,N)=>`${N===0?"M":"L"}${N*P},${R(k)}`).join(" "),T=`${_} L${b},${S} L0,${S} Z`,g=l.at(-1)??0;return`<svg class="dossier-chart" viewBox="0 0 ${b} ${S}" role="img" aria-label="Уровень по снимкам">
      <defs><linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}" stop-opacity="0.45"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></linearGradient></defs>
      <path d="${T}" fill="url(#lvl)"></path>
      <path d="${_}" fill="none" stroke="${a}" stroke-width="2.5"></path>
      <circle cx="${b}" cy="${R(g)}" r="4" fill="${a}"></circle>
    </svg>
    <p class="dossier-axis"><span>${r(G(s[0]?.created_at))}</span><span>${r(G(s.at(-1)?.created_at))} · ${c(g)} ур.</span></p>`}async function ht(){L.innerHTML="<p>Steam забирает карьеру из игры. WARDOGS должен быть закрыт. Не закрывай вкладку.</p>";for(let s=0;s<45;s++){const a=await fetch(`/api/auth/status?job=${encodeURIComponent(pt)}`).then(d=>d.json()).catch(()=>null);if(!a||a.status==="pending"){await new Promise(d=>setTimeout(d,2e3));continue}const l=a.next||(m?`/p/?id=${m}`:"/ratings"),n=new URL(l,location.origin);a.status==="ok"?(a.flag?n.searchParams.set("sync",a.flag):n.searchParams.delete("sync"),a.coins>0?n.searchParams.set("reward",String(a.coins)):a.already&&n.searchParams.set("reward","done"),!n.searchParams.get("id")&&a.steamId&&n.searchParams.set("id",a.steamId)):n.searchParams.set("sync",a.sync||"expired"),n.searchParams.delete("job"),location.replace(n.pathname+n.search);return}location.replace(m?`/p/?id=${m}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(w==="wait")await ht();else if(/^\d{17}$/.test(m)){const[s,a,l]=await Promise.all([fetch(`/api/players/${m}`).then(async n=>n.ok?n.json():null),fetch("/api/me").then(n=>n.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async n=>n.ok?n.json():null).catch(()=>null)]);if(!s)L.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const n=s.user,d=s.history,p=d.at(-1),b=d.length>1?d.at(-2):void 0,S=a.user?.steam_id===m,P=!d.length,_=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([t,e,i])=>({key:t,name:e,icon:i,level:Number(p?.[t]??0)||0})),T=Math.max(..._.map(t=>t.level),1),g=_.reduce((t,e)=>e.level>t.level?e:t,_[0]),N=(l?.players??[]).findIndex(t=>String(t.steam_id)===m),X=!!n.hide_leaderboard||!n.cis_opt_in,Y=N>=0?`место #${N+1}`:X?"скрыт из топа":"вне топ-200",j=s.squad,H=(t=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(t??""))?String(t):"")(j?.logo),C=["orange","gold","blue","red","green"].find(t=>t===n.accent)??"",tt={orange:"#ff4d1c",gold:"#e4b04a",blue:"#6ea2ff",red:"#ff5a4a",green:"#3dba7a"},D=String(n.motto??"").trim(),o=s.combat,et=t=>t==="win"?"Выиграно":t==="loss"?"Потеряно":t==="leave"?"Досрочный выход":"—",at=t=>t==="win"?"win":t==="loss"?"loss":"",f=(o?.history??[]).filter(t=>String(t.map||"").trim()||String(t.result||"").trim()),z=f.length<40?f.length:o?.matches??f.length,E=s.punishments??[],st=t=>t.untilAt?`до ${v(t.untilAt)}`:t.active?"до снятия":t.liftedAt?`снято ${v(t.liftedAt)}`:"—",M={lone:"/brand/operators/lone.webp",valk:"/brand/operators/valk.webp",mant:"/brand/operators/mant.webp"}[String(o?.side||"")]??"",J=t=>{const e=t.toLowerCase();return e.includes("valk")?"valk":e.includes("mant")?"mant":e.includes("lone")?"lone":""},nt=t=>{const e=t.toLowerCase();return e.includes("valk")?"/brand/factions/vk.png":e.includes("mant")?"/brand/factions/mc.png":e.includes("lone")||e.includes("star")?"/brand/factions/ls.png":""},ot=t=>{const e=t.trim(),i=e.toLowerCase();return!e||i==="white"||i==="unknown"?"":e},rt=t=>{const e=t.toLowerCase();return e.includes("ozet")||e.includes("madrid")||e.includes("europe")?{file:"ozeti",title:"Ozeti"}:e.includes("sabat")||e.includes("moscow")||e.includes("russia")?{file:"sabatulo",title:"Sabatulo"}:e.includes("bakur")||e.includes("kavkaz")?{file:"bakurani",title:"Bakurani"}:e.includes("zesta")||e.includes("america")||e.includes("detroit")?{file:"zestafona",title:"Zestafona"}:null},q=t=>{const e=t.trim().toLowerCase();return!e||e==="default"||e==="неизвестно"?"":dt[e]||""},I=(t,e,i="")=>`<span class="piece${i?` ${i}`:""}">${t?`<img src="${t}" alt="" />`:""}<span>${r(e)}</span></span>`,U=(t,e="")=>t==null?"—":`${c(t)}${e}`,W=t=>t?.name?`${r(t.name)} · ${c(t.count)}×`:"—",F=o?.weapons??[],it=Math.max(...F.map(t=>Number(t.kills)||0),1),B=o?.since||o?.last?`Играет здесь с ${r(v(o?.since)||"—")} · последний раз ${r(v(o?.last)||"—")}`:"",Z=Number(Q),K=[Z>0?`За обновление статистики начислено ${Z} очков. Следующие — завтра.`:Q==="done"?"Сегодняшние 10 очков за обновление статистики уже начислены.":"",w==="same"?"Цифры те же, что уже были. Свежее игра отдаст, если закрыть WARDOGS и снять ещё раз.":w==="game_running"?"Игра была запущена. Полностью закрой WARDOGS и нажми «Снять из игры».":w==="stale"?"Игра не отдала свежий снимок. Записали последние известные цифры. Закрой клиент и сними ещё раз.":w==="access_denied"?"Steam отменён. Нажми «Снять из игры» и подтверди вход.":P&&!o?"Цифр ещё нет. Закрой WARDOGS и нажми «Снять из игры» — откроется Steam, мы запишем карьеру.":w==="expired"?"Код входа истёк. Нажми «Снять из игры» ещё раз.":w&&w!=="ok"?"Не вышло снять карьеру. Закрой игру и нажми ещё раз.":""].filter(Boolean).join(" ");L.innerHTML=`
        <article class="dossier"${C?` data-accent="${C}"`:""}>
          <header class="dossier-hero${M?" has-op":""}">
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${r(n.avatar??"")}" />
                ${H?`<img class="dossier-clan" alt="" src="${r(H)}" />`:""}
              </div>
              <div>
                <p class="eyebrow">Досье · сезон ${r(String(l?.season||"03"))}</p>
                <h1>${r(n.persona??n.steam_id)}</h1>
                ${D?`<p class="dossier-line">${r(D)}</p>`:""}
                <div class="dossier-tags">
                  <span class="pill">${r(Y)}</span>
                  ${g.level?`<span class="pill now">${r(g.name)} ${g.level}</span>`:""}
                  ${j?`<a class="pill" href="/squad/?id=${j.id}">[${r(j.tag)}] ${r(j.name)}</a>`:'<span class="pill old">без сквада</span>'}
                  ${n.country?`<span class="pill">${r(n.country)}</span>`:""}
                  ${n.discord_name?`<span class="pill">Discord ${r(n.discord_name)}</span>`:""}
                </div>
              </div>
              <div class="dossier-level">
                <img src="/art/t_ui_icon_careerlevel_600.webp" alt="" />
                <b>${p?.wardog_level??"—"}</b>
                <span>уровень ${x(p?.wardog_level,b?.wardog_level)}</span>
              </div>
            </div>
            ${M?`<img class="dossier-op" alt="" src="${M}" />`:""}
          </header>
          ${K?`<p class="note dossier-alert" id="sync-note">${r(K)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${x(p?.xp,b?.xp)}</span><b>${c(p?.xp)}</b></div>
            <div><span>Деньги ${x(p?.cash,b?.cash)}</span><b>${V(p?.cash)}</b></div>
            <div><span>Золото ${x(p?.gold,b?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${p?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${p?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${V(p?.account_value)}</b></div>
            <div><span>Снимков</span><b>${d.length}</b></div>
          </section>
          ${o?`<section class="fight-card">
            <header>
              <p class="eyebrow">Статистика игрока</p>
              <p>Этот сервер, за всё время</p>
            </header>
            <div class="fight-card-hero">
              <div>
                <b>${ut(o.kd)}</b>
                <span>К/Д</span>
              </div>
              <div>
                <strong>${c(o.kills)} убийств · ${c(o.deaths)} смертей</strong>
                <span>Место #${c(o.place)} из ${c(o.of)}</span>
              </div>
            </div>
            <div class="fight-card-grid">
              <div><span>Хедшоты</span><b>${o.headshotPct==null?"—":`${Number(o.headshotPct).toLocaleString("ru-RU",{maximumFractionDigits:1})}%`} <small>${o.headshots==null?"":c(o.headshots)}</small></b></div>
              <div><span>Самое дальнее убийство</span><b>${U(o.longest," м")}</b></div>
              <div><span>Ср. дистанция</span><b>${U(o.average," м")}</b></div>
              <div><span>Лучший матч</span><b>${o.bestMatch==null?"—":`${c(o.bestMatch)} убийств`}</b></div>
              <div><span>Матчи</span><b>${z?`${c(z)} <small>по ${o.perMatch??"—"} убийств каждый</small>`:"—"}</b></div>
              <div><span>Основная сторона</span><b class="${J(String(o.faction||""))}">${r(String(o.faction||"").trim())||"—"}</b></div>
              <div><span>Убийства своих</span><b>${U(o.teamkills)}</b></div>
              <div><span>Винрейт</span><b>${o.winrate==null?"—":`${Number(o.winrate).toLocaleString("ru-RU",{maximumFractionDigits:1})}%`}</b></div>
            </div>
            <div class="fight-card-rivals">
              <p class="eyebrow">Соперники</p>
              <p><span>Заклятый враг</span><b>${W(o.enemy)}</b></p>
              <p><span>Любимая цель</span><b>${W(o.target)}</b></p>
            </div>
            ${F.length?`<div class="fight-card-guns">
              <p class="eyebrow">Оружие</p>
              ${F.map(t=>{const e=String(t.name||"неизвестно"),i=q(e);return`<p><i style="width:${Math.round((Number(t.kills)||0)/it*100)}%"></i>${i?`<img src="/art/${i}" alt="" />`:""}<b>${r(e)}</b><span>${c(t.kills)} · ${c(t.headshots)} HS</span></p>`}).join("")}
            </div>`:'<p class="note">Оружие, хедшоты и дистанция появятся со следующими убийствами, которые пришлёт сервер.</p>'}
            ${B?`<p class="note">${B}</p>`:""}
          </section>
          ${f.length?`<section class="match-log">
            <header>
              <p class="eyebrow">Матчи</p>
              <p>Этот сервер, хранить навсегда</p>
            </header>
            <div class="match-scroll">
              <table>
                <thead>
                  <tr>${f.some(t=>v(t.endedAt))?"<th>Завершено</th>":""}${f.some(t=>String(t.server||"").trim())?"<th>Сервер</th>":""}<th>Карта</th><th>Сторона</th><th>Результат</th><th>Место</th><th>У</th><th>С</th><th>К/Д</th><th>ХШ</th><th>ТК</th><th>Оружие</th></tr>
                </thead>
                <tbody>
                  ${f.map(t=>{const e=rt(String(t.map||"")),i=e?.title||String(t.map||""),u=i?I(e?`/brand/maps/${e.file}.webp`:"",`${i}${t.minutes?` · ${c(t.minutes)} мин`:""}`,"map"):"—",$=ot(String(t.faction||"")),y=$?I(nt($),$):"—",h=String(t.weapon||"").trim(),lt=h&&h.toLowerCase()!=="default"?I(q(h)?`/art/${q(h)}`:"",h,"gun"):"—";return`<tr>
                    ${v(t.endedAt)||f.some(O=>v(O.endedAt))?`<td>${r(v(t.endedAt)||"—")}</td>`:""}
                    ${String(t.server||"").trim()||f.some(O=>String(O.server||"").trim())?`<td>${r(t.server||"—")}</td>`:""}
                    <td>${u}</td>
                    <td class="${J($)}">${y}</td>
                    <td class="${at(t.result)}">${et(t.result)}</td>
                    <td>${t.place?`#${c(t.place)}${t.field?` из ${c(t.field)}`:""}`:"—"}</td>
                    <td>${c(t.kills)}</td>
                    <td>${c(t.deaths)}</td>
                    <td>${t.kd==null?"—":Number(t.kd).toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td>${c(t.headshots)}</td>
                    <td>${c(t.teamkills)}</td>
                    <td>${lt}</td>
                  </tr>`}).join("")}
                </tbody>
              </table>
            </div>
          </section>`:""}`:""}
          ${E.length?`<section class="punishments">
            <header>
              <p class="eyebrow">Наказания</p>
              <p>Этот сервер</p>
            </header>
            <table>
              <thead><tr><th>Что</th><th>За что</th><th>Когда</th><th>Срок</th></tr></thead>
              <tbody>
                ${E.map(t=>`<tr>
                  <td>${t.kind==="ban"?"Бан":"Наказание"}</td>
                  <td>${r(t.reason||"не указана")}</td>
                  <td>${r(v(t.startedAt)||"—")}</td>
                  <td>${r(st(t))}</td>
                </tr>`).join("")}
              </tbody>
            </table>
          </section>`:""}
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${g.level?r(g.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${_.map(t=>`
                  <div class="lane${t.name===g.name&&t.level?" lead":""}">
                    <img src="${t.icon}" alt="" />
                    <span>${t.name}</span>
                    <i><b style="width:${Math.round(t.level/T*100)}%"></b></i>
                    <strong>${t.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${d.length>1?x(p?.wardog_level,d[0]?.wardog_level)?`${x(p?.wardog_level,d[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${mt(d,tt[C]??"#e4b04a")}
              <p class="note">Последний снимок: ${r(G(p?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${m}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${S?`<form class="dossier-tune" id="tune">
            <label>Строка под ником
              <input id="motto" maxlength="80" value="${r(D)}" placeholder="Коротко о себе, до 80 знаков" />
            </label>
            <div class="swatches" role="radiogroup" aria-label="Цвет досье">
              ${[["","Как есть"],["orange","Огонь"],["gold","Золото"],["blue","Синий"],["red","Красный"],["green","Зелёный"]].map(([t,e])=>`
                <label class="swatch">
                  <input type="radio" name="accent" value="${t}" ${C===t?"checked":""} />
                  <i class="dot ${t||"plain"}"></i>
                  <span>${e}</span>
                </label>`).join("")}
            </div>
            <button class="btn small" type="submit">Сохранить вид</button>
            <p class="note" id="tune-note">Строку и цвет видят все, кто откроет это досье. Баннер сквада здесь не показывается.</p>
          </form>
          <div class="dossier-own">
            <a class="btn small" href="/auth/wardogs/start?next=/p&steamId=${r(m)}">Снять из игры</a>
            <button class="btn ghost small" id="resync" type="button">Из открытой базы</button>
            <label class="check"><input id="show-top" type="checkbox" ${n.cis_opt_in&&!n.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${a.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Закрой WARDOGS, нажми «Снять из игры», подтверди Steam — мы только запишем цифры. Вход на сайт в шапке отдельно.</p>
          </div>`:""}
        </article>
      `;const ct=async()=>{const t=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:t})})};document.querySelector("#show-top")?.addEventListener("change",ct),document.querySelector("#tune")?.addEventListener("submit",async t=>{t.preventDefault();const e=document.querySelector("#tune-note"),i=document.querySelector("#motto"),u=document.querySelector('input[name="accent"]:checked'),$=await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({motto:i?.value??"",accent:u?.value??""})});if($.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}if(!$.ok){e.textContent="Не сохранилось. Выбери цвет из списка и укороти строку.";return}location.reload()}),document.querySelector("#resync")?.addEventListener("click",async()=>{const t=document.querySelector("#sync-note"),e=document.querySelector("#resync");e.disabled=!0,t.classList.add("dossier-alert"),t.textContent="Обновляю статистику…";try{const i=await fetch(`https://wardogstracker.gg/api/v1/players/${m}`,{signal:AbortSignal.timeout(8e3)}),u=i.ok?await i.json().catch(()=>null):null,$=await fetch("/api/me/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(u&&u.player?{player:u.player}:{}),signal:AbortSignal.timeout(8e3)});if($.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${m}`)}`;return}const y=await $.json().catch(()=>({}));if(y.saved){const h=new URL("/p/",location.origin);h.searchParams.set("id",m),y.unchanged&&h.searchParams.set("sync","same"),y.coins?h.searchParams.set("reward",String(y.coins)):y.already&&h.searchParams.set("reward","done"),location.href=h.pathname+h.search;return}t.textContent=y.reason==="tracker_down"?"База карьеры не ответила. Нажми ещё раз.":"В открытой базе этого игрока ещё нет."}catch{t.textContent="Слишком долго. Нажми ещё раз — запрос оборвался."}e.disabled=!1}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const t=document.querySelector("#copy-profile");if(!t)return;const e=location.href;let i=!1;try{await navigator.clipboard.writeText(e),i=!0}catch{const u=document.createElement("textarea");u.value=e,u.setAttribute("readonly",""),u.style.position="fixed",u.style.left="-9999px",document.body.append(u),u.select();try{i=document.execCommand("copy")}catch{i=!1}u.remove()}t.textContent=i?"Ссылка скопирована":"Не скопировалось"})}}else try{const a=(await fetch("/api/me").then(l=>l.json()))?.user?.steam_id;/^\d{17}$/.test(a||"")?location.replace(`/p/?id=${a}`):L.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{L.innerHTML="<h1>Такой страницы нет</h1>"}
