/* 画面と進行。問題データは js/questions.js、図は js/scene.js */
(function(){
'use strict';

var CH = window.SHINPAN_CHAPTERS;
var renderScene = window.ShinpanScene.render;
var TOTAL_Q = CH.reduce(function(n,c){return n+c.qs.length;},0);
var MAX_STARS = CH.length*3;
var RANKS = [
  {min:0, name:'見習い', g:'見習', word:true},
  {min:3, name:'4級審判員', g:'4'},
  {min:7, name:'3級審判員', g:'3'},
  {min:12, name:'2級審判員', g:'2'},
  {min:16, name:'1級審判員', g:'1'},
  {min:18, name:'国際審判員', g:'国際', word:true}
];

/* ---------- 保存 ---------- */
var KEY='shinpan-dojo-v1';
function load(){
  var d={best:{},seen:{},right:{},sound:false};
  try{ var s=localStorage.getItem(KEY); if(s){ var o=JSON.parse(s); for(var k in o) d[k]=o[k]; } }catch(e){}
  return d;
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(P)); }catch(e){} }
var P = load();

/* ---------- 共通 ---------- */
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function starsFor(ok,total){ var r=ok/total; return r>=1?3:r>=0.66?2:r>=0.33?1:0; }
function totalStars(){ var t=0; CH.forEach(function(c){ t+=P.best[c.id]||0; }); return t; }
function rankFor(st){ var r=RANKS[0]; RANKS.forEach(function(x){ if(st>=x.min) r=x; }); return r; }
function nextRank(st){ for(var i=0;i<RANKS.length;i++){ if(RANKS[i].min>st) return RANKS[i]; } return null; }
function starSvg(on){ return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.2 6.2 20.4l1.2-6.5L2.6 9.4l6.5-.8z" style="fill:'+(on?'var(--star)':'none')+';stroke:'+(on?'var(--star)':'var(--line)')+'" stroke-width="1.6" stroke-linejoin="round"/></svg>'; }
function starsHtml(n){ var s=''; for(var i=0;i<3;i++) s+=starSvg(i<n); return s; }
var BOOK_SVG = '<svg viewBox="0 0 40 48" aria-hidden="true"><rect x="3" y="2" width="34" height="44" rx="3" style="fill:var(--ink)"/><rect x="8" y="9" width="12" height="16" rx="1.5" fill="#F2C200" transform="rotate(-8 14 17)"/><rect x="19" y="11" width="12" height="16" rx="1.5" fill="#E3263C" transform="rotate(7 25 19)"/><path d="M9 34h22M9 39h16" style="stroke:var(--bg)" stroke-width="2" stroke-linecap="round"/></svg>';

/* ---------- 笛の音 ---------- */
var actx=null;
function whistle(seq){
  if(!P.sound) return;
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    if(actx.state==='suspended') actx.resume();
    var t0=actx.currentTime+0.03;
    seq.forEach(function(sd){
      var a=t0+sd[0], d=sd[1];
      var o=actx.createOscillator(), g=actx.createGain(), l=actx.createOscillator(), lg=actx.createGain();
      o.type='sine'; o.frequency.value=2750; l.frequency.value=30; lg.gain.value=150;
      l.connect(lg); lg.connect(o.frequency); o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(0.0001,a); g.gain.exponentialRampToValueAtTime(0.08,a+0.02);
      g.gain.setValueAtTime(0.08,a+d-0.05); g.gain.exponentialRampToValueAtTime(0.0001,a+d);
      o.start(a); l.start(a); o.stop(a+d+0.03); l.stop(a+d+0.03);
    });
  }catch(e){}
}


/* =========================================================
   画面
   ========================================================= */
var cur='home', introCh=0, S=null, R=null, bookTab=0, qN=0;

function show(name){
  ['home','intro','play','result','book'].forEach(function(v){ var el=$('v-'+v); el.hidden=(v!==name); if(v===name) el.scrollTop=0; });
  cur=name;
}
function nextChapterIndex(){
  for(var i=0;i<CH.length;i++){ if((P.best[CH[i].id]||0)<3) return i; }
  return -1;
}

