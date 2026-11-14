import { useState } from 'react';
import type { Item } from '../core/plan';

interface Props {
  titulo: string;
  nomes: string[];
  tipos?: string[];
  rotuloItem: string;
  itens: Item[];
  onAdd: (i: Item) => void;
  onRemove: (idx: number) => void;
}

// Painel usado para Afastamentos (com tipo) e Condutores extras (sem tipo).
export function AbsencePanel({ titulo, nomes, tipos, rotuloItem, itens, onAdd, onRemove }: Props) {
  const [n, setN] = useState('');
  const [t, setT] = useState(tipos?.[0] ?? '');
  const [d, setD] = useState('');
  const nome = nomes.includes(n) ? n : nomes[0] ?? '';

  return (
    <div className="painel" aria-label={titulo}>
      <div className="row">
        <div style={{ flex: '2 1 200px' }}>
          <label>Pessoa</label>
          <select value={nome} onChange={(e) => setN(e.target.value)}>
            {nomes.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        {tipos && (
          <div style={{ flex: '1 1 110px' }}>
            <label>Tipo</label>
            <select value={t} onChange={(e) => setT(e.target.value)}>{tipos.map((x) => <option key={x}>{x}</option>)}</select>
          </div>
        )}
        <div style={{ flex: '2 1 200px' }}>
          <label>Dias (ex.: 10-20, 25)</label>
          <input value={d} onChange={(e) => setD(e.target.value)} />
        </div>
        <div style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
          <button type="button" disabled={!nome || !d.trim()} onClick={() => { onAdd({ n: nome, t: tipos ? t : undefined, d: d.trim() }); setD(''); }}>
            Adicionar
          </button>
        </div>
      </div>
      <div>
        {itens.map((a, i) => (
          <span className="afi" key={i}>
            {a.n} · {a.t ?? rotuloItem} · dias {a.d}
            <button type="button" title="Remover" onClick={() => onRemove(i)}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}
