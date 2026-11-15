import { describe, it, expect } from 'vitest';
import { escalaMap } from './escala';

const F = 'AUX DE LINHA ESQUERDA';

// Objeto mínimo aceito por escalaMap: horas do dia d em P.ph(d) e plantão de 24h em P.st24(d).
const P = (n: string, i: number, horas: Record<number, number>, plantao24: number[] = []) => ({
  n, gr: 1, i, f: F, afc: [''], ord: [0], ext: [0],
  P: {
    st24: (d: number) => plantao24.includes(d),
    ph: (d: number) => horas[d] ?? 0,
  },
});

const montar = (pes: any[], D: number) => escalaMap(pes, D, pes.map(() => Array(D).fill(F)));

describe('grade da escala', () => {
  it('completa a lacuna da linha existente antes de abrir outra linha da função', () => {
    // A só pode começar após 12h de descanso (plantão de 24h no dia anterior) e ocupa 20:00-02:00.
    // B (12h, livre) e C (6h, livre) cabem na mesma linha: 08:00-20:00 e 02:00-08:00.
    const a = P('A', 0, { 1: 6 }, [0]);
    const b = P('B', 1, { 1: 12 });
    const c = P('C', 2, { 1: 6 });
    const map = montar([a, b, c], 2);

    // linha 0 = plantão de 24h de A no dia 1 e turnos parciais empacotados no dia 2
    expect(map[F]).toHaveLength(1);
    expect(map[F][0][1].txt).toEqual([
      '08:00 às 20:00 B',
      '20:00 às 02:00 A',
      '02:00 às 08:00 C',
    ]);
  });

  it('não abre nova linha quando os turnos somam até 24h', () => {
    const map = montar([P('A', 0, { 0: 12 }), P('B', 1, { 0: 12 })], 1);
    expect(map[F]).toHaveLength(1);
    expect(map[F][0][0].txt).toEqual(['08:00 às 20:00 A', '20:00 às 08:00 B']);
  });

  it('só abre nova linha depois de a linha existente chegar a 24h', () => {
    const map = montar([P('A', 0, { 0: 12 }), P('B', 1, { 0: 12 }), P('C', 2, { 0: 12 })], 1);
    expect(map[F]).toHaveLength(2);
    expect(map[F][0][0].txt).toEqual(['08:00 às 20:00 A', '20:00 às 08:00 B']);
    expect(map[F][1][0].txt).toEqual(['08:00 às 20:00 C']);
  });
});
