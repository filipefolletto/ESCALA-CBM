import { useState } from 'react';
import { GR, FUNCS, VH0, num } from './core/constants';
import { planejar, avisos, type Pessoa, type Item } from './core/plan';
import { AbsencePanel } from './components/AbsencePanel';
import { Stats, EscalaTable, MapaTable } from './components/Tables';

let uid = 1;
const nova = (n = '', gr = 4, g = '', f = 'SOCORRISTA'): Pessoa => ({ id: uid++, n, idf: '', gr, g, f, ch: '' });
// Mês atual no fuso local (toISOString usaria UTC e podia adiantar o mês).
const mesAtual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const DEMO = (): Pessoa[] => [
  nova('MÁRCIO', 4, 'A', 'CHEFE DE SOCORRO'), nova('JULIANO', 4, 'A', 'CONDUTOR'),
  nova('DIEGO', 4, 'B', 'CHEFE DE SOCORRO'), nova('RAFAEL', 5, 'B', 'CONDUTOR'),
  nova('HENRIQUE', 5, 'C', 'CHEFE DE SOCORRO'), nova('RENAN', 5, 'C', 'CONDUTOR'),
  nova('FILIPE', 3, 'D', 'CHEFE DE SOCORRO'), nova('VINÍCIUS', 3, 'D', 'CONDUTOR'),
];

