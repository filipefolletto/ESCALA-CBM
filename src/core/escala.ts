// @ts-nocheck
// Monta a grade da escala: uma linha por função do dia, horários a partir das 08:00.
export const FORD=['CHEFE DE SOCORRO','CONDUTOR','CHEFE DE LINHA DIREITA','CHEFE DE LINHA ESQUERDA','AUXILIAR DE LINHA DIREITA','AUX DE LINHA ESQUERDA','SOCORRISTA',''];
export function escalaMap(pes,D,RL){
  const map={},best=(a,b)=>(a.x.gr-b.x.gr)||(a.x.i-b.x.i);
  const first=x=>x.n.split(/\s+/)[0];
  const hm2=h=>{const n=Math.round((((h%24)+24)%24)*60);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
  // Menor início >= e em que [s, s+h] caiba sem sobrepor os turnos já postos na linha (limite: 24h).
  const fit=(its,e,h)=>{const occ=its.map(i=>[i.st,i.st+i.o.h]).sort((a,b)=>a[0]-b[0]);let s=e;for(const[a,z]of occ){if(s+h<=a)break;if(s<z)s=z;}return s+h<=24?s:-1;};
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
      // Antes de abrir uma nova linha da função, completa as 24h da linha existente:
      // turnos rígidos primeiro (quem teve 24h no dia anterior só começa após 12h de descanso),
      // depois os maiores; escolhe a linha que fica mais cheia e só abre outra se não couber.
      const early=o=>(d>0&&o.x.P.st24(d-1))?12:0;
      const rows=[];
      b.ch.slice().sort((p,q)=>(early(q)-early(p))||(q.h-p.h)||best(p,q)).forEach(o=>{
        const e=early(o);
        let pick=-1,at=-1,usedMax=-1;
        rows.forEach((its,ri)=>{
          const s=fit(its,e,o.h);
          if(s<0)return;
          const used=its.reduce((a,i)=>a+i.o.h,0);
          if(used>usedMax||(used===usedMax&&s<at)){pick=ri;at=s;usedMax=used;}
        });
        if(pick<0)rows.push([{o,st:e}]);
        else rows[pick].push({o,st:at});
      });
      rows.forEach(its=>{
        its.sort((p,q)=>p.st-q.st);
        ents.push({cls:its.every(i=>i.o.x.ext[d]>0&&!i.o.x.ord[d])?'x':'w',txt:its.map(i=>hm2(8+i.st)+' às '+hm2(8+i.st+i.o.h)+' '+first(i.o.x))});
      });
      ents.forEach((e,j)=>{const sl=map[f]=map[f]||[];sl[j]=sl[j]||Array(D).fill(null);sl[j][d]=e;});
    });
  }
  return map;}
