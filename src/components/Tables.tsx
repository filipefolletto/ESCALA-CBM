import { GR, LET, fmt, brl } from '../core/constants';
import { FORD, funcoes24 } from '../core/escala';

const wkDe = (R: any) => (d: number) => { const w = new Date(R.y, R.m, d + 1).getDay(); return w === 0 || w === 6; };

export function Stats({ R }: { R: any }) {
  const itens: [string, string][] = [
    ['Horas ordinárias (todos)', fmt(R.ordTot) + ' h'], ['Cota total', brl(R.cota)], ['HE já lançadas', brl(R.heja)],
    ['Cota restante', brl(R.rest)], ['Cota por pessoa (automáticas)', brl(R.per)],
    ['Cotas editadas', `${R.nEd} pessoa(s) · ${brl(R.edCost)}`], ['HE distribuídas', brl(R.heVal)],
    ['Turnos realocados para fechar 24h', String(R.comp?.trocas ?? 0)],
    ['Funções/dia ainda com falta', String(R.lac?.length ?? 0)],
  ];
  return (
    <div className="stats">
      {itens.map(([a, b]) => <div className="st" key={a}><b>{b}</b><span>{a}</span></div>)}
    </div>
  );
}

export function EscalaTable({ R }: { R: any }) {
  const wk = wkDe(R), mp = R.map, c24 = funcoes24(mp, R.D);
  const chaves = [...FORD, 'AFAST'].filter((f) => mp[f]);
  const dias = Array.from({ length: R.D }, (_, d) => d);
  const hf = (h: number) => String(Math.round(h * 100) / 100).replace('.', ',');
  return (
    <table className="m" id="escala">
      <thead>
        <tr>
          <th>Função do dia</th>
          {dias.map((d) => <th key={d}>{d + 1}<small style={{ color: '#fff' }}>{LET[new Date(R.y, R.m, d + 1).getDay()]}</small></th>)}
        </tr>
      </thead>
      <tbody>
        {chaves.flatMap((f) => {
          const linhas = mp[f].map((row: any[], j: number) => (
            <tr key={f + j}>
              <td className="base nm">{j ? '' : f === 'AFAST' ? 'AFASTAMENTOS' : f || 'SEM FUNÇÃO'}</td>
              {dias.map((d) => {
                const o = row[d];
                return <td key={d} className={'c ' + (o ? o.cls : wk(d) ? 'g' : 'w')}>{o?.txt.map((t: string, i: number) => <div key={i}>{t}</div>)}</td>;
              })}
            </tr>
          ));
          if (f === 'AFAST' || !c24[f]) return linhas;
          // Conferência: total de horas da função no dia; 24h = função fechada.
          return [...linhas, (
            <tr key={f + '24'} className="tot">
              <td className="base nm">Conferência 24h</td>
              {dias.map((d) => {
                const c = c24[f][d];
                const cls = c.h <= 0 ? 'w' : c.conflito ? 'conf' : c.ok ? 'ok' : 'no';
                const icone = c.conflito ? '⚠' : c.ok ? '✓' : '✗';
                const falta = c.h > 0 && !c.ok ? `Faltam ${hf(24 - c.h)} h` : '';
                const titulo = c.conflito ? ['Conflito de horário na função', falta].filter(Boolean).join(' · ') : (falta || undefined);
                return (
                  <td key={d} className={'c ' + cls} title={titulo}>
                    {c.h > 0 ? `${hf(c.h)}h ${icone}` : ''}
                  </td>
                );
              })}
            </tr>
          )];
        })}
      </tbody>
    </table>
  );
}

export function MapaTable({ R }: { R: any }) {
  const wk = wkDe(R), pes = R.pesM;
  const dias = Array.from({ length: R.D }, (_, d) => d);
  // Os totais vêm das próprias linhas do mapa: "Mês" soma a linha de cima
  // (Ordinárias) e "Ext." soma a linha de baixo (Extraordinárias).
  const soma = (v: number[]) => v.reduce((a, b) => a + (b || 0), 0);
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
            <td rowSpan={2}>{fmt(soma(x.ord))}</td>
            <td rowSpan={2}>{brl(soma(x.ext) * x.vh)}</td>
            <td rowSpan={2}>{fmt(soma(x.ext))}</td>
            <td rowSpan={2}><b>{fmt(soma(x.ord) + soma(x.ext))}</b></td>
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
