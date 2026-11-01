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
/* ---------- sky, light ---------- */
const sky=new THREE.Mesh(new THREE.SphereGeometry(500,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;void main(){float h=normalize(p).y;vec3 hor=vec3(.50,.14,.20),mid=vec3(.15,.08,.20),top=vec3(.02,.02,.07);vec3 c=mix(hor,mid,smoothstep(0.,.25,h));c=mix(c,top,smoothstep(.2,.8,h));gl_FragColor=vec4(c,1.);}'}));scene.add(sky);
scene.add(new THREE.HemisphereLight(0xb7a8d0,0x40242a,.95));
const sun=new THREE.DirectionalLight(0xffb48a,1.8);sun.position.set(-60,45,50);sun.target.position.set(-10,0,-8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-75,right:75,top:75,bottom:-75,near:10,far:200});sun.shadow.bias=-.0005;scene.add(sun,sun.target);
/* ---------- ground & paths ---------- */
const gnd=new THREE.Mesh(new THREE.PlaneGeometry(700,700),M.grass);gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;scene.add(gnd);
const pave=(w,d,x,z,rx,rz)=>{const m=M.stone.clone();m.map=T.stone.clone();m.map.repeat.set(rx,rz);m.map.needsUpdate=true;const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);p.rotation.x=-Math.PI/2;p.position.set(x,.03,z);p.receiveShadow=true;scene.add(p)};
pave(48,50,0,-5,12,12);pave(6,36,0,38,1.5,9);pave(9,3.4,-28.5,-4,2,1);pave(3,12,-36,-18,1,3);
/* ---------- compound walls, gate, moon gate ---------- */
const WH=4.2;wallSeg(-24,-30,24,-30,WH);wallSeg(24,-30,24,20,WH);wallSeg(-24,20,-4.5,20,WH);wallSeg(4.5,20,24,20,WH);wallSeg(-24,-30,-24,-5.8,WH);wallSeg(-24,-2.2,-24,20,WH);
box(.5,.5,3.6,M.wall,-24,WH-.5,-4,world,false);
const mg=new THREE.Mesh(new THREE.TorusGeometry(1.95,.28,10,32),M.stone);mg.rotation.y=Math.PI/2;mg.position.set(-24,2.15,-4);mg.scale.set(1,1,1);mg.castShadow=true;world.add(mg);
box(.7,.4,5,M.stone,-24,0,-4,world,false);
// gate house
for(const sx of[-1,1]){pillar(sx*4.6,20,5.2);pillar(sx*4.6,17.6,5.2)}beam(-4.6,20,4.6,20,5.1,.5);beam(-4.6,17.6,4.6,17.6,5.1,.5);box(10,.6,.8,M.dark,0,5.2,20);
roof(9.2,3.2,3.2,5,1.2,5.5,0,18.8,1.6);
for(const s of[-1,1]){const g=new THREE.Group();g.position.set(s*4.4,0,20);const d=box(2.2,4.4,.2,M.pillar,s*-1.1,0,0,g);for(let r=0;r<3;r++)for(let c=0;c<2;c++)box(.18,.18,.24,M.brass,s*-.5-c*.7*s,1.2+r*1,0,g,false);world.add(g);doors.push({g,s,ax:0,az:20,open:0,sign:s})}
lant(-3.2,4,19.5);lant(3.2,4,19.5);lant(-7.5,3.2,21);lant(7.5,3.2,21);glow(0,3.6,19,22,18);
/* ---------- courtyard props ---------- */
function stoneLantern(x,z){const g=new THREE.Group();g.position.set(x,0,z);box(.9,.3,.9,M.stone,0,0,0,g);cyl(.18,1.1,M.stone,0,.3,0,g);box(.7,.5,.7,M.lamp,0,1.4,0,g,false);box(1.1,.2,1.1,M.stone,0,1.9,0,g);const c=new THREE.Mesh(new THREE.ConeGeometry(.8,.5,4),M.stone);c.position.y=2.25;c.rotation.y=Math.PI/4;g.add(c);world.add(g);col(x-.5,x+.5,z-.5,z+.5)}
[[-5,13],[5,13],[-5,4],[5,4],[-5,-7],[5,-7]].forEach(p=>stoneLantern(...p));
// stele
box(2.6,.4,1.2,M.stone,0,0,-1);box(1.6,2.6,.45,M.stone,0,.4,-1);box(1.1,.08,.1,M.brass,0,2.4,-.76,world,false);box(1.1,.08,.1,M.brass,0,1.9,-.76,world,false);box(1.1,.08,.1,M.brass,0,1.4,-.76,world,false);col(-1.4,1.4,-1.7,-.3);glow(0,2.4,.6,14,12);
function tree(x,z,m,s=1){cyl(.3*s,3*s,M.wood,x,0,z);for(let i=0;i<4;i++){const f=new THREE.Mesh(new THREE.IcosahedronGeometry((1.8-i*.2)*s,1),m);f.position.set(x+(rnd()-.5)*1.4*s,3.4*s+i*.5*s,z+(rnd()-.5)*1.4*s);f.castShadow=true;scene.add(f)}col(x-.4,x+.4,z-.4,z+.4)}
tree(-18,6,M.maple,1.2);tree(-18,-10,M.leaf,1.2);tree(-9,12,M.leaf);tree(9,12,M.maple);tree(18,16,M.leaf);tree(-19,16,M.maple);
/* ---------- great ancestral hall ---------- */
hallShell(0,-20,26,12,{h:5.2,base:.8,rh:4.4,lift:1.6,over:2.2});
wallSeg(-13,-26,13,-26,5.2,M.wall,.5,.8,false);wallSeg(-13,-26,-13,-14,5.2,M.wall,.5,.8,false);wallSeg(13,-26,13,-14,5.2,M.wall,.5,.8,false);
for(let i=0;i<4;i++)box(5.6,.2,.9,M.stone,0,.2*i,-11.6-i*.6);
col(2.4,13,-14.4,-13.8);col(-13,-2.4,-14.4,-13.8);
for(const x of[-7,7])for(const z of[-19]){pillar(x,z,5.2,.8)}
box(7,1.1,1.2,M.dark,0,.8,-24.6);for(let i=0;i<9;i++){box(.45,1.1,.12,M.dark,-3.2+i*.8,1.9,-25.2);box(.3,.35,.02,M.brass,-3.2+i*.8,2.4,-25.12,world,false)}
cyl(.55,.9,M.brass,0,.8,-22);cyl(.4,.2,M.dark,0,1.7,-22);col(-.7,.7,-22.7,-21.3);
for(const x of[-9,-3,3,9])lant(x,5.4,-14.3);for(const x of[-9,9])lant(x,5,-24);glow(0,4.4,-18,40,24);glow(0,3.2,-24,16,12);
/* ---------- library ---------- */
const LX=15,LZ=-5;hallShell(LX,LZ,10,14,{h:4.4,rh:3.2,lift:1.2,over:1.6});
wallSeg(LX-5,LZ-7,LX+5,LZ-7,4.4);wallSeg(LX-5,LZ+7,LX+5,LZ+7,4.4);wallSeg(LX+5,LZ-7,LX+5,LZ+7,4.4);wallSeg(LX-5,LZ-7,LX-5,LZ-2.2,4.4);wallSeg(LX-5,LZ+.5,LX-5,LZ+7,4.4);
{const g=new THREE.Group();g.position.set(LX-5,0,LZ-1.65);box(.15,3.4,1.5,M.pillar,0,0,0,g);world.add(g);doors.push({g,ax:LX-5,az:LZ-1,open:0,sign:-1,rot:1});const g2=new THREE.Group();g2.position.set(LX-5,0,LZ+.5);box(.15,3.4,1.5,M.pillar,0,0,-.75,g2);world.add(g2);doors.push({g:g2,ax:LX-5,az:LZ-1,open:0,sign:1,rot:1})}
const spine=[0x5a2f2a,0x2e4a5a,0x6b5a3a,0x3b3b55,0x4d5a3a];
for(const z of[LZ-6.3,LZ+6.3]){box(8,3.6,.7,M.wood,LX,0,z);for(let r=0;r<4;r++)for(let i=0;i<8;i++)box(.9,.6,.5,std({color:spine[(r+i)%5]}),LX-3.5+i,.3+r*.85,z+(z<LZ?.1:-.1),world,false)}
box(.7,3.6,10,M.wood,LX+4.5,0,LZ);for(let r=0;r<4;r++)box(.5,.6,9,std({color:spine[r]}),LX+4.2,.3+r*.85,LZ,world,false);col(LX+4.1,LX+5,LZ-5,LZ+5);col(LX-4,LX+4,LZ-6.7,LZ-5.9);col(LX-4,LX+4,LZ+5.9,LZ+6.7);
for(const dz of[-2.5,2.5]){box(2.6,.9,1.2,M.wood,LX,0,LZ+dz);box(.5,.12,.35,M.paper,LX-.6,.9,LZ+dz,world,false);cyl(.07,.6,M.paper,LX+.5,.9,LZ+dz,world,8).rotation.z=Math.PI/2;col(LX-1.4,LX+1.4,LZ+dz-.7,LZ+dz+.7)}
lant(LX,4,LZ-4);lant(LX,4,LZ+4);lant(LX-6.6,3.6,LZ-1);glow(LX,3.4,LZ,30,16);
/* ---------- garden: pond, bridge, pavilion, hut ---------- */
const PX=-40,PZ=-4;const water=new THREE.Mesh(new THREE.CircleGeometry(8.6,40),M.water);water.rotation.x=-Math.PI/2;water.position.set(PX,.12,PZ);scene.add(water);
const lot=new THREE.InstancedMesh(new THREE.CircleGeometry(.55,10),M.lotus,34),fl=new THREE.InstancedMesh(new THREE.ConeGeometry(.22,.4,7),M.pink,12),dm=new THREE.Object3D();
for(let i=0;i<34;i++){const a=rnd()*6.28,r=2+rnd()*5.6;dm.position.set(PX+Math.cos(a)*r,.16,PZ+Math.sin(a)*r);dm.rotation.set(-Math.PI/2,0,rnd()*6);dm.scale.setScalar(.7+rnd()*.7);dm.updateMatrix();lot.setMatrixAt(i,dm.matrix)}
for(let i=0;i<12;i++){const a=rnd()*6.28,r=3+rnd()*4.5;dm.position.set(PX+Math.cos(a)*r,.35,PZ+Math.sin(a)*r);dm.rotation.set(0,0,0);dm.scale.setScalar(1);dm.updateMatrix();fl.setMatrixAt(i,dm.matrix)}scene.add(lot,fl);
const rim=new THREE.Mesh(new THREE.TorusGeometry(8.7,.45,6,48),M.stone);rim.rotation.x=Math.PI/2;rim.position.set(PX,.2,PZ);scene.add(rim);
const bh=x=>1.25*Math.sin(Math.PI*clamp((x+47)/14,0,1));
for(let i=0;i<14;i++){const x=-47+i+.5,y=bh(x),sl=Math.atan2(bh(x+.5)-bh(x-.5),1);const b=box(1.05,.3,3,M.stone,x,y-.3,PZ);b.rotation.z=sl;box(.2,.7,.2,M.pillar,x,y,PZ-1.4);box(.2,.7,.2,M.pillar,x,y,PZ+1.4);box(1.05,.12,.12,M.pillar,x,y+.65,PZ-1.4).rotation.z=sl;box(1.05,.12,.12,M.pillar,x,y+.65,PZ+1.4).rotation.z=sl}
const PVX=-54,PVZ=-4;hallShell(PVX,PVZ,8,8,{h:3.8,base:.4,rh:2.8,lift:1.1,over:1.4});
for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])col(PVX+x*4-.4,PVX+x*4+.4,PVZ+z*4-.4,PVZ+z*4+.4);box(2.6,.5,.8,M.wood,PVX,.4,PVZ-2);box(1.4,.06,.9,M.paper,PVX,.9,PVZ-2,world,false);
lant(PVX-4,3.6,PVZ-4);lant(PVX+4,3.6,PVZ-4);lant(PVX-4,3.6,PVZ+4);lant(PVX+4,3.6,PVZ+4);glow(PVX,3,PVZ,28,16);
const HX=-37,HZ=-26;hallShell(HX,HZ,6,6,{h:3.4,rh:2.4,lift:1,over:1.2});wallSeg(HX-3,HZ-3,HX+3,HZ-3,3.4,M.wall,.4,0,false);wallSeg(HX-3,HZ-3,HX-3,HZ+3,3.4,M.wall,.4,0,false);wallSeg(HX+3,HZ-3,HX+3,HZ+3,3.4,M.wall,.4,0,false);wallSeg(HX-3,HZ+3,HX-.9,HZ+3,3.4,M.wall,.4,0,false);wallSeg(HX+.9,HZ+3,HX+3,HZ+3,3.4,M.wall,.4,0,false);
box(1.6,1.4,.2,M.paper,HX+1.4,1.2,HZ-2.9,world,false);box(2.2,.6,1,M.wood,HX,0,HZ-1.8);lant(HX,3,HZ+3.3);glow(HX,2.4,HZ,22,10,0xffc080);
for(let i=0;i<8;i++){box(.8,.14,.8,M.stone,HX+(rnd()-.5)*1.2,0,-16+i*-1.2,world,false)}
const wil=(x,z)=>{cyl(.35,3.6,M.wood,x,0,z);for(let i=0;i<26;i++){const a=i/26*6.28,r=1.3+rnd()*.8;const s=new THREE.Mesh(new THREE.BoxGeometry(.05,2.6+rnd(),.05),M.leaf);s.position.set(x+Math.cos(a)*r,2.4,z+Math.sin(a)*r);s.rotation.z=Math.cos(a)*.15;s.rotation.x=Math.sin(a)*.15;scene.add(s)}const t=new THREE.Mesh(new THREE.SphereGeometry(1.6,8,6),M.leaf);t.position.set(x,4.1,z);t.scale.y=.5;scene.add(t);col(x-.5,x+.5,z-.5,z+.5)};
wil(-33,6);wil(-47,5);wil(-33,-14);wil(-46,-12);
/* bamboo (instanced, swaying) */
const BN=130,bam=new THREE.InstancedMesh(new THREE.CylinderGeometry(.06,.09,9,6),M.bamboo,BN),bp=[];
for(let i=0;i<BN;i++){const cl=i%2,x=cl?-66+rnd()*10:-44+rnd()*16,z=cl?-8+rnd()*22:-40+rnd()*10;bp.push([x,z,rnd()*6,.8+rnd()*.5])}
/* lantern instances */
const li=new THREE.InstancedMesh(new THREE.SphereGeometry(.38,10,8),M.redlan,LAN.length);LAN.forEach((p,i)=>{dm.position.set(...p);dm.rotation.set(0,0,0);dm.scale.set(1,1.3,1);dm.updateMatrix();li.setMatrixAt(i,dm.matrix);box(.04,.4,.04,M.pillar,p[0],p[1]-.9,p[2],world,false)});scene.add(li);const N0=LAN.length;
/* ---------- mountains & far pagodas ---------- */
for(let i=0;i<22;i++){const a=i/22*6.28+rnd()*.2,r=170+rnd()*90,s=50+rnd()*70,m=new THREE.Mesh(new THREE.ConeGeometry(s,s*(1.2+rnd()*.9),6+(i%3)),new THREE.MeshLambertMaterial({color:new THREE.Color().setHSL(.62,.18,.22+(r-170)/90*.1),flatShading:true}));m.position.set(Math.cos(a)*r,s*.5,Math.sin(a)*r-40);scene.add(m)}
function pagoda(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);const mt=new THREE.MeshLambertMaterial({color:0x2c3248});for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(5-i*.6,2,5-i*.6),mt);b.position.y=1+i*3;g.add(b);const r=new THREE.Mesh(new THREE.ConeGeometry(4.6-i*.6,1.4,4),mt);r.position.y=2.6+i*3;r.rotation.y=Math.PI/4;g.add(r)}scene.add(g)}
pagoda(70,-120,2.4);pagoda(-100,-110,2);pagoda(10,-150,2.8);
/* ---------- particles ---------- */
const sp=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
function pts(n,sz,col,op,box_){const a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=box_[0]+rnd()*box_[1];a[i*3+1]=box_[2]+rnd()*box_[3];a[i*3+2]=box_[4]+rnd()*box_[5]}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));const p=new THREE.Points(g,new THREE.PointsMaterial({size:sz,map:sp,color:col,transparent:true,opacity:op,depthWrite:false,fog:true}));p.frustumCulled=false;scene.add(p);return p}
const mist=pts(160,14,0xb8c0dc,.16,[-70,120,.4,2.4,-40,80]),petals=pts(260,.22,0xf2c4d0,.9,[-60,90,0,12,-35,70]);
/* ====================== WINGS, SIGNS, ATMOSPHERE ====================== */
const EXTRA=(()=>{return{}})();
function sign(t,s,x,y,z,ry,w=4.8){const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');g.fillStyle='#160a0d';g.fillRect(0,0,1024,256);g.strokeStyle='#b8923f';g.lineWidth=6;g.strokeRect(10,10,1004,236);g.lineWidth=2;g.strokeRect(24,24,976,208);g.fillStyle='#efe3c8';g.textAlign='center';let fs=92;g.font=`600 ${fs}px Georgia,serif`;while(g.measureText(t).width>770&&fs>36){fs-=4;g.font=`600 ${fs}px Georgia,serif`}g.fillText(t,470,138);g.fillStyle='#c8a55a';g.font='italic 36px Georgia,serif';g.fillText(s,470,200);g.fillStyle='#a3182c';g.fillRect(866,58,100,100);g.fillStyle='#f1dcc0';g.font='700 46px Georgia,serif';g.fillText('DH',916,124);
 const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=4;const gp=new THREE.Group();gp.position.set(x,y,z);gp.rotation.y=ry;const pl=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),new THREE.MeshBasicMaterial({map:tx,fog:false}));pl.position.z=.07;const fr=new THREE.Mesh(new THREE.BoxGeometry(w+.2,w/4+.2,.1),M.dark);gp.add(fr,pl);world.add(gp);return gp}
