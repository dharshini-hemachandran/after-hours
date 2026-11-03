(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,G=window.gsap,ST=window.ScrollTrigger;
const motion=!reduce&&!!G&&!!ST;
if(motion){document.documentElement.classList.add('motion');G.registerPlugin(ST)}
/* ---------- navigation ---------- */
const bar=$('#bar'),nav=$('#nav'),mb=$('#mb');
const onScroll=()=>bar.classList.toggle('solid',scrollY>80&&!nav.classList.contains('open'));addEventListener('scroll',onScroll,{passive:true});onScroll();
const setMenu=o=>{nav.classList.toggle('open',o);bar.classList.toggle('open',o);mb.setAttribute('aria-expanded',o);mb.textContent=o?'Close':'Index';document.body.style.overflow=o?'hidden':'';onScroll()};
mb&&mb.addEventListener('click',()=>setMenu(!nav.classList.contains('open')));
addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){setMenu(false);mb.focus()}});
$$('#nav a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
/* current section in the navigation */
if($('.home')){const ids=['works','experience','about','contact'],links=Object.fromEntries(ids.map(i=>[i,$(`#nav a[href$="#${i}"]`)]));
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){ids.forEach(i=>links[i]&&links[i].removeAttribute('aria-current'));links[e.target.id]&&links[e.target.id].setAttribute('aria-current','true')}}),{rootMargin:'-45% 0px -50% 0px'});ids.forEach(i=>{const s=document.getElementById(i);s&&io.observe(s)})}
/* ---------- page transitions: a stone curtain ---------- */
const curtain=$('.curtain');
if(motion&&curtain){
 if(sessionStorage.getItem('ah-t')){sessionStorage.removeItem('ah-t');G.set(curtain,{yPercent:0});G.to(curtain,{yPercent:-100,duration:.9,ease:'power3.inOut',delay:.08})}else G.set(curtain,{yPercent:100});
 addEventListener('pageshow',e=>{if(e.persisted)G.set(curtain,{yPercent:100})});
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.button||a.target||a.hasAttribute('download'))return;const u=new URL(a.href,location.href);if(u.origin!==location.origin||(u.pathname===location.pathname&&u.hash))return;e.preventDefault();sessionStorage.setItem('ah-t','1');G.to(curtain,{yPercent:0,duration:.7,ease:'power3.inOut',onComplete:()=>{location.href=a.href}})})}
/* ---------- entrances & scroll choreography ---------- */
function splitWords(el){const t=el.textContent.trim().split(/\s+/);el.innerHTML=t.map(w=>`<span class="w">${w}</span>`).join(' ');return $$('.w',el)}
if(motion){
 const hero=$('.hero');
 if(hero){
  const arch=$('.hero .arch'),im=$('img',arch),ready=Promise.race([im&&im.decode?im.decode().catch(()=>{}):Promise.resolve(),new Promise(r=>setTimeout(r,900))]);
  ready.then(()=>{const tl=G.timeline({defaults:{ease:'power3.out'}});
   tl.to(arch,{clipPath:'inset(0% 0 0 0 round 999px 999px 0 0)',duration:1.5,ease:'power3.inOut'}).from(im,{scale:1.3,duration:2,ease:'power2.out'},0)
    .to('.hero h1 span b',{y:0,yPercent:0,duration:1.2,stagger:.14},.55).to('.hero .rv',{opacity:1,y:0,duration:1,stagger:.12},.9).from('.bar',{opacity:0,y:-16,duration:.9},.9)});
  G.to(im,{yPercent:10,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});
  G.to(arch,{scale:.92,yPercent:-4,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});
  G.to('.hero h1',{yPercent:-22,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});
 }else{const h=$('.ph h1');h&&G.set('.ph .rv',{opacity:0,y:24});G.to('.ph .rv',{opacity:1,y:0,duration:1.1,stagger:.12,ease:'power3.out',delay:.35})}
 const st=$('[data-split]');if(st){const w=splitWords(st);G.to(w,{opacity:1,stagger:.06,ease:'none',scrollTrigger:{trigger:st,start:'top 82%',end:'bottom 48%',scrub:true}})}
 $$('.arch.mk').forEach(a=>{if(a.closest('.hero'))return;const im=$('img',a);G.to(a,{clipPath:'inset(0% 0 0 0 round 999px 999px 0 0)',duration:1.5,ease:'power3.inOut',scrollTrigger:{trigger:a,start:'top 85%',once:true}});if(im){G.fromTo(im,{scale:1.25},{scale:1.02,duration:2,ease:'power2.out',scrollTrigger:{trigger:a,start:'top 85%',once:true}});G.fromTo(im,{yPercent:-5},{yPercent:5,ease:'none',scrollTrigger:{trigger:a,start:'top bottom',end:'bottom top',scrub:true}})}});
 $$('.head').forEach(h=>{const l=document.createElement('span');l.className='rl';l.style.cssText='position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor;opacity:.5;transform-origin:left';h.appendChild(l);G.fromTo(l,{scaleX:0},{scaleX:1,duration:1.4,ease:'power3.inOut',scrollTrigger:{trigger:h,start:'top 88%',once:true}})});
 ST.batch('.rv:not(.hero .rv):not(.ph .rv)',{start:'top 90%',once:true,onEnter:b=>G.to(b,{opacity:1,y:0,duration:1,stagger:.1,ease:'power3.out'})});
 $$('[data-band] img').forEach(i=>G.fromTo(i,{yPercent:-6},{yPercent:6,ease:'none',scrollTrigger:{trigger:i.parentElement,start:'top bottom',end:'bottom top',scrub:true}}));
 $$('.loop .d').forEach(p=>{const l=p.getTotalLength();p.style.setProperty('--l',l);G.fromTo(p,{strokeDasharray:l,strokeDashoffset:l},{strokeDashoffset:0,duration:2.2,ease:'power2.inOut',scrollTrigger:{trigger:p.ownerSVGElement,start:'top 80%',once:true}})});
}
/* ---------- contact form (composes an email in the visitor's mail app) ---------- */
const cf=$('#cf');
cf&&cf.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(cf),n=f.get('n').trim(),m=f.get('m').trim(),em=f.get('e').trim(),s=$('#fs');
 if(!n||!m||!/^\S+@\S+\.\S+$/.test(em)){s.textContent='Please add your name, a valid email and a message.';return}
 s.textContent='Opening your email app. If nothing opens, write to dharshini.void@gmail.com.';
 location.href='mailto:dharshini.void@gmail.com?subject='+encodeURIComponent('Hello from your portfolio, from '+n)+'&body='+encodeURIComponent(m+'\n\n— '+n+' ('+em+')')});