export default function App() {
  const [mes, setMes] = useState(mesAtual);
  const [cota, setCota] = useState('11000');
  const [heja, setHeja] = useState('0');
  const [vh, setVh] = useState<string[]>(VH0);
  const [pessoas, setPessoas] = useState<Pessoa[]>(DEMO);
  const [afs, setAfs] = useState<Item[]>([]);
  const [cxs, setCxs] = useState<Item[]>([]);
  const [painel, setPainel] = useState<'af' | 'cx' | null>(null);
  const [R, setR] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const nomes = pessoas.map((p) => p.n.trim()).filter(Boolean);
  const condutores = pessoas.filter((p) => p.f === 'CONDUTOR' && p.n.trim()).map((p) => p.n.trim());
  const edita = (id: number, campo: keyof Pessoa, v: any) =>
    setPessoas((ps) => ps.map((p) => (p.id === id ? { ...p, [campo]: v } : p)));

  const gerar = () => {
    const res = planejar({ mes, cota: num(cota), heja: num(heja), vh: vh.map(num), pessoas, afs, cxs });
    if (!res) { setMsg('Adicione ao menos uma pessoa e informe o mês.'); return; }
    setMsg(''); setR(res);
  };
  const baixar = async () => {
    try {
      const { exportXlsx } = await import('./export/xlsx');
      await exportXlsx(R);
    } catch { setMsg('Não foi possível gerar o arquivo.'); }
  };

  return (
    <main>
      <h1>ESCALA – Mapa de horas</h1>
      <p className="sub">Plantão de 24h = 18h no dia + 6h no seguinte. Meta de 5,7 h por dia do mês; o que sobrar da cota vira horas extraordinárias.</p>

      <div className="card">
        <h2>Mês, cota e valor da hora</h2>
        <div className="row">
          <div style={{ flex: '0 1 170px' }}><label>Mês</label><input type="month" value={mes} onChange={(e) => setMes(e.target.value)} /></div>
          <div style={{ flex: '0 1 190px' }}><label>Cota total do mês (R$)</label><input type="number" step="0.01" value={cota} onChange={(e) => setCota(e.target.value)} /></div>
          <div style={{ flex: '0 1 220px' }}><label>HE já lançadas (R$)</label><input type="number" step="0.01" value={heja} onChange={(e) => setHeja(e.target.value)} /></div>
        </div>
        <label style={{ marginTop: 12 }}>Valor da hora extra por graduação (R$)</label>
        <div className="vh">
          {GR.map((g, i) => (
            <div key={g}><label>{g}</label>
              <input type="number" step="0.01" placeholder="R$" value={vh[i]} onChange={(e) => setVh((v) => v.map((x, k) => (k === i ? e.target.value : x)))} />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Pessoas</h2>
        {pessoas.map((p) => (
          <div className="p" key={p.id}>
            <select aria-label="Graduação" value={p.gr} onChange={(e) => edita(p.id, 'gr', +e.target.value)}>{GR.map((g, i) => <option key={g} value={i}>{g}</option>)}</select>
            <input className="nm" placeholder="Nome completo" aria-label="Nome" value={p.n} onChange={(e) => edita(p.id, 'n', e.target.value)} />
            <input className="id" placeholder="Id Func" aria-label="Id Func" value={p.idf} onChange={(e) => edita(p.id, 'idf', e.target.value)} />
            <input placeholder="Guarnição" aria-label="Guarnição" maxLength={20} value={p.g} onChange={(e) => edita(p.id, 'g', e.target.value)} />
            <select className="fn" aria-label="Função" value={p.f} onChange={(e) => edita(p.id, 'f', e.target.value)}>{FUNCS.map((f) => <option key={f}>{f}</option>)}</select>
            <input type="number" min={0} step={1} placeholder="Cota HE (h) – auto" aria-label="Cota HE em horas" value={p.ch} onChange={(e) => edita(p.id, 'ch', e.target.value)} />
            <button className="sec" type="button" title="Remover" onClick={() => setPessoas((ps) => ps.filter((x) => x.id !== p.id))}>×</button>
          </div>
        ))}
        <div className="acts">
          <button className="sec" type="button" onClick={() => setPessoas((ps) => [...ps, nova()])}>+ Adicionar pessoa</button>
          <button className="sec" type="button" onClick={() => setPainel(painel === 'af' ? null : 'af')}>Afastamentos</button>
          <button className="sec" type="button" onClick={() => setPainel(painel === 'cx' ? null : 'cx')}>Condutores extras</button>
        </div>
        {painel === 'cx' && (
          <AbsencePanel titulo="Condutores extras" nomes={condutores} rotuloItem="condutor extra" itens={cxs}
            onAdd={(i) => setCxs((l) => [...l, i])} onRemove={(i) => setCxs((l) => l.filter((_, k) => k !== i))} />
        )}
        {painel === 'af' && (
          <AbsencePanel titulo="Afastamentos" nomes={nomes} tipos={['FER', 'LTS', 'LGL']} rotuloItem="afastamento" itens={afs}
            onAdd={(i) => setAfs((l) => [...l, i])} onRemove={(i) => setAfs((l) => l.filter((_, k) => k !== i))} />
        )}
        <div className="acts">
          <button onClick={gerar}>Gerar escala</button>
          <button className="sec" disabled={!R} onClick={baixar}>Baixar .xlsx</button>
        </div>
        <div id="msg">{msg}</div>
      </div>

      {R && (
        <>
          <div className="card">
            <h2>Cota de horas extraordinárias</h2>
            <Stats R={R} />
            <div className="warn">{avisos(R).map((a, i) => <div key={i}>{a}</div>)}</div>
          </div>
          <div className="card"><h2>Escala (uma guarnição por dia)</h2><div className="scroll"><EscalaTable R={R} /></div></div>
          <div className="card">
            <h2>Mapa de horas</h2>
            <div className="scroll"><MapaTable R={R} /></div>
            <div className="leg">
              <span><i style={{ background: '#ff0' }} />Plantão 24h (18h + 6h)</span><span><i style={{ background: '#fff' }} />Outros turnos</span>
              <span><i style={{ background: '#fff2cc' }} />Extraordinárias</span><span><i style={{ background: '#ffe599' }} />FER</span>
              <span><i style={{ background: '#c9daf8' }} />LTS / LGL</span><span><i style={{ background: '#d9d9d9' }} />Fim de semana</span>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