function lectern(x,z,ry){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;box(.9,1.0,.6,M.wood,0,0,0,g);const b=box(.85,.05,.55,M.paper,0,1.05,0,g,false);b.rotation.x=-.45;box(.7,.04,.4,M.brass,0,1.12,-.02,g,false).rotation.x=-.45;world.add(g);col(x-.6,x+.6,z-.6,z+.6);glow(x,1.8,z,6,6,0xffc890)}
// freestanding signboard for the outer gate
box(.3,3.6,.3,M.pillar,-2.6,0,26);box(.3,3.6,.3,M.pillar,2.6,0,26);sign("GHOST KING'S DOMAIN",'Entrance · Introduction',0,3.0,26.05,0,5.4);col(-2.8,2.8,25.8,26.3);
sign('CRIMSON ARCHIVE','Research & Projects',LX-5.45,4.05,LZ-1.85,-Math.PI/2,4.2);
sign('HALL OF RECORDS','Professional Experience',0,4.5,-14.15,0,4.4);
sign("SCHOLAR'S PAVILION",'Skills & Knowledge',15,3.5,16.1,0,3.7);
sign('MOONLIT GARDEN','Creative Portfolio',-49.7,3.6,-4,Math.PI/2,4.4);box(.2,4,.2,M.pillar,-49.75,0,-6.4);box(.2,4,.2,M.pillar,-49.75,0,-1.6);
sign('MOONLIT GARDEN','Beyond the moon gate',-22.6,3.0,-4,Math.PI/2,3.2);
sign('INNER RESIDENCE','Personal Introduction',HX,3.4,HZ+3.25,0,3.3);
sign('CELESTIAL PAVILION','Contact & Connections',-53.7,3.6,-24,Math.PI/2,4.4);box(.2,4,.2,M.pillar,-53.7,0,-26.4);box(.2,4,.2,M.pillar,-53.7,0,-21.6);
// library chamber partition + chamber signs + lecterns
wallSeg(LX-5,LZ+2,LX+2.6,LZ+2,4.4);wallSeg(LX+4,LZ+2,LX+5,LZ+2,4.4);
sign('CHAMBER I · THE VISIBILITY TRAP','Research Dossier',LX-1.2,3.2,LZ+1.68,Math.PI,4.6);sign('CHAMBER II · SKILL PASSPORT','Technical Archive',LX-1.2,3.2,LZ+2.32,0,4.6);
lectern(LX-2.5,-9.5,Math.PI);lectern(LX-1,-.9,0);
// scholar's pavilion, celestial pavilion
hallShell(15,12,8,8,{h:3.8,base:.3,rh:2.8,lift:1.1,over:1.4});box(2.8,.8,1,M.wood,15,.3,12);for(let i=0;i<4;i++)cyl(.09,.9,M.paper,14+i*.6,1.1,12,world,8).rotation.z=Math.PI/2;col(13.6,16.4,11.4,12.6);lant(12,3.4,16);lant(18,3.4,16);glow(15,3,12,18,14,0xe6eeff);
hallShell(-58,-24,8,8,{h:3.8,base:.6,rh:2.8,lift:1.1,over:1.4});for(let i=0;i<4;i++)box(2,.05,2,M.stone,-52-i*.01,.2*i,-24,world,false);cyl(.35,.9,M.brass,-58,.6,-24);col(-58.5,-57.5,-24.5,-23.5);lant(-62,3.6,-28);lant(-54,3.6,-28);lant(-62,3.6,-20);lant(-54,3.6,-20);glow(-58,3,-24,22,16,0xdfe6ff);glow(PX,6,PZ,26,30,0x7f9fff);
for(let i=0;i<7;i++)box(.8,.14,.8,M.stone,-37+(rnd()-.5)*1.4,0,-12-i*1.4,world,false);
if(LAN.length>N0){const l2=new THREE.InstancedMesh(new THREE.SphereGeometry(.38,10,8),M.redlan,LAN.length-N0);LAN.slice(N0).forEach((p,i)=>{dm.position.set(...p);dm.rotation.set(0,0,0);dm.scale.set(1,1.3,1);dm.updateMatrix();l2.setMatrixAt(i,dm.matrix)});scene.add(l2)}
/* floating crimson lanterns + silk */
const FL=new THREE.InstancedMesh(new THREE.SphereGeometry(.45,10,8),new THREE.MeshStandardMaterial({color:0x8f1224,emissive:0xff3b3b,emissiveIntensity:1.1}),46),fp=[];for(let i=0;i<46;i++)fp.push([-26+rnd()*56,6+rnd()*9,-34+rnd()*60,rnd()*6]);scene.add(FL);
const silk=[];for(const[x,y,z,ry]of[[-3.2,4.9,19.4,0],[3.2,4.9,19.4,0],[-9,5.3,-14.4,0],[9,5.3,-14.4,0],[-4.4,3.6,15.7,0],[4.4,3.6,15.7,0]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(.55,2.6),std({color:0x8a1428,side:THREE.DoubleSide}));m.geometry.translate(0,-1.3,0);m.position.set(x,y,z);m.rotation.y=ry;world.add(m);silk.push(m)}
/* ====================== AVATAR ====================== */
function makeAvatar(){const A=new THREE.Group(),F=new THREE.Group();A.add(F);
 const skin=std({color:0xe9cdb6,roughness:.6}),ink=std({color:0x17121a,roughness:.7}),wine=std({color:0x7a1426,roughness:.55}),crim=std({color:0xb01c30,roughness:.5,side:THREE.DoubleSide}),silv=new THREE.MeshStandardMaterial({color:0xc9ccd6,metalness:.85,roughness:.3}),hair=std({color:0x0a090e,roughness:.35}),cm=(r0,r1,h,m,seg=12)=>new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,seg),m);
 const put=(o,x,y,z,p=F)=>{o.position.set(x,y,z);o.castShadow=true;p.add(o);return o};
 const legs=[],arms=[];
 for(const s of[-1,1]){const lp=new THREE.Group();lp.position.set(s*.095,.86,0);F.add(lp);put(cm(.062,.05,.8,ink),0,-.42,0,lp);put(new THREE.Mesh(new THREE.BoxGeometry(.11,.07,.2),wine),0,-.82,.04,lp);legs.push(lp);
  const ap=new THREE.Group();ap.position.set(s*.2,1.36,0);F.add(ap);const sl=cm(.06,.17,.62,ink);sl.position.y=-.3;sl.castShadow=true;ap.add(sl);const tr=new THREE.Mesh(new THREE.TorusGeometry(.17,.018,6,16),crim);tr.rotation.x=Math.PI/2;tr.position.y=-.6;ap.add(tr);put(new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),skin),0,-.6,.0,ap);const br=cm(.052,.052,.1,silv,10);br.position.y=-.5;ap.add(br);arms.push(ap)}
 const skirt=put(new THREE.Mesh(new THREE.CylinderGeometry(.2,.48,.82,20,1,true),ink),0,.62,0);skirt.material=std({color:0x17121a,side:THREE.DoubleSide,roughness:.7});const hem=new THREE.Mesh(new THREE.TorusGeometry(.48,.025,6,24),crim);hem.rotation.x=Math.PI/2;hem.position.set(0,.22,0);F.add(hem);
 const over=put(new THREE.Mesh(new THREE.CylinderGeometry(.17,.21,.55,16),wine),0,1.12,0);const vst=put(new THREE.Mesh(new THREE.BoxGeometry(.06,.5,.2),ink),0,1.14,.08);const sash=new THREE.Mesh(new THREE.TorusGeometry(.2,.04,8,20),crim);sash.rotation.x=Math.PI/2;sash.position.set(0,.93,0);F.add(sash);
 const col2=put(cm(.075,.09,.1,ink),0,1.44,0);const chain=new THREE.Mesh(new THREE.TorusGeometry(.14,.008,4,18),silv);chain.rotation.x=Math.PI/2.4;chain.position.set(0,1.28,.03);F.add(chain);
 const head=new THREE.Group();head.position.set(0,1.58,0);F.add(head);const sk=new THREE.Mesh(new THREE.SphereGeometry(.115,18,14),skin);sk.scale.set(.95,1.08,1);sk.castShadow=true;head.add(sk);
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.125,18,14,0,Math.PI*2,0,Math.PI*.62),hair);cap.position.set(0,.02,-.012);cap.rotation.x=-.25;head.add(cap);
 const ep=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),ink);ep.scale.set(1,1.15,.5);ep.position.set(-.05,.02,.1);head.add(ep);const cord=new THREE.Mesh(new THREE.TorusGeometry(.118,.007,4,24),crim);cord.rotation.x=Math.PI/2;cord.rotation.z=.2;cord.position.set(0,.03,0);head.add(cord);
 const re=new THREE.Mesh(new THREE.SphereGeometry(.014,6,6),ink);re.position.set(.045,.025,.112);head.add(re);const pin=new THREE.Mesh(new THREE.ConeGeometry(.02,.14,6),silv);pin.position.set(0,.14,-.03);pin.rotation.x=-.2;head.add(pin);
 const hr=new THREE.Group();hr.position.set(0,.1,-.08);head.add(hr);const rib=new THREE.Mesh(new THREE.TorusGeometry(.05,.016,6,10),crim);rib.rotation.x=Math.PI/2;hr.add(rib);
 const segs=[];let par=hr;for(let i=0;i<6;i++){const sg=new THREE.Group();sg.position.y=i?-.2:0;par.add(sg);const m=cm(.045-i*.004,.04-i*.004,.22,hair,8);m.position.y=-.1;m.castShadow=true;sg.add(m);segs.push(sg);par=sg}
 const locks=[];for(const s of[-1,1]){const lg=new THREE.Group();lg.position.set(s*.1,.0,.05);head.add(lg);const m=cm(.016,.008,.48,hair,6);m.position.y=-.24;lg.add(m);locks.push(lg)}
 A.scale.setScalar(.92);return{A,F,legs,arms,segs,hr,locks,head,skirt,hem}}
