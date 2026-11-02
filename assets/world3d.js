import * as THREE from './vendor/three.module.min.js';
const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let R_=11;const rnd=()=>(R_=(R_*16807)%2147483647)/2147483647;
try{
const cv=document.createElement('canvas');cv.id='gl';document.body.prepend(cv);
const ren=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
ren.setPixelRatio(Math.min(devicePixelRatio,1.75));ren.shadowMap.enabled=true;ren.shadowMap.type=THREE.PCFSoftShadowMap;
ren.toneMapping=THREE.ACESFilmicToneMapping;ren.toneMappingExposure=1.05;
const scene=new THREE.Scene(),FOG=0x2b1822;scene.fog=new THREE.FogExp2(FOG,.0085);
const cam=new THREE.PerspectiveCamera(68,1,.1,700);cam.rotation.order='YXZ';
/* ---------- textures & materials ---------- */
function tex(w,draw,rx=1,ry=1){const c=document.createElement('canvas');c.width=c.height=w;const g=c.getContext('2d');draw(g,w);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
const noise=(g,w,n,a)=>{for(let i=0;i<n;i++){g.fillStyle=`rgba(${rnd()>.5?255:0},${rnd()>.5?255:0},${rnd()>.5?255:0},${a*rnd()})`;g.fillRect(rnd()*w,rnd()*w,1+rnd()*3,1+rnd()*3)}};
const T={
 stone:tex(256,(g,w)=>{g.fillStyle='#86857f';g.fillRect(0,0,w,w);noise(g,w,2500,.07);g.strokeStyle='#4f4e4a';g.lineWidth=3;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(0,i*64);g.lineTo(w,i*64);g.moveTo(i*64,0);g.lineTo(i*64,w);g.stroke()}}),
 grass:tex(256,(g,w)=>{g.fillStyle='#3b5240';g.fillRect(0,0,w,w);for(let i=0;i<3000;i++){g.fillStyle=`hsl(${95+rnd()*40},${25+rnd()*20}%,${18+rnd()*14}%)`;g.fillRect(rnd()*w,rnd()*w,2,4)}},90,90),
 wall:tex(128,(g,w)=>{g.fillStyle='#d9d3c5';g.fillRect(0,0,w,w);noise(g,w,900,.08)},4,1),
 roof:tex(128,(g,w)=>{g.fillStyle='#2b333d';g.fillRect(0,0,w,w);for(let y=0;y<8;y++)for(let x=0;x<8;x++){g.strokeStyle='#4a5563';g.lineWidth=2;g.beginPath();g.arc(x*16+8,y*16+14,8,0,Math.PI);g.stroke()}noise(g,w,400,.08)},8,5),
 wood:tex(128,(g,w)=>{g.fillStyle='#4a3326';g.fillRect(0,0,w,w);for(let i=0;i<60;i++){g.fillStyle=`rgba(0,0,0,${.15*rnd()})`;g.fillRect(rnd()*w,0,1+rnd()*2,w)}},2,2),
 floor:tex(128,(g,w)=>{g.fillStyle='#3d2a1e';g.fillRect(0,0,w,w);g.strokeStyle='#241810';g.lineWidth=2;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(0,i*32);g.lineTo(w,i*32);g.stroke()}noise(g,w,500,.06)},12,12)};
const std=(o)=>new THREE.MeshStandardMaterial({roughness:.85,metalness:0,...o});
const M={stone:std({map:T.stone}),grass:std({map:T.grass}),wall:std({map:T.wall}),roof:std({map:T.roof,roughness:.6,side:THREE.DoubleSide}),wood:std({map:T.wood}),floor:std({map:T.floor}),
 pillar:std({color:0x6b1022,roughness:.5}),dark:std({color:0x2a1d16}),brass:std({color:0xb08a3a,metalness:.7,roughness:.35}),
 lamp:new THREE.MeshStandardMaterial({color:0xffb36b,emissive:0xff8a3d,emissiveIntensity:1.5}),paper:new THREE.MeshStandardMaterial({color:0xe9d7b0,emissive:0xffc27a,emissiveIntensity:.7}),
 leaf:std({color:0x35553a}),maple:std({color:0x7a3b2c}),bamboo:std({color:0x6f8a52}),water:new THREE.MeshStandardMaterial({color:0x1d3a4b,roughness:.1,metalness:.5,transparent:true,opacity:.92}),lotus:std({color:0x3f6b45,side:THREE.DoubleSide}),pink:std({color:0xe7a0b4,emissive:0x331018})};
/* ---------- helpers ---------- */
M.redlan=new THREE.MeshStandardMaterial({color:0x9a1428,emissive:0xff3a2a,emissiveIntensity:.9});const world=new THREE.Group();scene.add(world);const cols=[],doors=[],lights=[];
function box(w,h,d,m,x,y,z,p=world,sh=true){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);o.castShadow=sh;o.receiveShadow=true;p.add(o);return o}
function cyl(r,h,m,x,y,z,p=world,seg=12){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),m);o.position.set(x,y+h/2,z);o.castShadow=true;p.add(o);return o}
const col=(x0,x1,z0,z1)=>cols.push([Math.min(x0,x1),Math.max(x0,x1),Math.min(z0,z1),Math.max(z0,z1)]);
function wallSeg(x0,z0,x1,z1,h,m=M.wall,t=.5,y=0,cap=true){const w=Math.abs(x1-x0)||t,d=Math.abs(z1-z0)||t;box(w,h,d,m,(x0+x1)/2,y,(z0+z1)/2);if(cap)box(w+.3,.25,d+.3,M.roof,(x0+x1)/2,y+h,(z0+z1)/2);col(x0-(w==t?t/2:0),x1+(w==t?t/2:0),z0-(d==t?t/2:0),z1+(d==t?t/2:0))}
function glow(x,y,z,int=18,dist=16,c=0xffb070){const l=new THREE.PointLight(c,int,dist,2);l.position.set(x,y,z);world.add(l);lights.push([l,int]);return l}
const LAN=[];const lant=(x,y,z)=>LAN.push([x,y,z]);
function roof(w,d,h,rl,lift,y,x,z,over=1.6){const E=10,Rg=9,pos=[],uv=[],idx=[];w+=over*2;d+=over*2;
 for(let k=0;k<=Rg;k++){const t=k/Rg,hw=w/2+(rl/2-w/2)*t,hd=Math.max(d/2*(1-t),.001);const cs=[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]];
  for(let e=0;e<4;e++)for(let i=0;i<E;i++){const u=i/E,a=cs[e],b=cs[(e+1)%4],px=a[0]+(b[0]-a[0])*u,pz=a[1]+(b[1]-a[1])*u,c=Math.pow(Math.abs(2*u-1),3);
   const flare=(1-t)*(1-t);pos.push(px+(Math.sign(px)||0)*flare*.5*(e%2?0:c),h*Math.pow(t,1.55)+lift*flare*(e%2?.35:1)*c,pz+(Math.sign(pz)||0)*flare*.5*(e%2?c:0));uv.push((e*E+i)/(4*E)*6,t*4)}}
 const P=4*E;for(let k=0;k<Rg;k++)for(let i=0;i<P;i++){const a=k*P+i,b=k*P+(i+1)%P,c=(k+1)*P+i,e=(k+1)*P+(i+1)%P;idx.push(a,c,b,b,c,e)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const m=new THREE.Mesh(g,M.roof);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;world.add(m);
 box(rl+.6,.3,.5,M.dark,x,y+h-.1,z);box(.5,.8,.6,M.dark,x-rl/2-.3,y+h,z);box(.5,.8,.6,M.dark,x+rl/2+.3,y+h,z)}
