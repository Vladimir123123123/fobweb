const m=document.querySelector("#list"),d=document.querySelector("#desk"),a=document.querySelector("#squad-note"),r=o=>o.replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n]??n);function y(o){return new Promise((n,c)=>{if(o.size>12e5||!["image/jpeg","image/png","image/webp"].includes(o.type)){c(new Error("image"));return}const t=new FileReader;t.onload=()=>n(String(t.result)),t.onerror=()=>c(new Error("image")),t.readAsDataURL(o)})}async function p(o,n,c,t=""){const e=await y(c),s=await fetch(`/api/squads/${o}/assets`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind:n,image:e,discord:t})});return s.status===401&&(location.href="/auth/steam?next=/squads"),s.ok}async function u(){let o;try{o=await fetch("/api/squads")}catch{a.textContent="Список сейчас не открывается.";return}if(!o.ok){a.textContent="Список сейчас не открывается.";return}const n=await o.json(),c=new Map(n.mine.map(e=>[e.squad_id,e.status])),t=n.desk;if(t){const e=t.pending.some(i=>i.kind==="logo"),s=t.pending.some(i=>i.kind==="banner"),g=t.status==="approved"?"Сквад в списке.":t.status==="rejected"?"Сквад отклонён.":"Сквад ждёт проверки.";d.innerHTML=`
        <article class="panel">
          <strong>[${r(t.tag)}] ${r(t.name)}</strong>
          <p>${g} ${t.banner_path?"Баннер уже на главной.":"Баннера на главной ещё нет."} ${e?"Новый логотип ждёт проверки.":""} ${s?"Новый баннер ждёт проверки, на главной остаётся прежний.":""}</p>
          <form id="logo-form" class="inline">
            <input id="logo-file" type="file" accept="image/jpeg,image/png,image/webp" />
            <button class="btn small" type="submit">Отправить логотип</button>
          </form>
          <form id="banner-form" class="inline">
            <input id="banner-file" type="file" accept="image/jpeg,image/png,image/webp" />
            <input id="banner-discord" placeholder="https://discord.gg/..." value="${r(t.discord_url)}" />
            <button class="btn small" type="submit">Отправить баннер</button>
          </form>
        </article>
      `,document.querySelector("#create")?.setAttribute("hidden",""),d.querySelector("#logo-form")?.addEventListener("submit",async i=>{i.preventDefault();const l=document.querySelector("#logo-file").files?.[0];if(l)try{a.textContent=await p(t.id,"logo",l)?"Логотип отправлен на проверку.":"Нужна картинка JPEG, PNG или WebP до 1,2 МБ.",a.textContent.startsWith("Логотип")&&u()}catch{a.textContent="Нужна картинка JPEG, PNG или WebP до 1,2 МБ."}}),d.querySelector("#banner-form")?.addEventListener("submit",async i=>{i.preventDefault();const l=document.querySelector("#banner-file").files?.[0],f=document.querySelector("#banner-discord").value;if(l)try{a.textContent=await p(t.id,"banner",l,f)?"Баннер отправлен на проверку.":"Нужны картинка до 1,2 МБ и ссылка discord.gg.",a.textContent.startsWith("Баннер")&&u()}catch{a.textContent="Нужна картинка JPEG, PNG или WebP до 1,2 МБ."}})}else d.innerHTML="",document.querySelector("#create")?.removeAttribute("hidden");m.innerHTML=n.squads.map(e=>`
      <article class="panel squad-card">
        ${e.logo?`<img class="squad-logo" src="${r(e.logo)}" alt="" />`:""}
        <div>
          <strong>[${r(e.tag)}] ${r(e.name)}</strong>
          <p>${e.members} в составе · ${r(e.owner_name??"владелец")} ${e.closed?"· набор закрыт":""}</p>
          ${e.closed?"":`<button class="btn small" data-join="${e.id}" type="button">${c.get(e.id)==="pending"?"Заявка отправлена":"Подать заявку"}</button>`}
        </div>
      </article>
    `).join("")||"<p>Сквадов пока нет.</p>",m.querySelectorAll("[data-join]").forEach(e=>{e.addEventListener("click",async()=>{const s=await fetch(`/api/squads/${e.dataset.join}/join`,{method:"POST"});a.textContent=s.ok?"Заявка отправлена.":"Нужен вход через Steam, и вы ещё не состоите в другом скваде.",s.status===401&&(location.href="/auth/steam?next=/squads")})})}document.querySelector("#create")?.addEventListener("submit",async o=>{o.preventDefault();const n=await fetch("/api/squads",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:document.querySelector("#name").value,tag:document.querySelector("#tag").value})});n.status===401&&(location.href="/auth/steam?next=/squads"),a.textContent=n.ok?"Сквад отправлен на проверку.":"Проверьте название и тег из 2–5 латинских букв или цифр.",n.ok&&u()});u();