const AV=makeAvatar();scene.add(AV.A);AV.A.traverse(o=>{if(o.isMesh)o.castShadow=true});
/* ====================== ZONES, PLAYER, CAMERA ====================== */
const Z=[
 {id:'domain',x:0,z:23.5,r:3.4,l:"Ghost King's Domain · Inscription",tp:[0,31]},
 {id:'visibility',x:LX-2.5,z:-9.5,r:3.2,l:'Chamber I · The Visibility Trap',tp:[LX-8,-6.5]},
 {id:'passport',x:LX-1,z:-.9,r:2.6,l:'Chamber II · Skill Passport',tp:[LX+3.3,-.5]},
 {id:'scholar',x:15,z:12,r:4,l:"Scholar's Pavilion · Skills",tp:[15,19]},
 {id:'records',x:0,z:-19.5,r:5.5,l:'Hall of Records · Experience',tp:[0,-9]},
 {id:'garden',x:-54,z:-4,r:4.6,l:'Moonlit Garden · Creative work',tp:[-46.8,-4]},
 {id:'inner',x:HX,z:HZ,r:3.6,l:'Inner Residence · About',tp:[HX,HZ+6.5]},
 {id:'celestial',x:-58,z:-24,r:4.6,l:'Celestial Pavilion · Contact',tp:[-52.5,-24]}];
