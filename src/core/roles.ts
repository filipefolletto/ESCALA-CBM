// @ts-nocheck
// Função do dia de cada pessoa e verificação de cobertura (um chefe de socorro e um condutor por dia).
export const LINHA=['CHEFE DE LINHA DIREITA','CHEFE DE LINHA ESQUERDA','AUXILIAR DE LINHA DIREITA','AUX DE LINHA ESQUERDA'];
export function roles(pes,D){
  const RL=pes.map(()=>Array(D).fill(''));
  const best=(a,b)=>(a.gr-b.gr)||(a.i-b.i);
  for(let d=0;d<D;d++){
    const on=pes.map((x,k)=>({x,k})).filter(o=>(o.x.P.starts(d)||(d===0&&o.x.P.carry()))&&!o.x.afc[d]);
    const pool=[],done=new Set();
    ['CHEFE DE SOCORRO','CONDUTOR'].forEach(f=>{
      const c=on.filter(o=>o.x.f===f&&!o.x.P.isEx(d)),c24=c.filter(o=>o.x.P.st24(d));
      const win=(c24.length?c24:c).slice().sort((a,b)=>best(a.x,b.x))[0];
      c.forEach(o=>{done.add(o.k);if(o===win)RL[o.k][d]=f;else pool.push(o);});
      on.filter(o=>o.x.f===f&&o.x.P.isEx(d)).forEach(o=>{done.add(o.k);RL[o.k][d]=f;});});
    on.forEach(o=>{if(done.has(o.k))return;if(o.x.P.hasXp(d)&&!o.x.P.st24(d))pool.push(o);else RL[o.k][d]=o.x.f;});
    pool.sort((a,b)=>best(a.x,b.x)).forEach((o,j)=>{RL[o.k][d]=LINHA[Math.min(j,LINHA.length-1)];});
  }
  for(let d=1;d<D;d++)pes.forEach((x,k)=>{if(!RL[k][d]&&x.P.tail(d))RL[k][d]=RL[k][d-1];});
  return RL;}
export function cover(pes,D,RL){
  
  const semG=[],multG=[],semCS=[],semCD=[],multCS=[],multCD=[];
  for(let d=0;d<D;d++){
    const on24=pes.filter(x=>x.P.st24(d)&&!x.afc[d]);
    if(!on24.length){semG.push(d+1);continue;}
    const base=on24.filter(x=>!x.P.isEx(d));
    if(new Set(base.map(x=>x.g||'—')).size>1)multG.push(d+1);
    const w=pes.filter(x=>x.P.starts(d)&&!x.afc[d]&&!x.P.isEx(d));
    const csN=w.filter(x=>x.f==='CHEFE DE SOCORRO').length,cdN=w.filter(x=>x.f==='CONDUTOR').length;
    if(!pes.some((x,k)=>RL[k][d]==='CHEFE DE SOCORRO'))semCS.push(d+1);
    if(!pes.some((x,k)=>RL[k][d]==='CONDUTOR'))semCD.push(d+1);
    if(csN>1)multCS.push(d+1);if(cdN>1)multCD.push(d+1);}
  return{semG,multG,semCS,semCD,multCS,multCD,g:[],cs:[],cd:[]};}
