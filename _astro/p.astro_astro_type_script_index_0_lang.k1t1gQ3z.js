const k=document.querySelector("#profile"),ct=JSON.parse(k.getAttribute("data-guns")||"{}"),G=new URLSearchParams(location.search),m=G.get("id")??"",v=G.get("sync")??"",lt=G.get("job")??"",i=s=>String(s??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a]??a);function K(s){return s==null?"—":`$${new Intl.NumberFormat("ru-RU").format(s)}`}const c=s=>s==null?"—":new Intl.NumberFormat("ru-RU").format(s);function dt(s){if(s==null||s==="")return"—";const a=Number(s);return Number.isFinite(a)?a.toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2}):"—"}function f(s){const a=new Date(String(s??""));return Number.isNaN(a.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(a)}function O(s){const a=new Date(String(s??""));return Number.isNaN(a.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(a)}function S(s,a){if(s==null||a==null)return"";const l=Number(s)-Number(a);if(!l)return"";const n=l>0?"+":"−";return`<em class="${l>0?"up":"down"}">${n}${new Intl.NumberFormat("ru-RU").format(Math.abs(l))}</em>`}function pt(s,a="#e4b04a"){const l=s.map(_=>_.wardog_level??0);if(l.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const n=Math.max(...l,1),d=Math.min(...l),p=Math.max(n-d,1),$=640,w=160,A=$/(l.length-1),R=_=>16+(1-(_-d)/p)*(w-36),y=l.map((_,x)=>`${x===0?"M":"L"}${x*A},${R(_)}`).join(" "),T=`${y} L${$},${w} L0,${w} Z`,b=l.at(-1)??0;return`<svg class="dossier-chart" viewBox="0 0 ${$} ${w}" role="img" aria-label="Уровень по снимкам">
      <defs><linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}" stop-opacity="0.45"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></linearGradient></defs>
      <path d="${T}" fill="url(#lvl)"></path>
      <path d="${y}" fill="none" stroke="${a}" stroke-width="2.5"></path>
      <circle cx="${$}" cy="${R(b)}" r="4" fill="${a}"></circle>
    </svg>
    <p class="dossier-axis"><span>${i(O(s[0]?.created_at))}</span><span>${i(O(s.at(-1)?.created_at))} · ${c(b)} ур.</span></p>`}async function ut(){k.innerHTML="<p>Steam забирает карьеру из игры. WARDOGS должен быть закрыт. Не закрывай вкладку.</p>";for(let s=0;s<45;s++){const a=await fetch(`/api/auth/status?job=${encodeURIComponent(lt)}`).then(d=>d.json()).catch(()=>null);if(!a||a.status==="pending"){await new Promise(d=>setTimeout(d,2e3));continue}const l=a.next||(m?`/p/?id=${m}`:"/ratings"),n=new URL(l,location.origin);a.status==="ok"?(a.flag?n.searchParams.set("sync",a.flag):n.searchParams.delete("sync"),!n.searchParams.get("id")&&a.steamId&&n.searchParams.set("id",a.steamId)):n.searchParams.set("sync",a.sync||"expired"),n.searchParams.delete("job"),location.replace(n.pathname+n.search);return}location.replace(m?`/p/?id=${m}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(v==="wait")await ut();else if(/^\d{17}$/.test(m)){const[s,a,l]=await Promise.all([fetch(`/api/players/${m}`).then(async n=>n.ok?n.json():null),fetch("/api/me").then(n=>n.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async n=>n.ok?n.json():null).catch(()=>null)]);if(!s)k.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const n=s.user,d=s.history,p=d.at(-1),$=d.length>1?d.at(-2):void 0,w=a.user?.steam_id===m,A=!d.length,y=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([t,e,r])=>({key:t,name:e,icon:r,level:Number(p?.[t]??0)||0})),T=Math.max(...y.map(t=>t.level),1),b=y.reduce((t,e)=>e.level>t.level?e:t,y[0]),x=(l?.players??[]).findIndex(t=>String(t.steam_id)===m),Q=!!n.hide_leaderboard||!n.cis_opt_in,V=x>=0?`место #${x+1}`:Q?"скрыт из топа":"вне топ-200",L=s.squad,H=(t=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(t??""))?String(t):"")(L?.logo),j=["orange","gold","blue","red","green"].find(t=>t===n.accent)??"",X={orange:"#ff4d1c",gold:"#e4b04a",blue:"#6ea2ff",red:"#ff5a4a",green:"#3dba7a"},D=String(n.motto??"").trim(),o=s.combat,Y=t=>t==="win"?"Выиграно":t==="loss"?"Потеряно":t==="leave"?"Досрочный выход":"—",tt=t=>t==="win"?"win":t==="loss"?"loss":"",g=(o?.history??[]).filter(t=>String(t.map||"").trim()||String(t.result||"").trim()),z=g.length<40?g.length:o?.matches??g.length,E=s.punishments??[],et=t=>t.untilAt?`до ${f(t.untilAt)}`:t.active?"до снятия":t.liftedAt?`снято ${f(t.liftedAt)}`:"—",M={lone:"/brand/operators/lone.webp",valk:"/brand/operators/valk.webp",mant:"/brand/operators/mant.webp"}[String(o?.side||"")]??"",J=t=>{const e=t.toLowerCase();return e.includes("valk")?"valk":e.includes("mant")?"mant":e.includes("lone")?"lone":""},st=t=>{const e=t.toLowerCase();return e.includes("valk")?"/brand/factions/vk.png":e.includes("mant")?"/brand/factions/mc.png":e.includes("lone")||e.includes("star")?"/brand/factions/ls.png":""},at=t=>{const e=t.trim(),r=e.toLowerCase();return!e||r==="white"||r==="unknown"?"":e},nt=t=>{const e=t.toLowerCase();return e.includes("ozet")||e.includes("madrid")||e.includes("europe")?{file:"ozeti",title:"Ozeti"}:e.includes("sabat")||e.includes("moscow")||e.includes("russia")?{file:"sabatulo",title:"Sabatulo"}:e.includes("bakur")||e.includes("kavkaz")?{file:"bakurani",title:"Bakurani"}:e.includes("zesta")||e.includes("america")||e.includes("detroit")?{file:"zestafona",title:"Zestafona"}:null},q=t=>{const e=t.trim().toLowerCase();return!e||e==="default"||e==="неизвестно"?"":ct[e]||""},I=(t,e,r="")=>`<span class="piece${r?` ${r}`:""}">${t?`<img src="${t}" alt="" />`:""}<span>${i(e)}</span></span>`,P=(t,e="")=>t==null?"—":`${c(t)}${e}`,W=t=>t?.name?`${i(t.name)} · ${c(t.count)}×`:"—",U=o?.weapons??[],ot=Math.max(...U.map(t=>Number(t.kills)||0),1),B=o?.since||o?.last?`Играет здесь с ${i(f(o?.since)||"—")} · последний раз ${i(f(o?.last)||"—")}`:"",Z=v==="same"?"Цифры те же, что уже были. Свежее игра отдаст, если закрыть WARDOGS и снять ещё раз.":v==="game_running"?"Игра была запущена. Полностью закрой WARDOGS и нажми «Снять из игры».":v==="stale"?"Игра не отдала свежий снимок. Записали последние известные цифры. Закрой клиент и сними ещё раз.":v==="access_denied"?"Steam отменён. Нажми «Снять из игры» и подтверди вход.":A&&!o?"Цифр ещё нет. Закрой WARDOGS и нажми «Снять из игры» — откроется Steam, мы запишем карьеру.":v==="expired"?"Код входа истёк. Нажми «Снять из игры» ещё раз.":v&&v!=="ok"?"Не вышло снять карьеру. Закрой игру и нажми ещё раз.":"";k.innerHTML=`
        <article class="dossier"${j?` data-accent="${j}"`:""}>
          <header class="dossier-hero${M?" has-op":""}">
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${i(n.avatar??"")}" />
                ${H?`<img class="dossier-clan" alt="" src="${i(H)}" />`:""}
              </div>
              <div>
                <p class="eyebrow">Досье · сезон ${i(String(l?.season||"03"))}</p>
                <h1>${i(n.persona??n.steam_id)}</h1>
                ${D?`<p class="dossier-line">${i(D)}</p>`:""}
                <div class="dossier-tags">
                  <span class="pill">${i(V)}</span>
                  ${b.level?`<span class="pill now">${i(b.name)} ${b.level}</span>`:""}
                  ${L?`<a class="pill" href="/squad/?id=${L.id}">[${i(L.tag)}] ${i(L.name)}</a>`:'<span class="pill old">без сквада</span>'}
                  ${n.country?`<span class="pill">${i(n.country)}</span>`:""}
                  ${n.discord_name?`<span class="pill">Discord ${i(n.discord_name)}</span>`:""}
                </div>
              </div>
              <div class="dossier-level">
                <img src="/art/t_ui_icon_careerlevel_600.webp" alt="" />
                <b>${p?.wardog_level??"—"}</b>
                <span>уровень ${S(p?.wardog_level,$?.wardog_level)}</span>
              </div>
            </div>
            ${M?`<img class="dossier-op" alt="" src="${M}" />`:""}
          </header>
          ${Z?`<p class="note dossier-alert" id="sync-note">${i(Z)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${S(p?.xp,$?.xp)}</span><b>${c(p?.xp)}</b></div>
            <div><span>Деньги ${S(p?.cash,$?.cash)}</span><b>${K(p?.cash)}</b></div>
            <div><span>Золото ${S(p?.gold,$?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${p?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${p?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${K(p?.account_value)}</b></div>
            <div><span>Снимков</span><b>${d.length}</b></div>
          </section>
          ${o?`<section class="fight-card">
            <header>
              <p class="eyebrow">Статистика игрока</p>
              <p>Этот сервер, за всё время</p>
            </header>
            <div class="fight-card-hero">
              <div>
                <b>${dt(o.kd)}</b>
                <span>К/Д</span>
              </div>
              <div>
                <strong>${c(o.kills)} убийств · ${c(o.deaths)} смертей</strong>
                <span>Место #${c(o.place)} из ${c(o.of)}</span>
              </div>
            </div>
            <div class="fight-card-grid">
              <div><span>Хедшоты</span><b>${o.headshotPct==null?"—":`${Number(o.headshotPct).toLocaleString("ru-RU",{maximumFractionDigits:1})}%`} <small>${o.headshots==null?"":c(o.headshots)}</small></b></div>
              <div><span>Самое дальнее убийство</span><b>${P(o.longest," м")}</b></div>
              <div><span>Ср. дистанция</span><b>${P(o.average," м")}</b></div>
              <div><span>Лучший матч</span><b>${o.bestMatch==null?"—":`${c(o.bestMatch)} убийств`}</b></div>
              <div><span>Матчи</span><b>${z?`${c(z)} <small>по ${o.perMatch??"—"} убийств каждый</small>`:"—"}</b></div>
              <div><span>Основная сторона</span><b class="${J(String(o.faction||""))}">${i(String(o.faction||"").trim())||"—"}</b></div>
              <div><span>Убийства своих</span><b>${P(o.teamkills)}</b></div>
              <div><span>Винрейт</span><b>${o.winrate==null?"—":`${Number(o.winrate).toLocaleString("ru-RU",{maximumFractionDigits:1})}%`}</b></div>
            </div>
            <div class="fight-card-rivals">
              <p class="eyebrow">Соперники</p>
              <p><span>Заклятый враг</span><b>${W(o.enemy)}</b></p>
              <p><span>Любимая цель</span><b>${W(o.target)}</b></p>
            </div>
            ${U.length?`<div class="fight-card-guns">
              <p class="eyebrow">Оружие</p>
              ${U.map(t=>{const e=String(t.name||"неизвестно"),r=q(e);return`<p><i style="width:${Math.round((Number(t.kills)||0)/ot*100)}%"></i>${r?`<img src="/art/${r}" alt="" />`:""}<b>${i(e)}</b><span>${c(t.kills)} · ${c(t.headshots)} HS</span></p>`}).join("")}
            </div>`:'<p class="note">Оружие, хедшоты и дистанция появятся со следующими убийствами, которые пришлёт сервер.</p>'}
            ${B?`<p class="note">${B}</p>`:""}
          </section>
          ${g.length?`<section class="match-log">
            <header>
              <p class="eyebrow">Матчи</p>
              <p>Этот сервер, хранить навсегда</p>
            </header>
            <div class="match-scroll">
              <table>
                <thead>
                  <tr>${g.some(t=>f(t.endedAt))?"<th>Завершено</th>":""}${g.some(t=>String(t.server||"").trim())?"<th>Сервер</th>":""}<th>Карта</th><th>Сторона</th><th>Результат</th><th>Место</th><th>У</th><th>С</th><th>К/Д</th><th>ХШ</th><th>ТК</th><th>Оружие</th></tr>
                </thead>
                <tbody>
                  ${g.map(t=>{const e=nt(String(t.map||"")),r=e?.title||String(t.map||""),u=r?I(e?`/brand/maps/${e.file}.webp`:"",`${r}${t.minutes?` · ${c(t.minutes)} мин`:""}`,"map"):"—",h=at(String(t.faction||"")),N=h?I(st(h),h):"—",C=String(t.weapon||"").trim(),rt=C&&C.toLowerCase()!=="default"?I(q(C)?`/art/${q(C)}`:"",C,"gun"):"—";return`<tr>
                    ${f(t.endedAt)||g.some(F=>f(F.endedAt))?`<td>${i(f(t.endedAt)||"—")}</td>`:""}
                    ${String(t.server||"").trim()||g.some(F=>String(F.server||"").trim())?`<td>${i(t.server||"—")}</td>`:""}
                    <td>${u}</td>
                    <td class="${J(h)}">${N}</td>
                    <td class="${tt(t.result)}">${Y(t.result)}</td>
                    <td>${t.place?`#${c(t.place)}${t.field?` из ${c(t.field)}`:""}`:"—"}</td>
                    <td>${c(t.kills)}</td>
                    <td>${c(t.deaths)}</td>
                    <td>${t.kd==null?"—":Number(t.kd).toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td>${c(t.headshots)}</td>
                    <td>${c(t.teamkills)}</td>
                    <td>${rt}</td>
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
                  <td>${i(t.reason||"не указана")}</td>
                  <td>${i(f(t.startedAt)||"—")}</td>
                  <td>${i(et(t))}</td>
                </tr>`).join("")}
              </tbody>
            </table>
          </section>`:""}
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${b.level?i(b.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${y.map(t=>`
                  <div class="lane${t.name===b.name&&t.level?" lead":""}">
                    <img src="${t.icon}" alt="" />
                    <span>${t.name}</span>
                    <i><b style="width:${Math.round(t.level/T*100)}%"></b></i>
                    <strong>${t.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${d.length>1?S(p?.wardog_level,d[0]?.wardog_level)?`${S(p?.wardog_level,d[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${pt(d,X[j]??"#e4b04a")}
              <p class="note">Последний снимок: ${i(O(p?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${m}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${w?`<form class="dossier-tune" id="tune">
            <label>Строка под ником
              <input id="motto" maxlength="80" value="${i(D)}" placeholder="Коротко о себе, до 80 знаков" />
            </label>
            <div class="swatches" role="radiogroup" aria-label="Цвет досье">
              ${[["","Как есть"],["orange","Огонь"],["gold","Золото"],["blue","Синий"],["red","Красный"],["green","Зелёный"]].map(([t,e])=>`
                <label class="swatch">
                  <input type="radio" name="accent" value="${t}" ${j===t?"checked":""} />
                  <i class="dot ${t||"plain"}"></i>
                  <span>${e}</span>
                </label>`).join("")}
            </div>
            <button class="btn small" type="submit">Сохранить вид</button>
            <p class="note" id="tune-note">Строку и цвет видят все, кто откроет это досье. Баннер сквада здесь не показывается.</p>
          </form>
          <div class="dossier-own">
            <a class="btn small" href="/auth/wardogs/start?next=/p&steamId=${i(m)}">Снять из игры</a>
            <button class="btn ghost small" id="resync" type="button">Из открытой базы</button>
            <label class="check"><input id="show-top" type="checkbox" ${n.cis_opt_in&&!n.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${a.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Закрой WARDOGS, нажми «Снять из игры», подтверди Steam — мы только запишем цифры. Вход на сайт в шапке отдельно.</p>
          </div>`:""}
        </article>
      `;const it=async()=>{const t=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:t})})};document.querySelector("#show-top")?.addEventListener("change",it),document.querySelector("#tune")?.addEventListener("submit",async t=>{t.preventDefault();const e=document.querySelector("#tune-note"),r=document.querySelector("#motto"),u=document.querySelector('input[name="accent"]:checked'),h=await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({motto:r?.value??"",accent:u?.value??""})});if(h.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}if(!h.ok){e.textContent="Не сохранилось. Выбери цвет из списка и укороти строку.";return}location.reload()}),document.querySelector("#resync")?.addEventListener("click",async()=>{const t=document.querySelector("#sync-note"),e=document.querySelector("#resync");e.disabled=!0,t.classList.add("dossier-alert"),t.textContent="Обновляю статистику…";try{const r=await fetch(`https://wardogstracker.gg/api/v1/players/${m}`,{signal:AbortSignal.timeout(8e3)}),u=r.ok?await r.json().catch(()=>null):null,h=await fetch("/api/me/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(u&&u.player?{player:u.player}:{}),signal:AbortSignal.timeout(8e3)});if(h.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${m}`)}`;return}const N=await h.json().catch(()=>({}));if(N.saved){location.href=N.unchanged?`/p/?id=${m}&sync=same`:`/p/?id=${m}`;return}t.textContent=N.reason==="tracker_down"?"База карьеры не ответила. Нажми ещё раз.":"В открытой базе этого игрока ещё нет."}catch{t.textContent="Слишком долго. Нажми ещё раз — запрос оборвался."}e.disabled=!1}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const t=document.querySelector("#copy-profile");if(!t)return;const e=location.href;let r=!1;try{await navigator.clipboard.writeText(e),r=!0}catch{const u=document.createElement("textarea");u.value=e,u.setAttribute("readonly",""),u.style.position="fixed",u.style.left="-9999px",document.body.append(u),u.select();try{r=document.execCommand("copy")}catch{r=!1}u.remove()}t.textContent=r?"Ссылка скопирована":"Не скопировалось"})}}else try{const a=(await fetch("/api/me").then(l=>l.json()))?.user?.steam_id;/^\d{17}$/.test(a||"")?location.replace(`/p/?id=${a}`):k.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{k.innerHTML="<h1>Такой страницы нет</h1>"}