const MAPD=[['Domain',0,28],['Crimson Archive',LX,LZ-3],["Scholar's",15,12],['Records',0,-20],['Garden',-54,-4],['Inner',HX,HZ],['Celestial',-58,-24]];
const P={x:0,z:38,y:0,h:Math.PI,vx:0,vz:0};let cy=0,cp=.36,cd=6.2,camPos=new THREE.Vector3(0,3,44),tgt=new THREE.Vector3(0,1.3,38),near=null,paused=false,cine=false,phase=0,run=0,spd=0,turn=0,run_=false;
const insideCol=(x,z)=>{for(const c of cols)if(x>c[0]&&x<c[1]&&z>c[2]&&z<c[3])return true;return false};
const blocked=(x,z)=>{const r=.42;for(const c of cols)if(x>c[0]-r&&x<c[1]+r&&z>c[2]-r&&z<c[3]+r)return true;const d=Math.hypot(x-PX,z-PZ);if(d<8.2&&Math.abs(z-PZ)>1.2)return true;if(Math.abs(x)>100||z>70||z<-95)return true;return false};
const gy=(x,z)=>{let y=0;if(Math.abs(x)<13&&z<-14)y=.8;else if(Math.abs(x)<2.8&&z<-11.6)y=.8*clamp((-11.6-z)/2.4,0,1);if(Math.abs(x+54)<4.8&&Math.abs(z+4)<4.8)y=.4;if(Math.abs(x+58)<4.8&&Math.abs(z+24)<4.8)y=.6;if(Math.abs(x-15)<4.8&&Math.abs(z-12)<4.8)y=.3;if(Math.abs(z-PZ)<1.5&&x>-47&&x<-33)y=Math.max(y,bh(x));return y};
P.y=gy(P.x,P.z);
window.__tp=id=>{const q=Z.find(a=>a.id==id);if(!q)return;P.x=q.tp[0];P.z=q.tp[1];P.y=gy(P.x,P.z);P.vx=P.vz=0;const H=Math.atan2(q.x-P.x,q.z-P.z);P.h=H;cy=H+Math.PI;cp=.34;camPos.set(P.x+Math.sin(cy)*4,P.y+3,P.z+Math.cos(cy)*4);tgt.set(P.x,P.y+1.3,P.z)};
const ov=$('#ov'),lbEl=$('#lb'),intro=$('#intro'),ms=()=>document.body.classList.contains('ms-open');let drag=null;
cv.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];cv.setPointerCapture(e.pointerId)});cv.addEventListener('pointermove',e=>{if(!drag||paused)return;cy-=(e.clientX-drag[0])*.0055;cp=clamp(cp+(e.clientY-drag[1])*.0045,-.1,1.15);drag=[e.clientX,e.clientY]});addEventListener('pointerup',()=>drag=null);
cv.addEventListener('wheel',e=>{cd=clamp(cd+e.deltaY*.004,3,9)},{passive:true});
const pz=document.createElement('div');pz.id='pz';pz.textContent='PAUSED';document.body.appendChild(pz);
const mo=document.createElement('div');mo.id='mapov';mo.innerHTML='<canvas width="560" height="470"></canvas><p>Residence map · press M to close · the red mark is you</p>';document.body.appendChild(mo);const mc=mo.querySelector('canvas'),mx=mc.getContext('2d');
const bt=$('#top .btns');if(bt){const b=document.createElement('button');b.className='chip';b.id='bMap';b.textContent='Map';b.onclick=()=>mo.classList.toggle('open');bt.prepend(b)}
const open_=id=>window.AHUI&&window.AHUI.open(id);
addEventListener('keydown',e=>{if(e.key=='Shift')run_=true;if(ov.classList.contains('open')||lbEl.classList.contains('open')||ms()||!intro.classList.contains('gone'))return;
 const k=e.key;if(k=='p'||k=='P'){paused=!paused;pz.style.display=paused?'grid':'none'}if(k=='c'||k=='C')cine=!cine;if(k=='m'||k=='M')mo.classList.toggle('open');if(k=='Escape')mo.classList.remove('open');
 if((k=='e'||k=='E'||k=='Enter')&&near&&!paused){e.preventDefault();open_(near.id)}});
