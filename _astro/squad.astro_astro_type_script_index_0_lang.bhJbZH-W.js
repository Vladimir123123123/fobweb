const _=document.querySelector("#squad-page"),i=new URLSearchParams(location.search).get("id")??"",o=p=>p.replace(/[&<>"']/g,$=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[$]??$),V=p=>{const $=/(?:https?:\/\/|www\.)[^\s]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:ru|su|com|net|org|gg|io|me|tv|app|dev)(?:\/[^\s]*)?/gi;let r="",s=0;for(const q of p.matchAll($)){const u=q.index??0;r+=o(p.slice(s,u));const h=q[0],f=h.replace(/[.,!?;:)]+$/g,""),x=h.slice(f.length),S=/^https?:\/\//i.test(f)?f:`https://${f}`;let y=!1;try{const m=new URL(S);y=m.protocol==="http:"||m.protocol==="https:"}catch{y=!1}r+=y?`<a href="${o(S)}" target="_blank" rel="noopener noreferrer">${o(f)}</a>${o(x)}`:o(h),s=u+h.length}return r+o(p.slice(s))};if(!/^\d+$/.test(i))_.innerHTML="<h1>Такой страницы нет</h1>";else{const[p,$]=await Promise.all([fetch(`/api/squads/${i}`),fetch("/api/me").then(r=>r.json()).catch(()=>({user:null}))]);if(!p.ok)_.innerHTML="<h1>Сквада нет</h1><p>Его не опубликовали или он ещё на проверке.</p>";else{const r=await p.json(),s=r.squad,q=r.members,u=r.seat,h=!!u&&String(u?.squad_id)===i,f=h&&u?.status==="member",x=h&&u?.status==="pending",S=u?.status==="member"&&!h,y=r.office==="leader"||r.office==="deputy"?r.office:"",m=!!y,C=$.user?.steam_id?String($.user.steam_id):"",k=q.filter(t=>t.status==="member"),E=m?q.filter(t=>t.status==="pending"):[],P=(t,e)=>`
        <a href="/p?id=${t.steam_id}">
          ${t.avatar?`<img src="${o(t.avatar)}" alt="" />`:`<span class="mate-fallback">${o((t.persona??"?").slice(0,1))}</span>`}
          <span>
            <strong>${o(t.persona??t.steam_id)}</strong>
            <small>${e}</small>
          </span>
        </a>`,I=r.activity,D=new Map(k.map(t=>[t.steam_id,t.persona??t.steam_id])),M=m&&I?`
        <section class="activity">
          <div class="hall-head">
            <h2>Активность</h2>
            <p class="note">Место в скваде за день, по времени на сервере</p>
          </div>
          <div class="activity-scroll">
            <table>
              <thead><tr><th>Участник</th>${I.days.map(t=>`<th>${o(t)}</th>`).join("")}</tr></thead>
              <tbody>
                ${I.rows.map(t=>`<tr>
                  <td><a href="/p?id=${t.steamId}">${o(D.get(t.steamId)??t.steamId)}</a></td>
                  ${t.cells.map(e=>`<td>${e?`<b>${e.place}</b><small>${e.minutes} мин${e.kills?` · ${e.kills}`:""}</small>`:"—"}</td>`).join("")}
                </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </section>`:"",g=r.clan,d=g?.slots??[],L=new Map(d.filter(t=>t.holder).map(t=>[t.holder,t.until])),b=t=>new Intl.DateTimeFormat("ru-RU",{timeZone:"Europe/Moscow",day:"numeric",month:"long",year:"numeric"}).format(new Date(t)),T=t=>{const e=t%10,a=t%100;return e===1&&a!==11?"слот":e>=2&&e<=4&&(a<12||a>14)?"слота":"слотов"},H=k.map(t=>{const e=L.get(t.steam_id),a=`${t.role==="leader"?"лидер":t.role==="deputy"?"заместитель":"в составе"}${e?` · VIP до ${b(e)}`:""}`,n=m&&t.role!=="leader"&&t.steam_id!==C?`<button class="btn ghost small" type="button" data-role="${t.steam_id}" data-deputy="${t.role==="deputy"?"0":"1"}">${t.role==="deputy"?"Снять заместителя":"Сделать заместителем"}</button><button class="btn ghost small" type="button" data-remove="${t.steam_id}">Исключить</button>`:"";return`
        <article class="mate${t.role==="leader"?" lead":t.role==="deputy"?" deputy":""}" data-member="${t.steam_id}" data-label="${o(a)}">
          ${P(t,a)}
          ${t.steam_id===C?"":`<span class="mate-actions"><button class="mate-report" type="button" data-steam="${t.steam_id}" data-name="${o(t.persona??t.steam_id)}">Репорт</button>${n}</span>`}
        </article>`}).join(""),O=E.map(t=>`
        <article class="mate wait">
          ${P(t,"заявка")}
          <span class="mate-actions">
            <button class="btn small" type="button" data-decide="${t.steam_id}" data-accept="1">Принять</button>
            <button class="btn ghost small" type="button" data-decide="${t.steam_id}" data-accept="0">Отклонить</button>
          </span>
        </article>`).join(""),J=s.status==="approved"?"Одобрено":s.status==="rejected"?"Отклонён":"На модерации",z=s.status==="approved"?"approved":s.status==="rejected"?"rejected":"pending";_.innerHTML=`
        <p class="eyebrow"><a href="/squads">Сквады</a></p>
        <article class="hall${s.banner?" has-banner":""}">
          <header class="hall-hero">
            ${s.banner?`<div class="hall-banner" style="background-image:url('${o(s.banner)}')"></div>`:""}
            <div class="hall-id">
              <div class="hall-mark">${s.logo?`<img src="${o(s.logo)}" alt="" />`:o(s.tag)}</div>
              <div>
                <h1>[${o(s.tag)}] ${o(s.name)}</h1>
                <div class="dossier-tags">
                  <span class="squad-status ${z}">${J}</span>
                  <span class="pill">${s.members} в составе</span>
                  <a class="pill" href="/p?id=${s.owner_steam_id}">${o(s.owner_name??"владелец")}</a>
                  ${s.closed?'<span class="pill old">набор закрыт</span>':'<span class="pill now">набор открыт</span>'}
                </div>
              </div>
            </div>
          </header>
          <section class="hall-split">
            <div>
              <p class="eyebrow">Описание</p>
              <p class="hall-copy">${s.about?V(s.about):"Сквад ещё не заполнил описание."}</p>
            </div>
            <div>
              <p class="eyebrow">Критерии набора</p>
              <p class="hall-copy">${s.criteria?V(s.criteria):"Критерии не указаны."}</p>
            </div>
          </section>
          <div class="hall-actions">
            ${s.discord_url?`<a class="btn small" href="${o(s.discord_url)}">Discord сквада</a>`:""}
            ${f?'<span class="note">Вы в составе.</span>':x?'<span class="note">Заявка на рассмотрении.</span>':S?'<span class="note">Вы уже состоите в скваде.</span>':s.closed?'<span class="note">Набор закрыт.</span>':'<button class="btn small" id="join" type="button">Подать заявку</button>'}
          </div>
        </article>
        ${d.length&&!m?`<p class="note">VIP: ${d.length} ${T(d.length)}. ${o([...new Set(d.map(t=>b(t.until)))].length===1?`Оплачены до ${b(d[0].until)}`:"Сроки у слотов разные")}</p>`:""}
        ${m&&g?(()=>{const t=[...new Set(d.map(l=>b(l.until)))],e=d.length?t.length===1?`Оплачены до ${t[0]}`:"Сроки у слотов разные":"Оплаченных слотов нет",a=k.filter(l=>!L.has(l.steam_id)),n=d.map(l=>{if(l.holder)return`<li><b>до ${o(b(l.until))}</b> · ${o(l.holderName||l.holder)} <button class="btn ghost small" type="button" data-clear-slot="${l.id}">Снять</button></li>`;const w=a.map(v=>`<option value="${v.steam_id}">${o(v.persona??v.steam_id)}</option>`).join("");return`<li><b>до ${o(b(l.until))}</b> · свободен <select data-slot-holder="${l.id}">${w}</select> <button class="btn small" type="button" data-assign="${l.id}">Выдать</button></li>`}).join(""),c=Number(g.price)||0;return`<section class="clan-desk">
            <div class="hall-head"><h2>Казна и VIP</h2><p class="note">Очки за квесты состава копируются в казну. Слот покупается отсюда, и вы сами выбираете, кому его выдать.</p></div>
            <p class="clan-stats"><b>${Number(g.coins)||0}</b> очков в казне · <b>${d.length}</b> VIP ${T(d.length)} · ${o(e)}</p>
            ${c>0?`<button class="btn small" id="buy-slot" type="button">Купить слот · ${c} очков · ${Number(g.days)||0} дней</button>`:'<p class="note">Покупка слота сейчас закрыта.</p>'}
            ${n?`<ul class="clan-slots">${n}</ul>`:""}
            ${y==="leader"?'<button class="btn ghost small" id="disband" type="button">Расформировать состав</button>':""}
          </section>`})():""}
        ${O?`<div class="hall-head"><h2>Заявки</h2><p class="note">${E.length}</p></div><div class="hall-roster">${O}</div>`:""}
        <div class="hall-head">
          <h2>Состав</h2>
          <p class="note">${(()=>{const t=k.length,e=t%10,a=t%100,n=e===1&&a!==11?"человек":e>=2&&e<=4&&(a<12||a>14)?"человека":"человек";return`${t} ${n}`})()} · <span id="on-server">смотрим сервер</span></p>
        </div>
        <div class="hall-roster">${H||"<p>В составе пока никого.</p>"}</div>
        ${M}
        <form id="report-form" class="report" hidden>
          <p>Жалоба на <strong id="report-who"></strong></p>
          <textarea id="report-note" maxlength="400" placeholder="Что человек сделал. Минимум 10 символов."></textarea>
          <button class="btn small" type="submit">Отправить</button>
        </form>
        <p class="note" id="squad-note"></p>
      `;const R=async()=>{const t=await fetch("/api/server").then(c=>c.ok?c.json():null).catch(()=>null),e=new Map;for(const c of t?.teams??[])for(const l of c.players??[])e.set(String(l.steamId),String(c.name||""));let a=0;document.querySelectorAll("[data-member]").forEach(c=>{const w=e.get(c.dataset.member??"")!==void 0;c.classList.toggle("live",w),w&&(a+=1);const v=c.querySelector("small"),N=c.dataset.label??"";v&&(v.textContent=w?`${N} · на сервере`:N)});const n=document.querySelector("#on-server");n&&(n.textContent=a?`${a} на сервере`:"на сервере никого")};R(),window.setInterval(()=>void R(),2e4),document.querySelector("#join")?.addEventListener("click",async()=>{const t=document.querySelector("#squad-note"),e=await fetch(`/api/squads/${i}/join`,{method:"POST"}),a=await e.json().catch(()=>({}));e.status===401&&(location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`),t.textContent=e.ok?"Заявка отправлена. Лидер сквада её примет или отклонит.":a.error==="closed"?"Набор закрыт.":a.error==="already"?"Вы уже состоите в скваде.":"Сейчас вступить не получилось.",e.ok&&location.reload()}),document.querySelectorAll("[data-decide]").forEach(t=>{t.addEventListener("click",async()=>{const e=document.querySelector("#squad-note"),a=await fetch(`/api/squads/${i}/decide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:t.dataset.decide,accept:t.dataset.accept==="1"})});if(a.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=a.ok?t.dataset.accept==="1"?"Игрок принят в состав.":"Заявка отклонена.":"Эта заявка уже решена.",a.ok&&location.reload()})}),document.querySelectorAll("[data-remove]").forEach(t=>{t.addEventListener("click",async()=>{const e=document.querySelector("#squad-note");if(!window.confirm("Исключить этого игрока из сквада?"))return;const a=await fetch(`/api/squads/${i}/remove`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:t.dataset.remove})});if(a.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=a.ok?"Игрок исключён из состава.":"Этого игрока уже нет в составе.",a.ok&&location.reload()})});const U={poor:"В казне не хватает очков.",closed:"Покупка слота сейчас закрыта.",discord:"У этого игрока не привязан Discord. Роль Спонсор некуда выдать.",held:"У этого игрока уже есть слот.",taken:"Этот слот уже выдан.",gone:"Слот или игрок уже изменились."};document.querySelector("#buy-slot")?.addEventListener("click",async()=>{const t=document.querySelector("#squad-note"),e=Number(g?.price)||0;if(!window.confirm(`Купить слот за ${e} очков казны?`))return;const a=await fetch(`/api/squads/${i}/slots`,{method:"POST"}),n=await a.json().catch(()=>({}));if(a.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}t.textContent=a.ok?"Слот куплен. Его можно выдать участнику.":U[String(n.error)]||"Купить слот не получилось.",a.ok&&location.reload()}),document.querySelectorAll("[data-assign]").forEach(t=>{t.addEventListener("click",async()=>{const e=document.querySelector("#squad-note"),a=document.querySelector(`[data-slot-holder="${t.dataset.assign}"]`),n=await fetch(`/api/squads/${i}/slots/${t.dataset.assign}/assign`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:a?.value??""})}),c=await n.json().catch(()=>({}));if(n.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=n.ok?"VIP выдан. Роль Спонсор появится в Discord в течение минуты.":U[String(c.error)]||"Выдать слот не получилось.",n.ok&&location.reload()})}),document.querySelectorAll("[data-clear-slot]").forEach(t=>{t.addEventListener("click",async()=>{const e=document.querySelector("#squad-note");if(!window.confirm("Снять VIP с этого игрока? Слот снова станет свободным."))return;const a=await fetch(`/api/squads/${i}/slots/${t.dataset.clearSlot}/clear`,{method:"POST"});if(a.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=a.ok?"VIP снят. Роль исчезнет в течение минуты, если другого срока нет.":"Снять слот не получилось.",a.ok&&location.reload()})}),document.querySelectorAll("[data-role]").forEach(t=>{t.addEventListener("click",async()=>{const e=document.querySelector("#squad-note"),a=t.dataset.deputy==="1",n=await fetch(`/api/squads/${i}/role`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:t.dataset.role,deputy:a})});if(n.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=n.ok?a?"Заместитель назначен.":"Заместитель снят.":"Эту должность изменить не получилось.",n.ok&&location.reload()})}),document.querySelector("#disband")?.addEventListener("click",async()=>{const t=document.querySelector("#squad-note");if(!window.confirm("Расформировать состав? Сквад, казна и слоты удалятся. Выданный VIP снимется."))return;const e=await fetch(`/api/squads/${i}/disband`,{method:"POST"});if(e.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.ok?location.href="/squads":t.textContent="Расформировать состав может только лидер."});const j=document.querySelector("#report-form");let A="";document.querySelectorAll(".mate-report").forEach(t=>{t.addEventListener("click",()=>{A=t.dataset.steam??"";const e=document.querySelector("#report-who");e&&(e.textContent=t.dataset.name??""),j?.removeAttribute("hidden"),document.querySelector("#report-note")?.focus()})}),j?.addEventListener("submit",async t=>{t.preventDefault();const e=document.querySelector("#squad-note"),a=document.querySelector("#report-note")?.value.trim()??"";if(a.length<10){e.textContent="Нужно хотя бы 10 символов, что именно случилось.";return}const n=await fetch(`/api/squads/${i}/report`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:A,note:a})}),c=await n.json().catch(()=>({}));if(n.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=n.ok?"Жалоба отправлена. Её увидит администрация сайта.":c.error==="duplicate"?"На этого человека вы уже жаловались на этой неделе.":c.error==="self"?"На себя жалобу отправить нельзя.":"Нужно хотя бы 10 символов, что именно случилось.",n.ok&&j.setAttribute("hidden","")})}}
