import { GR, LET, fmt, brl } from '../core/constants';
import { FORD } from '../core/escala';

const wkDe = (R: any) => (d: number) => { const w = new Date(R.y, R.m, d + 1).getDay(); return w === 0 || w === 6; };

export function Stats({ R }: { R: any }) {
  const itens: [string, string][] = [
    ['Horas ordinárias (todos)', fmt(R.ordTot) + ' h'], ['Cota total', brl(R.cota)], ['HE já lançadas', brl(R.heja)],
    ['Cota restante', brl(R.rest)], ['Cota por pessoa (automáticas)', brl(R.per)],
    ['Cotas editadas', `${R.nEd} pessoa(s) · ${brl(R.edCost)}`], ['HE distribuídas', brl(R.heVal)],
  ];
  return (
    <div className="stats">
      {itens.map(([a, b]) => <div className="st" key={a}><b>{b}</b><span>{a}</span></div>)}
    </div>
  );
}

export function EscalaTable({ R }: { R: any }) {
  const wk = wkDe(R), mp = R.map;
  const chaves = [...FORD, 'AFAST'].filter((f) => mp[f]);
  const dias = Array.from({ length: R.D }, (_, d) => d);
  return (
    <table className="m" id="escala">
      <thead>
        <tr>
          <th>Função do dia</th>
          {dias.map((d) => <th key={d}>{d + 1}<small style={{ color: '#fff' }}>{LET[new Date(R.y, R.m, d + 1).getDay()]}</small></th>)}
        </tr>
      </thead>
      <tbody>
        {chaves.flatMap((f) => mp[f].map((row: any[], j: number) => (
          <tr key={f + j}>
            <td className="base nm">{j ? '' : f === 'AFAST' ? 'AFASTAMENTOS' : f || 'SEM FUNÇÃO'}</td>
            {dias.map((d) => {
              const o = row[d];
              return <td key={d} className={'c ' + (o ? o.cls : wk(d) ? 'g' : 'w')}>{o?.txt.map((t: string, i: number) => <div key={i}>{t}</div>)}</td>;
            })}
          </tr>
        )))}
      </tbody>
    </table>
  );
}

export function MapaTable({ R }: { R: any }) {
  const wk = wkDe(R), pes = R.pesM;
  const dias = Array.from({ length: R.D }, (_, d) => d);
  return (
    <table className="m" id="mapa">
      <thead>
        <tr>
          {['#', 'Nível', 'Nome Completo', 'Id Func', 'Horas'].map((t) => <th rowSpan={2} key={t}>{t}</th>)}
          {dias.map((d) => <th key={d}>{d + 1}</th>)}
          {['Mês', 'Ext. (R$)', 'Ext. (h)', 'Total', 'COTA HE'].map((t) => <th rowSpan={2} key={t}>{t}</th>)}
        </tr>
        <tr>{dias.map((d) => <th key={d}>{LET[new Date(R.y, R.m, d + 1).getDay()]}</th>)}</tr>
      </thead>
      <tbody>
        {pes.flatMap((x: any, i: number) => [
          <tr key={x.n + 'o'}>
            <td className="base" rowSpan={2}>{i + 1}</td>
            <td className="base" rowSpan={2}>{GR[x.gr]}</td>
            <td className="base nm" rowSpan={2}>{x.n}{x.f && <small>{x.f}</small>}</td>
            <td className="base" rowSpan={2}>{x.idf}</td>
            <td className="base">Ordinárias</td>
            {dias.map((d) => {
              const v = x.ord[d], c = x.afc[d];
              const cls = c ? c : v > 0 ? (x.P.y24[d] ? 'y' : 'w') : wk(d) ? 'g' : 'w';
              return <td key={d} className={'c ' + cls}>{c || (v > 0 ? fmt(v) : '')}</td>;
            })}
            <td rowSpan={2}>{x.P.meta}</td>
            <td rowSpan={2}>{brl(x.hX * x.vh)}</td>
            <td rowSpan={2}>{fmt(x.hX)}</td>
            <td rowSpan={2}><b>{fmt(x.hO + x.hX)}</b></td>
            <td rowSpan={2}>{x.cotaH}</td>
          </tr>,
          <tr key={x.n + 'x'}>
            <td className="base">Extraordinárias</td>
            {dias.map((d) => {
              const e = x.ext[d];
              return <td key={d} className={'c ' + (e > 0 ? 'x' : wk(d) ? 'g' : 'w')}>{e > 0 ? fmt(e) : ''}</td>;
            })}
          </tr>,
        ])}
      </tbody>
    </table>
  );
}