addEventListener('keyup',e=>{if(e.key=='Shift')run_=false});
$('#pBtn').onclick=()=>near&&open_(near.id);$('#pA').onclick=()=>near&&open_(near.id);
const gd=$('#guide');if(gd)gd.innerHTML='<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows move &nbsp; <kbd>Shift</kbd> run &nbsp; drag: camera &nbsp; <kbd>E</kbd> enter / read &nbsp; <kbd>M</kbd> map &nbsp; <kbd>P</kbd> pause &nbsp; <kbd>C</kbd> cinematic';
function size(){ren.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}addEventListener('resize',size);size();document.body.classList.add('gl');
const angD=(a,b)=>{let d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return d};
function drawMap(){mx.fillStyle='#e8dcc1';mx.fillRect(0,0,560,470);const X=x=>(x+75)/110*540+10,Zc=z=>(z+40)/90*450+10;mx.strokeStyle='#6b1022';mx.lineWidth=2;mx.strokeRect(X(-24),Zc(-30),48/110*540,50/90*450);mx.fillStyle='#6b102233';mx.fillRect(X(-13),Zc(-26),26/110*540,12/90*450);mx.beginPath();mx.arc(X(PX),Zc(PZ),8.6/110*540,0,7);mx.fillStyle='#4a6b5d55';mx.fill();mx.stroke();mx.fillRect(X(LX-5),Zc(LZ-7),10/110*540,14/90*450);
 mx.font='600 12px Helvetica,Arial';mx.fillStyle='#1a1214';mx.textAlign='center';MAPD.forEach(([n,x,z])=>{mx.fillStyle='#a3182c';mx.fillRect(X(x)-4,Zc(z)-4,8,8);mx.fillStyle='#1a1214';mx.fillText(n,X(x),Zc(z)-9)});
 mx.fillStyle='#a3182c';mx.save();mx.translate(X(P.x),Zc(P.z));mx.rotate(-P.h+Math.PI);mx.beginPath();mx.moveTo(0,-9);mx.lineTo(6,7);mx.lineTo(-6,7);mx.fill();mx.restore()}
