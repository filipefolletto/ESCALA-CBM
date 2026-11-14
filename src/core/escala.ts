// @ts-nocheck
// Monta a grade da escala: uma linha por função do dia, horários a partir das 08:00.
export const FORD=['CHEFE DE SOCORRO','CONDUTOR','CHEFE DE LINHA DIREITA','CHEFE DE LINHA ESQUERDA','AUXILIAR DE LINHA DIREITA','AUX DE LINHA ESQUERDA','SOCORRISTA',''];
export function escalaMap(pes,D,RL){
  const map={},best=(a,b)=>(a.x.gr-b.x.gr)||(a.x.i-b.x.i);
  const first=x=>x.n.split(/\s+/)[0];
  const hm2=h=>{const n=Math.round((((h%24)+24)%24)*60);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
  for(let d=0;d<D;d++){
    const by={};
    pes.forEach((x,k)=>{
      if(x.afc[d]){(by.AFAST=by.AFAST||{f24:[],ch:[]}).f24.push({x,c:x.afc[d]});return;}
      const f=RL[k][d]||x.f,b=by[f]=by[f]||{f24:[],ch:[]};
      if(x.P.st24(d))b.f24.push({x});
      else{const h=x.P.ph(d);if(h>0.001)b.ch.push({x,h});}
    });
    Object.keys(by).forEach(f=>{
      const b=by[f],ents=[];
      b.f24.sort(best).forEach(o=>ents.push(o.c?{cls:o.c,txt:[o.c,first(o.x)]}:{cls:'y',txt:['08:00 às 08:00',first(o.x)]}));
      const slots=[];
      b.ch.sort(best).forEach(o=>{
        const early=(d>0&&o.x.P.st24(d-1))?12:0;
        let s=slots.find(t=>Math.max(t.cur,early)+o.h<=24);
        if(!s){s={cur:0,it:[]};slots.push(s);}
        const st=Math.max(s.cur,early);s.cur=st+o.h;s.it.push({o,st});});
      slots.forEach(s=>ents.push({cls:s.it.every(i=>i.o.x.ext[d]>0&&!i.o.x.ord[d])?'x':'w',txt:s.it.map(i=>hm2(8+i.st)+' às '+hm2(8+i.st+i.o.h)+' '+first(i.o.x))}));
      ents.forEach((e,j)=>{const sl=map[f]=map[f]||[];sl[j]=sl[j]||Array(D).fill(null);sl[j][d]=e;});
    });
  }
  return map;}