function pillar(x,z,h,y=0){cyl(.28,h,M.pillar,x,y,z);box(.95,.18,.95,M.dark,x,y+h,z);box(1.35,.16,1.35,M.wood,x,y+h+.18,z);cyl(.4,.12,M.stone,x,y,z);col(x-.35,x+.35,z-.35,z+.35)}
function beam(x0,z0,x1,z1,y,h=.4){box(Math.abs(x1-x0)||.35,h,Math.abs(z1-z0)||.35,M.wood,(x0+x1)/2,y,(z0+z1)/2)}
function hallShell(x,z,w,d,o){const{h=4.6,base=0,rh=3.4,lift=1.3,over=1.8}=o;
 if(base)box(w+2,base,d+2,M.stone,x,0,z);
 for(let i=0;i<=Math.round(w/4.8);i++)pillar(x-w/2+i*w/Math.round(w/4.8),z+d/2,h,base);
 for(let i=0;i<=Math.round(w/4.8);i++)pillar(x-w/2+i*w/Math.round(w/4.8),z-d/2,h,base);
 beam(x-w/2,z+d/2,x+w/2,z+d/2,base+h-.1);beam(x-w/2,z-d/2,x+w/2,z-d/2,base+h-.1);beam(x-w/2,z-d/2,x-w/2,z+d/2,base+h-.1);beam(x+w/2,z-d/2,x+w/2,z+d/2,base+h-.1);
 box(w,.1,d,M.floor,x,base,z,world,false);
 roof(w,d,rh,w*.5,lift,base+h+.2,x,z,over)}
/* ================= AFTER HOURS · ghost-city street, canal, courtyard, manor ================= */
scene.fog.color.set(0x16252d);scene.fog.density=.0105;
Object.assign(M,{timber:std({color:0x241915,roughness:.8}),vermil:std({color:0x8e1b17,roughness:.55}),gold:new THREE.MeshStandardMaterial({color:0xc29a4a,metalness:.6,roughness:.4,emissive:0x2a1c08}),cloth:std({color:0x7d1620,side:THREE.DoubleSide}),teal:std({color:0x2d5a5c,side:THREE.DoubleSide})});
const sky=new THREE.Mesh(new THREE.SphereGeometry(600,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;void main(){float h=normalize(p).y;vec3 hor=vec3(.36,.1,.1),mid=vec3(.06,.16,.2),top=vec3(.012,.022,.04);vec3 c=mix(hor,mid,smoothstep(0.,.22,h));c=mix(c,top,smoothstep(.18,.75,h));gl_FragColor=vec4(c,1.);}'}));scene.add(sky);
scene.add(new THREE.HemisphereLight(0x8fb0ba,0x3a2420,1.35));
const sun=new THREE.DirectionalLight(0xb9d0e0,1.35);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:5,far:120});sun.shadow.bias=-.0006;scene.add(sun,sun.target);
const plight=new THREE.PointLight(0xffa860,34,18,2);scene.add(plight);
const MAP=[],GL=[];
const dark=(c)=>{const m=M.stone.clone();m.map=T.stone.clone();m.color.set(c);return m};
const pave=(w,d,x,z,rx,rz,c=0x8c9298)=>{const m=dark(c);m.map.repeat.set(rx,rz);m.map.needsUpdate=true;const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);p.rotation.x=-Math.PI/2;p.position.set(x,.03,z);p.receiveShadow=true;scene.add(p)};
const gnd=new THREE.Mesh(new THREE.PlaneGeometry(900,900),std({color:0x0d1214}));gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;scene.add(gnd);
pave(12,112,0,2,3,28);pave(44,16,0,56,11,4);pave(70,19,0,-26.5,17,5);pave(8,10,0,-14,2,2);
/* ---- facade textures (lit lattice windows) ---- */
function facTex(seed){const mk=()=>{const c=document.createElement('canvas');c.width=c.height=256;return c},a=mk(),b=mk(),g=a.getContext('2d'),e=b.getContext('2d');g.fillStyle='#1a1411';g.fillRect(0,0,256,256);e.fillStyle='#000';e.fillRect(0,0,256,256);
 g.fillStyle='#2c1d16';g.fillRect(0,0,256,12);g.fillRect(0,244,256,12);g.fillStyle='#7d1a16';g.fillRect(0,12,256,7);g.fillStyle='#6b1412';g.fillRect(0,0,8,256);g.fillRect(248,0,8,256);
 for(let i=0;i<3;i++){const x=16+i*80,y=46,w=62,h=150,lit=((seed+i*3)%5)>1;g.fillStyle='#0d0a09';g.fillRect(x,y,w,h);if(lit){const gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'#ffcf7a');gr.addColorStop(1,'#d5702a');g.fillStyle=gr;g.fillRect(x,y,w,h);e.fillStyle=gr;e.fillRect(x,y,w,h)}
  g.strokeStyle='#1d130e';g.lineWidth=3;for(let k=1;k<4;k++){g.beginPath();g.moveTo(x+k*w/4,y);g.lineTo(x+k*w/4,y+h);g.stroke()}for(let k=1;k<6;k++){g.beginPath();g.moveTo(x,y+k*h/6);g.lineTo(x+w,y+k*h/6);g.stroke()}g.strokeStyle='#4a2a1c';g.lineWidth=5;g.strokeRect(x,y,w,h)}
 const t=c=>{const x=new THREE.CanvasTexture(c);x.wrapS=x.wrapT=THREE.RepeatWrapping;x.colorSpace=THREE.SRGBColorSpace;x.anisotropy=4;return x};return[t(a),t(b)]}
const FT=[0,1,2,3,4,5].map(facTex);
function facMat(v,rx,ry){const[m,e]=FT[v%6],m2=m.clone(),e2=e.clone();[m2,e2].forEach(t=>{t.repeat.set(rx,ry);t.needsUpdate=true});return new THREE.MeshStandardMaterial({map:m2,emissiveMap:e2,emissive:0xffffff,emissiveIntensity:1.1,roughness:.8})}
/* ---- local frames (front of every building faces local +x) ---- */
const FACE={E:0,W:Math.PI,S:-Math.PI/2,N:Math.PI/2};
function frame(x,z,face){const ry=FACE[face],G=new THREE.Group();G.position.set(x,0,z);G.rotation.y=ry;scene.add(G);const c=Math.round(Math.cos(ry)),s=Math.round(Math.sin(ry));const toW=(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c];return{G,toW,ry,cl:(x0,x1,z0,z1)=>{const a=toW(x0,z0),b=toW(x1,z1);col(a[0],b[0],a[1],b[1])},mp:(x0,x1,z0,z1,cc)=>{const a=toW(x0,z0),b=toW(x1,z1);MAP.push([Math.min(a[0],b[0]),Math.max(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[1],b[1]),cc])}}}
function roofIn(g,w,d,h,rl,lift,y,over,ry){w+=over*2;d+=over*2;const E=10,Rg=8,pos=[],uv=[],idx=[],rg=new THREE.Group();rg.position.y=y;rg.rotation.y=ry;g.add(rg);
 for(let k=0;k<=Rg;k++){const t=k/Rg,hw=w/2+(rl/2-w/2)*t,hd=Math.max(d/2*(1-t),.001),cs=[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]];for(let e=0;e<4;e++)for(let i=0;i<E;i++){const u=i/E,a=cs[e],b=cs[(e+1)%4],px=a[0]+(b[0]-a[0])*u,pz=a[1]+(b[1]-a[1])*u,c=Math.pow(Math.abs(2*u-1),3),fl=(1-t)*(1-t);pos.push(px+(Math.sign(px)||0)*fl*.5*(e%2?0:c),h*Math.pow(t,1.55)+lift*fl*(e%2?.35:1)*c,pz+(Math.sign(pz)||0)*fl*.5*(e%2?c:0));uv.push((e*E+i)/(4*E)*6,t*4)}}
 const P=4*E;for(let k=0;k<Rg;k++)for(let i=0;i<P;i++){const a=k*P+i,b=k*P+(i+1)%P,c=(k+1)*P+i,e=(k+1)*P+(i+1)%P;idx.push(a,c,b,b,c,e)}
 const gm=new THREE.BufferGeometry();gm.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));gm.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));gm.setIndex(idx);gm.computeVertexNormals();const m=new THREE.Mesh(gm,M.roof);m.castShadow=true;rg.add(m);
 box(rl+.6,.3,.5,M.dark,0,h-.1,0,rg);box(.5,.9,.6,M.dark,-rl/2-.3,h,0,rg);box(.5,.9,.6,M.dark,rl/2+.3,h,0,rg)}
