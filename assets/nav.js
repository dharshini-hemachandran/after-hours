/* AFTER HOURS — explicit world map & navigation configuration.
   Every room has: id · position/bounds · entrance · exit · destination · content section · trigger.
   Nothing is inferred from "whichever object is closest": the trigger of one room can never overlap another's (validated below).
   entrance = the doorway · exit = where "Leave room" places you (just outside) · trigger = the reading desk / lectern that opens `content` with E or Enter. */
window.AH_ROOMS=[
 {id:'index',order:0,name:'The Index',destination:'Start here',section:'Overview for recruiters',content:'index',bounds:[-3,3,48,56],entrance:{x:0,z:56},exit:{x:0,z:60},trigger:{x:0,z:50,r:2.4}},
 {id:'central-archive',order:1,name:'The Central Archive',destination:'The Visibility Trap',section:'Research project',content:'central-archive',bounds:[-17,17,-59,-35],entrance:{x:0,z:-35},exit:{x:0,z:-30},trigger:{x:0,z:-43.2,r:2.8}},
 {id:'strategists-chamber',order:2,name:"The Strategist's Chamber",destination:'Campus Connect · Skill Passport',section:'Product & technology',content:'strategists-chamber',bounds:[6,16,24.5,35.5],entrance:{x:6,z:30},exit:{x:3,z:30},trigger:{x:9,z:27,r:2.4}},
 {id:'scholars-pavilion',order:3,name:"The Scholar's Pavilion",destination:'Technical profile',section:'AI/ML & skills',content:'scholars-pavilion',bounds:[-16,-6,2.5,13.5],entrance:{x:-6,z:8},exit:{x:-3,z:8},trigger:{x:-9.2,z:10.6,r:2.4}},
 {id:'council-hall',order:4,name:'The Council Hall',destination:'Experience',section:'E-Cell · Journal Club · SurgeSkills · Nexwave',content:'council-hall',bounds:[6,16,2.5,13.5],entrance:{x:6,z:8},exit:{x:3,z:8},trigger:{x:8.4,z:4.8,r:2.4}},
 {id:'artisans-court',order:5,name:"The Artisan's Court",destination:'Creative portfolio',section:'Design & art direction',content:'artisans-court',bounds:[-16,-6,24.5,35.5],entrance:{x:-6,z:30},exit:{x:-3,z:30},trigger:{x:-9.4,z:32.8,r:2.4}},
 {id:'inner-residence',order:6,name:'The Inner Residence',destination:'About',section:'Personal introduction',content:'inner-residence',bounds:[23,33,-31.5,-20.5],entrance:{x:23,z:-26},exit:{x:20,z:-26},trigger:{x:25.4,z:-28.8,r:2.4}},
 {id:'contact-gate',order:7,name:'The Exit Gate',destination:'Contact',section:'Email · LinkedIn · GitHub · resume',content:'contact-gate',bounds:[-30,-23,-30,-22],entrance:{x:-27,z:-26},exit:{x:-21,z:-26},trigger:{x:-24,z:-26,r:2.4}}
];
window.AH_SPAWN={x:0,z:66};
window.AH_NAV={byId:id=>AH_ROOMS.find(r=>r.id===id),ordered:()=>[...AH_ROOMS].sort((a,b)=>a.order-b.order),
 inside:(r,x,z)=>x>=r.bounds[0]&&x<=r.bounds[1]&&z>=r.bounds[2]&&z<=r.bounds[3],
 validate(){const e=[],R=AH_ROOMS;const ids=new Set(R.map(r=>r.id));if(ids.size!==R.length)e.push('duplicate room id');const cs=new Set(R.map(r=>r.content));if(cs.size!==R.length)e.push('two rooms share one content section');
  for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i],b=R[j],d=Math.hypot(a.trigger.x-b.trigger.x,a.trigger.z-b.trigger.z);if(d<=a.trigger.r+b.trigger.r)e.push('triggers overlap: '+a.id+' / '+b.id)}
  R.forEach((r,i)=>{if(r.order!==i)e.push('order gap at '+r.id)});if(e.length)console.error('[nav] config errors:',e);return e}};
AH_NAV.validate();
