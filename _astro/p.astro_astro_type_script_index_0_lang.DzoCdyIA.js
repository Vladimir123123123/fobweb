const x=document.querySelector("#profile"),I=new URLSearchParams(location.search),d=I.get("id")??"",b=I.get("sync")??"",Z=I.get("job")??"",o=t=>String(t??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a]??a);function F(t){return t==null?"—":`$${new Intl.NumberFormat("ru-RU").format(t)}`}const m=t=>t==null?"—":new Intl.NumberFormat("ru-RU").format(t);function z(t){if(t==null||t==="")return"—";const a=Number(t);return Number.isFinite(a)?a.toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2}):"—"}function O(t){const a=new Date(String(t??""));return Number.isNaN(a.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(a)}function D(t){const a=new Date(String(t??""));return Number.isNaN(a.getTime())?"":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(a)}function y(t,a){if(t==null||a==null)return"";const c=Number(t)-Number(a);if(!c)return"";const s=c>0?"+":"−";return`<em class="${c>0?"up":"down"}">${s}${new Intl.NumberFormat("ru-RU").format(Math.abs(c))}</em>`}function K(t,a="#e4b04a"){const c=t.map(f=>f.wardog_level??0);if(c.length<2)return'<p class="note">Один снимок. Линия появится после следующего обновления.</p>';const s=Math.max(...c,1),r=Math.min(...c),l=Math.max(s-r,1),h=640,v=160,N=h/(c.length-1),j=f=>16+(1-(f-r)/l)*(v-36),g=c.map((f,w)=>`${w===0?"M":"L"}${w*N},${j(f)}`).join(" "),L=`${g} L${h},${v} L0,${v} Z`,$=c.at(-1)??0;return`<svg class="dossier-chart" viewBox="0 0 ${h} ${v}" role="img" aria-label="Уровень по снимкам">
      <defs><linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}" stop-opacity="0.45"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></linearGradient></defs>
      <path d="${L}" fill="url(#lvl)"></path>
      <path d="${g}" fill="none" stroke="${a}" stroke-width="2.5"></path>
      <circle cx="${h}" cy="${j($)}" r="4" fill="${a}"></circle>
    </svg>
    <p class="dossier-axis"><span>${o(D(t[0]?.created_at))}</span><span>${o(D(t.at(-1)?.created_at))} · ${m($)} ур.</span></p>`}async function Q(){x.innerHTML="<p>Steam забирает карьеру из игры. WARDOGS должен быть закрыт. Не закрывай вкладку.</p>";for(let t=0;t<45;t++){const a=await fetch(`/api/auth/status?job=${encodeURIComponent(Z)}`).then(r=>r.json()).catch(()=>null);if(!a||a.status==="pending"){await new Promise(r=>setTimeout(r,2e3));continue}const c=a.next||(d?`/p/?id=${d}`:"/ratings"),s=new URL(c,location.origin);a.status==="ok"?(a.flag?s.searchParams.set("sync",a.flag):s.searchParams.delete("sync"),!s.searchParams.get("id")&&a.steamId&&s.searchParams.set("id",a.steamId)):s.searchParams.set("sync",a.sync||"expired"),s.searchParams.delete("job"),location.replace(s.pathname+s.search);return}location.replace(d?`/p/?id=${d}&sync=token_timeout`:"/ratings?sync=token_timeout")}if(b==="wait")await Q();else if(/^\d{17}$/.test(d)){const[t,a,c]=await Promise.all([fetch(`/api/players/${d}`).then(async s=>s.ok?s.json():null),fetch("/api/me").then(s=>s.json()).catch(()=>({user:null})),fetch("/api/ratings?sort=level").then(async s=>s.ok?s.json():null).catch(()=>null)]);if(!t)x.innerHTML="<h1>Профиль ещё не создан</h1><p>Игрок не входил через Steam на этом сайте.</p>";else{const s=t.user,r=t.history,l=r.at(-1),h=r.length>1?r.at(-2):void 0,v=a.user?.steam_id===d,N=!r.length,g=[["role_assault","Штурм","/art/t_ui_icon_role_infantry.webp"],["role_medic","Медик","/art/t_ui_icon_role_medic.webp"],["role_recon","Разведка","/art/t_ui_icon_role_recon.webp"],["role_support","Поддержка","/art/t_ui_icon_role_support.webp"],["role_driver","Водитель","/art/t_ui_icon_role_driver.webp"],["role_pilot","Пилот","/art/t_ui_icon_role_pilot.webp"]].map(([e,i,u])=>({key:e,name:i,icon:u,level:Number(l?.[e]??0)||0})),L=Math.max(...g.map(e=>e.level),1),$=g.reduce((e,i)=>i.level>e.level?i:e,g[0]),w=(c?.players??[]).findIndex(e=>String(e.steam_id)===d),G=!!s.hide_leaderboard||!s.cis_opt_in,H=w>=0?`место #${w+1}`:G?"скрыт из топа":"вне топ-200",_=t.squad,P=(e=>/^\/api\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(String(e??""))?String(e):"")(_?.logo),k=["orange","gold","blue","red","green"].find(e=>e===s.accent)??"",E={orange:"#ff4d1c",gold:"#e4b04a",blue:"#6ea2ff",red:"#ff5a4a",green:"#3dba7a"},M=String(s.motto??"").trim(),n=t.combat,W=e=>{const i=e.toLowerCase();return i.includes("valk")?"valk":i.includes("mant")?"mant":i.includes("lone")?"lone":""},R=(e,i="")=>e==null?"—":`${m(e)}${i}`,C=e=>e?.name?`${o(e.name)} · ${m(e.count)}×`:"—",T=n?.weapons??[],J=Math.max(...T.map(e=>Number(e.kills)||0),1),U=n?.since||n?.last?`Играет здесь с ${o(O(n?.since)||"—")} · последний раз ${o(O(n?.last)||"—")}`:"",A=b==="same"?"Цифры те же, что уже были. Свежее игра отдаст, если закрыть WARDOGS и снять ещё раз.":b==="game_running"?"Игра была запущена. Полностью закрой WARDOGS и нажми «Снять из игры».":b==="stale"?"Игра не отдала свежий снимок. Записали последние известные цифры. Закрой клиент и сними ещё раз.":b==="access_denied"?"Steam отменён. Нажми «Снять из игры» и подтверди вход.":N&&!n?"Цифр ещё нет. Закрой WARDOGS и нажми «Снять из игры» — откроется Steam, мы запишем карьеру.":b==="expired"?"Код входа истёк. Нажми «Снять из игры» ещё раз.":b&&b!=="ok"?"Не вышло снять карьеру. Закрой игру и нажми ещё раз.":"";x.innerHTML=`
        <article class="dossier"${k?` data-accent="${k}"`:""}>
          <header class="dossier-hero">
            <div class="dossier-id">
              <div class="dossier-face">
                <img class="dossier-avatar" alt="" src="${o(s.avatar??"")}" />
                ${P?`<img class="dossier-clan" alt="" src="${o(P)}" />`:""}
              </div>
              <div>
                <p class="eyebrow">Досье · сезон ${o(String(c?.season||"03"))}</p>
                <h1>${o(s.persona??s.steam_id)}</h1>
                ${M?`<p class="dossier-line">${o(M)}</p>`:""}
                <div class="dossier-tags">
                  <span class="pill">${o(H)}</span>
                  ${$.level?`<span class="pill now">${o($.name)} ${$.level}</span>`:""}
                  ${_?`<a class="pill" href="/squad/?id=${_.id}">[${o(_.tag)}] ${o(_.name)}</a>`:'<span class="pill old">без сквада</span>'}
                  ${s.country?`<span class="pill">${o(s.country)}</span>`:""}
                  ${s.discord_name?`<span class="pill">Discord ${o(s.discord_name)}</span>`:""}
                </div>
              </div>
              <div class="dossier-level">
                <img src="/art/t_ui_icon_careerlevel_600.webp" alt="" />
                <b>${l?.wardog_level??"—"}</b>
                <span>уровень ${y(l?.wardog_level,h?.wardog_level)}</span>
              </div>
            </div>
          </header>
          ${A?`<p class="note dossier-alert" id="sync-note">${o(A)}</p>`:'<p class="note" id="sync-note"></p>'}
          <section class="dossier-meters">
            <div><span>Опыт ${y(l?.xp,h?.xp)}</span><b>${m(l?.xp)}</b></div>
            <div><span>Деньги ${y(l?.cash,h?.cash)}</span><b>${F(l?.cash)}</b></div>
            <div><span>Золото ${y(l?.gold,h?.gold)}</span><b><img src="/art/t_ui_goldbars_icon.webp" alt="" />${l?.gold??"—"}</b></div>
            <div><span>Открытия</span><b>${l?.unlocks??"—"}</b></div>
            <div><span>Стоимость</span><b>${F(l?.account_value)}</b></div>
            <div><span>Снимков</span><b>${r.length}</b></div>
          </section>
          ${n?`<section class="fight-card">
            <header>
              <p class="eyebrow">Статистика игрока</p>
              <p>Этот сервер, за всё время</p>
            </header>
            <div class="fight-card-hero">
              <div>
                <b>${z(n.kd)}</b>
                <span>К/Д</span>
              </div>
              <div>
                <strong>${m(n.kills)} убийств · ${m(n.deaths)} смертей</strong>
                <span>Место #${m(n.place)} из ${m(n.of)}</span>
              </div>
            </div>
            <div class="fight-card-grid">
              <div><span>Хедшоты</span><b>${n.headshotPct==null?"—":`${Number(n.headshotPct).toLocaleString("ru-RU",{maximumFractionDigits:1})}%`} <small>${n.headshots==null?"":m(n.headshots)}</small></b></div>
              <div><span>Самое дальнее убийство</span><b>${R(n.longest," м")}</b></div>
              <div><span>Ср. дистанция</span><b>${R(n.average," м")}</b></div>
              <div><span>Лучший матч</span><b>${n.bestMatch==null?"—":`${m(n.bestMatch)} убийств`}</b></div>
              <div><span>Матчи</span><b>${n.matches==null?"—":`${m(n.matches)} <small>по ${n.perMatch??"—"} убийств каждый</small>`}</b></div>
              <div><span>Основная сторона</span><b class="${W(String(n.faction||""))}">${o(String(n.faction||"").trim())||"—"}</b></div>
              <div><span>Убийства своих</span><b>${R(n.teamkills)}</b></div>
            </div>
            <div class="fight-card-rivals">
              <p class="eyebrow">Соперники</p>
              <p><span>Заклятый враг</span><b>${C(n.enemy)}</b></p>
              <p><span>Любимая цель</span><b>${C(n.target)}</b></p>
            </div>
            ${T.length?`<div class="fight-card-guns">
              <p class="eyebrow">Оружие</p>
              ${T.map(e=>`<p><i style="width:${Math.round((Number(e.kills)||0)/J*100)}%"></i><b>${o(e.name||"неизвестно")}</b><span>${m(e.kills)} · ${m(e.headshots)} HS</span></p>`).join("")}
            </div>`:'<p class="note">Оружие, хедшоты и дистанция появятся со следующими убийствами, которые пришлёт сервер.</p>'}
            ${U?`<p class="note">${U}</p>`:""}
          </section>`:""}
          <section class="dossier-split">
            <div class="panel">
              <p class="eyebrow">Классы</p>
              <h2>${$.level?o($.name):"Классов пока нет"}</h2>
              <div class="class-lanes">
                ${g.map(e=>`
                  <div class="lane${e.name===$.name&&e.level?" lead":""}">
                    <img src="${e.icon}" alt="" />
                    <span>${e.name}</span>
                    <i><b style="width:${Math.round(e.level/L*100)}%"></b></i>
                    <strong>${e.level||"—"}</strong>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <p class="eyebrow">Как рос уровень</p>
              <h2>${r.length>1?y(l?.wardog_level,r[0]?.wardog_level)?`${y(l?.wardog_level,r[0]?.wardog_level)} с первого снимка`:"Уровень держится":"Ждём второй снимок"}</h2>
              ${K(r,E[k]??"#e4b04a")}
              <p class="note">Последний снимок: ${o(D(l?.created_at)||"ещё не было")}. <a href="https://steamcommunity.com/profiles/${d}">Steam</a> · <button class="linkish" id="copy-profile" type="button">Скопировать ссылку</button></p>
            </div>
          </section>
          ${v?`<form class="dossier-tune" id="tune">
            <label>Строка под ником
              <input id="motto" maxlength="80" value="${o(M)}" placeholder="Коротко о себе, до 80 знаков" />
            </label>
            <div class="swatches" role="radiogroup" aria-label="Цвет досье">
              ${[["","Как есть"],["orange","Огонь"],["gold","Золото"],["blue","Синий"],["red","Красный"],["green","Зелёный"]].map(([e,i])=>`
                <label class="swatch">
                  <input type="radio" name="accent" value="${e}" ${k===e?"checked":""} />
                  <i class="dot ${e||"plain"}"></i>
                  <span>${i}</span>
                </label>`).join("")}
            </div>
            <button class="btn small" type="submit">Сохранить вид</button>
            <p class="note" id="tune-note">Строку и цвет видят все, кто откроет это досье. Баннер сквада здесь не показывается.</p>
          </form>
          <div class="dossier-own">
            <a class="btn small" href="/auth/wardogs/start?next=/p&steamId=${o(d)}">Снять из игры</a>
            <button class="btn ghost small" id="resync" type="button">Из открытой базы</button>
            <label class="check"><input id="show-top" type="checkbox" ${s.cis_opt_in&&!s.hide_leaderboard?"checked":""}/> Показывать в топе</label>
            ${a.discordLink?'<a class="btn ghost small" href="/auth/discord">Привязать Discord</a>':""}
            <p class="note">Закрой WARDOGS, нажми «Снять из игры», подтверди Steam — мы только запишем цифры. Вход на сайт в шапке отдельно.</p>
          </div>`:""}
        </article>
      `;const B=async()=>{const e=document.querySelector("#show-top").checked;await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({showInTop:e})})};document.querySelector("#show-top")?.addEventListener("change",B),document.querySelector("#tune")?.addEventListener("submit",async e=>{e.preventDefault();const i=document.querySelector("#tune-note"),u=document.querySelector("#motto"),p=document.querySelector('input[name="accent"]:checked'),S=await fetch("/api/me",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({motto:u?.value??"",accent:p?.value??""})});if(S.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}if(!S.ok){i.textContent="Не сохранилось. Выбери цвет из списка и укороти строку.";return}location.reload()}),document.querySelector("#resync")?.addEventListener("click",async()=>{const e=document.querySelector("#sync-note"),i=document.querySelector("#resync");i.disabled=!0,e.classList.add("dossier-alert"),e.textContent="Обновляю статистику…";try{const u=await fetch(`https://wardogstracker.gg/api/v1/players/${d}`,{signal:AbortSignal.timeout(8e3)}),p=u.ok?await u.json().catch(()=>null):null,S=await fetch("/api/me/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(p&&p.player?{player:p.player}:{}),signal:AbortSignal.timeout(8e3)});if(S.status===401){location.href=`/auth/steam?next=${encodeURIComponent(`/p/?id=${d}`)}`;return}const q=await S.json().catch(()=>({}));if(q.saved){location.href=q.unchanged?`/p/?id=${d}&sync=same`:`/p/?id=${d}`;return}e.textContent=q.reason==="tracker_down"?"База карьеры не ответила. Нажми ещё раз.":"В открытой базе этого игрока ещё нет."}catch{e.textContent="Слишком долго. Нажми ещё раз — запрос оборвался."}i.disabled=!1}),document.querySelector("#copy-profile")?.addEventListener("click",async()=>{const e=document.querySelector("#copy-profile");if(!e)return;const i=location.href;let u=!1;try{await navigator.clipboard.writeText(i),u=!0}catch{const p=document.createElement("textarea");p.value=i,p.setAttribute("readonly",""),p.style.position="fixed",p.style.left="-9999px",document.body.append(p),p.select();try{u=document.execCommand("copy")}catch{u=!1}p.remove()}e.textContent=u?"Ссылка скопирована":"Не скопировалось"})}}else try{const a=(await fetch("/api/me").then(c=>c.json()))?.user?.steam_id;/^\d{17}$/.test(a||"")?location.replace(`/p/?id=${a}`):x.innerHTML='<h1>Такой страницы нет</h1><p><a class="btn" href="/auth/steam?next=/ratings">Войти через Steam</a></p>'}catch{x.innerHTML="<h1>Такой страницы нет</h1>"}