/* ---- town house (solid, decorative) ---- */
let vi=0;
function bldg(x,z,sx,sz,fl,face){const F=frame(x,z,face),H=fl*4.2,fm=facMat(vi++,Math.max(1,Math.round(sz/9)),fl);
 const m=new THREE.Mesh(new THREE.BoxGeometry(sx,H,sz),[fm,M.timber,M.timber,M.timber,M.timber,M.timber]);m.position.y=H/2;m.castShadow=true;m.receiveShadow=true;F.G.add(m);
 for(let f=1;f<=fl;f++){const y=f*4.2;box(sx+1.5,.3,sz+1.5,M.dark,0,y-.15,0,F.G,false);if(f<fl||1){box(.1,.95,sz*.92,M.vermil,sx/2+.7,y+.02,0,F.G,false);for(let k=-1;k<=1;k++){const p=F.toW(sx/2+.9,k*sz/3);lant(p[0],y-1,p[1])}}}
 roofIn(F.G,sz,sx,2.3+rnd()*.7,sz*.5,1.1,H,1.3,Math.PI/2);F.cl(-sx/2,sx/2,-sz/2,sz/2);F.mp(-sx/2,sx/2,-sz/2,sz/2,'#5b4636')}
/* ---- carved plaque ---- */
function plaque(G,t,sb,x,y,z,ry,w){const c=document.createElement('canvas');c.width=1024;c.height=320;const g=c.getContext('2d');
 const gr=g.createLinearGradient(0,0,0,320);gr.addColorStop(0,'#2a1a12');gr.addColorStop(1,'#140b08');g.fillStyle=gr;g.fillRect(0,0,1024,320);for(let i=0;i<90;i++){g.fillStyle=`rgba(0,0,0,${.18*rnd()})`;g.fillRect(rnd()*1024,0,1+rnd()*2,320)}
 g.strokeStyle='#b8923f';g.lineWidth=5;g.strokeRect(10,10,1004,300);g.lineWidth=1.5;g.strokeRect(22,22,980,276);
 g.lineWidth=2.2;g.strokeStyle='#8a6a2c';for(let x0=34;x0<980;x0+=26){for(const y0 of[30,266]){g.beginPath();g.moveTo(x0,y0+18);g.lineTo(x0,y0);g.lineTo(x0+20,y0);g.lineTo(x0+20,y0+12);g.lineTo(x0+8,y0+12);g.lineTo(x0+8,y0+6);g.lineTo(x0+14,y0+6);g.stroke()}}
 g.strokeStyle='#c8a55a';g.lineWidth=3;for(const[px,py,sx_,sy_]of[[40,56,1,1],[984,56,-1,1],[40,264,1,-1],[984,264,-1,-1]]){g.beginPath();g.moveTo(px,py);g.quadraticCurveTo(px+34*sx_,py,px+34*sx_,py+30*sy_);g.quadraticCurveTo(px+34*sx_,py+10*sy_,px+14*sx_,py+10*sy_);g.stroke()}
 g.textAlign='center';let fs=104;g.font=`600 ${fs}px Georgia,'Times New Roman',serif`;while(g.measureText(t).width>880&&fs>40){fs-=4;g.font=`600 ${fs}px Georgia,serif`}
 g.fillStyle='rgba(0,0,0,.85)';g.fillText(t,514,176);g.fillStyle='#5a4220';g.fillText(t,511,171);const tg=g.createLinearGradient(0,100,0,190);tg.addColorStop(0,'#f1d38a');tg.addColorStop(1,'#a8802f');g.fillStyle=tg;g.fillText(t,512,174);
 g.font='italic 36px Georgia,serif';g.fillStyle='#c8a55a';g.fillText(sb,512,244);
 const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=8;const P=new THREE.Group();P.position.set(x,y,z);P.rotation.y=ry;const pl=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.3125),new THREE.MeshStandardMaterial({map:tx,emissiveMap:tx,emissive:0xffffff,emissiveIntensity:.55,roughness:.7}));pl.position.z=.09;const fr=new THREE.Mesh(new THREE.BoxGeometry(w+.25,w*.3125+.25,.14),M.vermil);P.add(fr,pl);G.add(P)}
