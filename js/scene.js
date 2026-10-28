/* 図の描画（SVG）。図は枠の高さに合わせて伸縮し、場面に必要な範囲へ自動でズームする */
(function(){
'use strict';
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
var COL = { a:['#2F7BEA','#FFFFFF','#0B2A5C'], d:['#FFFFFF','#14201A','#1B2A22'], g:['#FF86BC','#2A0F1D','#6A2244'], r:['#15181A','#F2C200','#F2C200'] };
function tw(t,fs){ var w=0; for(var i=0;i<t.length;i++){ w += /[\x20-\x7E]/.test(t.charAt(i)) ? fs*0.6 : fs; } return w; }
function f2(n){ return Math.round(n*100)/100; }
function BB(){ return {x0:1e9,y0:1e9,x1:-1e9,y1:-1e9, add:function(x,y,r){ r=r||0; if(x-r<this.x0)this.x0=x-r; if(x+r>this.x1)this.x1=x+r; if(y-r<this.y0)this.y0=y-r; if(y+r>this.y1)this.y1=y+r; }}; }

function label(x,y,t,mode,opt,bb){
  opt=opt||{};
  var fs=2.3, w=tw(t,fs)+1.8, h=3.4, b=opt.bounds||[-3,71];
  var cx=Math.min(Math.max(x,b[0]+0.4+w/2), b[1]-0.4-w/2);
  if(bb){ bb.add(cx-w/2,y-h/2); bb.add(cx+w/2,y+h/2); }
  var bg=opt.bg||'rgba(8,18,13,.84)', fg=opt.fg||'#fff';
  return '<g'+(mode?' class="'+mode+'"':'')+'><rect x="'+f2(cx-w/2)+'" y="'+f2(y-h/2)+'" width="'+f2(w)+'" height="'+h+'" rx=".9" fill="'+bg+'"/>'+
    '<text x="'+f2(cx)+'" y="'+f2(y+0.1)+'" font-size="'+fs+'" fill="'+fg+'" text-anchor="middle" dominant-baseline="central" font-weight="700">'+esc(t)+'</text></g>';
}
function defs(u){
  return '<defs>'+
    '<marker id="mw-'+u+'" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#FFFFFF"/></marker>'+
    '<marker id="my-'+u+'" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.6" markerHeight="4.6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#FFE066"/></marker>'+
    '<pattern id="net-'+u+'" width=".9" height=".9" patternUnits="userSpaceOnUse"><path d="M0 0L.9 .9M.9 0L0 .9" stroke="rgba(255,255,255,.6)" stroke-width=".09"/></pattern>'+
    '<pattern id="tf-'+u+'" width="10" height="10.5" y="-4" patternUnits="userSpaceOnUse"><rect width="10" height="5.25" style="fill:var(--turf-a)"/><rect y="5.25" width="10" height="5.25" style="fill:var(--turf-b)"/></pattern>'+
  '</defs>';
}
function wrap(vb,body,u,alt,al){ return '<svg viewBox="'+vb+'" preserveAspectRatio="'+(al||'xMidYMid')+' meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+esc(alt||'ピッチの図')+'">'+defs(u)+body+'</svg>'; }
function grass(u){ return '<rect x="-400" y="-400" width="900" height="900" fill="url(#tf-'+u+')"/>'; }

function pitchHalf(u){
  return grass(u)+
    '<g style="stroke:var(--chalk)" stroke-width=".32" fill="none">'+
     '<path d="M0 120V0H68V120"/><line x1="0" y1="52.5" x2="68" y2="52.5"/>'+
     '<rect x="13.84" y="0" width="40.32" height="16.5"/><rect x="24.84" y="0" width="18.32" height="5.5"/>'+
     '<path d="M26.688 16.5A9.15 9.15 0 0 0 41.312 16.5"/><path d="M1 0A1 1 0 0 1 0 1"/><path d="M67 0A1 1 0 0 0 68 1"/>'+
     '<circle cx="34" cy="52.5" r="9.15"/></g>'+
    '<circle cx="34" cy="11" r=".38" style="fill:var(--chalk)"/><circle cx="34" cy="52.5" r=".38" style="fill:var(--chalk)"/>'+
    '<rect x="30.34" y="-2.4" width="7.32" height="2.4" fill="rgba(0,0,0,.18)"/><rect x="30.34" y="-2.4" width="7.32" height="2.4" fill="url(#net-'+u+')" style="stroke:var(--chalk)" stroke-width=".42"/>';
}
function arrow(a,u,i,bb){
  var k=a[0], x1=a[1], y1=a[2], x2=a[3], y2=a[4];
  bb.add(x1,y1,1); bb.add(x2,y2,1.4);
  var dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy)||1, tr=Math.min(0.9,len*0.08);
  var ex=x2-dx/len*tr, ey=y2-dy/len*tr, delay=0.25+i*0.45, st;
  if(k==='run') st='stroke="#FFE066" stroke-width=".42" stroke-dasharray="1.2 .8" marker-end="url(#my-'+u+')"';
  else if(k==='shot') st='stroke="#FFFFFF" stroke-width=".62" marker-end="url(#mw-'+u+')"';
  else st='stroke="#FFFFFF" stroke-width=".45" marker-end="url(#mw-'+u+')"';
  return '<line class="arr" style="animation-delay:'+delay+'s" x1="'+x1+'" y1="'+y1+'" x2="'+f2(ex)+'" y2="'+f2(ey)+'" '+st+' stroke-linecap="round"/>';
}
function player(p,bb){
  var t=p[0], n=String(p[1]), x=p[2], y=p[3], fl=p[4], c=COL[t], s='';
  bb.add(x,y,3.3);
  s+='<ellipse cx="'+x+'" cy="'+f2(y+1.5)+'" rx="2" ry=".9" fill="rgba(0,0,0,.2)"/>';
  if(fl==='hl') s+='<circle class="hl-ring" cx="'+x+'" cy="'+y+'" r="3.15" fill="none" stroke="#FFE066" stroke-width=".45" stroke-dasharray="1.1 .75"/>';
  var fs = n.length>1 ? 1.95 : 2.25;
  if(fl==='down'){
    s+='<ellipse cx="'+x+'" cy="'+y+'" rx="2.8" ry="1.6" fill="'+c[0]+'" stroke="'+c[2]+'" stroke-width=".3"/>';
    s+='<text x="'+x+'" y="'+f2(y+0.1)+'" font-size="1.8" fill="'+c[1]+'" text-anchor="middle" dominant-baseline="central" font-weight="700">'+esc(n)+'</text>';
  }else{
    s+='<circle cx="'+x+'" cy="'+y+'" r="2" fill="'+c[0]+'" stroke="'+c[2]+'" stroke-width=".34"/>';
    s+='<text x="'+x+'" y="'+f2(y+0.1)+'" font-size="'+fs+'" fill="'+c[1]+'" text-anchor="middle" dominant-baseline="central" font-weight="700">'+esc(n)+'</text>';
  }
  return '<g>'+s+'</g>';
}
function ballSvg(x,y,r){ r=r||0.98; return '<g><circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#FFFFFF" stroke="#111" stroke-width=".22"/><circle cx="'+x+'" cy="'+y+'" r="'+f2(r*0.37)+'" fill="#111"/></g>'; }
function mark(m,bb){
  var k=m[0], x=m[1], y=m[2];
  bb.add(x,y,2);
  if(k==='foul'){
    var pts=[]; for(var i=0;i<16;i++){ var r=i%2?0.75:1.75, a=Math.PI*2*i/16-Math.PI/2; pts.push(f2(x+r*Math.cos(a))+','+f2(y+r*Math.sin(a))); }
    return '<polygon points="'+pts.join(' ')+'" fill="#FFD23F" stroke="#4A3600" stroke-width=".2"/>';
  }
  if(k==='x') return '<g stroke="#FF5A4E" stroke-width=".7" stroke-linecap="round"><circle cx="'+x+'" cy="'+y+'" r="2" fill="none" stroke-width=".3" stroke-dasharray=".8 .6"/><path d="M'+(x-1.1)+' '+(y-1.1)+'L'+(x+1.1)+' '+(y+1.1)+'M'+(x+1.1)+' '+(y-1.1)+'L'+(x-1.1)+' '+(y+1.1)+'"/></g>';
  if(k==='med') return '<g><circle cx="'+x+'" cy="'+y+'" r="1.7" fill="#FFFFFF" stroke="#C81E2B" stroke-width=".25"/><path d="M'+x+' '+(y-1)+'V'+(y+1)+'M'+(x-1)+' '+y+'H'+(x+1)+'" stroke="#C81E2B" stroke-width=".55"/></g>';
  return '';
}
var YEL={bg:'#FFE066', fg:'#1A1500'};
function sceneHalf(sc,u){
  var bb=BB(), s=pitchHalf(u), top='';
  if(sc.zone){
    var z=sc.zone;
    s+='<g class="rev"><rect x="'+z[0]+'" y="'+z[1]+'" width="'+z[2]+'" height="'+z[3]+'" fill="rgba(255,224,102,.2)" stroke="#FFE066" stroke-width=".35" stroke-dasharray="1.2 .7"/></g>';
  }
  if(sc.oline) s+='<line class="rev" x1="-400" y1="'+sc.oline[0]+'" x2="500" y2="'+sc.oline[0]+'" stroke="#FFE066" stroke-width=".42" stroke-dasharray="1.4 .9"/>';
  if(sc.spray){ s+='<line class="rev" x1="'+sc.spray[0]+'" y1="'+sc.spray[2]+'" x2="'+sc.spray[1]+'" y2="'+sc.spray[2]+'" stroke="#FFFFFF" stroke-width=".5" stroke-dasharray=".15 .55" stroke-linecap="round"/>'; }
  if(sc.measure){
    var me=sc.measure, mx=me[0];
    bb.add(mx,me[1]); bb.add(mx,me[2]);
    s+='<g stroke="#FFFFFF" stroke-width=".3"><line x1="'+mx+'" y1="'+me[1]+'" x2="'+mx+'" y2="'+me[2]+'"/><line x1="'+(mx-0.9)+'" y1="'+me[1]+'" x2="'+(mx+0.9)+'" y2="'+me[1]+'"/><line x1="'+(mx-0.9)+'" y1="'+me[2]+'" x2="'+(mx+0.9)+'" y2="'+me[2]+'"/></g>';
  }
  (sc.arr||[]).forEach(function(a,i){ s+=arrow(a,u,i,bb); });
  (sc.p||[]).forEach(function(p){ s+=player(p,bb); });
  (sc.marks||[]).forEach(function(m){ s+=mark(m,bb); });
  if(sc.ball){ bb.add(sc.ball[0],sc.ball[1],1.2); s+=ballSvg(sc.ball[0],sc.ball[1]); }
  if(sc.zone){ var zz=sc.zone; top+=label(zz[0]+zz[2]-tw(zz[4],2.3)/2-1.6, zz[1]+zz[3]-2.4, zz[4], 'rev', YEL, bb); }
  if(sc.oline){ var ol=sc.oline; top+=label(ol[2]!=null?ol[2]:54, ol[0]-2.1, ol[1], 'rev', YEL, bb); }
  if(sc.measure){ var m2=sc.measure, my=(m2[1]+m2[2])/2; top+=label(m2[0]+4.4, my, m2[3], 'pre', null, bb); top+=label(m2[0]+5.2, my, m2[4], 'rev', YEL, bb); }
  (sc.lab||[]).forEach(function(l){ top+=label(l[0],l[1],l[2],l[3],null,bb); });
  /* 場面に必要な範囲へズーム */
  var pad=2.4, x0=bb.x0-pad, x1=bb.x1+pad, y0=bb.y0-pad, y1=bb.y1+pad;
  if(y0<13) y0=Math.min(y0,-3.6);
  var minW=54, minH=40, c;
  if(x1-x0<minW){ c=(x0+x1)/2; x0=c-minW/2; x1=c+minW/2; }
  if(y1-y0<minH){ c=(y0+y1)/2; y0=c-minH/2; y1=c+minH/2; }
  if(x0<-3){ x1+=-3-x0; x0=-3; } if(x1>71){ x0-=x1-71; x1=71; } if(x0<-3) x0=-3;
  return wrap(f2(x0)+' '+f2(y0)+' '+f2(x1-x0)+' '+f2(y1-y0), s+top, u, null, y0<0?'xMidYMin':'xMidYMid');
}

function ledRows(rows,cls,u){
  var n=rows.length, base = n===1?15:(n===2?10.5:7.5), ys = n===1?[18.4]:(n===2?[11.8,25]:[9,18.2,27.4]);
  var s='<g'+(cls?' class="'+cls+'"':'')+' filter="url(#glow-'+u+')">';
  rows.forEach(function(r,i){
    var c={a:'#FFB547',g:'#47F08A',r:'#FF5A4E'}[r.c];
    var fs=Math.min(base, 46/Math.max(tw(r.t,1)*0.92,0.1));
    s+='<text class="led-t" x="37" y="'+ys[i]+'" font-size="'+f2(fs)+'" fill="'+c+'" text-anchor="middle" dominant-baseline="central">'+esc(r.t)+'</text>';
    if(r.tag) s+='<text class="led-t rev" x="14" y="'+ys[i]+'" font-size="3.4" fill="'+c+'" dominant-baseline="central">'+esc(r.tag)+'</text>';
  });
  return s+'</g>';
}
function sceneLed(sc,u){
  var s='<rect x="-400" y="-400" width="900" height="900" fill="#08100C"/>'+
    '<defs><pattern id="dots-'+u+'" width="1.1" height="1.1" patternUnits="userSpaceOnUse"><circle cx=".55" cy=".55" r=".22" fill="#1C2621"/></pattern>'+
    '<filter id="glow-'+u+'" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation=".55" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'+
    '<rect x="9" y="3" width="56" height="30" rx="2.2" fill="#0F1512" stroke="#2C3530" stroke-width=".5"/><rect x="10" y="4" width="54" height="28" rx="1.6" fill="url(#dots-'+u+')"/>';
  s+=ledRows(sc.rows, sc.revRows?'pre':'', u);
  if(sc.revRows) s+=ledRows(sc.revRows,'rev',u);
  if(sc.cap) s+='<text x="37" y="38.2" font-size="2.6" fill="#9DB3A5" text-anchor="middle" dominant-baseline="central">'+esc(sc.cap)+'</text>';
  return wrap('3 0 68 42', s, u, '電光ボードの図');
}
function cardShape(c,x,y,rot,cls){
  var w=12, h=17, g='<g'+(cls?' class="'+cls+'"':'')+' transform="rotate('+rot+' '+x+' '+y+')">';
  if(c==='q') return g+'<rect x="'+(x-w/2)+'" y="'+(y-h/2)+'" width="'+w+'" height="'+h+'" rx="1.2" fill="rgba(255,255,255,.1)" stroke="#FFFFFF" stroke-width=".45" stroke-dasharray="1.3 .8"/><text x="'+x+'" y="'+(y+0.3)+'" font-size="8" fill="#FFFFFF" text-anchor="middle" dominant-baseline="central" font-weight="700">?</text></g>';
  var f = c==='y' ? '#F2C200' : '#E3263C';
  return g+'<rect x="'+(x-w/2+0.6)+'" y="'+(y-h/2+0.8)+'" width="'+w+'" height="'+h+'" rx="1.2" fill="rgba(0,0,0,.25)"/><rect x="'+(x-w/2)+'" y="'+(y-h/2)+'" width="'+w+'" height="'+h+'" rx="1.2" fill="'+f+'"/><rect x="'+(x-w/2+1)+'" y="'+(y-h/2+1)+'" width="'+(w-2)+'" height="2.2" rx=".6" fill="rgba(255,255,255,.28)"/></g>';
}
function sceneCards(sc,u){
  var s=grass(u), n=sc.cards.length, gap=24, x0=37-(n-1)*gap/2;
  sc.cards.forEach(function(c,i){
    var x=x0+i*gap, rot=i%2?7:-7;
    s+=cardShape(c.c,x,15.5,rot,c.rev?'pre':'');
    if(c.rev) s+=cardShape(c.rev,x,15.5,rot,'rev');
    s+=label(x,32.5,c.t,'',{bounds:[0,74]});
  });
  return wrap('6 2 62 34', s, u, 'カードの図');
}
function sceneSignal(sc,u){
  var k='#121517', s=grass(u);
  s+='<line x1="-400" y1="35.6" x2="500" y2="35.6" style="stroke:var(--chalk)" stroke-width=".35"/>';
  s+='<ellipse cx="37" cy="35.4" rx="6" ry="1" fill="rgba(0,0,0,.2)"/>';
  s+='<path d="M35.2 25.5L34 35M38.8 25.5L40 35" stroke="'+k+'" stroke-width="2.2" stroke-linecap="round"/>';
  s+='<path d="M33 13.6Q37 12.2 41 13.6L40.2 26.4H33.8Z" fill="'+k+'"/>';
  s+='<path d="M35.4 13.1L37 15.2L38.6 13.1" stroke="#F2C200" stroke-width=".55" fill="none"/>';
  s+='<circle cx="37" cy="8.6" r="2.9" fill="'+k+'"/>';
  s+='<path d="M40.4 14.4L42 1.6M33.6 14.4L31.8 25" stroke="'+k+'" stroke-width="1.9" stroke-linecap="round"/>';
  s+=ballSvg(52,33.6,1.5);
  s+=label(52,29,'FKの前','',{bounds:[0,74]});
  return wrap('14 -1 46 39', s, u, '片手を上げた主審の図');
}
function sceneZoom(sc,u){
  var s=grass(u), cy=sc.y, r=11, cx=37;
  s+='<rect x="-400" y="18" width="900" height="12" style="fill:var(--chalk)"/>';
  s+='<defs><clipPath id="bc-'+u+'"><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'"/></clipPath></defs>';
  s+='<ellipse cx="'+(cx+1.6)+'" cy="'+(cy+1.8)+'" rx="'+r+'" ry="'+r+'" fill="rgba(0,0,0,.18)"/>';
  s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#FFFFFF"/>';
  var g='<g clip-path="url(#bc-'+u+')">', pent=[];
  for(var i=0;i<5;i++){ var a=-Math.PI/2+i*2*Math.PI/5; pent.push(f2(cx+3.6*Math.cos(a))+','+f2(cy+3.6*Math.sin(a)));
    g+='<line x1="'+f2(cx+3.6*Math.cos(a))+'" y1="'+f2(cy+3.6*Math.sin(a))+'" x2="'+f2(cx+8.2*Math.cos(a))+'" y2="'+f2(cy+8.2*Math.sin(a))+'" stroke="#1A1A1A" stroke-width=".5"/>';
    var b=a+Math.PI/5; g+='<circle cx="'+f2(cx+11*Math.cos(b))+'" cy="'+f2(cy+11*Math.sin(b))+'" r="3.4" fill="#1A1A1A"/>'; }
  g+='<polygon points="'+pent.join(' ')+'" fill="#1A1A1A"/></g>';
  s+=g+'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#1A1A1A" stroke-width=".5"/>';
  s+='<g stroke="#FFE066" stroke-width=".45" stroke-dasharray="1.2 .7"><line x1="22" y1="18" x2="52" y2="18"/><line x1="22" y1="30" x2="52" y2="30"/></g>';
  var B={bounds:[0,74]};
  s+=label(11,-2.2,sc.top,'',B);
  s+=label(9,37.2,sc.bottom,'',B);
  s+=label(63,24,sc.line,'',{bounds:[0,74], bg:'rgba(8,18,13,.75)'});
  s+=label(60,37.2,sc.rev,'rev',{bounds:[0,74], bg:'#FFE066', fg:'#1A1500'});
  s+='<text x="3" y="'+(cy<12?33:12)+'" font-size="2" fill="rgba(255,255,255,.8)">真上から見た図</text>';
  return wrap('0 -5 74 45', s, u, 'ボールとラインを真上から見た図');
}
function renderScene(sc,u){
  if(sc.v==='led') return sceneLed(sc,u);
  if(sc.v==='cards') return sceneCards(sc,u);
  if(sc.v==='signal') return sceneSignal(sc,u);
  if(sc.v==='zoom') return sceneZoom(sc,u);
  return sceneHalf(sc,u);
}

window.ShinpanScene = { render: renderScene };
})();
