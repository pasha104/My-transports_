/* BUSPHOTO cloud sync — Google OAuth + Supabase.
   Keeps the game's localStorage state in a private row belonging to the signed-in user. */
(function(){
  'use strict';
  if(window.__BUSPHOTO_SYNC_MODULE__) return;
  window.__BUSPHOTO_SYNC_MODULE__=true;

  const SUPABASE_URL='https://ubhfigqpsepnpokrbdyo.supabase.co';
  const SUPABASE_KEY='sb_publishable_yN8W8pvQq8hWsYMO8z1Rzw_6zKQ-8D1';
  const TABLE='busphoto_cloud_state';
  const ROW_ID='main';

  const SYNC_KEYS=[
    'busphoto_interactive_game',
    'busphoto_service_cards_v1',
    'minsk_custom_osm_stops_v1',
    'busphoto_stop_regions_loaded_v1',
    'busphoto_stop_region_bbox_v1',
    'busphoto_tracked_vehicle_v1',
    'busphoto_single_route_shifts_v35',
    'busphoto_departure_cards_v36',
    'busphoto_maintenance_v43'
  ];

  let sb=null, user=null, saveTimer=null, channel=null, originalSave=null;

  const $=id=>document.getElementById(id);
  function status(t,error=false){
    const el=$('busSyncStatus');
    if(el){el.textContent=t;el.style.borderColor=error?'#d32f2f':'';}
  }
  function readLocal(){
    const data={};
    for(const key of SYNC_KEYS){
      try{const raw=localStorage.getItem(key);if(raw!==null)data[key]=raw;}catch(e){}
    }
    return {version:2,savedAt:new Date().toISOString(),keys:data};
  }
  function localStats(){
    let game=null,stops=[];
    try{game=JSON.parse(localStorage.getItem('busphoto_interactive_game')||'null');}catch(e){}
    try{stops=JSON.parse(localStorage.getItem('minsk_custom_osm_stops_v1')||'[]');}catch(e){}
    return {
      vehicles:Array.isArray(game?.owned)?game.owned.length:0,
      routes:Array.isArray(game?.routes)?game.routes.length:0,
      stops:Array.isArray(stops)?stops.length:0,
      balance:Number(game?.balance||0)
    };
  }
  function cloudStats(payload){
    const keys=payload?.keys||{};let game=null,stops=[];
    try{game=JSON.parse(keys['busphoto_interactive_game']||'null');}catch(e){}
    try{stops=JSON.parse(keys['minsk_custom_osm_stops_v1']||'[]');}catch(e){}
    return {
      vehicles:Array.isArray(game?.owned)?game.owned.length:0,
      routes:Array.isArray(game?.routes)?game.routes.length:0,
      stops:Array.isArray(stops)?stops.length:0,
      balance:Number(game?.balance||0)
    };
  }
  function fmt(n){return Math.round(Number(n||0)).toLocaleString('ru-RU');}
  function refreshInfo(extra=''){
    const x=$('busSyncInfo');if(!x)return;
    const l=localStats();
    x.textContent=`Локально: ${l.vehicles} ТС · ${l.routes} маршрутов · ${l.stops} остановок · ${fmt(l.balance)} р.${extra?' · '+extra:''}`;
  }
  function redirectUrl(){
    return window.location.origin + window.location.pathname;
  }
  async function loadSdk(){
    if(window.supabase?.createClient) return window.supabase;
    if(window.__BUSPHOTO_SUPABASE_PROMISE__) return window.__BUSPHOTO_SUPABASE_PROMISE__;
    window.__BUSPHOTO_SUPABASE_PROMISE__=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.async=true;
      s.onload=()=>window.supabase?.createClient
        ?resolve(window.supabase)
        :reject(new Error('Supabase SDK не инициализировался'));
      s.onerror=()=>reject(new Error('Не удалось загрузить Supabase SDK'));
      document.head.appendChild(s);
    });
    return window.__BUSPHOTO_SUPABASE_PROMISE__;
  }
  function showLoggedOut(){
    $('busSyncAuth').style.display='';
    $('busSyncPanel').style.display='none';
    refreshInfo();
  }
  function showLoggedIn(){
    $('busSyncAuth').style.display='none';
    $('busSyncPanel').style.display='';
    const email=user?.email||user?.user_metadata?.email||'Google аккаунт';
    $('busSyncUser').textContent=`👤 ${email}`;
    $('busSyncAuto').checked=localStorage.getItem('busphoto_sync_auto_v1')==='1';
    refreshInfo();
  }
  async function loginGoogle(){
    status('🔐 открываю Google...');
    const r=await sb.auth.signInWithOAuth({
      provider:'google',
      options:{
        redirectTo:redirectUrl(),
        queryParams:{access_type:'offline',prompt:'select_account'}
      }
    });
    if(r.error) throw r.error;
  }
  async function signup(){
    const email=$('busSyncEmail').value.trim(),password=$('busSyncPassword').value;
    if(!email||!password)return status('Введите email и пароль.',true);
    if(password.length<6)return status('Пароль должен содержать минимум 6 символов.',true);
    status('📨 создаю аккаунт...');
    const r=await sb.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl()}});
    if(r.error)throw r.error;
    if(r.data.session){
      user=r.data.user;showLoggedIn();installAutoSave();realtime();await inspectCloud();
      status('✅ Аккаунт создан.');
    }else status('📨 Письмо отправлено. Подтверди email и затем войди.');
  }
  async function resendConfirmation(){
    const email=$('busSyncEmail').value.trim();
    if(!email)return status('Сначала введи email.',true);
    const r=await sb.auth.resend({type:'signup',email,options:{emailRedirectTo:redirectUrl()}});
    if(r.error)throw r.error;
    status('✅ Письмо отправлено повторно.');
  }
  async function loginEmail(){
    const email=$('busSyncEmail').value.trim(),password=$('busSyncPassword').value;
    if(!email||!password)return status('Введите email и пароль.',true);
    status('🔐 вход...');
    const r=await sb.auth.signInWithPassword({email,password});
    if(r.error)throw r.error;
    user=r.data.user;showLoggedIn();installAutoSave();realtime();await inspectCloud();
  }
  async function getRow(){
    const r=await sb.from(TABLE).select('id,data,updated_at')
      .eq('user_id',user.id).eq('id',ROW_ID).maybeSingle();
    if(r.error)throw r.error;
    return r.data;
  }
  async function saveCloud(silent=false){
    if(!user)return false;
    if(!silent)status('☁️ сохраняю...');
    try{
      if(typeof window.saveGameState==='function')window.saveGameState();
      const payload=readLocal();
      const r=await sb.from(TABLE).upsert(
        {user_id:user.id,id:ROW_ID,data:payload,updated_at:new Date().toISOString()},
        {onConflict:'user_id,id'}
      );
      if(r.error)throw r.error;
      if(!silent)status('✅ сохранено в облако');
      refreshInfo('сохранено: '+new Date().toLocaleTimeString('ru-RU'));
      return true;
    }catch(e){
      console.error('[BUSPHOTO sync save]',e);
      status('⚠️ ошибка сохранения: '+(e.message||e),true);
      return false;
    }
  }
  async function inspectCloud(){
    try{
      const row=await getRow();
      if(!row){status('☁️ облачного сохранения пока нет. Сохрани текущую игру.');return;}
      const c=cloudStats(row.data);
      const when=row.updated_at?new Date(row.updated_at).toLocaleString('ru-RU'):'';
      status(`☁️ облако: ${c.vehicles} ТС · ${c.routes} маршрутов · ${c.stops} остановок · ${fmt(c.balance)} р.${when?' · '+when:''}`);
      refreshInfo('облако найдено');
    }catch(e){
      console.error('[BUSPHOTO sync inspect]',e);
      status('⚠️ не удалось проверить облако: '+(e.message||e),true);
    }
  }
  async function loadCloud(){
    if(!user)return;
    status('⬇️ загружаю из облака...');
    try{
      const row=await getRow();
      if(!row){status('В облаке нет сохранения. Сначала нажми «Сохранить в облако».',true);return;}
      const c=cloudStats(row.data),l=localStats();
      const ok=confirm(
        `Загрузить облачное сохранение?\n\n`+
        `Облако: ${c.vehicles} ТС, ${c.routes} маршрутов, ${c.stops} остановок, ${fmt(c.balance)} р.\n`+
        `Локально: ${l.vehicles} ТС, ${l.routes} маршрутов, ${l.stops} остановок, ${fmt(l.balance)} р.\n\n`+
        `Локальные данные будут заменены.`
      );
      if(!ok){status('Загрузка отменена.');return;}
      const keys=row.data?.keys||{};
      for(const key of SYNC_KEYS){
        if(Object.prototype.hasOwnProperty.call(keys,key))localStorage.setItem(key,keys[key]);
        else localStorage.removeItem(key);
      }
      status('✅ данные загружены. Перезагружаю...');
      setTimeout(()=>location.reload(),350);
    }catch(e){
      console.error('[BUSPHOTO sync load]',e);
      status('⚠️ ошибка загрузки: '+(e.message||e),true);
    }
  }
  function installAutoSave(){
    if(originalSave||typeof window.saveGameState!=='function')return;
    originalSave=window.saveGameState;
    window.saveGameState=function(){
      const r=originalSave.apply(this,arguments);
      if(localStorage.getItem('busphoto_sync_auto_v1')==='1'&&user){
        clearTimeout(saveTimer);
        saveTimer=setTimeout(()=>saveCloud(true),1200);
      }
      return r;
    };
  }
  function realtime(){
    if(channel)sb.removeChannel(channel);
    channel=sb.channel('busphoto-cloud-sync-'+user.id)
      .on('postgres_changes',{
        event:'*',schema:'public',table:TABLE,
        filter:`user_id=eq.${user.id}`
      },()=>inspectCloud())
      .subscribe();
  }
  async function logout(){
    if(channel)sb.removeChannel(channel);
    channel=null;user=null;
    await sb.auth.signOut();
    showLoggedOut();
    status('Вы вышли из Google/облачного аккаунта.');
  }
  async function init(){
    if(!document.getElementById('game-section-sync'))return;

    $('busSyncGoogle').onclick=()=>loginGoogle().catch(e=>{
      console.error('[BUSPHOTO Google]',e);
      status('⚠️ Google-вход не настроен или запрещён: '+(e.message||e),true);
    });
    $('busSyncLogin').onclick=()=>loginEmail().catch(e=>status('⚠️ ошибка входа: '+e.message,true));
    $('busSyncSignup').onclick=()=>signup().catch(e=>status('⚠️ ошибка регистрации: '+e.message,true));
    $('busSyncResend').onclick=()=>resendConfirmation().catch(e=>status('⚠️ '+e.message,true));
    $('busSyncSave').onclick=()=>saveCloud().catch(e=>status('⚠️ '+e.message,true));
    $('busSyncLoad').onclick=()=>loadCloud().catch(e=>status('⚠️ '+e.message,true));
    $('busSyncLogout').onclick=()=>logout().catch(e=>status('⚠️ '+e.message,true));
    $('busSyncAuto').onchange=()=>{
      localStorage.setItem('busphoto_sync_auto_v1',$('busSyncAuto').checked?'1':'0');
      status($('busSyncAuto').checked?'🔄 автосинхронизация включена.':'Автосинхронизация выключена.');
      if($('busSyncAuto').checked)saveCloud(true);
    };

    refreshInfo();
    try{
      status('🔄 подключение к облаку...');
      const sdk=await loadSdk();
      sb=sdk.createClient(SUPABASE_URL,SUPABASE_KEY,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
      });

      const r=await sb.auth.getSession();
      user=r.data.session?.user||null;

      if(user){
        showLoggedIn();installAutoSave();realtime();await inspectCloud();
      }else{
        showLoggedOut();
        status('🔐 войди через Google, чтобы включить синхронизацию.');
      }

      sb.auth.onAuthStateChange((_event,session)=>{
        user=session?.user||null;
        if(user){
          showLoggedIn();installAutoSave();realtime();
          setTimeout(()=>inspectCloud(),0);
        }else{
          if(channel)sb.removeChannel(channel);
          channel=null;showLoggedOut();
        }
      });
    }catch(e){
      console.error('[BUSPHOTO sync init]',e);
      status('⚠️ '+(e.message||e),true);
    }
  }
  window.BUSPHOTOInitSync=init;
})();
