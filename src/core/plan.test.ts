import { describe, it, expect } from 'vitest';
import { planejar, type Pessoa, type Entrada } from './plan';
import { VH0 } from './constants';

const P = (n: string, gr: number, g: string, f: string, i: number): Pessoa => ({ id: i, n, idf: '', gr, g, f, ch: '' });
const entrada = (extra: Partial<Entrada> = {}, mes = '2026-11'): Entrada => ({
  mes, cota: 11000, heja: 0, vh: VH0.map(Number).map((v, i) => v || 80 + i),
  afs: [], cxs: [],
  pessoas: [
    P('ANA', 3, 'A', 'CHEFE DE SOCORRO', 0), P('BETO', 1, 'A', 'CHEFE DE SOCORRO', 1),
    P('CIRO', 4, 'A', 'CONDUTOR', 2), P('DAVI', 5, 'A', 'CONDUTOR', 3),
    P('EVA', 2, 'B', 'CHEFE DE SOCORRO', 4), P('FABIO', 4, 'B', 'CONDUTOR', 5),
    P('GIL', 2, 'C', 'CHEFE DE SOCORRO', 6), P('HUGO', 5, 'C', 'CONDUTOR', 7),
    P('IVO', 1, 'D', 'CHEFE DE SOCORRO', 8), P('JOAO', 4, 'D', 'CONDUTOR', 9),
  ],
  ...extra,
});

describe.each(['2026-02', '2026-04', '2026-05'])('mês %s', (mes) => {
  const R = planejar(entrada({}, mes));

  it('horas ordinárias fecham a meta de 5,7 h por dia', () => {
    R.pes.forEach((x: any) => expect(x.hO).toBe(x.P.meta));
  });
  it('no máximo um chefe de socorro e um condutor por dia', () => {
    for (let d = 0; d < R.D; d++) {
      const n = (f: string) => R.pesM.filter((_: any, k: number) => R.RL[k][d] === f).length;
      expect(n('CHEFE DE SOCORRO')).toBeLessThanOrEqual(1);
      expect(n('CONDUTOR')).toBeLessThanOrEqual(1);
    }
  });
  it('ninguém trabalha sem função e a escala não tem linha SEM FUNÇÃO', () => {
    R.pesM.forEach((x: any, k: number) => {
      for (let d = 0; d < R.D; d++) if (x.P.desc(d).length) expect(R.RL[k][d]).not.toBe('');
    });
    expect(R.map['']).toBeUndefined();
  });
  it('sempre há um plantão de 24h por dia', () => {
    expect(R.cv.semG).toEqual([]);
  });
});

describe('afastamentos', () => {
  it('cada dia afastado reduz a meta em 5,7 h (arredondando para cima)', () => {
    const R = planejar(entrada({ afs: [{ n: 'CIRO', t: 'FER', d: '10-24' }] }, '2026-05'));
    const ciro = R.pes.find((x: any) => x.n === 'CIRO');
    expect(ciro.P.meta).toBe(Math.ceil((342 * (31 - 15)) / 60 - 1e-9));
  });
});