/* ---- interior props ---- */
function carpetTex(c1,c2){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle=c1;g.fillRect(0,0,256,256);g.strokeStyle=c2;g.lineWidth=8;g.strokeRect(14,14,228,228);g.lineWidth=3;g.strokeRect(30,30,196,196);g.beginPath();g.arc(128,128,54,0,7);g.stroke();for(let i=0;i<8;i++){g.beginPath();g.ellipse(128+Math.cos(i*.785)*34,128+Math.sin(i*.785)*34,16,6,i*.785,0,7);g.stroke()}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function carpet(G,x,z,w,d,c1,c2){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({map:carpetTex(c1,c2),roughness:.95}));m.rotation.x=-Math.PI/2;m.position.set(x,.09,z);m.receiveShadow=true;G.add(m)}
function candelabra(F,x,z){const G=F.G;cyl(.05,1.3,M.brass,x,0,z,G,8);cyl(.16,.06,M.brass,x,0,z,G,10);for(let i=0;i<5;i++){const a=i*1.256,px=x+Math.cos(a)*.22,pz=z+Math.sin(a)*.22;cyl(.025,.2,M.paper,px,1.3,pz,G,6);const f=new THREE.Mesh(new THREE.SphereGeometry(.03,6,5),M.lamp);f.position.set(px,1.55,pz);G.add(f);const w=F.toW(px,pz);GL.push([w[0],1.55,w[1]])}}
function censer(G,x,z){cyl(.3,.34,M.brass,x,.2,z,G,12);cyl(.2,.2,M.brass,x,.54,z,G,12);for(const a of[0,2.1,4.2])cyl(.04,.22,M.brass,x+Math.cos(a)*.22,0,z+Math.sin(a)*.22,G,5)}
function drape(G,x,y,z,ry,w,h,m){const g=new THREE.PlaneGeometry(w,h,10,1),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*9)*.07);g.computeVertexNormals();const d=new THREE.Mesh(g,m);d.position.set(x,y,z);d.rotation.y=ry;G.add(d)}
function hang(F,lx,y,lz){const p=F.toW(lx,lz);lant(p[0],y,p[1]);cyl(.012,1.2,M.dark,lx,y,lz,F.G,4)}
function lectern(F,lx,lz){const G=F.G;box(.95,1,.58,M.wood,lx,0,lz,G);const b=box(.82,.05,.55,M.paper,lx-.05,1.02,lz,G,false);b.rotation.z=.42;const l=new THREE.PointLight(0xffd29a,5,5,2);l.position.set(lx,1.7,lz);G.add(l);F.cl(lx-.7,lx+.7,lz-.8,lz+.8);return F.toW(lx,lz)}
/* ---- enterable room: hollow ground floor, door leaves, carved plaque, themed interior ---- */
const ZN=[];
function room(o){const{x,z,sx,sz,face,fl=2,id,name,sub,theme}=o,F=frame(x,z,face),G=F.G,H=4.2,hx=sx/2,hz=sz/2,wm=M.timber;
 const wall=(x0,z0,x1,z1)=>{const w=Math.abs(x1-x0)||.5,d=Math.abs(z1-z0)||.5;box(w,H,d,wm,(x0+x1)/2,0,(z0+z1)/2,G);F.cl(Math.min(x0,x1)-(w==.5?.25:0),Math.max(x0,x1)+(w==.5?.25:0),Math.min(z0,z1)-(d==.5?.25:0),Math.max(z0,z1)+(d==.5?.25:0))};
 wall(-hx,-hz,-hx,hz);wall(-hx,-hz,hx,-hz);wall(-hx,hz,hx,hz);wall(hx,-hz,hx,-1.6);wall(hx,1.6,hx,hz);
 for(const zz of[-hz,hz,-1.6,1.6])cyl(.3,H,M.pillar,hx,0,zz,G,10);box(.6,.5,3.8,M.vermil,hx,H-.5,0,G);
 const fm=facMat(vi++,Math.max(1,Math.round(sz/9)),fl-1),up=new THREE.Mesh(new THREE.BoxGeometry(sx,(fl-1)*H,sz),[fm,wm,wm,wm,wm,wm]);up.position.y=H+(fl-1)*H/2;G.add(up);
 box(sx,.3,sz,M.wood,0,H-.15,0,G,false);box(sx,.12,sz,M.floor,0,0,0,G,false);for(let f=1;f<=fl;f++)box(sx+1.6,.3,sz+1.6,M.dark,0,f*H-.15,0,G,false);
 roofIn(G,sz,sx,3,sz*.5,1.2,fl*H,1.5,Math.PI/2);
 for(const s of[-1,1]){const lf=new THREE.Group();lf.position.set(hx,0,s*1.6);G.add(lf);box(.14,3.4,1.5,M.vermil,0,0,-s*.75,lf);F.cl(0,0,0,0);doors.push({g:lf,ax:F.toW(hx,0)[0],az:F.toW(hx,0)[1],open:0,sign:s,rot:1,room:1})}
 plaque(G,name,sub,hx+.14,H+.55,0,Math.PI/2,4.6);F.mp(-hx,hx,-hz,hz,'#7a2a22');
 hang(F,hx-.6,H-.6,-2.2);hang(F,hx-.6,H-.6,2.2);
 const col_={amber:0xffb870,jade:0xbfe4e8,vermil:0xff7352,gold:0xffcb8a,warm:0xff9a6a}[theme]||0xffc888;const pl=new THREE.PointLight(col_,26,15,2);pl.position.set(0,3,0);G.add(pl);lights.push([pl,26]);
 const L=F.toW(0,0);let lw;
 if(theme=='amber'){carpet(G,0,0,sx*.7,sz*.7,'#3a1a14','#c29a4a');const idxs=[0,3,6,10,14,18,22,26];const gl=window.GALLERY||[];idxs.forEach((n,i)=>{const gi=gl[n%Math.max(1,gl.length)];if(!gi)return;const lz=-hz+1.2+i%4*((sz-2.4)/3),side=i<4?-1:1;const tx=new THREE.TextureLoader().load('assets/gallery/thumb/'+gi.f+'.webp');tx.colorSpace=THREE.SRGBColorSpace;const k=gi.w/gi.h,ph=1.9;const pw=ph*k;const fr=box(pw+.2,ph+.2,.08,M.gold,side<0?-hx+.3:-hx+.3,1.5,lz,G,false);const m=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),new THREE.MeshStandardMaterial({map:tx,emissiveMap:tx,emissive:0xffffff,emissiveIntensity:.35}));m.position.set(-hx+.35,1.5+ph/2,lz);m.rotation.y=Math.PI/2;fr.position.y=1.5+ph/2;G.add(m);if(i>3){fr.position.set(-hx+.3,1.5+ph/2,lz)}});
  box(2.4,.5,1,M.wood,-1,0,-2,G);lw=lectern(F,1.6,2.8);candelabra(F,-2.6,3.6)}
 if(theme=='jade'){carpet(G,0,0,sx*.6,sz*.6,'#14282b','#bfa86a');for(let i=0;i<3;i++){box(.6,3.2,sz*.7,M.wood,-hx+.5,0,0,G);}for(let r=0;r<4;r++)for(let k=0;k<7;k++)cyl(.06,.9,M.paper,-hx+.9,.25+r*.75,-3.4+k*1.1,G,6).rotation.x=Math.PI/2;box(2.8,.9,1.2,M.wood,-.5,0,-2.5,G);F.cl(-1.9,.9,-3.1,-1.9);lw=lectern(F,1.8,2.6);drape(G,-hx+.3,2.4,3.4,Math.PI/2,2.4,3.4,M.teal);hang(F,0,3.4,0)}
 if(theme=='vermil'){carpet(G,0,0,sx*.7,sz*.7,'#4a0f12','#d0a24c');box(3.4,.85,1.4,M.wood,-.8,0,0,G);box(2.6,.04,1,M.paper,-.8,.85,0,G,false);F.cl(-2.6,1,-.8,.8);candelabra(F,-3.4,-2.6);candelabra(F,-3.4,2.6);drape(G,-hx+.3,2.4,-3,Math.PI/2,2.6,3.4,M.cloth);drape(G,-hx+.3,2.4,3,Math.PI/2,2.6,3.4,M.cloth);lw=lectern(F,2,3);censer(G,-3.2,0)}
 if(theme=='gold'){carpet(G,0,0,sx*.75,sz*.75,'#2c1a12','#c29a4a');box(7,.8,1.5,M.wood,-1,0,0,G);F.cl(-4.5,2.5,-.8,.8);for(let k=-3;k<=3;k++){box(.5,.5,.5,M.timber,-1+k*1,0,-1.5,G,false);box(.5,.5,.5,M.timber,-1+k*1,0,1.5,G,false)}candelabra(F,-hx+1,-hz+1);candelabra(F,-hx+1,hz-1);drape(G,-hx+.3,2.4,0,Math.PI/2,5,3.4,M.cloth);lw=lectern(F,2.6,3.2)}
 if(theme=='warm'){carpet(G,.6,0,sx*.8,sz*.7,'#e8d6b8','#9c2f1f');box(3.6,.6,3,M.wood,-hx+2.2,0,-hz+2.4,G);box(3.4,.3,2.8,M.vermil,-hx+2.2,.6,-hz+2.4,G,false);for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]])cyl(.07,2.6,M.vermil,-hx+2.2+a*1.7,0,-hz+2.4+b*1.4,G,6);drape(G,-hx+2.2,2.2,-hz+3.9,0,3.4,2.6,M.cloth);F.cl(-hx+.4,-hx+4,-hz+.8,-hz+4);censer(G,-.4,.2);candelabra(F,-2.4,3.8);candelabra(F,2,-3.8);lw=lectern(F,2.6,2.8)}
 ZN.push({id,x:lw[0],z:lw[1],r:2.6,l:name,tp:F.toW(hx+3.4,0)})}