function renderHome(){
  var st=totalStars(), rk=rankFor(st), nx=nextRank(st);
  var ni=nextChapterIndex(), played=Object.keys(P.best).length>0;
  var cta=$('cta');
  if(ni<0){ cta.textContent='全節クリア！ 好きな節に再挑戦'; cta.dataset.v='0'; }
  else{ cta.textContent = played ? ('第'+(ni+1)+'節「'+CH[ni].title+'」へ') : '第1節からはじめる'; cta.dataset.v=String(ni); }

  var grade = rk.word ? '<div class="grade word">'+rk.g+'</div>' : '<div class="grade"><span><span class="n">'+rk.g+'</span><span class="u">級</span></span></div>';
  $('license').innerHTML =
    '<div class="lic-head"><span>REFEREE LICENSE</span><span>審判員証</span></div>'+
    '<div class="lic-body">'+grade+'<div class="lic-info"><div class="lic-rank">'+rk.name+'</div>'+
    '<div class="meter"><i style="width:'+Math.round(st/MAX_STARS*100)+'%"></i></div>'+
    '<div class="lic-next">★'+st+' / '+MAX_STARS+(nx?'　'+nx.name.replace('審判員','')+'まであと★'+(nx.min-st):'　最高ランクに到達')+'</div></div></div>';

  var html='';
  CH.forEach(function(c,i){
    var b=P.best[c.id];
    html+='<li><button class="fx'+(i===ni?' next':'')+'" data-act="intro" data-v="'+i+'">'+
      '<span class="fx-top"><span class="fx-no">第'+(i+1)+'節</span>'+(i===ni?'<span class="tag">次はここ</span>':'<span class="stars" aria-label="星'+(b||0)+'つ">'+starsHtml(b||0)+'</span>')+'</span>'+
      '<b>'+esc(c.title)+'</b><small>'+esc(c.meta)+'</small></button></li>';
  });
  $('fixtures').innerHTML=html;

  $('totalQ').textContent=TOTAL_Q;
  var seen=Object.keys(P.seen).length;
  $('bookRow').innerHTML = '<span class="book-ico">'+BOOK_SVG+'</span><b>審判手帳</b><span class="cnt">'+seen+'/'+TOTAL_Q+'</span>';
  $('soundBtn').innerHTML = '笛の音<br>'+(P.sound?'オン':'オフ');
}
function goHome(){ renderHome(); show('home'); }

function openIntro(i){
  if(!(i>=0 && i<CH.length)) i=0;
  introCh=i; var c=CH[i];
  $('inNo').textContent='第'+(i+1)+'節';
  $('inTitle').textContent=c.title;
  $('inLead').textContent=c.lead;
  $('inPoints').innerHTML=c.points.map(function(p){return '<li>'+esc(p)+'</li>';}).join('');
  var b=P.best[c.id];
  $('inMeta').textContent=c.qs.length+'つの場面 ・ およそ'+Math.ceil(c.qs.length*0.5)+'分'+(b!=null?' ・ これまでの最高 ★'+b:'');
  show('intro');
}

