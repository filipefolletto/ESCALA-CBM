// @ts-nocheck
import ExcelJS from 'exceljs';
import {GR,LET} from '../core/constants';
import {FORD,funcoes24} from '../core/escala';

// Gera o .xlsx (folhas MapaDeHoras, Escala e Carga horária) e baixa no navegador.
export async function exportXlsx(R){
  const pes=R.pesM,D=R.D,y=R.y,m=R.m;
  const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('MapaDeHoras');
    const th={style:'thin',color:{argb:'FF000000'}},bx={top:th,left:th,bottom:th,right:th};
    const F=a=>({type:'pattern',pattern:'solid',fgColor:{argb:a}});
    const colL=n=>{let s='';while(n>0){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);}return s;};
    const SS=w=>(r,c,v,o={})=>{const k=w.getCell(r,c);if(v!==undefined)k.value=v;k.font={name:'Arial',size:o.sz||10,bold:!!o.b,color:o.col?{argb:o.col}:undefined};k.alignment={horizontal:o.al||'center',vertical:'middle',wrapText:!!o.wrap};k.border=bx;if(o.f)k.fill=F(o.f);if(o.nf)k.numFmt=o.nf;return k;};const S=SS(ws);
    const c0=6,cM=c0+D,cR=cM+1,cH=cM+2,cT=cM+3,cC=cM+4,BRL='[$R$] #,##0.00';
    ['','Nível','Nome Completo','Id Func','Horas'].forEach((t,i)=>{ws.mergeCells(1,i+1,2,i+1);S(1,i+1,t,{b:1,f:'FF999999'});S(2,i+1,undefined,{f:'FF999999'});});
    for(let d=0;d<D;d++){S(1,c0+d,d+1,{b:1,f:'FF999999'});const w=new Date(y,m,d+1).getDay();S(2,c0+d,LET[w],{f:(w===0||w===6)?'FFD9D9D9':undefined});}
    [['Mês',cM],['Ext. (R$)',cR],['Ext. (h)',cH],['Total',cT],['COTA HE',cC]].forEach(([t,c])=>{ws.mergeCells(1,c,2,c);S(1,c,t,{b:1,f:'FF999999'});S(2,c,undefined,{f:'FF999999'});});
    
    const vr0=4+3*pes.length+1;
    let r=4,seq=0;const rc=[];
    pes.forEach(x=>{
      
      seq++;
      [[1,seq],[2,GR[x.gr]],[3,x.n],[4,x.id]].forEach(([c,v])=>{ws.mergeCells(r,c,r+1,c);S(r,c,v,{f:'FFEFEFEF',al:c===3?'left':'center'});S(r+1,c,undefined,{f:'FFEFEFEF'});});
      S(r,5,'Ordinárias',{f:'FFEFEFEF'});S(r+1,5,'Extraordinárias',{f:'FFEFEFEF'});
      for(let d=0;d<D;d++){
        const v=x.ord[d],e=x.ext[d],c=x.afc[d],w=new Date(y,m,d+1).getDay(),we=(w===0||w===6);
        if(c)S(r,c0+d,c,{b:1,f:c==='FER'?'FFFFE599':'FFC9DAF8'});
        else S(r,c0+d,v>0?v:undefined,{b:v>0,f:v>0?(x.P.y24[d]?'FFFFFF00':'FFFFFFFF'):(we?'FFD9D9D9':'FFFFFFFF'),nf:'0.0#'});
        S(r+1,c0+d,e>0?e:undefined,{f:e>0?'FFFFF2CC':(we?'FFD9D9D9':'FFFFFFFF'),nf:'0.0#'});}
      const L1=colL(c0),L2=colL(c0+D-1);
      ws.mergeCells(r,cM,r+1,cM);S(r,cM,x.P.meta);S(r+1,cM);
      ws.mergeCells(r,cH,r+1,cH);S(r,cH,{formula:`SUM(${L1}${r+1}:${L2}${r+1})`,result:x.hX});S(r+1,cH);
      ws.mergeCells(r,cR,r+1,cR);S(r,cR,{formula:`${colL(cH)}${r}*$C$${vr0+1+x.gr}`,result:x.hX*x.vh},{nf:BRL});S(r+1,cR);
      ws.mergeCells(r,cT,r+1,cT);S(r,cT,{formula:`SUM(${L1}${r}:${L2}${r})+${colL(cH)}${r}`,result:x.hO+x.hX},{b:1});S(r+1,cT);
      ws.mergeCells(r,cC,r+1,cC);S(r,cC,x.cotaH);S(r+1,cC);
      rc.push(`${colL(cR)}${r}`);r+=3;});
    S(vr0,2,'Nível',{b:1,f:'FF999999'});S(vr0,3,'VALOR HE (R$/h)',{b:1,f:'FF999999'});
    GR.forEach((g,k)=>{S(vr0+1+k,2,g);S(vr0+1+k,3,R.vh[k]||undefined,{nf:BRL});});
    const sr=vr0+GR.length+2;
    [['COTA TOTAL',R.cota],['HE JÁ LANÇADAS',R.heja],['HE DISTRIBUÍDAS (R$)',{formula:rc.join('+')||'0',result:R.heVal}],['COTA RESTANTE',R.rest],['COTA POR PESSOA',R.per]].forEach(([t,v],i)=>{S(sr+i,2,t,{b:1,al:'left'});ws.mergeCells(sr+i,2,sr+i,3);S(sr+i,4,v,{nf:BRL});ws.mergeCells(sr+i,4,sr+i,5);});
    ws.getColumn(1).width=4;ws.getColumn(2).width=16;ws.getColumn(3).width=42;ws.getColumn(4).width=10;ws.getColumn(5).width=15;
    for(let d=0;d<D;d++)ws.getColumn(c0+d).width=4.5;
    [cM,cH,cT,cC].forEach(c=>ws.getColumn(c).width=9);ws.getColumn(cR).width=13;
    ws.views=[{state:'frozen',xSplit:4,ySplit:2}];
    ws.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};
    
    const w3=wb.addWorksheet('Escala'),E3=SS(w3),mp=R.map,c24=funcoes24(mp,D);
    const hf=h=>String(Math.round(h*100)/100).replace('.',',');
    w3.mergeCells(1,1,1,D+1);E3(1,1,'ESCALA DE SERVIÇO - '+new Date(y,m,1).toLocaleString('pt-BR',{month:'long'}).toUpperCase()+'/'+y,{b:1,sz:13});
    E3(2,1,'Função do dia',{b:1,f:'FF999999'});for(let d=0;d<D;d++)E3(2,2+d,d+1,{b:1,f:'FF999999'});
    let q3=3;
    [...FORD,'AFAST'].filter(f=>mp[f]).forEach(f=>{
      mp[f].forEach((row,j)=>{
        E3(q3,1,j?'':(f==='AFAST'?'AFASTAMENTOS':(f||'SEM FUNÇÃO')),{b:1,al:'left',f:'FFEFEFEF'});
        for(let d=0;d<D;d++){const o=row[d],w=new Date(y,m,d+1).getDay();
          if(o)E3(q3,2+d,o.txt.join('\n'),{b:1,wrap:1,sz:9,f:o.cls==='FER'?'FFFFE599':(o.cls==='LTS'||o.cls==='LGL')?'FFC9DAF8':o.cls==='y'?'FFFFFF00':o.cls==='x'?'FFFFF2CC':'FFFFFFFF'});
          else E3(q3,2+d,undefined,{f:(w===0||w===6)?'FFD9D9D9':'FFFFFFFF'});}
        w3.getRow(q3).height=54;q3++;});
      if(f==='AFAST'||!c24[f])return;
      // Conferência: 24h fechadas (✓) ou o total que falta (✗) em cada dia.
      E3(q3,1,'Conferência 24h',{al:'left',sz:9,col:'FF6B7280',f:'FFEFEFEF'});
      for(let d=0;d<D;d++){
        const c=c24[f][d],icone=c.conflito?'⚠':c.ok?'✓':'✗';
        E3(q3,2+d,c.h>0?`${hf(c.h)}h ${icone}`:undefined,{b:1,sz:9,col:c.h<=0?undefined:(c.conflito?'FF8A5A00':c.ok?'FF137333':'FFA50E0E'),f:c.h<=0?'FFFFFFFF':(c.conflito?'FFFFF3CD':c.ok?'FFE6F4EA':'FFFCE8E6')});
      }
      w3.getRow(q3).height=16;q3++;
    });
    w3.getColumn(1).width=30;for(let d=0;d<D;d++)w3.getColumn(2+d).width=14;
    w3.views=[{state:'frozen',xSplit:1,ySplit:2}];w3.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};
    const w2=wb.addWorksheet('Carga horária');
    w2.addRow(['Nome','Graduação','Guarnição','Função','Ordinárias (h)','Extras (h)','Total (h)','Meta (h)','Valor HE (R$)']);
    w2.getRow(1).eachCell(c=>{c.font={bold:true};c.fill=F('FFE5E7EB');c.border=bx;c.alignment={horizontal:'center'};});
    pes.forEach(x=>{const row=w2.addRow([x.n,GR[x.gr],x.g,x.f,x.hO,x.hX,x.hO+x.hX,x.P.meta,x.hX*x.vh]);row.eachCell(c=>{c.border=bx;});row.getCell(9).numFmt=BRL;});
    w2.columns.forEach((c,k)=>c.width=k===0?34:k===3?28:14);
  const buf=await wb.xlsx.writeBuffer();
  const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`mapa-${y}-${String(m+1).padStart(2,'0')}.xlsx`;a.click();URL.revokeObjectURL(a.href);
}
