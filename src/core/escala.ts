// @ts-nocheck
// Monta a grade da escala: uma linha por função do dia, com os horários reais dos turnos.
import { LINHA } from './roles';

export const FORD=['CHEFE DE SOCORRO','CONDUTOR','CHEFE DE LINHA DIREITA','CHEFE DE LINHA ESQUERDA','AUXILIAR DE LINHA DIREITA','AUX DE LINHA ESQUERDA','SOCORRISTA',''];

export function escalaMap(pes,D,RL){
  const map={},best=(a,b)=>(a.x.gr-b.x.gr)||(a.x.i-b.x.i);
  const first=x=>x.n.split(/\s+/)[0];
  const hm2=h=>{const n=Math.round((((h%24)+24)%24)*60);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
  // Junta os turnos parciais em grupos de até 24h, sem sobrepor horários dentro
  // do grupo. Se dois turnos coincidem no horário, o segundo abre outra função
  // (mesmo que a primeira ainda não tenha chegado a 24h).
  const grupos=itens=>{
    const bins=[];
    itens.slice().sort((p,q)=>(p.a-q.a)||(q.h-p.h)||best(p,q)).forEach(o=>{
      let pick=-1,usedMax=-1;
      bins.forEach((b,bi)=>{
        if(b.some(i=>i.a+i.h>o.a&&o.a+o.h>i.a))return; // conflito de horário
        const used=b.reduce((a,i)=>a+i.h,0);
        if(used+o.h<=24+1e-9&&used>usedMax){pick=bi;usedMax=used;}
      });
      if(pick<0)bins.push([o]);else bins[pick].push(o);
    });
    return bins;
  };
  // Separa em linhas visuais apenas os turnos que se sobrepõem (posições reais, sem reposicionar).
  const linhas=itens=>{
    const rows=[];
    itens.slice().sort((p,q)=>(p.a-q.a)||(q.h-p.h)||best(p,q)).forEach(o=>{
      const ri=rows.findIndex(its=>its.every(i=>i.a+i.h<=o.a||o.a+o.h<=i.a));
      if(ri<0)rows.push([o]);else rows[ri].push(o);
    });
    return rows;
  };
  // Uma pessoa = uma linha na célula: quando ela tem mais de um turno no dia,
  // mostra só o primeiro início e o último fim. As horas reais ficam em `h`/`ivs`
  // para a conferência não somar o intervalo entre os turnos como se fosse trabalho.
  const render=its=>{
    its.sort((p,q)=>p.a-q.a);
    const por=new Map();
    its.forEach(i=>{
      const k=first(i.x),g=por.get(k)||{ini:i.a,fim:i.a+i.h,h:0,iv:[],x:i.x};
      g.ini=Math.min(g.ini,i.a);g.fim=Math.max(g.fim,i.a+i.h);
      g.h+=i.h;g.iv.push([i.a,i.a+i.h]);por.set(k,g);
    });
    const gs=[...por.values()].sort((a,b)=>a.ini-b.ini);
    return {
      cls:its.every(i=>i.ex)?'x':'w',
      txt:gs.map(g=>hm2(g.ini)+' às '+hm2(g.fim)+' '+first(g.x)),
      h:gs.reduce((a,g)=>a+g.h,0),
      ivs:gs.reduce((a,g)=>a.concat(g.iv),[]),
    };
  };
  for(let d=0;d<D;d++){
    const by={};
    pes.forEach((x,k)=>{
      if(x.afc[d]){(by.AFAST=by.AFAST||{f24:[],ch:[]}).f24.push({x,c:x.afc[d]});return;}
      const f=RL[k][d]||x.f,b=by[f]=by[f]||{f24:[],ch:[]};
      // Turnos que começam neste dia, nos horários reais (o mapa divide o plantão em 18h + 6h).
      (x.P.segs?x.P.segs():[]).forEach(g=>{
        if(g.s<0||Math.floor(g.s/24)!==d)return;
        if(g.b===24){b.f24.push({x});return;}
        b.ch.push({x,f,h:g.e-g.s,a:g.s-24*d,ex:g.t==='x'});
      });
    });
    // Reagrupa os turnos parciais das funções de linha: junta todos e só reabre uma
    // função depois de somar 24h no grupo. O nome da função que tinha mais horas no
    // grupo é mantido; as demais usam os nomes livres.
    const lineCh=[];
    LINHA.forEach(f=>{const b=by[f];if(b&&b.ch.length){lineCh.push(...b.ch);b.ch=[];}});
    // Funções de linha já tomadas por um plantão de 24h não recebem turnos parciais.
    const usados=new Set(LINHA.filter(f=>by[f]&&by[f].f24.length));
    const livres=LINHA.filter(f=>!usados.has(f));
    // Se os grupos passarem das funções livres, distribui entre as já usadas (nunca numa com 24h).
    const extra=livres.length?livres[livres.length-1]:LINHA[LINHA.length-1];
    const total=b=>b.reduce((a,i)=>a+i.h,0);
    const prefere=its=>{
      const peso={};its.forEach(it=>{peso[it.f]=(peso[it.f]||0)+it.h;});
      return Object.keys(peso).sort((a,b)=>(peso[b]-peso[a])||(LINHA.indexOf(a)-LINHA.indexOf(b)))[0];
    };
    // Grupos com mais horas escolhem o nome da função primeiro (evita perder a
    // preferência do grupo maior quando dois grupos querem o mesmo nome).
    const usadas=[];
    grupos(lineCh).sort((p,q)=>total(q)-total(p)).forEach(bin=>{
      const pref=prefere(bin);
      let f;
      if(livres.length){
        const k0=livres.indexOf(pref);
        f=livres.splice(k0<0?0:k0,1)[0];usadas.push(f);
      }else if(usadas.length){
        // Mais grupos que funções livres: prefere uma função usada que não conflite no horário;
        // se todas conflitarem, distribui entre as que têm menos linhas (conflito inevitável).
        const cabe=f=>!(by[f].f24||[]).length&&bin.every(o=>(by[f].rows||[]).flat().every(i=>i.a+i.h<=o.a||o.a+o.h<=i.a));
        const cand=usadas.filter(cabe),pool=cand.length?cand:usadas;
        f=pool.slice().sort((a,b)=>((by[a].rows||[]).length-(by[b].rows||[]).length)||(LINHA.indexOf(a)-LINHA.indexOf(b)))[0];
      }else f=extra;
      by[f]=by[f]||{f24:[],ch:[]};(by[f].rows=by[f].rows||[]).push(...linhas(bin));
    });
    Object.keys(by).forEach(f=>{
      const b=by[f],ents=[];
      b.f24.sort(best).forEach(o=>ents.push(o.c?{cls:o.c,txt:[o.c,first(o.x)]}:{cls:'y',txt:['08:00 às 08:00',first(o.x)],h:24,ivs:[[8,32]]}));
      (b.rows||[]).concat(linhas(b.ch)).forEach(its=>ents.push(render(its)));
      ents.forEach((e,j)=>{const sl=map[f]=map[f]||[];sl[j]=sl[j]||Array(D).fill(null);sl[j][d]=e;});
    });
  }
  return map;}

// Confere, por dia e por função, quantas horas a grade cobre e se há conflito
// de horário. A função está "fechada" quando soma 24h E nenhum turno se
// sobrepõe a outro na mesma função. Plantão de 24h conta como 24h; turnos que
// cruzam a meia-noite contam inteiros no dia em que começam (como na grade).
export function funcoes24(map,D){
  const out={};
  Object.keys(map).forEach(f=>{
    if(!f||f==='AFAST')return;
    const h=Array(D).fill(0),ints=Array.from({length:D},()=>[]);
    (map[f]||[]).forEach(row=>row.forEach((o,d)=>{
      if(!o||!o.txt)return;
      // A grade agrupa os turnos da mesma pessoa; use os intervalos reais e a
      // soma exata das horas, e não o intervalo aparente (que inclui pausas).
      if(o.h!==undefined){
        h[d]+=o.h;
        (o.ivs||[]).forEach(([a,b])=>ints[d].push([a*60,b*60]));
        return;
      }
      if(o.txt.length===2&&o.txt[0]==='08:00 às 08:00'){h[d]+=24;ints[d].push([8,32]);return;}
      o.txt.forEach(t=>{
        const m=t.match(/^(\d\d):(\d\d) às (\d\d):(\d\d) /);
        if(!m)return;
        const ini=+m[1]*60+ +m[2],fim=+m[3]*60+ +m[4];
        const dur=(((fim-ini+1440)%1440)||1440)/60;
        h[d]+=dur;ints[d].push([ini,ini+dur*60]);
      });
    }));
    out[f]=h.map((v,d)=>{
      const iv=ints[d].slice().sort((a,b)=>a[0]-b[0]);
      // Dois turnos no mesmo horário na mesma função = conflito.
      const conflito=iv.some((x,i)=>i>0&&x[0]<iv[i-1][1]);
      const ok=v>=24-1e-9;
      return {h:v,ok,conflito,fechada:ok&&!conflito};
    });
  });
  return out;}