/* ---- street layout ---- */
const RM=[{x:-11,z:30,face:'E',id:'garden',name:"The Artisan's Court",sub:'Creative work',theme:'amber'},{x:-11,z:8,face:'E',id:'scholar',name:"The Scholar's Pavilion",sub:'Technical & analytical profile',theme:'jade'},{x:11,z:30,face:'W',id:'passport',name:"The Strategist's Chamber",sub:'Product & technology',theme:'vermil'},{x:11,z:8,face:'W',id:'records',name:'The Council Hall',sub:'Business, strategy & operations',theme:'gold'}];
RM.forEach(r=>room({...r,sx:10,sz:11,fl:2}));
for(const sd of[-1,1]){let zc=52;while(zc>-8){const hit=RM.find(r=>Math.sign(r.x)==sd&&Math.abs(zc-r.z)<11);if(hit){zc=hit.z-11.5;continue}const len=8+Math.floor(rnd()*3);if(zc-len<-9)break;bldg(sd*11,zc-len/2,10,len,2+Math.floor(rnd()*3),sd<0?'E':'W');zc-=len+(rnd()<.25?4:0)}}
for(const sd of[-1,1])for(let zz=50;zz>-10;zz-=14)bldg(sd*25,zz,12,13,4+Math.floor(rnd()*3),sd<0?'E':'W');
/* lantern strings across the street */
for(let zz=52;zz>-6;zz-=4.5){const pts=[];for(let k=0;k<=6;k++){const x=-6+k*2,y=8.6-1.5*Math.sin(Math.PI*k/6);pts.push(new THREE.Vector3(x,y,zz));if(k>0&&k<6)lant(x,y-.55,zz)}scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x2a1d16})))}
/* ---- entrance gate & plaza ---- */
for(const sx of[-1,1]){cyl(.7,9,M.pillar,sx*5.4,0,58,scene,12);cyl(.9,.5,M.stone,sx*5.4,0,58,scene,12);col(sx*5.4-.9,sx*5.4+.9,57.1,58.9);wallSeg(sx*6.3,58,sx*22,58,3.6,M.timber,.8,0,true);wallSeg(sx*22,58,sx*22,44,3.6,M.timber,.8,0,true)}
box(13,.8,1.2,M.dark,0,8.4,58);box(11,.5,1,M.vermil,0,7.4,58);{const g=new THREE.Group();g.position.set(0,0,58);scene.add(g);roofIn(g,12,3.4,3.4,7,1.5,9.1,1.9,0)}
plaque(scene,'AFTER HOURS','Dharshini Hemachandran · portfolio',0,5.6,58.45,0,5.4);lant(-3.5,7,59);lant(3.5,7,59);lant(-9,5,57);lant(9,5,57);
for(const s of[-1,1]){const lf=new THREE.Group();lf.position.set(s*4.6,0,58.2);scene.add(lf);box(2.3,5.2,.2,M.vermil,-s*1.15,0,0,lf);doors.push({g:lf,ax:0,az:58,open:0,sign:s,rot:0})}
/* ---- canal with arched bridge ---- */
const water=new THREE.Mesh(new THREE.PlaneGeometry(150,6.6),new THREE.MeshStandardMaterial({color:0x0f2a33,roughness:.08,metalness:.55,transparent:true,opacity:.95,emissive:0x07161b}));water.rotation.x=-Math.PI/2;water.position.set(0,.1,-14);scene.add(water);
for(const zz of[-10.7,-17.3])for(const sd of[-1,1])box(71.4,.7,.6,M.stone,sd*39.3,0,zz,scene)
const bh=zv=>1.5*Math.sin(Math.PI*clamp((zv+17.6)/7.2,0,1));
for(let i=0;i<9;i++){const zv=-17.6+i*.8+.4,y=bh(zv),sl=Math.atan2(bh(zv+.4)-bh(zv-.4),.8);const b=box(7,.3,.85,M.stone,0,y-.3,zv);b.rotation.x=-sl;for(const sx of[-3.3,3.3]){box(.16,.9,.5,M.vermil,sx,y,zv);const r=box(.12,.1,.9,M.vermil,sx,y+.85,zv);r.rotation.x=-sl}}
box(7.2,2.2,.5,M.stone,0,-.2,-17.5,scene,false);box(7.2,2.2,.5,M.stone,0,-.2,-10.5,scene,false);
const fl=new THREE.InstancedMesh(new THREE.BoxGeometry(.5,.5,.5),new THREE.MeshStandardMaterial({color:0xffc27a,emissive:0xff9a3c,emissiveIntensity:1.6}),46),dm=new THREE.Object3D(),fpos=[];
for(let i=0;i<46;i++){const x=-40+rnd()*80,zz=-16.3+rnd()*4.4;if(Math.abs(x)<3.6){i--;continue}fpos.push([x,zz,rnd()*6]);GL.push([x,.45,zz])}scene.add(fl);
/* ---- courtyard, lotus ponds, central manor ---- */
for(const sx of[-1,1]){wallSeg(sx*34,-17,sx*34,-58,4,M.timber,.8,0,true);wallSeg(sx*34,-17,sx*9,-17.6,1.6,M.timber,.6,0,false)}
const ponds=[[13,-25,10,9],[-13,-25,10,9]];const lot=new THREE.InstancedMesh(new THREE.CircleGeometry(.55,10),M.lotus,40),pk=new THREE.InstancedMesh(new THREE.ConeGeometry(.22,.4,7),M.pink,16);let li_=0,pi_=0;
for(const[px,pz,pw,pd]of ponds){const pm=new THREE.Mesh(new THREE.PlaneGeometry(pw,pd),M.water);pm.rotation.x=-Math.PI/2;pm.position.set(px,.1,pz);scene.add(pm);for(const[ox,oz,w,d]of[[0,-pd/2,pw+1,.8],[0,pd/2,pw+1,.8],[-pw/2,0,.8,pd],[pw/2,0,.8,pd]])box(w,.5,d,M.stone,px+ox,0,pz+oz,scene,false);
 for(let i=0;i<20&&li_<40;i++){dm.position.set(px+(rnd()-.5)*(pw-2),.14,pz+(rnd()-.5)*(pd-2));dm.rotation.set(-Math.PI/2,0,rnd()*6);dm.scale.setScalar(.7+rnd()*.7);dm.updateMatrix();lot.setMatrixAt(li_++,dm.matrix)}for(let i=0;i<8&&pi_<16;i++){dm.position.set(px+(rnd()-.5)*(pw-2),.33,pz+(rnd()-.5)*(pd-2));dm.rotation.set(0,0,0);dm.scale.setScalar(1);dm.updateMatrix();pk.setMatrixAt(pi_++,dm.matrix);GL.push([dm.position.x,.5,dm.position.z])}MAP.push([px-pw/2,px+pw/2,pz-pd/2,pz+pd/2,'#7f9ea6'])}
scene.add(lot,pk);
for(let zz=-20;zz>-34;zz-=5)for(const sx of[-5.5,5.5]){const g=new THREE.Group();g.position.set(sx,0,zz);scene.add(g);box(.8,.3,.8,M.stone,0,0,0,g);cyl(.16,1,M.stone,0,.3,0,g,8);box(.6,.5,.6,M.lamp,0,1.3,0,g,false);box(1,.18,1,M.stone,0,1.8,0,g);col(sx-.5,sx+.5,zz-.5,zz+.5);GL.push([sx,1.5,zz])}
// manor: hollow ground hall + five tiers
col(17,19.6,-59.5,-34.9);col(-19.6,-17,-59.5,-34.9);const MZ=-47,MH=.8;box(38,MH,24,M.stone,0,0,MZ,scene);MAP.push([-19,19,-59,-35,'#7a2a22']);
const mw=(x0,z0,x1,z1)=>{const w=Math.abs(x1-x0)||.6,d=Math.abs(z1-z0)||.6;box(w,5,d,M.timber,(x0+x1)/2,MH,(z0+z1)/2,scene);col(Math.min(x0,x1)-(w==.6?.3:0),Math.max(x0,x1)+(w==.6?.3:0),Math.min(z0,z1)-(d==.6?.3:0),Math.max(z0,z1)+(d==.6?.3:0))};
mw(-17,-35,-4.6,-35);mw(4.6,-35,17,-35);mw(-17,-59,17,-59);mw(-17,-59,-17,-35);mw(17,-59,17,-35);
for(const x of[-4.6,4.6,-10,10,-16,16])cyl(.45,5.2,M.pillar,x,MH,-35,scene,12);box(10.6,.6,.7,M.vermil,0,MH+4.4,-35,scene);
box(36,.4,24,M.wood,0,MH+5,MZ,scene,false);box(34,.14,22,M.floor,0,MH,MZ,scene,false);
for(let i=0;i<5;i++)box(9,.16*(i+1),1.2,M.cloth,0,0,-30-i*1.0+.5-.0,scene);
const tw=[[30,18],[24,14],[18,11],[12,8]];let ty=MH+5.2;const tierRoof=(w,d,y)=>{const g=new THREE.Group();g.position.set(0,0,MZ);scene.add(g);roofIn(g,w,d,2.6,w*.55,1.4,y,2.2,0)};
tierRoof(36,24,ty);ty+=2.6+.2;
tw.forEach(([w,d],i)=>{const fm=facMat(vi++,Math.max(2,Math.round(w/8)),1),m=new THREE.Mesh(new THREE.BoxGeometry(w,4.4,d),[M.timber,M.timber,M.timber,M.timber,fm,M.timber]);m.position.set(0,ty+2.2,MZ);m.castShadow=true;scene.add(m);
 box(w+1.4,.3,d+1.4,M.dark,0,ty-.1,MZ,scene,false);box(w*.92,.1,.1,M.vermil,0,ty+.9,MZ+d/2+.6,scene,false);for(let k=-2;k<=2;k++)lant(k*w*.2,ty+.4,MZ+d/2+.7);tierRoof(w+2,d+2,ty+4.4);ty+=4.4+2.6+.2});