function startChapter(i){
  S={ch:i, i:0, res:[], answered:false, pick:null};
  show('play'); renderQ();
}
function chipFor(t){
  if(/レッド|退場（2枚目/.test(t)) return '<span class="chip r"></span>';
  if(/イエロー/.test(t)) return '<span class="chip y"></span>';
  if(/ノーカード|カードなし/.test(t)) return '<span class="chip n"></span>';
  return '';
}
function updateBar(){
  var c=CH[S.ch], ok=S.res.filter(Boolean).length;
  $('pbNo').textContent='第'+(S.ch+1)+'節　SCENE '+(S.i+1)+'/'+c.qs.length;
  $('pbTitle').textContent=c.title;
  $('ledOk').textContent=ok; $('ledNg').textContent=S.res.length-ok;
  var pips=$('pips'); pips.style.gridTemplateColumns='repeat('+c.qs.length+',1fr)';
  var ph=''; c.qs.forEach(function(_,k){ var cls = k<S.res.length ? (S.res[k]?'ok':'ng') : (k===S.i?'cur':''); ph+='<i class="'+cls+'"></i>'; }); pips.innerHTML=ph;
}
function renderQ(){
  var c=CH[S.ch], q=c.qs[S.i];
  updateBar();
  qN++;
  var sc=$('scene'); sc.className='scene'+(q.scene.v==='led'?' dark':''); sc.innerHTML=renderScene(q.scene,'q'+qN);
  $('prompt').textContent=q.q;
  var ch=$('choices'); ch.className='choices'+((q.c.length===2||q.c.length===4)?' two':'');
  ch.innerHTML=q.c.map(function(t,k){ return '<button class="choice" data-act="pick" data-v="'+k+'" id="ch-'+k+'">'+chipFor(t)+'<span class="lbl">'+esc(t)+'</span></button>'; }).join('');
  $('qpanel').hidden=false;
  var fb=$('fb'); fb.hidden=true; fb.innerHTML='';
  if(S.answered) showFeedback();
}
function answer(k){
  if(S.answered) return;
  var q=CH[S.ch].qs[S.i], ok=(k===q.a);
  S.answered=true; S.pick=k; S.res.push(ok);
  P.seen[q.id]=1; if(ok) P.right[q.id]=1; save();
  if(ok) whistle([[0,0.13]]);
  showFeedback();
}
/* 解説は判定ボタンと入れ替えて表示（スクロール不要） */
function showFeedback(){
  var c=CH[S.ch], q=c.qs[S.i], ok=(S.pick===q.a), last=(S.i===c.qs.length-1);
  $('scene').classList.add('revealed');
  updateBar();
  $('qpanel').hidden=true;
  var fb=$('fb');
  fb.innerHTML =
    '<div class="fb-head"><span class="fb-mark '+(ok?'ok':'ng')+'">'+(ok?'正解！':'ざんねん')+'</span><span class="fb-call">'+esc(q.verdict)+'</span>'+
      (ok?'':'<span class="fb-you">あなたの判定：<s>'+esc(q.c[S.pick])+'</s></span>')+'</div>'+
    '<p class="fb-why">'+esc(q.why)+'</p>'+
    (q.watch?'<p class="memo"><b>観戦メモ</b>'+esc(q.watch)+'</p>':'')+
    '<p class="logged">'+BOOK_SVG+'審判手帳に記録：'+esc(q.card.t)+'</p>'+
    '<button class="btn-y" data-act="next">'+(last?'試合終了の笛 → 結果を見る':'次の場面へ')+'</button>';
  fb.hidden=false;
}
function next(){
  var c=CH[S.ch];
  if(S.i>=c.qs.length-1){ finish(); return; }
  S.i++; S.answered=false; S.pick=null;
  renderQ(); $('v-play').scrollTop=0;
}
function finish(){
  var c=CH[S.ch], okN=S.res.filter(Boolean).length, st=starsFor(okN,c.qs.length);
  var before=totalStars(), rkBefore=rankFor(before);
  var prev=P.best[c.id]; if(prev==null || st>prev) P.best[c.id]=st;
  save();
  var rkAfter=rankFor(totalStars());
  R={ch:S.ch, res:S.res.slice(), ok:okN, stars:st, promoted:(rkAfter.min>rkBefore.min)?rkAfter:null};
  bookTab=S.ch;
  renderResult(); show('result');
  whistle([[0,0.16],[0.3,0.16],[0.6,0.8]]);
}
function renderResult(){
  var c=CH[R.ch];
  $('resCh').textContent='第'+(R.ch+1)+'節　'+c.title;
  $('board').innerHTML='<div><span class="num g">'+R.ok+'</span><small>せいかい</small></div><span class="dash">-</span><div><span class="num r">'+(R.res.length-R.ok)+'</span><small>ミス</small></div>';
  var s=''; for(var i=0;i<3;i++) s+=starSvg(i<R.stars); $('resStars').innerHTML=s;
  var pm=$('promo');
  if(R.promoted){ pm.textContent='昇格！ あなたは「'+R.promoted.name+'」になりました'; pm.hidden=false; }
  else if(R.stars===3){ pm.textContent='パーフェクト！ この節の判定はすべて正確でした'; pm.hidden=false; }
  else pm.hidden=true;
  $('review').innerHTML=c.qs.map(function(q,k){ var ok=R.res[k]; return '<li><span class="m '+(ok?'ok':'ng')+'">'+(ok?'✓':'✕')+'</span><span>'+esc(q.card.t)+'</span></li>'; }).join('');
  $('nextCh').textContent = R.ch<CH.length-1 ? ('第'+(R.ch+2)+'節「'+CH[R.ch+1].title+'」へ') : '審判手帳を開く';
}
function renderBook(){
  var t='';
  CH.forEach(function(c,i){
    var got=c.qs.filter(function(q){return P.seen[q.id];}).length;
    t+='<button class="tab" role="tab" aria-selected="'+(i===bookTab)+'" data-act="tab" data-v="'+i+'">第'+(i+1)+'節<small>'+got+'/'+c.qs.length+'</small></button>';
  });
  $('tabs').innerHTML=t;
  var c=CH[bookTab], got=c.qs.filter(function(q){return P.seen[q.id];}).length;
  var html='<h3><span>'+esc(c.title)+'</span><small>'+got+'/'+c.qs.length+'</small></h3>';
  c.qs.forEach(function(q){
    if(P.seen[q.id]) html+='<div class="note'+(P.right[q.id]?' ok':'')+'"><b>'+esc(q.card.t)+'</b><p>'+esc(q.card.b)+'</p></div>';
    else html+='<div class="note locked"><b>？？？</b><p>この節の場面を判定すると記録されます</p></div>';
  });
  var bl=$('bookList'); bl.innerHTML=html; bl.scrollTop=0;
}
function openBook(){ renderBook(); show('book'); }

document.addEventListener('click', function(e){
  var b=e.target.closest('[data-act]'); if(!b) return;
  var act=b.dataset.act, v=parseInt(b.dataset.v,10);
  if(act==='home') goHome();
  else if(act==='intro') openIntro(v);
  else if(act==='start') startChapter(introCh);
  else if(act==='pick') answer(v);
  else if(act==='next') next();
  else if(act==='book') openBook();
  else if(act==='tab'){ bookTab=v; renderBook(); }
  else if(act==='retry'){ if(R) startChapter(R.ch); }
  else if(act==='nextch'){ if(R && R.ch<CH.length-1) openIntro(R.ch+1); else openBook(); }
  else if(act==='sound'){ P.sound=!P.sound; save(); $('soundBtn').innerHTML='笛の音<br>'+(P.sound?'オン':'オフ'); if(P.sound) whistle([[0,0.12]]); }
});

/* ---------- 起動 ---------- */
renderHome();
show('home');
})();
