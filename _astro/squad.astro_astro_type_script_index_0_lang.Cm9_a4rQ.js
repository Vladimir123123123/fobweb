const d=document.querySelector("#squad-page"),c=new URLSearchParams(location.search).get("id")??"",e=l=>l.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]??t);if(!/^\d+$/.test(c))d.innerHTML="<h1>Такой страницы нет</h1>";else{const l=await fetch(`/api/squads/${c}`);if(!l.ok)d.innerHTML="<h1>Сквада нет</h1><p>Его не опубликовали или он ещё на проверке.</p>";else{const t=await l.json(),s=t.squad,r=t.members,i=t.seat&&String(t.seat.squad_id)===c,p=!!t.seat&&!i,h=a=>a.role==="leader"?"лидер":a.status==="pending"?"заявка":"в составе",u=r.map(a=>`
        <a class="mate${a.role==="leader"?" lead":""}" href="/p?id=${a.steam_id}">
          ${a.avatar?`<img src="${e(a.avatar)}" alt="" />`:`<span class="mate-fallback">${e((a.persona??"?").slice(0,1))}</span>`}
          <span>
            <strong>${e(a.persona??a.steam_id)}</strong>
            <small>${h(a)}</small>
          </span>
        </a>`).join(""),$=s.status==="approved"?"Одобрено":s.status==="rejected"?"Отклонён":"На модерации",v=s.status==="approved"?"approved":s.status==="rejected"?"rejected":"pending";d.innerHTML=`
        <p class="eyebrow"><a href="/squads">Сквады</a></p>
        <article class="hall${s.banner?" has-banner":""}">
          <header class="hall-hero">
            ${s.banner?`<div class="hall-banner" style="background-image:url('${e(s.banner)}')"></div>`:""}
            <div class="hall-id">
              <div class="hall-mark">${s.logo?`<img src="${e(s.logo)}" alt="" />`:e(s.tag)}</div>
              <div>
                <h1>[${e(s.tag)}] ${e(s.name)}</h1>
                <div class="dossier-tags">
                  <span class="squad-status ${v}">${$}</span>
                  <span class="pill">${s.members} в составе</span>
                  <a class="pill" href="/p?id=${s.owner_steam_id}">${e(s.owner_name??"владелец")}</a>
                  ${s.closed?'<span class="pill old">набор закрыт</span>':'<span class="pill now">набор открыт</span>'}
                </div>
              </div>
            </div>
          </header>
          <section class="hall-split">
            <div>
              <p class="eyebrow">Описание</p>
              <p class="hall-copy">${e(s.about||"Сквад ещё не заполнил описание.")}</p>
            </div>
            <div>
              <p class="eyebrow">Критерии набора</p>
              <p class="hall-copy">${e(s.criteria||"Критерии не указаны.")}</p>
            </div>
          </section>
          <div class="hall-actions">
            ${s.discord_url?`<a class="btn small" href="${e(s.discord_url)}">Discord сквада</a>`:""}
            ${i?'<span class="note">Вы в составе.</span>':p?'<span class="note">Вы уже состоите в скваде.</span>':s.closed?'<span class="note">Набор закрыт.</span>':'<button class="btn small" id="join" type="button">Вступить</button>'}
          </div>
        </article>
        <div class="hall-head">
          <h2>Состав</h2>
          <p class="note">${(()=>{const a=r.length,n=a%10,o=a%100,g=n===1&&o!==11?"человек":n>=2&&n<=4&&(o<12||o>14)?"человека":"человек";return`${a} ${g}`})()}</p>
        </div>
        <div class="hall-roster">${u||"<p>В составе пока никого.</p>"}</div>
        <p class="note" id="squad-note"></p>
      `,document.querySelector("#join")?.addEventListener("click",async()=>{const a=document.querySelector("#squad-note"),n=await fetch(`/api/squads/${c}/join`,{method:"POST"}),o=await n.json().catch(()=>({}));n.status===401&&(location.href=`/auth/steam?next=${encodeURIComponent(location.pathname+location.search)}`),a.textContent=n.ok?"Вы в составе сквада.":o.error==="closed"?"Набор закрыт.":o.error==="already"?"Вы уже состоите в скваде.":"Сейчас вступить не получилось.",n.ok&&location.reload()})}}
