const h=document.querySelector("#squad-page"),n=new URLSearchParams(location.search).get("id")??"",o=i=>i.replace(/[&<>"']/g,l=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[l]??l);if(!/^\d+$/.test(n))h.innerHTML="<h1>Такой страницы нет</h1>";else{const[i,l]=await Promise.all([fetch(`/api/squads/${n}`),fetch("/api/me").then(c=>c.json()).catch(()=>({user:null}))]);if(!i.ok)h.innerHTML="<h1>Сквада нет</h1><p>Его не опубликовали или он ещё на проверке.</p>";else{const c=await i.json(),e=c.squad,m=c.members,d=c.seat,p=!!d&&String(d?.squad_id)===n,w=p&&d?.status==="member",S=p&&d?.status==="pending",j=d?.status==="member"&&!p,$=!!c.mine,k=l.user?.steam_id?String(l.user.steam_id):"",f=m.filter(t=>t.status==="member"),v=$?m.filter(t=>t.status==="pending"):[],y=(t,a)=>`
        <a href="/p?id=${t.steam_id}">
          ${t.avatar?`<img src="${o(t.avatar)}" alt="" />`:`<span class="mate-fallback">${o((t.persona??"?").slice(0,1))}</span>`}
          <span>
            <strong>${o(t.persona??t.steam_id)}</strong>
            <small>${a}</small>
          </span>
        </a>`,_=f.map(t=>`
        <article class="mate${t.role==="leader"?" lead":""}">
          ${y(t,t.role==="leader"?"лидер":"в составе")}
          ${t.steam_id===k?"":`<span class="mate-actions"><button class="mate-report" type="button" data-steam="${t.steam_id}" data-name="${o(t.persona??t.steam_id)}">Репорт</button>${$&&t.role!=="leader"?`<button class="btn ghost small" type="button" data-remove="${t.steam_id}">Исключить</button>`:""}</span>`}
        </article>`).join(""),g=v.map(t=>`
        <article class="mate wait">
          ${y(t,"заявка")}
          <span class="mate-actions">
            <button class="btn small" type="button" data-decide="${t.steam_id}" data-accept="1">Принять</button>
            <button class="btn ghost small" type="button" data-decide="${t.steam_id}" data-accept="0">Отклонить</button>
          </span>
        </article>`).join(""),x=e.status==="approved"?"Одобрено":e.status==="rejected"?"Отклонён":"На модерации",C=e.status==="approved"?"approved":e.status==="rejected"?"rejected":"pending";h.innerHTML=`
        <p class="eyebrow"><a href="/squads">Сквады</a></p>
        <article class="hall${e.banner?" has-banner":""}">
          <header class="hall-hero">
            ${e.banner?`<div class="hall-banner" style="background-image:url('${o(e.banner)}')"></div>`:""}
            <div class="hall-id">
              <div class="hall-mark">${e.logo?`<img src="${o(e.logo)}" alt="" />`:o(e.tag)}</div>
              <div>
                <h1>[${o(e.tag)}] ${o(e.name)}</h1>
                <div class="dossier-tags">
                  <span class="squad-status ${C}">${x}</span>
                  <span class="pill">${e.members} в составе</span>
                  <a class="pill" href="/p?id=${e.owner_steam_id}">${o(e.owner_name??"владелец")}</a>
                  ${e.closed?'<span class="pill old">набор закрыт</span>':'<span class="pill now">набор открыт</span>'}
                </div>
              </div>
            </div>
          </header>
          <section class="hall-split">
            <div>
              <p class="eyebrow">Описание</p>
              <p class="hall-copy">${o(e.about||"Сквад ещё не заполнил описание.")}</p>
            </div>
            <div>
              <p class="eyebrow">Критерии набора</p>
              <p class="hall-copy">${o(e.criteria||"Критерии не указаны.")}</p>
            </div>
          </section>
          <div class="hall-actions">
            ${e.discord_url?`<a class="btn small" href="${o(e.discord_url)}">Discord сквада</a>`:""}
            ${w?'<span class="note">Вы в составе.</span>':S?'<span class="note">Заявка на рассмотрении.</span>':j?'<span class="note">Вы уже состоите в скваде.</span>':e.closed?'<span class="note">Набор закрыт.</span>':'<button class="btn small" id="join" type="button">Подать заявку</button>'}
          </div>
        </article>
        ${g?`<div class="hall-head"><h2>Заявки</h2><p class="note">${v.length}</p></div><div class="hall-roster">${g}</div>`:""}
        <div class="hall-head">
          <h2>Состав</h2>
          <p class="note">${(()=>{const t=f.length,a=t%10,s=t%100,r=a===1&&s!==11?"человек":a>=2&&a<=4&&(s<12||s>14)?"человека":"человек";return`${t} ${r}`})()}</p>
        </div>
        <div class="hall-roster">${_||"<p>В составе пока никого.</p>"}</div>
        <form id="report-form" class="report" hidden>
          <p>Жалоба на <strong id="report-who"></strong></p>
          <textarea id="report-note" maxlength="400" placeholder="Что человек сделал. Минимум 10 символов."></textarea>
          <button class="btn small" type="submit">Отправить</button>
        </form>
        <p class="note" id="squad-note"></p>
      `,document.querySelector("#join")?.addEventListener("click",async()=>{const t=document.querySelector("#squad-note"),a=await fetch(`/api/squads/${n}/join`,{method:"POST"}),s=await a.json().catch(()=>({}));a.status===401&&(location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`),t.textContent=a.ok?"Заявка отправлена. Лидер сквада её примет или отклонит.":s.error==="closed"?"Набор закрыт.":s.error==="already"?"Вы уже состоите в скваде.":"Сейчас вступить не получилось.",a.ok&&location.reload()}),document.querySelectorAll("[data-decide]").forEach(t=>{t.addEventListener("click",async()=>{const a=document.querySelector("#squad-note"),s=await fetch(`/api/squads/${n}/decide`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:t.dataset.decide,accept:t.dataset.accept==="1"})});if(s.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}a.textContent=s.ok?t.dataset.accept==="1"?"Игрок принят в состав.":"Заявка отклонена.":"Эта заявка уже решена.",s.ok&&location.reload()})}),document.querySelectorAll("[data-remove]").forEach(t=>{t.addEventListener("click",async()=>{const a=document.querySelector("#squad-note");if(!window.confirm("Исключить этого игрока из сквада?"))return;const s=await fetch(`/api/squads/${n}/remove`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:t.dataset.remove})});if(s.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}a.textContent=s.ok?"Игрок исключён из состава.":"Этого игрока уже нет в составе.",s.ok&&location.reload()})});const u=document.querySelector("#report-form");let q="";document.querySelectorAll(".mate-report").forEach(t=>{t.addEventListener("click",()=>{q=t.dataset.steam??"";const a=document.querySelector("#report-who");a&&(a.textContent=t.dataset.name??""),u?.removeAttribute("hidden"),document.querySelector("#report-note")?.focus()})}),u?.addEventListener("submit",async t=>{t.preventDefault();const a=document.querySelector("#squad-note"),s=document.querySelector("#report-note")?.value.trim()??"";if(s.length<10){a.textContent="Нужно хотя бы 10 символов, что именно случилось.";return}const r=await fetch(`/api/squads/${n}/report`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:q,note:s})}),b=await r.json().catch(()=>({}));if(r.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}a.textContent=r.ok?"Жалоба отправлена. Её увидит администрация сайта.":b.error==="duplicate"?"На этого человека вы уже жаловались на этой неделе.":b.error==="self"?"На себя жалобу отправить нельзя.":"Нужно хотя бы 10 символов, что именно случилось.",r.ok&&u.setAttribute("hidden","")})}}