/* ---------- findings chart (The Visibility Trap) ---------- */
const bars=$('#bars');
if(bars){const D={g:{t:'Exposure Gini by policy · lower means exposure is spread more evenly',max:.65,rows:[['Engagement-first',.6126],['Exploration 35%',.3452],['Exposure-aware 35%',.129],['Exposure-aware 50%',.1204],['Exploration 50%',.0292]]},
 e:{t:'Mean engagement proxy by policy · higher means more engagement collected in the simulation',max:.7,rows:[['Engagement-first',.6754],['Exploration 35%',.6017],['Exposure-aware 35%',.5221],['Exploration 50%',.4951],['Exposure-aware 50%',.4582]]}};
 const draw=k=>{const d=D[k];$('#ct').textContent=d.t;bars.innerHTML=d.rows.map(([n,v])=>`<div class="r"><span>${n}</span><div class="tr"><i style="--v:0" data-v="${v/d.max}"></i></div><b>${v.toFixed(4)}</b></div>`).join('');requestAnimationFrame(()=>requestAnimationFrame(()=>$$('i',bars).forEach(i=>i.style.setProperty('--v',i.dataset.v))))};
 draw('g');$$('#seg input').forEach(i=>i.addEventListener('change',()=>draw(i.value)))}
/* ---------- TF-IDF + cosine similarity demonstration (Campus Connect) ---------- */
const dt=$('#dt');
if(dt){
 const OPP=[['Backend developer · campus hackathon team','Backend developer for a campus hackathon team. Python, FastAPI, PostgreSQL, REST APIs and databases. Build and deploy a working prototype in a weekend.'],
 ['Research assistant · recommendation systems study','Research assistant for a recommendation systems study. Python, pandas, data analysis, simulation, statistics and clear written reports.'],
 ['Design volunteer · college event','Design volunteer for a college event. Posters, social media posts, branding, visual identity and layout in Figma or Canva.'],
 ['Operations and outreach coordinator · student event','Coordinate a student event: logistics, outreach, recruiting volunteers, scheduling and communicating with sponsors.'],
 ['Product intern · student platform','Product intern for a student platform. User research, product thinking, writing requirements, testing features and talking to students.']];
 const STOP=new Set('a an and are as at be by for from has have i in into is it of on or that the their this to was we with you your my me our can will not but so than then them these those'.split(' '));
 const tok=t=>(t.toLowerCase().match(/[a-z][a-z+#.]*[a-z+#]|[a-z]/g)||[]).map(w=>w.replace(/\.$/,'')).filter(w=>w.length>1&&!STOP.has(w)).map(w=>w.length>4&&w.endsWith('s')&&!w.endsWith('ss')?w.slice(0,-1):w);
 const docs=OPP.map(o=>tok(o[0]+' '+o[1])),N=docs.length,df={};docs.forEach(d=>new Set(d).forEach(t=>df[t]=(df[t]||0)+1));
 const idf=t=>Math.log((1+N)/(1+df[t]))+1,vec=ts=>{const tf={};ts.forEach(t=>{if(df[t])tf[t]=(tf[t]||0)+1});const v={};for(const t in tf)v[t]=tf[t]/ts.length*idf(t);return v};
 const norm=v=>Math.sqrt(Object.values(v).reduce((a,x)=>a+x*x,0)),dv=docs.map(vec);
 const run=()=>{const q=vec(tok(dt.value)),qn=norm(q);
  const out=OPP.map((o,i)=>{const d=dv[i],dn=norm(d);let dot=0;const sh=[];for(const t in q)if(d[t]){dot+=q[t]*d[t];sh.push([t,q[t]*d[t]])}const s=qn&&dn?dot/(qn*dn):0;sh.sort((a,b)=>b[1]-a[1]);return{t:o[0],s,sh:sh.slice(0,5).map(x=>x[0])}}).sort((a,b)=>b.s-a.s);
  $('#res').innerHTML=out.map(r=>`<li><span class="tt">${r.t}</span><span class="sc">${(r.s*100).toFixed(1)}%</span><span class="bar2"><i style="width:${Math.round(r.s*100)}%"></i></span><span class="sh">${r.sh.length?'shared terms: '+r.sh.map(x=>'<mark>'+x+'</mark>').join(' · '):'no shared terms'}</span></li>`).join('')};
 let tm;dt.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(run,120)});run()}
})();
