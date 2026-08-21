/* My-transports cloud accounts + per-user game sync */
(function(){
  const cfg = window.BP_SUPABASE_CONFIG || {};
  const KEYS = ['busphoto_interactive_game','busphoto_service_cards_v1'];
  const originalSet = Storage.prototype.setItem;
  const originalRemove = Storage.prototype.removeItem;
  let supa = null, user = null, hydrating = false, syncTimer = null, initialized = false;

  function configured(){
    return !!(window.supabase && cfg.url && cfg.anonKey &&
      !String(cfg.url).includes('YOUR-PROJECT') && !String(cfg.anonKey).includes('YOUR_'));
  }
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function relevant(k){return KEYS.includes(k);}
  function apiUrl(path){return String(cfg.apiBase||'').replace(/\/$/,'')+path;}

  window.bpCloudReady = new Promise(async resolve=>{
    try{
      if(!configured()){ renderAuthBar('⚙️ Облако не настроено'); resolve(); return; }
      supa = window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const {data:{session}} = await supa.auth.getSession();
      user = session?.user || null;
      await setupUserState();
      supa.auth.onAuthStateChange((_event,s)=>{ 
        const next=s?.user||null;
        if((next?.id||null)!==(user?.id||null)){ user=next; setupUserState().catch(console.error); }
      });
      initialized=true;
      installStorageSync();
      renderAuthBar(user ? `👤 ${user.email||'Аккаунт'}` : '👤 Войти');
      resolve();
    }catch(e){
      console.error('Cloud init error',e);
      renderAuthBar('⚠️ Ошибка облака');
      resolve();
    }
  });

  async function setupUserState(){
    if(!supa || !user) { renderAuthBar('👤 Войти'); return; }
    hydrating=true;
    try{
      const {data,error}=await supa.from('user_state').select('game_state,cards').eq('user_id',user.id).maybeSingle();
      if(error) throw error;
      const flag='bp_cloud_hydrated_'+user.id;
      if(data){
        if(data.game_state) originalSet.call(localStorage,'busphoto_interactive_game',JSON.stringify(data.game_state));
        else originalRemove.call(localStorage,'busphoto_interactive_game');
        if(data.cards) originalSet.call(localStorage,'busphoto_service_cards_v1',JSON.stringify(data.cards));
        else originalRemove.call(localStorage,'busphoto_service_cards_v1');
      }else{
        // First account: migrate existing local game only if this browser has no other account.
        const previous=localStorage.getItem('bp_last_user_id');
        if(previous && previous!==user.id){
          originalRemove.call(localStorage,'busphoto_interactive_game');
          originalRemove.call(localStorage,'busphoto_service_cards_v1');
        }
        await syncNow();
      }
      originalSet.call(localStorage,'bp_last_user_id',user.id);
      if(sessionStorage.getItem(flag)!=='1'){
        sessionStorage.setItem(flag,'1');
        hydrating=false;
        location.reload();
        return;
      }
    }catch(e){
      console.error('State load error',e);
    }finally{ hydrating=false; }
  }

  function installStorageSync(){
    if(window.__bpStoragePatched) return;
    window.__bpStoragePatched=true;
    Storage.prototype.setItem=function(k,v){
      originalSet.call(this,k,v);
      if(this===localStorage && relevant(k) && !hydrating && user) scheduleSync();
    };
    Storage.prototype.removeItem=function(k){
      originalRemove.call(this,k);
      if(this===localStorage && relevant(k) && !hydrating && user) scheduleSync();
    };
  }
  function scheduleSync(){
    clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>syncNow().catch(console.error),700);
  }
  async function syncNow(){
    if(!supa||!user||hydrating)return;
    const gameRaw=localStorage.getItem('busphoto_interactive_game');
    const cardsRaw=localStorage.getItem('busphoto_service_cards_v1');
    let game=null,cards=null;
    try{game=gameRaw?JSON.parse(gameRaw):null}catch{}
    try{cards=cardsRaw?JSON.parse(cardsRaw):null}catch{}
    const {error}=await supa.from('user_state').upsert({
      user_id:user.id,game_state:game,cards:Array.isArray(cards)?cards:[],updated_at:new Date().toISOString()
    },{onConflict:'user_id'});
    if(error) throw error;
  }

  async function login(email,password){
    if(!supa) throw new Error('Сначала настрой Supabase в busphoto-cloud-config.js');
    const r=await supa.auth.signInWithPassword({email,password});
    if(r.error) throw r.error;
    return r;
  }
  async function signup(email,password){
    if(!supa) throw new Error('Сначала настрой Supabase.');
    const r=await supa.auth.signUp({email,password});
    if(r.error) throw r.error;
    return r;
  }
  async function logout(){
    try{await syncNow();}catch(e){console.warn('sync before logout failed',e);}
    originalRemove.call(localStorage,'busphoto_interactive_game');
    originalRemove.call(localStorage,'busphoto_service_cards_v1');
    if(supa) await supa.auth.signOut();
    sessionStorage.clear();
    location.reload();
  }

  async function startTelegramLink(){
    if(!user) throw new Error('Войдите в аккаунт.');
    const {data:{session}}=await supa.auth.getSession();
    const r=await fetch(apiUrl('/api/telegram/link/start'),{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:'{}'
    });
    const j=await r.json();
    if(!r.ok||!j.ok) throw new Error(j.error||'Не удалось создать код');
    return j;
  }
  async function telegramStatus(){
    if(!user) return {connected:false};
    const {data:{session}}=await supa.auth.getSession();
    const r=await fetch(apiUrl('/api/telegram/link/status'),{headers:{Authorization:'Bearer '+session.access_token}});
    return r.json();
  }

  function renderAuthBar(label){
    const old=document.getElementById('bpAuthBar'); if(old) old.remove();
    const bar=document.createElement('div'); bar.id='bpAuthBar';
    bar.innerHTML=`<button type="button" id="bpAuthButton">${esc(label)}</button>`;
    const style=document.createElement('style');style.textContent=`
      #bpAuthBar{position:fixed;right:10px;bottom:10px;z-index:100000}
      #bpAuthButton{border:1px solid #55718c;border-radius:999px;background:#1e3f66;color:#fff;padding:9px 13px;font-weight:700;box-shadow:0 4px 18px #0004;cursor:pointer}
      #bpAuthModal{position:fixed;inset:0;background:#0008;display:flex;align-items:center;justify-content:center;z-index:100001;padding:15px}
      #bpAuthCard{width:min(430px,100%);background:#fff;color:#111;border-radius:16px;padding:18px;box-shadow:0 15px 60px #0008}
      #bpAuthCard h2{margin:0 0 12px}#bpAuthCard input{width:100%;padding:12px;margin:6px 0;box-sizing:border-box;border:1px solid #999;border-radius:9px;font-size:16px}
      #bpAuthCard button{padding:11px 14px;border:0;border-radius:9px;margin:5px 4px 0 0;cursor:pointer;font-weight:700}
      .bp-primary{background:#1e3f66;color:#fff}.bp-secondary{background:#eee;color:#111}.bp-danger{background:#b00020;color:#fff}
      #bpAuthMsg{min-height:20px;margin:8px 0;color:#444}.bp-user-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      @media(max-width:600px){#bpAuthBar{right:7px;bottom:7px}#bpAuthButton{font-size:13px}}
    `;document.head.appendChild(style);document.body.appendChild(bar);
    bar.querySelector('button').onclick=()=>openAuth();
  }

  function openAuth(){
    let m=document.getElementById('bpAuthModal');
    if(m){m.style.display='flex';return;}
    m=document.createElement('div');m.id='bpAuthModal';
    m.innerHTML=`<div id="bpAuthCard">
      <h2>${user?'👤 Мой аккаунт':'👤 My-transports'}</h2>
      ${user?`
        <div><b>${esc(user.email||'')}</b></div>
        <div class="bp-user-row">
          <button class="bp-primary" id="bpSync">☁️ Синхронизировать</button>
          <button class="bp-secondary" id="bpTg">🤖 Telegram</button>
          <button class="bp-danger" id="bpLogout">Выйти</button>
        </div>
        <div id="bpAuthMsg"></div>`:`
        <input id="bpEmail" type="email" placeholder="Email">
        <input id="bpPass" type="password" placeholder="Пароль (минимум 6 символов)">
        <div>
          <button class="bp-primary" id="bpLogin">Войти</button>
          <button class="bp-secondary" id="bpSignup">Создать аккаунт</button>
        </div>
        <div id="bpAuthMsg">После регистрации проверьте почту, если подтверждение включено.</div>`}
      <button class="bp-secondary" id="bpClose">Закрыть</button>
    </div>`;
    document.body.appendChild(m);
    m.querySelector('#bpClose').onclick=()=>m.remove();
    if(user){
      m.querySelector('#bpLogout').onclick=logout;
      m.querySelector('#bpSync').onclick=async()=>{try{await syncNow();m.querySelector('#bpAuthMsg').textContent='✅ Данные синхронизированы.'}catch(e){m.querySelector('#bpAuthMsg').textContent='❌ '+e.message}};
      m.querySelector('#bpTg').onclick=async()=>{
        try{
          const st=await telegramStatus();
          if(st.connected){m.querySelector('#bpAuthMsg').textContent='✅ Telegram уже подключён.';return;}
          const r=await startTelegramLink();
          m.querySelector('#bpAuthMsg').innerHTML=`🤖 Откройте бота и отправьте ему код <b>${esc(r.code)}</b>.<br>Код действует 10 минут.`;
          let n=0; const timer=setInterval(async()=>{n++;try{const s=await telegramStatus();if(s.connected){clearInterval(timer);m.querySelector('#bpAuthMsg').textContent='✅ Telegram успешно подключён!';}}catch{}if(n>30)clearInterval(timer)},2000);
        }catch(e){m.querySelector('#bpAuthMsg').textContent='❌ '+e.message}
      };
    }else{
      const msg=m.querySelector('#bpAuthMsg');
      m.querySelector('#bpLogin').onclick=async()=>{try{await login(m.querySelector('#bpEmail').value.trim(),m.querySelector('#bpPass').value);msg.textContent='Вход выполнен…';location.reload()}catch(e){msg.textContent='❌ '+e.message}};
      m.querySelector('#bpSignup').onclick=async()=>{try{const r=await signup(m.querySelector('#bpEmail').value.trim(),m.querySelector('#bpPass').value);msg.textContent=r.data.session?'✅ Аккаунт создан.':'✅ Проверьте почту для подтверждения.'}catch(e){msg.textContent='❌ '+e.message}};
    }
  }
  window.bpCloud={get user(){return user},get supabase(){return supa},syncNow,startTelegramLink,telegramStatus,openAuth,login,signup,logout,configured};
})();
