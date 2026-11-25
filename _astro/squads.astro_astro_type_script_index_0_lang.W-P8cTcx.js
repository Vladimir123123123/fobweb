const l=document.querySelector("#list"),i=document.querySelector("#squad-note"),s=o=>o.replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a]??a);function f(o){return new Promise((a,r)=>{if(o.size>12e5||!["image/jpeg","image/png","image/webp"].includes(o.type)){r(new Error("image"));return}const t=new FileReader;t.onload=()=>a(String(t.result)),t.onerror=()=>r(new Error("image")),t.readAsDataURL(o)})}async function b(o,a,r,t=""){const u=await f(r),d=await fetch(`/api/squads/${o}/assets`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind:a,image:u,discord:t})});return d.status===401&&(location.href="/auth/steam?next=/squads"),d.ok}async function c(){let o;try{o=await fetch("/api/squads")}catch{i.textContent="Список сейчас не открывается.";return}if(!o.ok){i.textContent="Список сейчас не открывается.";return}const a=await o.json(),r=new Map(a.mine.map(e=>[e.squad_id,e])),t=a.desk,u=a.mine.find(e=>e.status==="member");t||u?document.querySelector("#create")?.setAttribute("hidden",""):document.querySelector("#create")?.removeAttribute("hidden");const d=e=>e.status==="rejected"?{tone:"rejected",text:"Отклонён"}:e.status!=="approved"?{tone:"pending",text:"На модерации"}:e.closed?{tone:"closed",text:"Набор закрыт"}:{tone:"approved",text:"Набор открыт"};l.innerHTML=a.squads.map(e=>{const n=t?.id===e.id,p=n&&t.pending.some(m=>m.kind==="logo"),g=n&&t.pending.some(m=>m.kind==="banner");return`
      <article class="squad-tile">
        ${e.logo?`<img class="squad-bg" src="${s(e.logo)}" alt="" loading="lazy" />`:`<span class="squad-bg plain" aria-hidden="true">${s(e.tag)}</span>`}
        <span class="squad-status ${d(e).tone}">${d(e).text}</span>
        <a class="squad-row" href="/squad?id=${e.id}">
          <span class="squad-face">
            <strong><i>[${s(e.tag)}]</i> ${s(e.name)}</strong>
            <p>${e.members} в составе · ${s(e.owner_name??"владелец")}</p>
          </span>
        </a>
        <div class="squad-actions">
          ${e.discord_url?`<a class="btn ghost small" href="${s(e.discord_url)}">Discord</a>`:""}
          ${n?'<button class="btn small" data-edit type="button">Редактировать</button>':r.get(e.id)?.status==="member"?'<span class="note">Вы в составе</span>':r.get(e.id)?.status==="pending"?'<span class="note">Заявка отправлена</span>':u||e.closed?"":`<button class="btn small" data-join="${e.id}" type="button">Подать заявку</button>`}
        </div>
        ${n?`
          <form id="profile-form" class="squad-form squad-edit" hidden>
            <div class="squad-fields">
              <label>Название<input id="profile-name" maxlength="32" value="${s(t.name)}" /></label>
              <label>Тег<input id="profile-tag" maxlength="5" value="${s(t.tag)}" /></label>
            </div>
            <label>Описание<textarea id="profile-about" maxlength="700" placeholder="Адрес сайта в тексте станет ссылкой">${s(t.about??"")}</textarea></label>
            <label>Критерии набора<textarea id="profile-criteria" maxlength="700">${s(t.criteria??"")}</textarea></label>
            <label>Discord<input id="profile-discord" placeholder="https://discord.gg/..." value="${s(t.discord_url)}" /></label>
            <label class="check"><input id="profile-closed" type="checkbox" ${t.closed?"checked":""}/> Набор закрыт</label>
            <div class="squad-assets">
              <div>
                <label>Логотип<input id="logo-file" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                <button class="btn ghost small" id="logo-send" type="button">Отправить логотип</button>
              </div>
              <div>
                <label>Баннер<input id="banner-file" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                <button class="btn ghost small" id="banner-send" type="button">Отправить баннер</button>
              </div>
            </div>
            <p class="note">${p?"Новый логотип на модерации. ":""}${g?"Новый баннер на модерации.":""}</p>
            <div class="squad-submit">
              <button class="btn small" type="submit">Сохранить карточку</button>
            </div>
          </form>`:""}
      </article>`}).join("")||"<p>Сквадов пока нет.</p>",l.querySelector("[data-edit]")?.addEventListener("click",()=>{const e=l.querySelector("#profile-form");e?.toggleAttribute("hidden"),e?.closest(".squad-tile")?.classList.toggle("editing",!e.hasAttribute("hidden"))}),l.querySelector("#profile-form")?.addEventListener("submit",async e=>{if(e.preventDefault(),!t)return;const n=await fetch(`/api/squads/${t.id}/profile`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:document.querySelector("#profile-name").value,tag:document.querySelector("#profile-tag").value,about:document.querySelector("#profile-about").value,criteria:document.querySelector("#profile-criteria").value,discord:document.querySelector("#profile-discord").value,closed:document.querySelector("#profile-closed").checked})});i.textContent=n.ok?"Карточка сохранена.":"Название, тег из 2–5 букв, описание от 20 символов, критерии от 10.",n.ok&&c()}),l.querySelector("#logo-send")?.addEventListener("click",async()=>{if(!t)return;const e=document.querySelector("#logo-file").files?.[0];if(e)try{i.textContent=await b(t.id,"logo",e)?"Логотип отправлен на модерацию.":"Нужна картинка JPEG, PNG или WebP до 1,2 МБ.",i.textContent.startsWith("Логотип")&&c()}catch{i.textContent="Нужна картинка JPEG, PNG или WebP до 1,2 МБ."}}),l.querySelector("#banner-send")?.addEventListener("click",async()=>{if(!t)return;const e=document.querySelector("#banner-file").files?.[0],n=document.querySelector("#profile-discord").value;if(e)try{i.textContent=await b(t.id,"banner",e,n)?"Баннер отправлен на модерацию.":"Нужны картинка до 1,2 МБ и ссылка discord.gg.",i.textContent.startsWith("Баннер")&&c()}catch{i.textContent="Нужна картинка JPEG, PNG или WebP до 1,2 МБ."}}),l.querySelectorAll("[data-join]").forEach(e=>{e.addEventListener("click",async()=>{const n=await fetch(`/api/squads/${e.dataset.join}/join`,{method:"POST"}),p=await n.json().catch(()=>({}));n.status===401&&(location.href="/auth/steam?next=/squads"),i.textContent=n.ok?"Заявка отправлена. Лидер сквада её примет или отклонит.":p.error==="closed"?"Набор закрыт.":p.error==="already"?"Вы уже состоите в скваде.":"Сейчас вступить не получилось.",n.ok&&c()})})}document.querySelector("#create")?.addEventListener("submit",async o=>{o.preventDefault();const a=await fetch("/api/squads",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:document.querySelector("#name").value,tag:document.querySelector("#tag").value,about:document.querySelector("#create #about").value,criteria:document.querySelector("#create #criteria").value})});a.status===401&&(location.href="/auth/steam?next=/squads");const r=await a.json().catch(()=>({}));i.textContent=a.ok?"Сквад отправлен на проверку.":r.error==="already"?"Вы уже состоите в скваде.":"Название, тег из 2–5 букв, описание от 20 символов и критерии от 10.",a.ok&&c()});c();
