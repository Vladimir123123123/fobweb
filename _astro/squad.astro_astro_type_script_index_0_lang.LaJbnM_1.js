const w=document.querySelector("#squad-page"),i=new URLSearchParams(location.search).get("id")??"",o=v=>v.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[m]??m);if(!/^\d+$/.test(i))w.innerHTML="<h1>Такой страницы нет</h1>";else{const[v,m]=await Promise.all([fetch(`/api/squads/${i}`),fetch("/api/me").then(d=>d.json()).catch(()=>({user:null}))]);if(!v.ok)w.innerHTML="<h1>Сквада нет</h1><p>Его не опубликовали или он ещё на проверке.</p>";else{const d=await v.json(),n=d.squad,k=d.members,$=d.seat,g=!!$&&String($?.squad_id)===i,U=g&&$?.status==="member",N=g&&$?.status==="pending",A=$?.status==="member"&&!g,I=d.office==="leader"||d.office==="deputy"?d.office:"",f=!!I,j=m.user?.steam_id?String(m.user.steam_id):"",b=k.filter(t=>t.status==="member"),x=f?k.filter(t=>t.status==="pending"):[],_=(t,e)=>`
        <a href="/p?id=${t.steam_id}">
          ${t.avatar?`<img src="${o(t.avatar)}" alt="" />`:`<span class="mate-fallback">${o((t.persona??"?").slice(0,1))}</span>`}
          <span>
            <strong>${o(t.persona??t.steam_id)}</strong>
            <small>${e}</small>
          </span>
        </a>`,q=d.activity,V=new Map(b.map(t=>[t.steam_id,t.persona??t.steam_id])),D=f&&q?`
        <section class="activity">
          <div class="hall-head">
            <h2>Активность</h2>
            <p class="note">Место в скваде за день, по времени на сервере</p>
          </div>
          <div class="activity-scroll">
            <table>
              <thead><tr><th>Участник</th>${q.days.map(t=>`<th>${o(t)}</th>`).join("")}</tr></thead>
              <tbody>
                ${q.rows.map(t=>`<tr>
                  <td><a href="/p?id=${t.steamId}">${o(V.get(t.steamId)??t.steamId)}</a></td>
                  ${t.cells.map(e=>`<td>${e?`<b>${e.place}</b><small>${e.minutes} мин${e.kills?` · ${e.kills}`:""}</small>`:"—"}</td>`).join("")}
                </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </section>`:"",p=d.clan,r=p?.slots??[],C=new Map(r.filter(t=>t.holder).map(t=>[t.holder,t.until])),u=t=>new Intl.DateTimeFormat("ru-RU",{timeZone:"Europe/Moscow",day:"numeric",month:"long",year:"numeric"}).format(new Date(t)),E=t=>{const e=t%10,a=t%100;return e===1&&a!==11?"слот":e>=2&&e<=4&&(a<12||a>14)?"слота":"слотов"},M=b.map(t=>{const e=C.get(t.steam_id),a=`${t.role==="leader"?"лидер":t.role==="deputy"?"заместитель":"в составе"}${e?` · VIP до ${u(e)}`:""}`,s=f&&t.role!=="leader"&&t.steam_id!==j?`<button class="btn ghost small" type="button" data-role="${t.steam_id}" data-deputy="${t.role==="deputy"?"0":"1"}">${t.role==="deputy"?"Снять заместителя":"Сделать заместителем"}</button><button class="btn ghost small" type="button" data-remove="${t.steam_id}">Исключить</button>`:"";return`
        <article class="mate${t.role==="leader"?" lead":t.role==="deputy"?" deputy":""}" data-member="${t.steam_id}" data-label="${o(a)}">
          ${_(t,a)}
          ${t.steam_id===j?"":`<span class="mate-actions"><button class="mate-report" type="button" data-steam="${t.steam_id}" data-name="${o(t.persona??t.steam_id)}">Репорт</button>${s}</span>`}
        </article>`}).join(""),P=x.map(t=>`
        <article class="mate wait">
          ${_(t,"заявка")}
          <span class="mate-actions">
            <button class="btn small" type="button" data-decide="${t.steam_id}" data-accept="1">Принять</button>
            <button class="btn ghost small" type="button" data-decide="${t.steam_id}" data-accept="0">Отклонить</button>
          </span>
        </article>`).join(""),H=n.status==="approved"?"Одобрено":n.status==="rejected"?"Отклонён":"На модерации",J=n.status==="approved"?"approved":n.status==="rejected"?"rejected":"pending";w.innerHTML=`
        <p class="eyebrow"><a href="/squads">Сквады</a></p>
        <article class="hall${n.banner?" has-banner":""}">
          <header class="hall-hero">
            ${n.banner?`<div class="hall-banner" style="background-image:url('${o(n.banner)}')"></div>`:""}
            <div class="hall-id">
              <div class="hall-mark">${n.logo?`<img src="${o(n.logo)}" alt="" />`:o(n.tag)}</div>
              <div>
                <h1>[${o(n.tag)}] ${o(n.name)}</h1>
                <div class="dossier-tags">
                  <span class="squad-status ${J}">${H}</span>
                  <span class="pill">${n.members} в составе</span>
                  <a class="pill" href="/p?id=${n.owner_steam_id}">${o(n.owner_name??"владелец")}</a>
                  ${n.closed?'<span class="pill old">набор закрыт</span>':'<span class="pill now">набор открыт</span>'}
                </div>
              </div>
            </div>
          </header>
          <section class="hall-split">
            <div>
              <p class="eyebrow">Описание</p>
              <p class="hall-copy">${o(n.about||"Сквад ещё не заполнил описание.")}</p>
            </div>
            <div>
              <p class="eyebrow">Критерии набора</p>
              <p class="hall-copy">${o(n.criteria||"Критерии не указаны.")}</p>
            </div>
          </section>
          <div class="hall-actions">
            ${n.discord_url?`<a class="btn small" href="${o(n.discord_url)}">Discord сквада</a>`:""}
            ${U?'<span class="note">Вы в составе.</span>':N?'<span class="note">Заявка на рассмотрении.</span>':A?'<span class="note">Вы уже состоите в скваде.</span>':n.closed?'<span class="note">Набор закрыт.</span>':'<button class="btn small" id="join" type="button">Подать заявку</button>'}
          </div>
        </article>
        ${r.length&&!f?`<p class="note">VIP: ${r.length} ${E(r.length)}. ${o([...new Set(r.map(t=>u(t.until)))].length===1?`Оплачены до ${u(r[0].until)}`:"Сроки у слотов разные")}</p>`:""}
        ${f&&p?(()=>{const t=[...new Set(r.map(l=>u(l.until)))],e=r.length?t.length===1?`Оплачены до ${t[0]}`:"Сроки у слотов разные":"Оплаченных слотов нет",a=b.filter(l=>!C.has(l.steam_id)),s=r.map(l=>{if(l.holder)return`<li><b>до ${o(u(l.until))}</b> · ${o(l.holderName||l.holder)} <button class="btn ghost small" type="button" data-clear-slot="${l.id}">Снять</button></li>`;const y=a.map(h=>`<option value="${h.steam_id}">${o(h.persona??h.steam_id)}</option>`).join("");return`<li><b>до ${o(u(l.until))}</b> · свободен <select data-slot-holder="${l.id}">${y}</select> <button class="btn small" type="button" data-assign="${l.id}">Выдать</button></li>`}).join(""),c=Number(p.price)||0;return`<section class="clan-desk">
            <div class="hall-head"><h2>Казна и VIP</h2><p class="note">Очки за квесты состава копируются в казну. Слот покупается отсюда, и вы сами выбираете, кому его выдать.</p></div>
            <p class="clan-stats"><b>${Number(p.coins)||0}</b> очков в казне · <b>${r.length}</b> VIP ${E(r.length)} · ${o(e)}</p>
            ${c>0?`<button class="btn small" id="buy-slot" type="button">Купить слот · ${c} очков · ${Number(p.days)||0} дней</button>`:'<p class="note">Покупка слота сейчас закрыта.</p>'}
            ${s?`<ul class="clan-slots">${s}</ul>`:""}
            ${I==="leader"?'<button class="btn ghost small" id="disband" type="button">Расформировать состав</button>':""}
          </section>`})():""}
        ${P?`<div class="hall-head"><h2>Заявки</h2><p class="note">${x.length}</p></div><div class="hall-roster">${P}</div>`:""}
        <div class="hall-head">
          <h2>Состав</h2>
          <p class="note">${(()=>{const t=b.length,e=t%10,a=t%100,s=e===1&&a!==11?"человек":e>=2&&e<=4&&(a<12||a>14)?"человека":"человек";return`${t} ${s}`})()} · <span id="on-server">смотрим сервер</span></p>
        </div>
        <div class="hall-roster">${M||"<p>В составе пока никого.</p>"}</div>
        ${D}
        <form id="report-form" class="report" hidden>
          <p>Жалоба на <strong id="report-who"></strong></p>
          <textarea id="report-note" maxlength="400" placeholder="Что человек сделал. Минимум 10 символов."></textarea>
          <button class="btn small" type="submit">Отправить</button>
        </form>
        <p class="note" id="squad-note"></p>
      `;const T=async()=>{const t=await fetch("/api/server").then(c=>c.ok?c.json():null).catch(()=>null),e=new Map;for(const c of t?.teams??[])for(const l of c.players??[])e.set(String(l.steamId),String(c.name||""));let a=0;document.querySelectorAll("[data-member]").forEach(c=>{const y=e.get(c.dataset.member??"")!==void 0;c.classList.toggle("live",y),y&&(a+=1);const h=c.querySelector("small"),R=c.dataset.label??"";h&&(h.textContent=y?`${R} · на сервере`:R)});const s=document.querySelector("#on-server");s&&(s.textContent=a?`${a} на сервере`:"на сервере никого")};T(),window.setInterval(()=>void T(),2e4),document.querySelector("#join")?.addEventListener("click",async()=>{const t=document.querySelector("#squad-note"),e=await fetch(`/api/squads/${i}/join`,{method:"POST"}),a=await e.json().catch(()=>({}));e.status===401&&(location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`),t.textContent=e.ok?"Заявка отправлена. Лидер сквада её примет или отклонит.":a.error==="closed"?"Набор закрыт.":a.error==="already"?"Вы уже состоите в скваде.":"Сейчас вступить не получилось.",e.ok&&location.reload()}),document.querySelectorAll("[data-decide]").forEach(t=>{t.addEventListener("click",async()=>{const e=document.querySelector("#squad-note"),a=await fetch(`/api/squads/${i}/decide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:t.dataset.decide,accept:t.dataset.accept==="1"})});if(a.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=a.ok?t.dataset.accept==="1"?"Игрок принят в состав.":"Заявка отклонена.":"Эта заявка уже решена.",a.ok&&location.reload()})}),document.querySelectorAll("[data-remove]").forEach(t=>{t.addEventListener("click",async()=>{const e=document.querySelector("#squad-note");if(!window.confirm("Исключить этого игрока из сквада?"))return;const a=await fetch(`/api/squads/${i}/remove`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:t.dataset.remove})});if(a.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=a.ok?"Игрок исключён из состава.":"Этого игрока уже нет в составе.",a.ok&&location.reload()})});const L={poor:"В казне не хватает очков.",closed:"Покупка слота сейчас закрыта.",discord:"У этого игрока не привязан Discord. Роль Спонсор некуда выдать.",held:"У этого игрока уже есть слот.",taken:"Этот слот уже выдан.",gone:"Слот или игрок уже изменились."};document.querySelector("#buy-slot")?.addEventListener("click",async()=>{const t=document.querySelector("#squad-note"),e=Number(p?.price)||0;if(!window.confirm(`Купить слот за ${e} очков казны?`))return;const a=await fetch(`/api/squads/${i}/slots`,{method:"POST"}),s=await a.json().catch(()=>({}));if(a.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}t.textContent=a.ok?"Слот куплен. Его можно выдать участнику.":L[String(s.error)]||"Купить слот не получилось.",a.ok&&location.reload()}),document.querySelectorAll("[data-assign]").forEach(t=>{t.addEventListener("click",async()=>{const e=document.querySelector("#squad-note"),a=document.querySelector(`[data-slot-holder="${t.dataset.assign}"]`),s=await fetch(`/api/squads/${i}/slots/${t.dataset.assign}/assign`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:a?.value??""})}),c=await s.json().catch(()=>({}));if(s.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=s.ok?"VIP выдан. Роль Спонсор появится в Discord в течение минуты.":L[String(c.error)]||"Выдать слот не получилось.",s.ok&&location.reload()})}),document.querySelectorAll("[data-clear-slot]").forEach(t=>{t.addEventListener("click",async()=>{const e=document.querySelector("#squad-note");if(!window.confirm("Снять VIP с этого игрока? Слот снова станет свободным."))return;const a=await fetch(`/api/squads/${i}/slots/${t.dataset.clearSlot}/clear`,{method:"POST"});if(a.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=a.ok?"VIP снят. Роль исчезнет в течение минуты, если другого срока нет.":"Снять слот не получилось.",a.ok&&location.reload()})}),document.querySelectorAll("[data-role]").forEach(t=>{t.addEventListener("click",async()=>{const e=document.querySelector("#squad-note"),a=t.dataset.deputy==="1",s=await fetch(`/api/squads/${i}/role`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:t.dataset.role,deputy:a})});if(s.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=s.ok?a?"Заместитель назначен.":"Заместитель снят.":"Эту должность изменить не получилось.",s.ok&&location.reload()})}),document.querySelector("#disband")?.addEventListener("click",async()=>{const t=document.querySelector("#squad-note");if(!window.confirm("Расформировать состав? Сквад, казна и слоты удалятся. Выданный VIP снимется."))return;const e=await fetch(`/api/squads/${i}/disband`,{method:"POST"});if(e.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.ok?location.href="/squads":t.textContent="Расформировать состав может только лидер."});const S=document.querySelector("#report-form");let O="";document.querySelectorAll(".mate-report").forEach(t=>{t.addEventListener("click",()=>{O=t.dataset.steam??"";const e=document.querySelector("#report-who");e&&(e.textContent=t.dataset.name??""),S?.removeAttribute("hidden"),document.querySelector("#report-note")?.focus()})}),S?.addEventListener("submit",async t=>{t.preventDefault();const e=document.querySelector("#squad-note"),a=document.querySelector("#report-note")?.value.trim()??"";if(a.length<10){e.textContent="Нужно хотя бы 10 символов, что именно случилось.";return}const s=await fetch(`/api/squads/${i}/report`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:O,note:a})}),c=await s.json().catch(()=>({}));if(s.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=s.ok?"Жалоба отправлена. Её увидит администрация сайта.":c.error==="duplicate"?"На этого человека вы уже жаловались на этой неделе.":c.error==="self"?"На себя жалобу отправить нельзя.":"Нужно хотя бы 10 символов, что именно случилось.",s.ok&&S.setAttribute("hidden","")})}}