/* ====================== LOOP ====================== */
const clk=new THREE.Clock(),RM=matchMedia('(prefers-reduced-motion:reduce)').matches,pr=$('#prompt'),wp=water.material,dm2=new THREE.Object3D();
function loop(){requestAnimationFrame(loop);const dt=Math.min(.05,clk.getDelta()),t=clk.elapsedTime;
 const active=!paused&&!cine&&intro.classList.contains('gone')&&!ov.classList.contains('open')&&!lbEl.classList.contains('open')&&!ms();
 let f=0,s=0;if(active&&window.__ah){const k=window.__ah.keys();f=(k.f?1:0)-(k.b?1:0);s=(k.r?1:0)-(k.l?1:0)}
 let dx=0,dz=0;const has=!!(f||s);if(has){const l=Math.hypot(f,s);f/=l;s/=l;dx=-Math.sin(cy)*f+Math.cos(cy)*s;dz=-Math.cos(cy)*f-Math.sin(cy)*s}
 const want=has?Math.atan2(dx,dz):P.h,diff=angD(P.h,want);
 const top=run_?5.8:3.2,tv=has?top*clamp(1-Math.abs(diff)/Math.PI*.75,.25,1):0,ka=1-Math.exp(-(has?9:12)*dt);
 P.vx+=(dx*tv-P.vx)*ka;P.vz+=(dz*tv-P.vz)*ka;
 const nx=P.x+P.vx*dt,nz=P.z+P.vz*dt;if(!blocked(nx,P.z))P.x=nx;else P.vx=0;if(!blocked(P.x,nz))P.z=nz;else P.vz=0;
 spd=Math.hypot(P.vx,P.vz);if(has||spd>.4){const hd=spd>.4?Math.atan2(P.vx,P.vz):want;const dd=angD(P.h,has?want:hd);const rate=has?11:6;const st=dd*(1-Math.exp(-rate*dt));P.h+=st;turn+=((st/Math.max(dt,.001))-turn)*Math.min(1,dt*8)}else turn*=1-Math.min(1,dt*8);
 P.y+=(gy(P.x,P.z)-P.y)*Math.min(1,dt*14);
 const sf=clamp(spd/3.2,0,1.5);run+=((spd>4.2?1:0)-run)*Math.min(1,dt*6);if(spd>.15)phase+=dt*(5.5+spd*1.5);
 const amp=Math.min(1,spd/3)*(.45+.4*run),A=AV;
 AV.A.position.set(P.x,P.y,P.z);AV.A.rotation.y=P.h;AV.F.rotation.x=run*.16*Math.min(1,spd/5);AV.F.rotation.z=clamp(-turn*.03,-.12,.12);AV.F.position.y=(RM?0:Math.abs(Math.sin(phase))*.035*amp)+Math.sin(t*1.7)*.004;
 A.legs[0].rotation.x=Math.sin(phase)*amp*1.1;A.legs[1].rotation.x=-Math.sin(phase)*amp*1.1;A.arms[0].rotation.x=-Math.sin(phase)*amp*.8+Math.sin(t*1.3)*.03;A.arms[1].rotation.x=Math.sin(phase)*amp*.8-Math.sin(t*1.3)*.03;A.arms[0].rotation.z=.08+Math.sin(t*1.1)*.03;A.arms[1].rotation.z=-.08-Math.sin(t*1.1)*.03;
 A.skirt.rotation.x=Math.sin(phase)*amp*.05;A.skirt.scale.set(1+sf*.05,1,1+sf*.12);
 A.hr.rotation.x=.5+sf*.5+Math.sin(t*2)*.04;A.segs.forEach((g,i)=>{g.rotation.x=.12+Math.sin(phase*.5-i*.7)*.12*amp+Math.sin(t*1.5+i)*.03;g.rotation.z=-turn*.025*(i+1)*.4+Math.sin(t+i*.8)*.02});A.locks.forEach((g,i)=>{g.rotation.x=.08+sf*.25+Math.sin(t*1.8+i)*.03});A.head.rotation.y=clamp(-turn*.02,-.25,.25);
 if(cine){const a=t*.07;cam.position.set(Math.sin(a)*38,11+Math.sin(t*.2)*2,Math.cos(a)*30+6);cam.lookAt(0,3,-12)}else{
  const dirx=Math.sin(cy)*Math.cos(cp),diry=Math.sin(cp),dirz=Math.cos(cy)*Math.cos(cp);const ty=P.y+1.35;
  tgt.x+=(P.x-tgt.x)*(1-Math.exp(-16*dt));tgt.y+=(ty-tgt.y)*(1-Math.exp(-10*dt));tgt.z+=(P.z-tgt.z)*(1-Math.exp(-16*dt));
  let m=cd;for(let d=.7;d<=cd;d+=.25){const x=tgt.x+dirx*d,y=tgt.y+diry*d,z=tgt.z+dirz*d;if(y<.3||(y<5.6&&insideCol(x,z))){m=Math.max(.9,d-.4);break}}
  cdc=m<cdc?m:cdc+(m-cdc)*(1-Math.exp(-5*dt));
  cam.position.set(tgt.x+dirx*cdc,Math.max(.4,tgt.y+diry*cdc),tgt.z+dirz*cdc);cam.lookAt(tgt.x,tgt.y+.15,tgt.z);AV.A.visible=cdc>1.1}
 let n=null,bd=1e9;for(const q of Z){const d=Math.hypot(P.x-q.x,P.z-q.z);if(d<q.r&&d<bd){bd=d;n=q}}
 if(n!==near){near=n;if(n){$('#pBtn').textContent='E · '+n.l;pr.classList.add('show')}else pr.classList.remove('show')}
 for(const d of doors){const nr=Math.hypot(P.x-d.ax,P.z-d.az)<(d.rot?5:7);d.open+=((nr?1:0)-d.open)*Math.min(1,dt*3);d.g.rotation.y=d.rot?d.open*1.5*(d.sign>0?-1:1):d.open*1.45*d.sign}
 if(!RM){for(let i=0;i<BN;i++){const b=bp[i];dm.position.set(b[0],4.5*b[3],b[1]);dm.rotation.set(Math.sin(t*.9+b[2])*.035,0,Math.cos(t*.7+b[2])*.05);dm.scale.set(1,b[3],1);dm.updateMatrix();bam.setMatrixAt(i,dm.matrix)}bam.instanceMatrix.needsUpdate=true;
  for(let i=0;i<fp.length;i++){const b=fp[i];dm2.position.set(b[0]+Math.sin(t*.2+b[3])*1.5,b[1]+Math.sin(t*.6+b[3])*.5,b[2]);dm2.scale.set(1,1.25,1);dm2.updateMatrix();FL.setMatrixAt(i,dm2.matrix)}FL.instanceMatrix.needsUpdate=true;silk.forEach((m,i)=>{m.rotation.z=Math.sin(t*1.2+i)*.1;m.rotation.x=Math.sin(t*.9+i*2)*.06});
  const pa=petals.geometry.attributes.position;for(let i=0;i<pa.count;i++){let y=pa.getY(i)-dt*.7,x=pa.getX(i)+Math.sin(t+i)*dt*.6+dt*.5;if(y<0)y=12;pa.setXYZ(i,x>60?-60:x,y,pa.getZ(i))}pa.needsUpdate=true;mist.position.x=Math.sin(t*.05)*10;
  wp.emissive.setRGB(.02,.05+Math.sin(t*.8)*.01,.07);lights.forEach(([l,b],i)=>l.intensity=b*(1+Math.sin(t*3+i*2)*.04))}
 if(mo.classList.contains('open'))drawMap();
 ren.render(scene,cam)}
let cdc=cd;scene.add(bam);loop();window.__ah3d={P,Z,cols,AV};
}catch(err){console.warn('[after-hours] WebGL world unavailable, using 2D street fallback:',err);document.body.classList.remove('gl')}