cyl(.25,3,M.gold,0,ty-.6,MZ,scene,8);const fin=new THREE.Mesh(new THREE.SphereGeometry(.6,10,8),M.gold);fin.position.set(0,ty+2.7,MZ);scene.add(fin);
const wheel=new THREE.Group();wheel.position.set(20.5,4.4,-50);scene.add(wheel);const wr=new THREE.Mesh(new THREE.TorusGeometry(4,.25,6,28),M.timber);wr.rotation.y=Math.PI/2;wheel.add(wr);for(let i=0;i<8;i++){const sp=box(.2,8,.2,M.timber,0,-4,0,wheel,false);sp.rotation.x=i*Math.PI/8;sp.position.y=0}
// central archive interior (Visibility Trap)
{const F=frame(0,MZ,'S'),G=F.G;carpet(scene,0,-45,9,22,'#4a0f12','#d0a24c');carpet(scene,-0.001,-45,9.01,22,'#4a0f12','#d0a24c');for(const x of[-9,9])for(const z of[-41,-47,-53])cyl(.4,5.2,M.pillar,x,MH,z,scene,10),col(x-.45,x+.45,z-.45,z+.45);
 for(const x of[-5,5])for(const z of[-40,-52]){const g2=new THREE.Group();g2.position.set(x,MH,z);scene.add(g2);const F2={G:g2,toW:(a,b)=>[x+a,z+b]};candelabra(F2,0,0)}
 for(const[x,z]of[[-8,-37],[8,-37],[-8,-56],[8,-56],[0,-36],[0,-56]]){lant(x,5.2,z);cyl(.012,1.2,M.dark,x,5,z,scene,4)}
 for(const s of[-1,1]){for(let k=0;k<3;k++)drape(scene,s*16.6,3.4,-40-k*6,-s*Math.PI/2,3.4,4.2,M.cloth)}box(7,1.1,1.4,M.wood,0,MH,-55,scene);censer(scene,0,-52);col(-3.6,3.6,-55.8,-54.2);
 const lw=[0,-45];box(.95,1,.58,M.wood,0,MH,-44,scene);const pb=box(.82,.05,.55,M.paper,0,MH+1.02,-44,scene,false);pb.rotation.x=-.42;col(-.6,.6,-44.6,-43.4);const pl=new THREE.PointLight(0xff5a3a,60,28,2);pl.position.set(0,4,-45);scene.add(pl);lights.push([pl,60]);const pl2=new THREE.PointLight(0xffc27a,24,20,2);pl2.position.set(0,3.4,-40);scene.add(pl2);lights.push([pl2,24]);
 plaque(scene,'THE CENTRAL ARCHIVE','Research & systems',0,MH+4.4+.9,-34.55,0,6.8);ZN.push({id:'visibility',x:0,z:-43.2,r:3,l:'The Central Archive',tp:[0,-30]})}
// inner residence + exit gate
room({x:28,z:-26,sx:10,sz:11,face:'W',fl:2,id:'inner',name:'The Inner Residence',sub:'About',theme:'warm'});
{const gx=-27,gz=-26;for(const s of[-1,1]){cyl(.45,5.4,M.pillar,gx,0,gz+s*3,scene,10);col(gx-.5,gx+.5,gz+s*3-.5,gz+s*3+.5)}box(1.2,.5,7,M.vermil,gx,5.4,gz,scene);box(.9,.4,6.6,M.dark,gx,5.9,gz,scene);{const g=new THREE.Group();g.position.set(gx,0,gz);scene.add(g);roofIn(g,3.4,7.6,2,3.6,1.1,6.3,1.4,0)}plaque(scene,'THE EXIT GATE','Contact & resume',gx+.7,5.6,gz,Math.PI/2,4.2);lant(gx+.4,4.4,gz-2);lant(gx+.4,4.4,gz+2);MAP.push([gx-1,gx+1,gz-4,gz+4,'#7a2a22']);
 const G=new THREE.Group();G.position.set(gx+3,0,gz);scene.add(G);box(.58,1,.95,M.wood,0,0,0,G);const pb=box(.55,.05,.82,M.paper,0,1.02,0,G,false);pb.rotation.x=.42;col(gx+2.4,gx+3.6,gz-.8,gz+.8);const l=new THREE.PointLight(0xffd29a,8,7,2);l.position.set(gx+3,1.8,gz);scene.add(l);ZN.push({id:'celestial',x:gx+3,z:gz,r:3,l:'The Exit Gate',tp:[gx+8,gz]})}
ZN.push({id:'domain',x:0,z:50,r:3.2,l:'The Index',tp:[0,66]});
{const g=new THREE.Group();g.position.set(0,0,52);scene.add(g);box(1.4,1.1,.7,M.wood,0,0,0,g);const pb=box(1.2,.05,.6,M.paper,0,1.12,0,g,false);pb.rotation.x=-.42;col(-.8,.8,51.6,52.4)}
/* ---- karst mountains, mist, glow ---- */
for(let i=0;i<34;i++){const a=(i/34)*Math.PI*1.15-Math.PI*.08,r=170+rnd()*140,h=90+rnd()*150,rb=14+rnd()*22,geo=new THREE.CylinderGeometry(rb*.12,rb,h,7,5,true),p=geo.attributes.position;for(let k=0;k<p.count;k++){const n=(rnd()-.5)*rb*.35;p.setX(k,p.getX(k)+n);p.setZ(k,p.getZ(k)+(rnd()-.5)*rb*.35)}geo.computeVertexNormals();const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:new THREE.Color().setHSL(.5,.22,.1+.07*rnd()),flatShading:true}));m.position.set(Math.cos(a)*r*1.3-0,h/2-8,-60-Math.sin(a)*r);scene.add(m)}
const spr=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
function pts(arr,sz,color,op,add){const a=new Float32Array(arr.length*3);arr.forEach((p,i)=>{a[i*3]=p[0];a[i*3+1]=p[1];a[i*3+2]=p[2]});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));const p=new THREE.Points(g,new THREE.PointsMaterial({size:sz,map:spr,color,transparent:true,opacity:op,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending}));p.frustumCulled=false;scene.add(p);return p}
const lanI=new THREE.InstancedMesh(new THREE.SphereGeometry(.34,10,8),new THREE.MeshStandardMaterial({color:0xb3261e,emissive:0xff3a22,emissiveIntensity:1.35}),LAN.length);LAN.forEach((p,i)=>{dm.position.set(...p);dm.rotation.set(0,0,0);dm.scale.set(1,1.25,1);dm.updateMatrix();lanI.setMatrixAt(i,dm.matrix)});scene.add(lanI);
pts([...LAN,...GL],2.6,0xff8a3a,.75,true);
const mistR=[];for(let i=0;i<150;i++)mistR.push([(rnd()-.5)*130,.5+rnd()*3,-60+rnd()*130]);const mist=pts(mistR,16,0x9a6a66,.12,false);
const petR=[];for(let i=0;i<220;i++)petR.push([(rnd()-.5)*50,rnd()*12,-40+rnd()*100]);const petals=pts(petR,.2,0xe8a0a8,.85,false);
const Z=ZN;

