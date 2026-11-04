const p=document.querySelector("#list"),d=document.querySelector("#desk"),r=document.querySelector("#squad-note"),n=o=>o.replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a]??a);function b(o){return new Promise((a,l)=>{if(o.size>12e5||!["image/jpeg","image/png","image/webp"].includes(o.type)){l(new Error("image"));return}const t=new FileReader;t.onload=()=>a(String(t.result)),t.onerror=()=>l(new Error("image")),t.readAsDataURL(o)})}async function m(o,a,l,t=""){const e=await b(l),c=await fetch(`/api/squads/${o}/assets`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind:a,image:e,discord:t})});return c.status===401&&(location.href="/auth/steam?next=/squads"),c.ok}async function u(){let o;try{o=await fetch("/api/squads")}catch{r.textContent="Список сейчас не открывается.";return}if(!o.ok){r.textContent="Список сейчас не открывается.";return}const a=await o.json(),l=new Map(a.mine.map(e=>[e.squad_id,e.status])),t=a.desk;if(t){const e=t.pending.some(i=>i.kind==="logo"),c=t.pending.some(i=>i.kind==="banner"),f=t.status==="approved"?"Сквад в списке.":t.status==="rejected"?"Сквад отклонён.":"Сквад ждёт проверки.";d.innerHTML=`
        <article class="panel">
          <strong>[${n(t.tag)}] ${n(t.name)}</strong>
          <p>${f} ${t.banner_path?"Баннер уже на главной.":"Баннера на главной ещё нет."} ${e?"Новый логотип ждёт проверки.":""} ${c?"Новый баннер ждёт проверки, на главной остаётся прежний.":""}</p>
          <form id="profile-form" class="squad-form">
            <label>Описание<textarea id="profile-about" maxlength="700">${n(t.about??"")}</textarea></label>
            <label>Критерии набора<textarea id="profile-criteria" maxlength="700">${n(t.criteria??"")}</textarea></label>
            <label>Discord<input id="profile-discord" placeholder="https://discord.gg/..." value="${n(t.discord_url)}" /></label>
            <button class="btn small" type="submit">Сохранить карточку</button>
          </form>
          <form id="logo-form" class="inline">
            <input id="logo-file" type="file" accept="image/jpeg,image/png,image/webp" />
            <button class="btn small" type="submit">Отправить логотип</button>
          </form>
          <form id="banner-form" class="inline">
            <input id="banner-file" type="file" accept="image/jpeg,image/png,image/webp" />
            <input id="banner-discord" placeholder="https://discord.gg/..." value="${n(t.discord_url)}" />
            <button class="btn small" type="submit">Отправить баннер</button>
          </form>
        </article>
      `,document.querySelector("#create")?.setAttribute("hidden",""),d.querySelector("#profile-form")?.addEventListener("submit",async i=>{i.preventDefault();const s=await fetch(`/api/squads/${t.id}/profile`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({about:document.querySelector("#profile-about").value,criteria:document.querySelector("#profile-criteria").value,discord:document.querySelector("#profile-discord").value})});r.textContent=s.ok?"Карточка сохранена.":"Описание от 20 символов, критерии от 10, Discord — ссылка discord.gg.",s.ok&&u()}),d.querySelector("#logo-form")?.addEventListener("submit",async i=>{i.preventDefault();const s=document.querySelector("#logo-file").files?.[0];if(s)try{r.textContent=await m(t.id,"logo",s)?"Логотип отправлен на проверку.":"Нужна картинка JPEG, PNG или WebP до 1,2 МБ.",r.textContent.startsWith("Логотип")&&u()}catch{r.textContent="Нужна картинка JPEG, PNG или WebP до 1,2 МБ."}}),d.querySelector("#banner-form")?.addEventListener("submit",async i=>{i.preventDefault();const s=document.querySelector("#banner-file").files?.[0],g=document.querySelector("#banner-discord").value;if(s)try{r.textContent=await m(t.id,"banner",s,g)?"Баннер отправлен на проверку.":"Нужны картинка до 1,2 МБ и ссылка discord.gg.",r.textContent.startsWith("Баннер")&&u()}catch{r.textContent="Нужна картинка JPEG, PNG или WebP до 1,2 МБ."}})}else d.innerHTML="",document.querySelector("#create")?.removeAttribute("hidden");p.innerHTML=a.squads.map(e=>`
      <article class="panel squad-card">
        <a class="squad-mark" href="/squad?id=${e.id}">${e.logo?`<img src="${n(e.logo)}" alt="" />`:n(e.tag)}</a>
        <div>
          <h2><a href="/squad?id=${e.id}">[${n(e.tag)}] ${n(e.name)}</a></h2>
          <p>${e.members} в составе · ${n(e.owner_name??"владелец")}${e.closed?" · набор закрыт":""}</p>
          <span class="squad-label">Описание</span>
          <p class="squad-copy">${n(e.about||"Сквад ещё не заполнил описание.")}</p>
          <span class="squad-label">Критерии набора</span>
          <p class="squad-copy">${n(e.criteria||"Критерии не указаны.")}</p>
          <div class="squad-actions">
            ${e.discord_url?`<a class="btn ghost small" href="${n(e.discord_url)}">Discord</a>`:""}
            <a class="btn ghost small" href="/squad?id=${e.id}">Состав</a>
            ${e.closed?"":`<button class="btn small" data-join="${e.id}" type="button">${l.get(e.id)==="pending"?"Заявка отправлена":"Подать заявку"}</button>`}
          </div>
        </div>
      </article>
    `).join("")||"<p>Сквадов пока нет.</p>",p.querySelectorAll("[data-join]").forEach(e=>{e.addEventListener("click",async()=>{const c=await fetch(`/api/squads/${e.dataset.join}/join`,{method:"POST"});r.textContent=c.ok?"Заявка отправлена.":"Нужен вход через Steam, и вы ещё не состоите в другом скваде.",c.status===401&&(location.href="/auth/steam?next=/squads")})})}document.querySelector("#create")?.addEventListener("submit",async o=>{o.preventDefault();const a=await fetch("/api/squads",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:document.querySelector("#name").value,tag:document.querySelector("#tag").value,about:document.querySelector("#create #about").value,criteria:document.querySelector("#create #criteria").value})});a.status===401&&(location.href="/auth/steam?next=/squads"),r.textContent=a.ok?"Сквад отправлен на проверку.":"Название, тег из 2–5 букв, описание от 20 символов и критерии от 10.",a.ok&&u()});u();
