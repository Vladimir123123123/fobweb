const k=document.querySelector("#profile"),P=new URLSearchParams(location.search),p=P.get("id")??"",b=P.get("sync")??"",Q=P.get("job")??"",o=e=>String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a]??a);function H(e){return e==null?"—":`$${new Intl.NumberFormat("ru-RU").format(e)}`}const c=e=>e==null?"—":new Intl.NumberFormat("ru-RU").format(e);function V(e){if(e==null||e==="")return"—";const a=Number(e);return Number.isFinite(a)?a.toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2}):"—"}function q(e){const a=new Date(String(e??""));return Number.isNaN(a.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(a)}function I(e){const a=new Date(String(e??""));return Number.isNaN(a.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(a)}function y(e,a){if(e==null||a==null)return"";const l=Number(e)-Number(a);if(!l)return"";const s=l>0?"+":"−";return`<em class="${l>0?"up":"down"}">${s}${new Intl.NumberFormat("ru-RU").format(Math.abs(l))}</em>`}function X(e,a="#e4b04a"){const l=e.map(f=>f.wardog_level??0);if(l.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const s=Math.max(...l,1),r=Math.min(...l),d=Math.max(s-r,1),m=640,v=160,N=m/(l.length-1),L=f=>16+(1-(f-r)/d)*(v-36),g=l.map((f,w)=>`${w===0?"M":"L"}${w*N},${L(f)}`).join(" "),j=`${g} L${m},${v} L0,${v} Z`,$=l.at(-1)??0;return`<svg class="dossier-chart" viewBox="0 0 ${m} ${v}" role="img" aria-label="Уровень по снимкам">
      <defs><linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}" stop-opacity="0.45"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></linearGradient></defs>
      <path d="${j}" fill="url(#lvl)"></path>
      <path d="${g}" fill="none" stroke="${a}" stroke-width="2.5"></path>
      <circle cx="${m}" cy="${L($)}" r="4" fill="${a}"></circle>
    </svg>
    <p class="dossier-axis"><span>${o(I(e[0]?.created_at))}</span><span>${o(I(e.at(-1)?.created_at))} · ${c($)} ур.</span></p>`}async function Y(){k.innerHTML="<p>Steam забирает карьеру из игры. WARDOGS должен быть закрыт. Не закрывай вкладку.</p>";for(let e=0;e<45;e++){const a=await fetch(`/api/auth/status?job=${encodeURIComponent(Q)}`).then(r=>r.json()).catch(()=>null);if(!a||a.status==="pending"){await new Promise(r=>setTimeout(r,2e3));continue}const l=a.next||(p?`/p/?id=${p}`:"/ratings"),s=new URL(l,location.origin);a.status==="ok"?(a.flag?s.searchParams.set("sync",a.flag):s.searchParams.delete("sync"),!s.searchParams.get("id")&&a.steamId&&s.searchParams.set("id",a.steamId)):s.searchParams.set("sync",a.sync||"expired"),s.searchParams.delete("job"),location.replace(s.pathname+s.search);return}location.replace(p?`/p/?id=${p}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(b==="wait")await Y();else if(/^\d{17}$/.test(p)){const[e,a,l]=await Promise.all([fetch(`/api/players/${p}`).then(async s=>s.ok?s.json():null),fetch("/api/me").then(s=>s.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async s=>s.ok?s.json():null).catch(()=>null)]);if(!e)k.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const s=e.user,r=e.history,d=r.at(-1),m=r.length>1?r.at(-2):void 0,v=a.user?.steam_id===p,N=!r.length,g=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([t,i,h])=>({key:t,name:i,icon:h,level:Number(d?.[t]??0)||0})),j=Math.max(...g.map(t=>t.level),1),$=g.reduce((t,i)=>i.level>t.level?i:t,g[0]),w=(l?.players??[]).findIndex(t=>String(t.steam_id)===p),E=!!s.hide_leaderboard||!s.cis_opt_in,W=w>=0?`место #${w+1}`:E?"скрыт из топа":"вне топ-200",_=e.squad,U=(t=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(t??""))?String(t):"")(_?.logo),x=["orange","gold","blue","red","green"].find(t=>t===s.accent)??"",J={orange:"#ff4d1c",gold:"#e4b04a",blue:"#6ea2ff",red:"#ff5a4a",green:"#3dba7a"},R=String(s.motto??"").trim(),n=e.combat,B=t=>t==="win"?"Выиграно":t==="loss"?"Потеряно":t==="leave"?"Досрочный выход":"—",Z=t=>t==="win"?"win":t==="loss"?"loss":"",C=n?.history??[],F=t=>{const i=t.toLowerCase();return i.includes("valk")?"valk":i.includes("mant")?"mant":i.includes("lone")?"lone":""},D=(t,i="")=>t==null?"—":`${c(t)}${i}`,A=t=>t?.name?`${o(t.name)} · ${c(t.count)}×`:"—",M=n?.weapons??[],z=Math.max(...M.map(t=>Number(t.kills)||0),1),O=n?.since||n?.last?`Играет здесь с ${o(q(n?.since)||"—")} · последний раз ${o(q(n?.last)||"—")}`:"",G=b==="same"?"Цифры те же, что уже были. Свежее игра отдаст, если закрыть WARDOGS и снять ещё раз.":b==="game_running"?"Игра была запущена. Полностью закрой WARDOGS и нажми «Снять из игры».":b==="stale"?"Игра не отдала свежий снимок. Записали последние известные цифры. Закрой клиент и сними ещё раз.":b==="access_denied"?"Steam отменён. Нажми «Снять из игры» и подтверди вход.":N&&!n?"Цифр ещё нет. Закрой WARDOGS и нажми «Снять из игры» — откроется Steam, мы запишем карьеру.":b==="expired"?"Код входа истёк. Нажми «Снять из игры» ещё раз.":b&&b!=="ok"?"Не вышло снять карьеру. Закрой игру и нажми ещё раз.":"";k.innerHTML=`
        <article class="dossier"${x?` data-accent="${x}"`:""}>
          <header class="dossier-hero">
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${o(s.avatar??"")}" />
                ${U?`<img class="dossier-clan" alt="" src="${o(U)}" />`:""}
              </div>
              <div>
                <p class="eyebrow">Досье · сезон ${o(String(l?.season||"03"))}</p>
                <h1>${o(s.persona??s.steam_id)}</h1>
                ${R?`<p class="dossier-line">${o(R)}</p>`:""}
                <div class="dossier-tags">
                  <span class="pill">${o(W)}</span>
                  ${$.level?`<span class="pill now">${o($.name)} ${$.level}</span>`:""}
                  ${_?`<a class="pill" href="/squad/?id=${_.id}">[${o(_.tag)}] ${o(_.name)}</a>`:'<span class="pill old">без сквада</span>'}
                  ${s.country?`<span class="pill">${o(s.country)}</span>`:""}
                  ${s.discord_name?`<span class="pill">Discord ${o(s.discord_name)}</span>`:""}
                </div>
              </div>
              <div class="dossier-level">
                <img src="/art/t_ui_icon_careerlevel_600.webp" alt="" />
                <b>${d?.wardog_level??"—"}</b>
                <span>уровень ${y(d?.wardog_level,m?.wardog_level)}</span>
              </div>
            </div>
          </header>
          ${G?`<p class="note dossier-alert" id="sync-note">${o(G)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${y(d?.xp,m?.xp)}</span><b>${c(d?.xp)}</b></div>
            <div><span>Деньги ${y(d?.cash,m?.cash)}</span><b>${H(d?.cash)}</b></div>
            <div><span>Золото ${y(d?.gold,m?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${d?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${d?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${H(d?.account_value)}</b></div>
            <div><span>Снимков</span><b>${r.length}</b></div>
          </section>
          ${n?`<section class="fight-card">
            <header>
              <p class="eyebrow">Статистика игрока</p>
              <p>Этот сервер, за всё время</p>
            </header>
            <div class="fight-card-hero">
              <div>
                <b>${V(n.kd)}</b>
                <span>К/Д</span>
              </div>
              <div>
                <strong>${c(n.kills)} убийств · ${c(n.deaths)} смертей</strong>
                <span>Место #${c(n.place)} из ${c(n.of)}</span>
              </div>
            </div>
            <div class="fight-card-grid">
              <div><span>Хедшоты</span><b>${n.headshotPct==null?"—":`${Number(n.headshotPct).toLocaleString("ru-RU",{maximumFractionDigits:1})}%`} <small>${n.headshots==null?"":c(n.headshots)}</small></b></div>
              <div><span>Самое дальнее убийство</span><b>${D(n.longest," м")}</b></div>
              <div><span>Ср. дистанция</span><b>${D(n.average," м")}</b></div>
              <div><span>Лучший матч</span><b>${n.bestMatch==null?"—":`${c(n.bestMatch)} убийств`}</b></div>
              <div><span>Матчи</span><b>${n.matches==null?"—":`${c(n.matches)} <small>по ${n.perMatch??"—"} убийств каждый</small>`}</b></div>
              <div><span>Основная сторона</span><b class="${F(String(n.faction||""))}">${o(String(n.faction||"").trim())||"—"}</b></div>
              <div><span>Убийства своих</span><b>${D(n.teamkills)}</b></div>
              <div><span>Винрейт</span><b>${n.winrate==null?"—":`${Number(n.winrate).toLocaleString("ru-RU",{maximumFractionDigits:1})}%`}</b></div>
            </div>
            <div class="fight-card-rivals">
              <p class="eyebrow">Соперники</p>
              <p><span>Заклятый враг</span><b>${A(n.enemy)}</b></p>
              <p><span>Любимая цель</span><b>${A(n.target)}</b></p>
            </div>
            ${M.length?`<div class="fight-card-guns">
              <p class="eyebrow">Оружие</p>
              ${M.map(t=>`<p><i style="width:${Math.round((Number(t.kills)||0)/z*100)}%"></i><b>${o(t.name||"неизвестно")}</b><span>${c(t.kills)} · ${c(t.headshots)} HS</span></p>`).join("")}
            </div>`:'<p class="note">Оружие, хедшоты и дистанция появятся со следующими убийствами, которые пришлёт сервер.</p>'}
            ${O?`<p class="note">${O}</p>`:""}
          </section>
          ${C.length?`<section class="match-log">
            <header>
              <p class="eyebrow">Матчи</p>
              <p>Этот сервер, хранить навсегда</p>
            </header>
            <div class="match-scroll">
              <table>
                <thead>
                  <tr><th>Завершено</th><th>Сервер</th><th>Карта</th><th>Сторона</th><th>Результат</th><th>Место</th><th>У</th><th>С</th><th>К/Д</th><th>ХШ</th><th>ТК</th><th>Оружие</th></tr>
                </thead>
                <tbody>
                  ${C.map(t=>`<tr>
                    <td>${o(q(t.endedAt)||"—")}</td>
                    <td>${o(t.server||"—")}</td>
                    <td>${o(t.map||"—")}${t.minutes?` · ${c(t.minutes)} мин`:""}</td>
                    <td class="${F(String(t.faction||""))}">${o(t.faction||"—")}</td>
                    <td class="${Z(t.result)}">${B(t.result)}</td>
                    <td>${t.place?`#${c(t.place)}${t.field?` из ${c(t.field)}`:""}`:"—"}</td>
                    <td>${c(t.kills)}</td>
                    <td>${c(t.deaths)}</td>
                    <td>${t.kd==null?"—":Number(t.kd).toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td>${c(t.headshots)}</td>
                    <td>${c(t.teamkills)}</td>
                    <td>${o(t.weapon||"—")}</td>
                  </tr>`).join("")}
                </tbody>
              </table>
            </div>
          </section>`:""}`:""}
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${$.level?o($.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${g.map(t=>`
                  <div class="lane${t.name===$.name&&t.level?" lead":""}">
                    <img src="${t.icon}" alt="" />
                    <span>${t.name}</span>
                    <i><b style="width:${Math.round(t.level/j*100)}%"></b></i>
                    <strong>${t.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${r.length>1?y(d?.wardog_level,r[0]?.wardog_level)?`${y(d?.wardog_level,r[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${X(r,J[x]??"#e4b04a")}
              <p class="note">Последний снимок: ${o(I(d?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${p}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${v?`<form class="dossier-tune" id="tune">
            <label>Строка под ником
              <input id="motto" maxlength="80" value="${o(R)}" placeholder="Коротко о себе, до 80 знаков" />
            </label>
            <div class="swatches" role="radiogroup" aria-label="Цвет досье">
              ${[["","Как есть"],["orange","Огонь"],["gold","Золото"],["blue","Синий"],["red","Красный"],["green","Зелёный"]].map(([t,i])=>`
                <label class="swatch">
                  <input type="radio" name="accent" value="${t}" ${x===t?"checked":""} />
                  <i class="dot ${t||"plain"}"></i>
                  <span>${i}</span>
                </label>`).join("")}
            </div>
            <button class="btn small" type="submit">Сохранить вид</button>
            <p class="note" id="tune-note">Строку и цвет видят все, кто откроет это досье. Баннер сквада здесь не показывается.</p>
          </form>
          <div class="dossier-own">
            <a class="btn small" href="/auth/wardogs/start?next=/p&steamId=${o(p)}">Снять из игры</a>
            <button class="btn ghost small" id="resync" type="button">Из открытой базы</button>
            <label class="check"><input id="show-top" type="checkbox" ${s.cis_opt_in&&!s.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${a.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Закрой WARDOGS, нажми «Снять из игры», подтверди Steam — мы только запишем цифры. Вход на сайт в шапке отдельно.</p>
          </div>`:""}
        </article>
      `;const K=async()=>{const t=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:t})})};document.querySelector("#show-top")?.addEventListener("change",K),document.querySelector("#tune")?.addEventListener("submit",async t=>{t.preventDefault();const i=document.querySelector("#tune-note"),h=document.querySelector("#motto"),u=document.querySelector('input[name="accent"]:checked'),S=await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({motto:h?.value??"",accent:u?.value??""})});if(S.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}if(!S.ok){i.textContent="Не сохранилось. Выбери цвет из списка и укороти строку.";return}location.reload()}),document.querySelector("#resync")?.addEventListener("click",async()=>{const t=document.querySelector("#sync-note"),i=document.querySelector("#resync");i.disabled=!0,t.classList.add("dossier-alert"),t.textContent="Обновляю статистику…";try{const h=await fetch(`https://wardogstracker.gg/api/v1/players/${p}`,{signal:AbortSignal.timeout(8e3)}),u=h.ok?await h.json().catch(()=>null):null,S=await fetch("/api/me/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(u&&u.player?{player:u.player}:{}),signal:AbortSignal.timeout(8e3)});if(S.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${p}`)}`;return}const T=await S.json().catch(()=>({}));if(T.saved){location.href=T.unchanged?`/p/?id=${p}&sync=same`:`/p/?id=${p}`;return}t.textContent=T.reason==="tracker_down"?"База карьеры не ответила. Нажми ещё раз.":"В открытой базе этого игрока ещё нет."}catch{t.textContent="Слишком долго. Нажми ещё раз — запрос оборвался."}i.disabled=!1}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const t=document.querySelector("#copy-profile");if(!t)return;const i=location.href;let h=!1;try{await navigator.clipboard.writeText(i),h=!0}catch{const u=document.createElement("textarea");u.value=i,u.setAttribute("readonly",""),u.style.position="fixed",u.style.left="-9999px",document.body.append(u),u.select();try{h=document.execCommand("copy")}catch{h=!1}u.remove()}t.textContent=h?"Ссылка скопирована":"Не скопировалось"})}}else try{const a=(await fetch("/api/me").then(l=>l.json()))?.user?.steam_id;/^\d{17}$/.test(a||"")?location.replace(`/p/?id=${a}`):k.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{k.innerHTML="<h1>Такой страницы нет</h1>"}
