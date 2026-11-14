// @ts-nocheck
// Regra de escala: plantões de 24h (18h + 6h), complementos de 12h/6h e horas extras.
// Todos os cálculos usam horas corridas desde o início do mês.
export const PD=342;
export function dias(str,D){const s=new Set<number>();String(str).split(/[,;\s]+/).filter(Boolean).forEach(t=>{const[a,b]=t.split('-').map(Number);if(!a)return;for(let d=a;d<=(b||a);d++)if(d>=1&&d<=D)s.add(d-1);});return s;}
export function build(off,D,abs,xd){
  const L=24*D,sh=[];
  const meta=Math.ceil(PD*(D-abs.size)/60-1e-9);
  const clip=(s,e)=>Math.max(0,Math.min(e,L)-Math.max(s,0));
  const free=(s,e)=>{
    if(s<0||e>L)return false;
    for(const x of sh){if(s<x.e&&e>x.s)return false;if(x.b===24&&s>=x.e&&s<x.e+12)return false;}
    for(let d=Math.floor(s/24);d<=Math.floor((e-.001)/24);d++)if(abs.has(d))return false;
    return true;};
  const put=(len,t)=>{
    const c=sh.filter(x=>x.b===24).map(x=>x.e+12);
    for(let s=0;s+len<=L;s+=6)c.push(s);
    const s=c.find(s=>free(s,s+len));
    if(s===undefined)return 0;
    sh.push({s,e:s+len,t,b:len});return len;};
  let tot=0,ovf=false;
  if(off===3&&!abs.has(0)){sh.push({s:-18,e:6,t:'o',b:24});tot+=6;}
  for(let d=off;d<D;d+=4){
    if(abs.has(d))continue;
    const g=clip(24*d+6,24*d+30);
    if(ovf||tot+g>meta){ovf=true;sh.push({s:24*d+6,e:24*d+30,t:'x',b:24});continue;}
    sh.push({s:24*d+6,e:24*d+30,t:'o',b:24});tot+=g;}
  const xfail=[];(xd||[]).forEach(d=>{const s=24*d+6,e=s+24;if(abs.has(d)||sh.some(x=>(x.b===24&&x.s<e+12&&x.e+12>s)||(s<x.e&&e>x.s)))xfail.push(d+1);else sh.push({s,e,t:'x',b:24,ex:1});});
  let r=meta-tot;const pc=[];
  while(r>=12){pc.push(12);r-=12;}while(r>=6){pc.push(6);r-=6;}if(r>0)pc.push(r);
  pc.forEach(l=>{tot+=put(l,'o');});
  const ov=(x,d)=>clip(Math.max(x.s,24*d),Math.min(x.e,24*d+24));
  const cells=t=>Array.from({length:D},(_,d)=>sh.filter(x=>x.t===t).reduce((a,x)=>a+ov(x,d),0));
  const y24=Array.from({length:D},(_,d)=>sh.some(x=>x.b===24&&ov(x,d)>0));
  const hrs=t=>sh.filter(x=>x.t===t).reduce((a,x)=>a+clip(x.s,x.e),0);
  const hm=h=>{const n=Math.round(h*60);return String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
  const desc=d=>{const o=[];sh.slice().sort((a,b)=>a.s-b.s).forEach(x=>{
    if(x.b===24){if(x.s>=0&&Math.floor(x.s/24)===d)o.push('24h');else if(x.s<0&&d===0)o.push('00:00 às 06:00');return;}
    const a=Math.max(x.s,24*d),e=Math.min(x.e,24*d+24);if(e>a)o.push(hm(a-24*d)+' às '+hm(e-24*d));});return o;};
  const st24=d=>sh.some(x=>x.b===24&&x.s>=0&&Math.floor(x.s/24)===d);
  const st24b=d=>sh.some(x=>x.b===24&&!x.ex&&x.s>=0&&Math.floor(x.s/24)===d);
  const isEx=d=>sh.some(x=>x.ex&&x.b===24&&x.s>=0&&Math.floor(x.s/24)===d);
  const hasXp=d=>sh.some(x=>x.t==='x'&&x.b!==24&&ov(x,d)>0);
  const starts=d=>sh.some(x=>x.s>=0&&Math.floor(x.s/24)===d);
  const tail=d=>sh.some(x=>x.b!==24&&x.s>=0&&Math.floor(x.s/24)===d-1&&x.e>24*d);
  return{meta,put,cells,y24,hrs,desc,st24,st24b,xfail,isEx,hasXp,starts,tail,ph:d=>sh.filter(x=>x.b!==24).reduce((a,x)=>a+ov(x,d),0),carry:()=>sh.some(x=>x.s<0)};
}
