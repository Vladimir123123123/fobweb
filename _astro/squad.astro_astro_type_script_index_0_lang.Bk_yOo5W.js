const p=document.querySelector("#squad-page"),c=new URLSearchParams(location.search).get("id")??"",s=d=>d.replace(/[&<>"']/g,l=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[l]??l);if(!/^\d+$/.test(c))p.innerHTML="<h1>Такой страницы нет</h1>";else{const[d,l]=await Promise.all([fetch(`/api/squads/${c}`),fetch("/api/me").then(n=>n.json()).catch(()=>({user:null}))]);if(!d.ok)p.innerHTML="<h1>Сквада нет</h1><p>Его не опубликовали или он ещё на проверке.</p>";else{const n=await d.json(),e=n.squad,u=n.members,h=n.seat&&String(n.seat.squad_id)===c,v=!!n.seat&&!h,f=l.user?.steam_id?String(l.user.steam_id):"",g=t=>t.role==="leader"?"лидер":t.status==="pending"?"заявка":"в составе",y=u.map(t=>`
        <article class="mate${t.role==="leader"?" lead":""}">
          <a href="/p?id=${t.steam_id}">
            ${t.avatar?`<img src="${s(t.avatar)}" alt="" />`:`<span class="mate-fallback">${s((t.persona??"?").slice(0,1))}</span>`}
            <span>
              <strong>${s(t.persona??t.steam_id)}</strong>
              <small>${g(t)}</small>
            </span>
          </a>
          ${t.steam_id===f?"":`<button class="mate-report" type="button" data-steam="${t.steam_id}" data-name="${s(t.persona??t.steam_id)}">Репорт</button>`}
        </article>`).join(""),q=e.status==="approved"?"Одобрено":e.status==="rejected"?"Отклонён":"На модерации",b=e.status==="approved"?"approved":e.status==="rejected"?"rejected":"pending";p.innerHTML=`
        <p class="eyebrow"><a href="/squads">Сквады</a></p>
        <article class="hall${e.banner?" has-banner":""}">
          <header class="hall-hero">
            ${e.banner?`<div class="hall-banner" style="background-image:url('${s(e.banner)}')"></div>`:""}
            <div class="hall-id">
              <div class="hall-mark">${e.logo?`<img src="${s(e.logo)}" alt="" />`:s(e.tag)}</div>
              <div>
                <h1>[${s(e.tag)}] ${s(e.name)}</h1>
                <div class="dossier-tags">
                  <span class="squad-status ${b}">${q}</span>
                  <span class="pill">${e.members} в составе</span>
                  <a class="pill" href="/p?id=${e.owner_steam_id}">${s(e.owner_name??"владелец")}</a>
                  ${e.closed?'<span class="pill old">набор закрыт</span>':'<span class="pill now">набор открыт</span>'}
                </div>
              </div>
            </div>
          </header>
          <section class="hall-split">
            <div>
              <p class="eyebrow">Описание</p>
              <p class="hall-copy">${s(e.about||"Сквад ещё не заполнил описание.")}</p>
            </div>
            <div>
              <p class="eyebrow">Критерии набора</p>
              <p class="hall-copy">${s(e.criteria||"Критерии не указаны.")}</p>
            </div>
          </section>
          <div class="hall-actions">
            ${e.discord_url?`<a class="btn small" href="${s(e.discord_url)}">Discord сквада</a>`:""}
            ${h?'<span class="note">Вы в составе.</span>':v?'<span class="note">Вы уже состоите в скваде.</span>':e.closed?'<span class="note">Набор закрыт.</span>':'<button class="btn small" id="join" type="button">Вступить</button>'}
          </div>
        </article>
        <div class="hall-head">
          <h2>Состав</h2>
          <p class="note">${(()=>{const t=u.length,a=t%10,o=t%100,r=a===1&&o!==11?"человек":a>=2&&a<=4&&(o<12||o>14)?"человека":"человек";return`${t} ${r}`})()}</p>
        </div>
        <div class="hall-roster">${y||"<p>В составе пока никого.</p>"}</div>
        <form id="report-form" class="report" hidden>
          <p>Жалоба на <strong id="report-who"></strong></p>
          <textarea id="report-note" maxlength="400" placeholder="Что человек сделал. Минимум 10 символов."></textarea>
          <button class="btn small" type="submit">Отправить</button>
        </form>
        <p class="note" id="squad-note"></p>
      `,document.querySelector("#join")?.addEventListener("click",async()=>{const t=document.querySelector("#squad-note"),a=await fetch(`/api/squads/${c}/join`,{method:"POST"}),o=await a.json().catch(()=>({}));a.status===401&&(location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`),t.textContent=a.ok?"Вы в составе сквада.":o.error==="closed"?"Набор закрыт.":o.error==="already"?"Вы уже состоите в скваде.":"Сейчас вступить не получилось.",a.ok&&location.reload()});const i=document.querySelector("#report-form");let m="";document.querySelectorAll(".mate-report").forEach(t=>{t.addEventListener("click",()=>{m=t.dataset.steam??"";const a=document.querySelector("#report-who");a&&(a.textContent=t.dataset.name??""),i?.removeAttribute("hidden"),document.querySelector("#report-note")?.focus()})}),i?.addEventListener("submit",async t=>{t.preventDefault();const a=document.querySelector("#squad-note"),o=document.querySelector("#report-note")?.value.trim()??"";if(o.length<10){a.textContent="Нужно хотя бы 10 символов, что именно случилось.";return}const r=await fetch(`/api/squads/${c}/report`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({steamId:m,note:o})}),$=await r.json().catch(()=>({}));if(r.status===401){location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`;return}a.textContent=r.ok?"Жалоба отправлена. Её увидит администрация сайта.":$.error==="duplicate"?"На этого человека вы уже жаловались на этой неделе.":$.error==="self"?"На себя жалобу отправить нельзя.":"Нужно хотя бы 10 символов, что именно случилось.",r.ok&&i.setAttribute("hidden","")})}}
