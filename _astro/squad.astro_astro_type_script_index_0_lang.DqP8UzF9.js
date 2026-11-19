const f=document.querySelector("#squad-page"),r=new URLSearchParams(location.search).get("id")??"",o=p=>p.replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i]??i);if(!/^\d+$/.test(r))f.innerHTML="<h1>Такой страницы нет</h1>";else{const[p,i]=await Promise.all([fetch(`/api/squads/${r}`),fetch("/api/me").then(l=>l.json()).catch(()=>({user:null}))]);if(!p.ok)f.innerHTML="<h1>Сквада нет</h1><p>Его не опубликовали или он ещё на проверке.</p>";else{const l=await p.json(),a=l.squad,b=l.members,d=l.seat,u=!!d&&String(d?.squad_id)===r,C=u&&d?.status==="member",I=u&&d?.status==="pending",E=d?.status==="member"&&!u,h=!!l.mine,L=i.user?.steam_id?String(i.user.steam_id):"",m=b.filter(t=>t.status==="member"),g=h?b.filter(t=>t.status==="pending"):[],q=(t,e)=>`
        <a href="/p?id=${t.steam_id}">
          ${t.avatar?`<img src="${o(t.avatar)}" alt="" />`:`<span class="mate-fallback">${o((t.persona??"?").slice(0,1))}</span>`}
          <span>
            <strong>${o(t.persona??t.steam_id)}</strong>
            <small>${e}</small>
          </span>
        </a>`,$=l.activity,T=new Map(m.map(t=>[t.steam_id,t.persona??t.steam_id])),O=h&&$?`
        <section class="activity">
          <div class="hall-head">
            <h2>Активность</h2>
            <p class="note">Место в скваде за день, по времени на сервере</p>
          </div>
          <div class="activity-scroll">
            <table>
              <thead><tr><th>Участник</th>${$.days.map(t=>`<th>${o(t)}</th>`).join("")}</tr></thead>
              <tbody>
                ${$.rows.map(t=>`<tr>
                  <td><a href="/p?id=${t.steamId}">${o(T.get(t.steamId)??t.steamId)}</a></td>
                  ${t.cells.map(e=>`<td>${e?`<b>${e.place}</b><small>${e.minutes} мин${e.kills?` · ${e.kills}`:""}</small>`:"—"}</td>`).join("")}
                </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </section>`:"",A=m.map(t=>{const e=t.role==="leader"?"лидер":"в составе";return`
        <article class="mate${t.role==="leader"?" lead":""}" data-member="${t.steam_id}" data-label="${e}">
          ${q(t,e)}
          ${t.steam_id===L?"":`<span class="mate-actions"><button class="mate-report" type="button" data-steam="${t.steam_id}" data-name="${o(t.persona??t.steam_id)}">Репорт</button>${h&&t.role!=="leader"?`<button class="btn ghost small" type="button" data-remove="${t.steam_id}">Исключить</button>`:""}</span>`}
        </article>`}).join(""),S=g.map(t=>`
        <article class="mate wait">
          ${q(t,"заявка")}
          <span class="mate-actions">
            <button class="btn small" type="button" data-decide="${t.steam_id}" data-accept="1">Принять</button>
            <button class="btn ghost small" type="button" data-decide="${t.steam_id}" data-accept="0">Отклонить</button>
          </span>
        </article>`).join(""),P=a.status==="approved"?"Одобрено":a.status==="rejected"?"Отклонён":"На модерации",R=a.status==="approved"?"approved":a.status==="rejected"?"rejected":"pending";f.innerHTML=`
        <p class="eyebrow"><a href="/squads">Сквады</a></p>
        <article class="hall${a.banner?" has-banner":""}">
          <header class="hall-hero">
            ${a.banner?`<div class="hall-banner" style="background-image:url('${o(a.banner)}')"></div>`:""}
            <div class="hall-id">
              <div class="hall-mark">${a.logo?`<img src="${o(a.logo)}" alt="" />`:o(a.tag)}</div>
              <div>
                <h1>[${o(a.tag)}] ${o(a.name)}</h1>
                <div class="dossier-tags">
                  <span class="squad-status ${R}">${P}</span>
                  <span class="pill">${a.members} в составе</span>
                  <a class="pill" href="/p?id=${a.owner_steam_id}">${o(a.owner_name??"владелец")}</a>
                  ${a.closed?'<span class="pill old">набор закрыт</span>':'<span class="pill now">набор открыт</span>'}
                </div>
              </div>
            </div>
          </header>
          <section class="hall-split">
            <div>
              <p class="eyebrow">Описание</p>
              <p class="hall-copy">${o(a.about||"Сквад ещё не заполнил описание.")}</p>
            </div>
            <div>
              <p class="eyebrow">Критерии набора</p>
              <p class="hall-copy">${o(a.criteria||"Критерии не указаны.")}</p>
            </div>
          </section>
          <div class="hall-actions">
            ${a.discord_url?`<a class="btn small" href="${o(a.discord_url)}">Discord сквада</a>`:""}
            ${C?'<span class="note">Вы в составе.</span>':I?'<span class="note">Заявка на рассмотрении.</span>':E?'<span class="note">Вы уже состоите в скваде.</span>':a.closed?'<span class="note">Набор закрыт.</span>':'<button class="btn small" id="join" type="button">Подать заявку</button>'}
          </div>
        </article>
        ${S?`<div class="hall-head"><h2>Заявки</h2><p class="note">${g.length}</p></div><div class="hall-roster">${S}</div>`:""}
        <div class="hall-head">
          <h2>Состав</h2>
          <p class="note">${(()=>{const t=m.length,e=t%10,s=t%100,c=e===1&&s!==11?"человек":e>=2&&e<=4&&(s<12||s>14)?"человека":"человек";return`${t} ${c}`})()} · <span id="on-server">смотрим сервер</span></p>
        </div>
        <div class="hall-roster">${A||"<p>В составе пока никого.</p>"}</div>
        ${O}
        <form id="report-form" class="report" hidden>
          <p>Жалоба на <strong id="report-who"></strong></p>
          <textarea id="report-note" maxlength="400" placeholder="Что человек сделал. Минимум 10 символов."></textarea>
          <button class="btn small" type="submit">Отправить</button>
        </form>
        <p class="note" id="squad-note"></p>
      `;const w=async()=>{const t=await fetch("/api/server").then(n=>n.ok?n.json():null).catch(()=>null),e=new Map;for(const n of t?.teams??[])for(const k of n.players??[])e.set(String(k.steamId),String(n.name||""));let s=0;document.querySelectorAll("[data-member]").forEach(n=>{const y=e.get(n.dataset.member??"")!==void 0;n.classList.toggle("live",y),y&&(s+=1);const _=n.querySelector("small"),x=n.dataset.label??"";_&&(_.textContent=y?`${x} · на сервере`:x)});const c=document.querySelector("#on-server");c&&(c.textContent=s?`${s} на сервере`:"на сервере никого")};w(),window.setInterval(()=>void w(),2e4),document.querySelector("#join")?.addEventListener("click",async()=>{const t=document.querySelector("#squad-note"),e=await fetch(`/api/squads/${r}/join`,{method:"POST"}),s=await e.json().catch(()=>({}));e.status===401&&(location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`),t.textContent=e.ok?"Заявка отправлена. Лидер сквада её примет или отклонит.":s.error==="closed"?"Набор закрыт.":s.error==="already"?"Вы уже состоите в скваде.":"Сейчас вступить не получилось.",e.ok&&location.reload()}),document.querySelectorAll("[data-decide]").forEach(t=>{t.addEventListener("click",async()=>{const e=document.querySelector("#squad-note"),s=await fetch(`/api/squads/${r}/decide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:t.dataset.decide,accept:t.dataset.accept==="1"})});if(s.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=s.ok?t.dataset.accept==="1"?"Игрок принят в состав.":"Заявка отклонена.":"Эта заявка уже решена.",s.ok&&location.reload()})}),document.querySelectorAll("[data-remove]").forEach(t=>{t.addEventListener("click",async()=>{const e=document.querySelector("#squad-note");if(!window.confirm("Исключить этого игрока из сквада?"))return;const s=await fetch(`/api/squads/${r}/remove`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:t.dataset.remove})});if(s.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=s.ok?"Игрок исключён из состава.":"Этого игрока уже нет в составе.",s.ok&&location.reload()})});const v=document.querySelector("#report-form");let j="";document.querySelectorAll(".mate-report").forEach(t=>{t.addEventListener("click",()=>{j=t.dataset.steam??"";const e=document.querySelector("#report-who");e&&(e.textContent=t.dataset.name??""),v?.removeAttribute("hidden"),document.querySelector("#report-note")?.focus()})}),v?.addEventListener("submit",async t=>{t.preventDefault();const e=document.querySelector("#squad-note"),s=document.querySelector("#report-note")?.value.trim()??"";if(s.length<10){e.textContent="Нужно хотя бы 10 символов, что именно случилось.";return}const c=await fetch(`/api/squads/${r}/report`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:j,note:s})}),n=await c.json().catch(()=>({}));if(c.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}e.textContent=c.ok?"Жалоба отправлена. Её увидит администрация сайта.":n.error==="duplicate"?"На этого человека вы уже жаловались на этой неделе.":n.error==="self"?"На себя жалобу отправить нельзя.":"Нужно хотя бы 10 символов, что именно случилось.",c.ok&&v.setAttribute("hidden","")})}}