const clk=new THREE.Clock();
/* ================= avatar ================= */
const st=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.6,...o}),AM={skin:st(0xe6c8b2),ink:st(0x2a2230),wine:st(0x7a1426),crim:st(0xb01c32),silv:st(0xc9ccd6,{metalness:.8,roughness:.3}),hair:st(0x0a0910,{roughness:.35})};
const av=new THREE.Group(),F=new THREE.Group();av.add(F);av.scale.setScalar(.92);scene.add(av);
const mk=(geo,m,x,y,z,p=F)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;p.add(o);return o};
const legs=[-1,1].map(sx=>{const h=new THREE.Group();h.position.set(sx*.1,.88,0);F.add(h);mk(new THREE.CylinderGeometry(.06,.05,.82,8),AM.ink,0,-.42,0,h);mk(new THREE.BoxGeometry(.11,.08,.2),AM.ink,0,-.86,.04,h);return h});
mk(new THREE.CylinderGeometry(.27,.52,.82,18,1,true),new THREE.MeshStandardMaterial({color:0x2a2230,roughness:.6,side:THREE.DoubleSide}),0,.56,0);
mk(new THREE.CylinderGeometry(.285,.5,.12,18,1,true),new THREE.MeshStandardMaterial({color:0x7a1426,side:THREE.DoubleSide}),0,.2,0);mk(new THREE.TorusGeometry(.5,.03,6,20),AM.crim,0,.16,0).rotation.x=Math.PI/2;
mk(new THREE.CylinderGeometry(.15,.21,.52,12),AM.ink,0,1.13,0);mk(new THREE.BoxGeometry(.12,.52,.2),AM.crim,.07,1.13,.03).rotation.z=-.35;
mk(new THREE.TorusGeometry(.2,.035,6,16),AM.wine,0,.93,0).rotation.x=Math.PI/2;mk(new THREE.TorusGeometry(.17,.012,5,14),AM.silv,0,1.3,0).rotation.x=Math.PI/2;
const arms=[-1,1].map(sx=>{const a=new THREE.Group();a.position.set(sx*.22,1.34,0);F.add(a);const sl=mk(new THREE.ConeGeometry(.2,.7,12,1,true),new THREE.MeshStandardMaterial({color:0x2a2230,side:THREE.DoubleSide}),sx*.03,-.35,0,a);sl.rotation.z=sx*.12;mk(new THREE.TorusGeometry(.2,.025,5,14),AM.crim,sx*.075,-.69,0,a).rotation.x=Math.PI/2;mk(new THREE.SphereGeometry(.045,8,6),AM.skin,sx*.07,-.72,0,a);mk(new THREE.CylinderGeometry(.052,.052,.07,8),AM.silv,sx*.065,-.6,0,a);a.sl=sl;return a});
const head=new THREE.Group();head.position.y=1.58;F.add(head);mk(new THREE.SphereGeometry(.115,16,12),AM.skin,0,0,0,head).scale.y=1.1;mk(new THREE.CylinderGeometry(.04,.045,.1,8),AM.skin,0,-.13,0,head);
mk(new THREE.SphereGeometry(.125,16,12,0,6.3,0,1.75),AM.hair,0,.015,-.012,head);const ep=mk(new THREE.SphereGeometry(.036,10,8),AM.ink,-.045,.012,.102,head);ep.scale.set(1.25,1,.45);mk(new THREE.TorusGeometry(.118,.007,5,20),AM.crim,0,.02,0,head).rotation.x=Math.PI/2-.12;mk(new THREE.SphereGeometry(.012,6,5),AM.ink,.045,.012,.108,head);
mk(new THREE.ConeGeometry(.03,.09,6),AM.silv,0,.14,-.04,head);mk(new THREE.SphereGeometry(.026,6,5),AM.crim,0,.12,-.07,head);
const hair=[];let hp=new THREE.Group();hp.position.set(0,.1,-.1);head.add(hp);for(let i=0;i<7;i++){const seg=new THREE.Group();seg.position.y=i?-.2:0;hp.add(seg);mk(new THREE.CylinderGeometry(.04-i*.003,.037-i*.003,.21,7),AM.hair,0,-.1,0,seg);if(i==2)mk(new THREE.TorusGeometry(.04,.01,5,10),AM.crim,0,-.02,0,seg).rotation.x=Math.PI/2;hair.push(seg);hp=seg}
const locks=[-1,1].map(sx=>mk(new THREE.BoxGeometry(.018,.42,.03),AM.hair,sx*.11,-.2,.07,head));
/* ================= state & controls ================= */
const P={x:0,z:66,h:Math.PI,vx:0,vz:0,y:0,sp:0},C={yaw:0,pitch:.3,dist:6.4,tx:0,ty:1.5,tz:66,drag:-9,reset:0};let near=null,paused=false,cine=false,run=false,phase=0,turn=0,rb=0;
const insideCol=(x,z)=>{for(const c of cols)if(x>c[0]&&x<c[1]&&z>c[2]&&z<c[3])return true;return false};
const blocked=(x,z)=>{const r=.4;for(const c of cols)if(x>c[0]-r&&x<c[1]+r&&z>c[2]-r&&z<c[3]+r)return true;if(z>-17.3&&z<-10.7&&Math.abs(x)>3.5)return true;if(z>58&&Math.abs(x)>21)return true;if(z>-17&&Math.abs(x)>31)return true;return z>76||z<-62||Math.abs(x)>34};
const gy=(x,z)=>{let y=0;if(Math.abs(x)<3.4&&z>-17.6&&z<-10.4)y=bh(z);if(Math.abs(x)<19&&z<-35)y=.8;else if(Math.abs(x)<4.6&&z<-29&&z>-35)y=.8*clamp((-29-z)/6,0,1);return y};
window.__tp=id=>{const q=Z.find(a=>a.id==id);if(!q)return;P.x=q.tp[0];P.z=q.tp[1];P.vx=P.vz=0;P.h=Math.atan2(q.x-P.x,q.z-P.z);C.yaw=P.h+Math.PI;C.pitch=.28;P.y=gy(P.x,P.z);C.tx=P.x;C.tz=P.z;C.drag=-9};
const intro=$('#intro'),lbEl=$('#lb');let drag=null;
cv.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];cv.setPointerCapture(e.pointerId)});cv.addEventListener('pointermove',e=>{if(!drag||paused)return;C.yaw-=(e.clientX-drag[0])*.005;C.pitch=clamp(C.pitch+(e.clientY-drag[1])*.004,-.05,.95);C.drag=clk.elapsedTime;drag=[e.clientX,e.clientY]});addEventListener('pointerup',()=>drag=null);cv.addEventListener('wheel',e=>{C.dist=clamp(C.dist+e.deltaY*.004,3.5,10)},{passive:true});
const pz=document.createElement('div');pz.id='pz';pz.textContent='PAUSED';document.body.appendChild(pz);
const mapEl=document.createElement('div');mapEl.id='mapov';mapEl.innerHTML='<canvas width="400" height="560"></canvas><p>Map of the city · M to close</p>';document.body.appendChild(mapEl);const mc=mapEl.querySelector('canvas').getContext('2d');
const mapBtn=document.createElement('button');mapBtn.className='chip';mapBtn.textContent='Map';$('.btns').prepend(mapBtn);const toggleMap=()=>mapEl.classList.toggle('open');mapBtn.onclick=toggleMap;
const uiOpen=()=>document.body.classList.contains('ms-open')||lbEl.classList.contains('open')||!intro.classList.contains('gone');
addEventListener('keydown',e=>{if(e.key=='Shift')run=true;if(uiOpen())return;const k=e.key;if(k=='p'||k=='P'){paused=!paused;pz.style.display=paused?'grid':'none'}if(k=='c'||k=='C')cine=!cine;if(k=='m'||k=='M')toggleMap();if((k=='e'||k=='E'||k=='Enter')&&near&&!paused)window.AHUI.open(near.id)});addEventListener('keyup',e=>{if(e.key=='Shift')run=false});
$('#pBtn').onclick=()=>near&&window.AHUI.open(near.id);$('#pA').onclick=()=>near&&window.AHUI.open(near.id);
const gd=$('#guide'),GUIDE='<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows move &nbsp; <kbd>Shift</kbd> run &nbsp; the camera follows you · drag to look &nbsp; <kbd>M</kbd> map &nbsp; <kbd>P</kbd> pause &nbsp; <kbd>C</kbd> cinematic';if(gd)gd.innerHTML=GUIDE;
function size(){ren.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}addEventListener('resize',size);size();document.body.classList.add('gl');
const shortest=(a,b)=>{let d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return d};
function drawMap(){const W=400,H=560,sx=x=>(x+40)/80*W,sz=z=>(z+62)/140*H;mc.fillStyle='#e8dcc1';mc.fillRect(0,0,W,H);mc.fillStyle='#d3c4a2';mc.fillRect(sx(-6),sz(58),sx(6)-sx(-6),sz(-10)-sz(58));mc.fillRect(sx(-34),sz(-17),sx(34)-sx(-34),sz(-60)-sz(-17));mc.fillStyle='#8fa9ae';mc.fillRect(0,sz(-17),W,sz(-11)-sz(-17));mc.strokeStyle='#6b1022';mc.lineWidth=1.5;
 for(const m of MAP){mc.fillStyle=m[4];mc.fillRect(sx(m[0]),sz(m[2]),sx(m[1])-sx(m[0]),sz(m[3])-sz(m[2]));mc.strokeRect(sx(m[0]),sz(m[2]),sx(m[1])-sx(m[0]),sz(m[3])-sz(m[2]))}
 mc.font='600 10.5px Georgia';mc.textAlign='center';for(const q of Z){mc.fillStyle='#6b1022';mc.beginPath();mc.arc(sx(q.x),sz(q.z),4,0,7);mc.fill();mc.fillStyle='#1a1214';mc.fillText(q.l.replace('The ',''),sx(q.x),sz(q.z)-8)}
 mc.save();mc.translate(sx(P.x),sz(P.z));mc.rotate(Math.PI-P.h);mc.beginPath();mc.moveTo(0,-10);mc.lineTo(6,7);mc.lineTo(0,3);mc.lineTo(-6,7);mc.closePath();mc.fillStyle='#a3182c';mc.fill();mc.strokeStyle='#1a1214';mc.stroke();mc.restore()}
