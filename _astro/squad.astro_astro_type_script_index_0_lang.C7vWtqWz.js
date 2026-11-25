const C=document.querySelector("#squad-page"),r=new URLSearchParams(location.search).get("id")??"",s=p=>p.replace(/[&<>"']/g,y=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[y]??y),N=p=>{const y=/(?:https?:\/\/|www\.)[^\s]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:ru|su|com|net|org|gg|io|me|tv|app|dev)(?:\/[^\s]*)?/gi;let i="",n=0;for(const S of p.matchAll(y)){const u=S.index??0;i+=s(p.slice(n,u));const h=S[0],v=h.replace(/[.,!?;:)]+$/g,""),j=h.slice(v.length),x=/^https?:\/\//i.test(v)?v:`https://${v}`;let b=!1;try{const m=new URL(x);b=m.protocol==="http:"||m.protocol==="https:"}catch{b=!1}i+=b?`<a href="${s(x)}" target="_blank" rel="noopener noreferrer">${s(v)}</a>${s(j)}`:s(h),n=u+h.length}return i+s(p.slice(n))};if(!/^\d+$/.test(r))C.innerHTML="<h1>Такой страницы нет</h1>";else{const[p,y]=await Promise.all([fetch(`/api/squads/${r}`),fetch("/api/me").then(i=>i.json()).catch(()=>({user:null}))]);if(!p.ok)C.innerHTML="<h1>Сквада нет</h1><p>Его не опубликовали или он ещё на проверке.</p>";else{const i=await p.json(),n=i.squad,S=i.members,u=i.seat,h=!!u&&String(u?.squad_id)===r,v=h&&u?.status==="member",j=h&&u?.status==="pending",x=u?.status==="member"&&!h,b=i.office==="leader"||i.office==="deputy"?i.office:"",m=!!b,E=y.user?.steam_id?String(y.user.steam_id):"",I=S.filter(t=>t.status==="member"),P=m?S.filter(t=>t.status==="pending"):[],L=(t,a)=>`
        <a href="/p?id=${t.steam_id}">
          ${t.avatar?`<img src="${s(t.avatar)}" alt="" />`:`<span class="mate-fallback">${s((t.persona??"?").slice(0,1))}</span>`}
          <span>
            <strong>${s(t.persona??t.steam_id)}</strong>
            <small>${a}</small>
            <em class="mate-id">ID ${s(t.steam_id.slice(-6))}</em>
          </span>
        </a>`,k=i.activity,D=new Map(I.map(t=>[t.steam_id,t.persona??t.steam_id])),V=m&&k?`
        <section class="activity">
          <div class="hall-head">
            <h2>Активность</h2>
            <p class="note">Место в скваде за день, по времени на сервере</p>
          </div>
          ${(()=>{const t=k.days.map((e,o)=>{let c=0,l=0,$=0;for(const f of k.rows){const w=f.cells[o];w&&(c+=w.minutes,l+=w.kills,$+=1)}return{day:e,minutes:c,kills:l,people:$}}),a=Math.max(...t.map(e=>e.minutes),1);return`<div class="act-chart" role="img" aria-label="Минуты сквада на сервере по дням">${t.map(e=>`
              <div class="act-bar" tabindex="0">
                <div class="act-tip"><b>${s(e.day)}</b><span>${e.minutes} мин на сервере</span><span>${e.people} игроков · ${e.kills} убийств</span></div>
                <div class="act-fill" style="height:${e.minutes?Math.max(4,Math.round(e.minutes/a*100)):2}%"></div>
                <span class="act-day">${s(e.day.slice(-5))}</span>
              </div>`).join("")}</div>`})()}
          <div class="activity-scroll">
            <table>
              <thead><tr><th>Участник</th>${k.days.map(t=>`<th>${s(t)}</th>`).join("")}</tr></thead>
              <tbody>
                ${k.rows.map(t=>`<tr>
                  <td><a href="/p?id=${t.steamId}">${s(D.get(t.steamId)??t.steamId)}</a></td>
                  ${t.cells.map(a=>`<td>${a?`<b>${a.place}</b><small>${a.minutes} мин${a.kills?` · ${a.kills}`:""}</small>`:"—"}</td>`).join("")}
                </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </section>`:"",g=i.clan,d=g?.slots??[],T=new Map(d.filter(t=>t.holder).map(t=>[t.holder,t.until])),q=t=>new Intl.DateTimeFormat("ru-RU",{timeZone:"Europe/Moscow",day:"numeric",month:"long",year:"numeric"}).format(new Date(t)),O=t=>{const a=t%10,e=t%100;return a===1&&e!==11?"слот":a>=2&&a<=4&&(e<12||e>14)?"слота":"слотов"},H=I.map(t=>{const a=T.get(t.steam_id),e=`${t.role==="leader"?"лидер":t.role==="deputy"?"заместитель":"в составе"}${a?` · VIP до ${q(a)}`:""}`,o=m&&t.role!=="leader"&&t.steam_id!==E?`<button class="btn ghost small" type="button" data-role="${t.steam_id}" data-deputy="${t.role==="deputy"?"0":"1"}">${t.role==="deputy"?"Снять заместителя":"Сделать заместителем"}</button><button class="btn ghost small" type="button" data-remove="${t.steam_id}">Исключить</button>`:"";return`
        <article class="mate${t.role==="leader"?" lead":t.role==="deputy"?" deputy":""}" data-member="${t.steam_id}" data-label="${s(e)}">
          ${L(t,e)}
          ${t.steam_id===E?"":`<span class="mate-actions"><button class="mate-report" type="button" data-steam="${t.steam_id}" data-name="${s(t.persona??t.steam_id)}">Репорт</button>${o}</span>`}
        </article>`}).join(""),R=P.map(t=>`
        <article class="mate wait">
          ${L(t,"заявка")}
          <span class="mate-actions">
            <button class="btn small" type="button" data-decide="${t.steam_id}" data-accept="1">Принять</button>
            <button class="btn ghost small" type="button" data-decide="${t.steam_id}" data-accept="0">Отклонить</button>
          </span>
        </article>`).join(""),J=n.status==="approved"?"Одобрено":n.status==="rejected"?"Отклонён":"На модерации",z=n.status==="approved"?"approved":n.status==="rejected"?"rejected":"pending";C.innerHTML=`
        <p class="eyebrow"><a href="/squads">Сквады</a></p>
        <article class="hall${n.banner?" has-banner":""}">
          <header class="hall-hero">
            <div class="hall-banner${n.banner?"":" plain"}"${n.banner?` style="background-image:url('${s(n.banner)}')"`:""}></div>
            <div class="hall-id">
              <div class="hall-mark">${n.logo?`<img src="${s(n.logo)}" alt="" />`:s(n.tag)}</div>
              <div>
                <h1>[${s(n.tag)}] ${s(n.name)}</h1>
                <div class="dossier-tags">
                  <span class="squad-status ${z}">${J}</span>
                  <span class="pill">${n.members} в составе</span>
                  <a class="pill" href="/p?id=${n.owner_steam_id}">${s(n.owner_name??"владелец")}</a>
                  ${n.closed?'<span class="pill old">набор закрыт</span>':'<span class="pill now">набор открыт</span>'}
                </div>
              </div>
            </div>
          </header>
          <section class="hall-split">
            <div>
              <p class="eyebrow">Описание</p>
              <p class="hall-copy">${n.about?N(n.about):"Сквад ещё не заполнил описание."}</p>
            </div>
            <div>
              <p class="eyebrow">Критерии набора</p>
              <p class="hall-copy">${n.criteria?N(n.criteria):"Критерии не указаны."}</p>
            </div>
          </section>
          <div class="hall-actions">
            ${n.discord_url?`<a class="btn small" href="${s(n.discord_url)}">Discord сквада</a>`:""}
            ${v?'<span class="note">Вы в составе.</span>':j?'<span class="note">Заявка на рассмотрении.</span>':x?'<span class="note">Вы уже состоите в скваде.</span>':n.closed?'<span class="note">Набор закрыт.</span>':'<button class="btn small" id="join" type="button">Подать заявку</button>'}
          </div>
        </article>
        ${d.length&&!m?`<p class="note">VIP: ${d.length} ${O(d.length)}. ${s([...new Set(d.map(t=>q(t.until)))].length===1?`Оплачены до ${q(d[0].until)}`:"Сроки у слотов разные")}</p>`:""}
        ${m&&g?(()=>{const t=[...new Set(d.map(l=>q(l.until)))],a=d.length?t.length===1?`Оплачены до ${t[0]}`:"Сроки у слотов разные":"Оплаченных слотов нет",e=I.filter(l=>!T.has(l.steam_id)),o=d.map(l=>{if(l.holder)return`<li><b>до ${s(q(l.until))}</b> · ${s(l.holderName||l.holder)} <button class="btn ghost small" type="button" data-clear-slot="${l.id}">Снять</button></li>`;const $=e.map(f=>`<option value="${f.steam_id}">${s(f.persona??f.steam_id)}</option>`).join("");return`<li><b>до ${s(q(l.until))}</b> · свободен <select data-slot-holder="${l.id}">${$}</select> <button class="btn small" type="button" data-assign="${l.id}">Выдать</button></li>`}).join(""),c=Number(g.price)||0;return`<section class="clan-desk">
            <div class="hall-head"><h2>Казна и VIP</h2><p class="note">Очки за квесты состава копируются в казну. Слот покупается отсюда, и вы сами выбираете, кому его выдать.</p></div>
            <p class="clan-stats"><b>${Number(g.coins)||0}</b> очков в казне · <b>${d.length}</b> VIP ${O(d.length)} · ${s(a)}</p>
            ${c>0?`<button class="btn small" id="buy-slot" type="button">Купить слот · ${c} очков · ${Number(g.days)||0} дней</button>`:'<p class="note">Покупка слота сейчас закрыта.</p>'}
            ${o?`<ul class="clan-slots">${o}</ul>`:""}
            ${b==="leader"?'<button class="btn ghost small" id="disband" type="button">Расформировать состав</button>':""}
          </section>`})():""}
        ${R?`<div class="hall-head"><h2>Заявки</h2><p class="note">${P.length}</p></div><div class="hall-roster">${R}</div>`:""}
        <div class="hall-head">
          <h2>Состав</h2>
          <p class="note">${(()=>{const t=I.length,a=t%10,e=t%100,o=a===1&&e!==11?"человек":a>=2&&a<=4&&(e<12||e>14)?"человека":"человек";return`${t} ${o}`})()} · <span id="on-server">смотрим сервер</span></p>
        </div>
        <div class="hall-roster">${H||"<p>В составе пока никого.</p>"}</div>
        ${V}
        <form id="report-form" class="report" hidden>
          <p>Жалоба на <strong id="report-who"></strong></p>
          <textarea id="report-note" maxlength="400" placeholder="Что человек сделал. Минимум 10 символов."></textarea>
          <button class="btn small" type="submit">Отправить</button>
        </form>
        <p class="note" id="squad-note"></p>
      `;const U=async()=>{const t=await fetch("/api/server").then(c=>c.ok?c.json():null).catch(()=>null),a=new Map;for(const c of t?.teams??[])for(const l of c.players??[])a.set(String(l.steamId),String(c.name||""));let e=0;document.querySelectorAll("[data-member]").forEach(c=>{const $=a.get(c.dataset.member??"")!==void 0;c.classList.toggle("live",$),$&&(e+=1);const f=c.querySelector("small"),w=c.dataset.label??"";f&&(f.textContent=$?`${w} · на сервере`:w)});const o=document.querySelector("#on-server");o&&(o.textContent=e?`${e} на сервере`:"на сервере никого")};U(),window.setInterval(()=>void U(),2e4),document.querySelector("#join")?.addEventListener("click",async()=>{const t=document.querySelector("#squad-note"),a=await fetch(`/api/squads/${r}/join`,{method:"POST"}),e=await a.json().catch(()=>({}));a.status===401&&(location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`),t.textContent=a.ok?"Заявка отправлена. Лидер сквада её примет или отклонит.":e.error==="closed"?"Набор закрыт.":e.error==="already"?"Вы уже состоите в скваде.":"Сейчас вступить не получилось.",a.ok&&location.reload()}),document.querySelectorAll("[data-decide]").forEach(t=>{t.addEventListener("click",async()=>{const a=document.querySelector("#squad-note"),e=await fetch(`/api/squads/${r}/decide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:t.dataset.decide,accept:t.dataset.accept==="1"})});if(e.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}a.textContent=e.ok?t.dataset.accept==="1"?"Игрок принят в состав.":"Заявка отклонена.":"Эта заявка уже решена.",e.ok&&location.reload()})}),document.querySelectorAll("[data-remove]").forEach(t=>{t.addEventListener("click",async()=>{const a=document.querySelector("#squad-note");if(!window.confirm("Исключить этого игрока из сквада?"))return;const e=await fetch(`/api/squads/${r}/remove`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:t.dataset.remove})});if(e.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}a.textContent=e.ok?"Игрок исключён из состава.":"Этого игрока уже нет в составе.",e.ok&&location.reload()})});const A={poor:"В казне не хватает очков.",closed:"Покупка слота сейчас закрыта.",discord:"У этого игрока не привязан Discord. Роль Спонсор некуда выдать.",held:"У этого игрока уже есть слот.",taken:"Этот слот уже выдан.",gone:"Слот или игрок уже изменились."};document.querySelector("#buy-slot")?.addEventListener("click",async()=>{const t=document.querySelector("#squad-note"),a=Number(g?.price)||0;if(!window.confirm(`Купить слот за ${a} очков казны?`))return;const e=await fetch(`/api/squads/${r}/slots`,{method:"POST"}),o=await e.json().catch(()=>({}));if(e.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}t.textContent=e.ok?"Слот куплен. Его можно выдать участнику.":A[String(o.error)]||"Купить слот не получилось.",e.ok&&location.reload()}),document.querySelectorAll("[data-assign]").forEach(t=>{t.addEventListener("click",async()=>{const a=document.querySelector("#squad-note"),e=document.querySelector(`[data-slot-holder="${t.dataset.assign}"]`),o=await fetch(`/api/squads/${r}/slots/${t.dataset.assign}/assign`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:e?.value??""})}),c=await o.json().catch(()=>({}));if(o.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}a.textContent=o.ok?"VIP выдан. Роль Спонсор появится в Discord в течение минуты.":A[String(c.error)]||"Выдать слот не получилось.",o.ok&&location.reload()})}),document.querySelectorAll("[data-clear-slot]").forEach(t=>{t.addEventListener("click",async()=>{const a=document.querySelector("#squad-note");if(!window.confirm("Снять VIP с этого игрока? Слот снова станет свободным."))return;const e=await fetch(`/api/squads/${r}/slots/${t.dataset.clearSlot}/clear`,{method:"POST"});if(e.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}a.textContent=e.ok?"VIP снят. Роль исчезнет в течение минуты, если другого срока нет.":"Снять слот не получилось.",e.ok&&location.reload()})}),document.querySelectorAll("[data-role]").forEach(t=>{t.addEventListener("click",async()=>{const a=document.querySelector("#squad-note"),e=t.dataset.deputy==="1",o=await fetch(`/api/squads/${r}/role`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:t.dataset.role,deputy:e})});if(o.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}a.textContent=o.ok?e?"Заместитель назначен.":"Заместитель снят.":"Эту должность изменить не получилось.",o.ok&&location.reload()})}),document.querySelector("#disband")?.addEventListener("click",async()=>{const t=document.querySelector("#squad-note");if(!window.confirm("Расформировать состав? Сквад, казна и слоты удалятся. Выданный VIP снимется."))return;const a=await fetch(`/api/squads/${r}/disband`,{method:"POST"});if(a.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}a.ok?location.href="/squads":t.textContent="Расформировать состав может только лидер."});const _=document.querySelector("#report-form");let M="";document.querySelectorAll(".mate-report").forEach(t=>{t.addEventListener("click",()=>{M=t.dataset.steam??"";const a=document.querySelector("#report-who");a&&(a.textContent=t.dataset.name??""),_?.removeAttribute("hidden"),document.querySelector("#report-note")?.focus()})}),_?.addEventListener("submit",async t=>{t.preventDefault();const a=document.querySelector("#squad-note"),e=document.querySelector("#report-note")?.value.trim()??"";if(e.length<10){a.textContent="Нужно хотя бы 10 символов, что именно случилось.";return}const o=await fetch(`/api/squads/${r}/report`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:M,note:e})}),c=await o.json().catch(()=>({}));if(o.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}a.textContent=o.ok?"Жалоба отправлена. Её увидит администрация сайта.":c.error==="duplicate"?"На этого человека вы уже жаловались на этой неделе.":c.error==="self"?"На себя жалобу отправить нельзя.":"Нужно хотя бы 10 символов, что именно случилось.",o.ok&&_.setAttribute("hidden","")})}}
