import { describe, it, expect } from 'vitest';
import { planejar, type Pessoa } from './plan';
import { VH0 } from './constants';
import { funcoes24 } from './escala';

const P = (n: string, gr: number, g: string, f: string, i: number): Pessoa => ({ id: i, n, idf: '', gr, g, f, ch: '' });
const entrada = (semCompletar?: boolean) => ({
  mes: '2026-11', cota: 11000, heja: 0,
  vh: VH0.map(Number).map((v: any, i: number) => v || 80 + i),
  pessoas: [
    P('MÁRCIO', 4, 'A', 'CHEFE DE SOCORRO', 0), P('JULIANO', 4, 'A', 'CONDUTOR', 1),
    P('DIEGO', 4, 'B', 'CHEFE DE SOCORRO', 2), P('RAFAEL', 5, 'B', 'CONDUTOR', 3),
    P('HENRIQUE', 5, 'C', 'CHEFE DE SOCORRO', 4), P('RENAN', 5, 'C', 'CONDUTOR', 5),
    P('FILIPE', 3, 'D', 'CHEFE DE SOCORRO', 6), P('VINÍCIUS', 3, 'D', 'CONDUTOR', 7),
  ],
  afs: [], cxs: [], semCompletar,
});
const conflitos = (R: any) => {
  const c = funcoes24(R.map, R.D);
  return Object.keys(c).reduce((n, f) => n + c[f].filter((v: any) => v.conflito).length, 0);
};

describe('completar 24h realocando horas', () => {
  const antes = planejar(entrada(true)) as any;
  const depois = planejar(entrada(false)) as any;

  it('não mexe na escala quando desligado', () => {
    expect(antes.comp.trocas).toBe(0);
  });

  it('move turnos existentes para fechar funções parciais', () => {
    expect(depois.comp.trocas).toBeGreaterThan(0);
    expect(depois.lac.length).toBeLessThan(antes.lac.length);
    // O dia 2, que antes tinha 12h em cada linha, fecha 24h depois da realocação.
    expect(funcoes24(depois.map, depois.D)['CHEFE DE LINHA DIREITA'][1].h).toBe(24);
  });

  it('não cria horas novas nem estoura a carga de ninguém', () => {
    const soma = (R: any) => R.pesM.reduce((a: number, x: any) => a + x.hO + x.hX, 0);
    expect(soma(depois)).toBe(soma(antes));
    depois.pesM.forEach((x: any, i: number) => {
      expect(x.hO).toBe(antes.pesM[i].hO);
      expect(x.hX).toBe(antes.pesM[i].hX);
      expect(x.hO).toBeLessThanOrEqual(x.P.meta);
      expect(x.hX).toBeLessThanOrEqual(x.cotaH);
    });
  });

  it('não gera conflito de horário nas funções', () => {
    expect(conflitos(antes)).toBe(0);
    expect(conflitos(depois)).toBe(0);
  });

  it('informa as lacunas que não foi possível fechar', () => {
    expect(depois.lac.every((l: any) => l.falta > 0 && l.h > 0)).toBe(true);
    expect(depois.lac.length).toBeGreaterThan(0); // horas insuficientes no mês
  });
});