/* ================= loop ================= */
const RMo=matchMedia('(prefers-reduced-motion:reduce)').matches,pr=$('#prompt');
function loop(){requestAnimationFrame(loop);const dt=Math.min(.05,clk.getDelta()),t=clk.elapsedTime;
 const active=!paused&&!cine&&!uiOpen()&&window.__ah;let tvx=0,tvz=0,fIn=0,sIn=0;
 if(active){const k=window.__ah.keys();fIn=(k.f?1:0)-(k.b?1:0);sIn=(k.r?1:0)-(k.l?1:0);if(fIn||sIn){const l=Math.hypot(fIn,sIn),f=fIn/l,s=sIn/l,cy=C.yaw,want=run?5.8:3.2;tvx=(-Math.sin(cy)*f+Math.cos(cy)*s)*want;tvz=(-Math.cos(cy)*f-Math.sin(cy)*s)*want}}
 const tsp=Math.hypot(tvx,tvz);if(tsp>.1){const th=Math.atan2(tvx,tvz),d=shortest(P.h,th),step=d*(1-Math.exp(-11*dt));P.h+=step;turn+=(step/dt-turn)*Math.min(1,dt*10);const al=Math.max(.25,1-Math.abs(d)/1.6);tvx*=al;tvz*=al}else turn+=(0-turn)*Math.min(1,dt*8);
 const ac=1-Math.exp(-(tsp>.1?9:12)*dt);P.vx+=(tvx-P.vx)*ac;P.vz+=(tvz-P.vz)*ac;P.sp=Math.hypot(P.vx,P.vz);
 const dx=P.vx*dt,dz=P.vz*dt;if(!blocked(P.x+dx,P.z))P.x+=dx;else P.vx=0;if(!blocked(P.x,P.z+dz))P.z+=dz;else P.vz=0;
 P.y+=(gy(P.x,P.z)-P.y)*Math.min(1,dt*14);
 /* auto-follow: camera swings behind the heading; not when walking backwards towards it */
 if(t-C.drag>1.6&&P.sp>.5&&!(fIn<0&&!sIn)){const rate=fIn>0?(sIn?1.6:2.4):1.1;C.yaw+=shortest(C.yaw,P.h+Math.PI)*(1-Math.exp(-rate*dt))}
 if(t-C.drag>1.6&&P.sp>.5)C.pitch+=(.3-C.pitch)*(1-Math.exp(-1.2*dt));
 const moving=P.sp>.15;rb+=((P.sp>4.2?1:0)-rb)*Math.min(1,dt*6);const amp=clamp(P.sp/3.2,0,1.2);phase+=dt*P.sp*(1.9+rb*.5)*1.6;
 const sw=Math.sin(phase)*(.42+rb*.38)*amp;legs[0].rotation.x=sw;legs[1].rotation.x=-sw;arms[0].rotation.x=-sw*.8-.04;arms[1].rotation.x=sw*.8-.04;
 F.position.y=Math.abs(Math.sin(phase))*.035*amp+Math.sin(t*1.7)*.004;F.rotation.x=rb*.2*amp+(moving?.04:0);F.rotation.z=clamp(-turn*.03,-.14,.14);
 head.rotation.y=Math.sin(t*.6)*.04*(1-amp);arms.forEach((a,i)=>{a.rotation.z=(i?-1:1)*(Math.sin(t*1.3+i)*.02+amp*.05);a.sl.rotation.z=(i?1:-1)*.12+Math.sin(t*2+i+phase)*.04*(.4+amp)});
 hair.forEach((h,i)=>{h.rotation.x=(i?.1:.55)+P.sp*.03*(1+i*.1)+Math.sin(phase*.5-i*.6+t*1.2)*.05*(.4+amp)*(i+1)*.35;h.rotation.z=Math.sin(t*.9-i*.5)*.03*(i+1)+clamp(turn*.012*i,-.25,.25)});
 locks.forEach(l=>l.rotation.x=.04+P.sp*.02);av.position.set(P.x,P.y,P.z);av.rotation.y=P.h;
 const tk=1-Math.exp(-14*dt);C.tx+=(P.x-C.tx)*tk;C.ty+=(P.y+1.45-C.ty)*tk;C.tz+=(P.z-C.tz)*tk;
 plight.position.set(P.x,2.6,P.z);sun.position.set(P.x-22,34,P.z+18);sun.target.position.set(P.x,0,P.z);sun.target.updateMatrixWorld();
 if(cine){const a=t*.06;cam.position.set(Math.sin(a)*40,14+Math.sin(t*.2)*2,-30+Math.cos(a)*36);cam.lookAt(0,10,-40);av.visible=true}else{
  const cp=Math.cos(C.pitch),dxv=Math.sin(C.yaw)*cp,dyv=Math.sin(C.pitch),dzv=Math.cos(C.yaw)*cp;let dd=C.dist;
  for(let d=.7;d<=C.dist;d+=.2){const x=C.tx+dxv*d,y=C.ty+dyv*d,z=C.tz+dzv*d;if(y<.3||(y<9&&insideCol(x,z))){dd=Math.max(1.3,d-.3);break}}
  C.cd=C.cd==null?dd:(dd<C.cd?dd:C.cd+(dd-C.cd)*(1-Math.exp(-4*dt)));cam.position.set(C.tx+dxv*C.cd,Math.max(.5,C.ty+dyv*C.cd),C.tz+dzv*C.cd);cam.lookAt(C.tx,C.ty+.15,C.tz);av.visible=C.cd>1.7}
 let n=null,bd=1e9;for(const q of Z){const d=Math.hypot(P.x-q.x,P.z-q.z);if(d<q.r&&d<bd){bd=d;n=q}}
 if(n!==near){near=n;if(gd)gd.innerHTML=n?'<kbd>E</kbd> read · '+n.l:GUIDE;pr.classList.remove('show')}
 for(const d of doors){const nr=Math.hypot(P.x-d.ax,P.z-d.az)<(d.room?6:12);d.open+=((nr?1:0)-d.open)*Math.min(1,dt*3);d.g.rotation.y=d.rot?d.open*1.5*(d.sign>0?-1:1):d.open*1.45*d.sign}
 if(!RMo){wheel.rotation.x=t*.12;
  for(let i=0;i<46;i++){const q=fpos[i];dm.position.set(q[0]+Math.sin(t*.2+q[2])*.6,.28+Math.sin(t*.9+q[2])*.04,q[1]);dm.rotation.set(0,t*.1+q[2],0);dm.scale.setScalar(1);dm.updateMatrix();fl.setMatrixAt(i,dm.matrix)}fl.instanceMatrix.needsUpdate=true;
  const pa=petals.geometry.attributes.position;for(let i=0;i<pa.count;i++){let y=pa.getY(i)-dt*.7,x=pa.getX(i)+Math.sin(t+i)*dt*.6+dt*.5;if(y<0)y=12;pa.setXYZ(i,x>26?-26:x,y,pa.getZ(i))}pa.needsUpdate=true;mist.position.x=Math.sin(t*.05)*10;
  lights.forEach(([l,b],i)=>l.intensity=b*(1+Math.sin(t*3+i*2)*.04));water.material.emissive.setRGB(.02,.07+Math.sin(t*.8)*.012,.09)}
 if(mapEl.classList.contains('open'))drawMap();
 ren.render(scene,cam)}
document.getElementById('ld')&&document.getElementById('ld').remove();loop();window.__ah3d={P,C,Z,cols,run:()=>run};
}catch(err){console.warn('[after-hours] WebGL world unavailable, using 2D fallback:',err);document.getElementById('ld')&&document.getElementById('ld').remove();document.body.classList.remove('gl')}
