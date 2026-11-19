import { describe, it, expect } from 'vitest';
import { escalaMap, funcoes24 } from './escala';
import { planejar, type Pessoa } from './plan';
import { VH0 } from './constants';

const L = ['CHEFE DE LINHA DIREITA', 'CHEFE DE LINHA ESQUERDA', 'AUXILIAR DE LINHA DIREITA', 'AUX DE LINHA ESQUERDA'];
const F = L[3];

// Turno: d = dia (0-based), a = hora de início no relógio (0..24), h = duração, b = 24 para plantão.
type T = { d: number; a: number; h: number; t?: 'o' | 'x'; b?: number };

// Objeto mínimo aceito por escalaMap: turnos crus em P.segs().
const P = (n: string, i: number, turnos: T[], f = F) => ({
  n, gr: 1, i, f, afc: Array(31).fill(''), ord: Array(31).fill(0), ext: Array(31).fill(0),
  P: {
    segs: () => turnos.map((t) => ({ s: 24 * t.d + t.a, e: 24 * t.d + t.a + t.h, t: t.t ?? 'o', b: t.b ?? t.h })),
  },
});

const montar = (pes: any[], D: number, RL?: string[][]) =>
  escalaMap(pes, D, RL ?? pes.map(() => Array(D).fill(F)));

const hrs = (txt: string[]) => txt.reduce((a, t) => {
  const m = t.match(/^(\d\d):(\d\d) às (\d\d):(\d\d)/);
  if (!m) return a;
  const ini = +m[1] * 60 + +m[2], fim = +m[3] * 60 + +m[4];
  return a + (((fim - ini + 1440) % 1440) || 1440) / 60;
}, 0);

describe('grade da escala', () => {
  it('usa o horário real do turno, sem reposicionar', () => {
    // 3h às 18:00 (antes a grade inventava 20:00 às 23:00).
    const map = montar([P('A', 0, [{ d: 0, a: 18, h: 3 }])], 1);
    expect(map[F][0][0].txt).toEqual(['18:00 às 21:00 A']);
  });

  it('mantém o turno de 12h que atravessa a meia-noite inteiro, em vez de dois de 6h', () => {
    const map = montar([P('A', 0, [{ d: 0, a: 18, h: 12 }])], 2);
    expect(map[F]).toHaveLength(1);
    expect(map[F][0][0].txt).toEqual(['18:00 às 06:00 A']);
    expect(hrs(map[F][0][0].txt)).toBe(12);
    // aparece uma única vez, no dia em que começa
    expect(map[F][0][1]).toBeNull();
  });

  it('mostra o plantão de 24h em uma linha só, sem repetir a madrugada no dia seguinte', () => {
    const map = montar([P('A', 0, [{ d: 0, a: 6, h: 24, b: 24 }]), P('B', 1, [{ d: 1, a: 18, h: 3 }])], 2);
    expect(map[F][0][0].txt).toEqual(['08:00 às 08:00', 'A']);
    expect(map[F][0][1].txt).toEqual(['18:00 às 21:00 B']);
  });

  it('separa em outra função os turnos que se sobrepõem', () => {
    const map = montar([P('A', 0, [{ d: 0, a: 8, h: 12 }]), P('B', 1, [{ d: 0, a: 8, h: 12 }])], 1);
    // mesmo horário = conflito: cada turno vai para uma função diferente
    expect(map[F][0][0].txt).toEqual(['08:00 às 20:00 A']);
    expect(map[L[0]][0][0].txt).toEqual(['08:00 às 20:00 B']);
  });

  it('abre outra função quando há conflito de horário, mesmo sem 24h', () => {
    const map = montar([
      P('A', 0, [{ d: 0, a: 18, h: 3 }]),
      P('B', 1, [{ d: 0, a: 18, h: 3 }]),
      P('C', 2, [{ d: 0, a: 18, h: 3 }]),
    ], 1);
    // 9h no dia, mas os três coincidem: não podem ficar na mesma função
    expect(map[F][0][0].txt).toEqual(['18:00 às 21:00 A']);
    expect(map[L[0]][0][0].txt).toEqual(['18:00 às 21:00 B']);
    expect(map[L[1]][0][0].txt).toEqual(['18:00 às 21:00 C']);
  });

  it('empilha turnos seguidos na mesma linha da função', () => {
    const map = montar([
      P('A', 0, [{ d: 0, a: 8, h: 12 }]),
      P('B', 1, [{ d: 0, a: 20, h: 12 }]),
    ], 1);
    expect(map[F]).toHaveLength(1);
    expect(map[F][0][0].txt).toEqual(['08:00 às 20:00 A', '20:00 às 08:00 B']);
  });

  it('mostra uma única vez o nome de quem faz vários turnos no mesmo dia', () => {
    const map = montar([P('A', 0, [
      { d: 0, a: 8, h: 6 }, { d: 0, a: 15, h: 3 }, { d: 0, a: 21, h: 3 },
    ])], 1);
    // primeiro início (08:00) até o último fim (00:00), nome uma vez só
    expect(map[F][0][0].txt).toEqual(['08:00 às 00:00 A']);
    // a conferência conta as 12h reais, não as 16h do intervalo aparente
    expect(funcoes24(map, 1)[F][0].h).toBe(12);
  });

  it('só abre nova função depois de completar 24h com turnos em sequência', () => {
    const map = montar([
      P('A', 0, [{ d: 0, a: 8, h: 12 }]),
      P('B', 1, [{ d: 0, a: 20, h: 12 }]),
      P('C', 2, [{ d: 0, a: 8, h: 12 }]),
    ], 1);
    // A (08–20) e B (20–08) são seguidos, fecham 24h e ficam na mesma linha;
    // C só abre a próxima função porque coincide com A e não cabe nas 24h.
    expect(map[F]).toHaveLength(1);
    expect(map[F][0][0].txt).toEqual(['08:00 às 20:00 A', '20:00 às 08:00 B']);
    expect(hrs(map[F][0][0].txt)).toBe(24);
    expect(map[L[0]][0][0].txt).toEqual(['08:00 às 20:00 C']);
  });

  it('distribui turnos simultâneos entre as funções, sem conflito', () => {
    const map = montar(Array.from({ length: 4 }, (_, i) => P(String.fromCharCode(65 + i), i, [{ d: 0, a: 18, h: 6 }])), 1);
    const c = funcoes24(map, 1);
    [F, L[0], L[1], L[2]].forEach((f) => {
      expect(c[f][0]).toEqual({ h: 6, ok: false, conflito: false, fechada: false });
    });
  });

  it('junta turnos de funções de linha diferentes para fechar 24h e dispensa a função vazia', () => {
    const x = P('X', 0, [{ d: 0, a: 0, h: 6 }], L[0]);
    const y = P('Y', 1, [{ d: 0, a: 6, h: 18 }], L[1]);
    const map = montar([x, y], 1, [[L[0]], [L[1]]]);

    // mantém o nome da função que já tinha mais horas (L[1], 18h)
    expect(map[L[1]][0][0].txt).toEqual(['00:00 às 06:00 X', '06:00 às 00:00 Y']);
    expect(hrs(map[L[1]][0][0].txt)).toBe(24);
    expect(map[L[0]]).toBeUndefined();
  });

  it('não usa para turnos parciais uma função que já tem plantão de 24h', () => {
    const z = P('Z', 0, [{ d: 0, a: 6, h: 24, b: 24 }], L[0]);
    const x = P('X', 1, [{ d: 0, a: 18, h: 6 }], L[0]);
    const y = P('Y', 2, [{ d: 0, a: 6, h: 12 }], L[1]);
    const map = montar([z, x, y], 1, [[L[0]], [L[0]], [L[1]]]);

    expect(map[L[0]]).toHaveLength(1);
    expect(map[L[0]][0][0].txt).toEqual(['08:00 às 08:00', 'Z']);
    // X sai da função cheia e completa a função que tinha 12h
    expect(map[L[1]][0][0].txt).toEqual(['06:00 às 18:00 Y', '18:00 às 00:00 X']);
  });

  it('não reagrupa chefe de socorro, condutor nem socorrista', () => {
    const cs = P('CS', 0, [{ d: 0, a: 8, h: 12 }], 'CHEFE DE SOCORRO');
    const cd = P('CD', 1, [{ d: 0, a: 8, h: 12 }], 'CONDUTOR');
    const so = P('SO', 2, [{ d: 0, a: 8, h: 6 }], 'SOCORRISTA');
    const x = P('X', 3, [{ d: 0, a: 8, h: 6 }], L[0]);
    const map = montar([cs, cd, so, x], 1, [['CHEFE DE SOCORRO'], ['CONDUTOR'], ['SOCORRISTA'], [L[0]]]);

    expect(map['CHEFE DE SOCORRO'][0][0].txt).toEqual(['08:00 às 20:00 CS']);
    expect(map['CONDUTOR'][0][0].txt).toEqual(['08:00 às 20:00 CD']);
    expect(map['SOCORRISTA'][0][0].txt).toEqual(['08:00 às 14:00 SO']);
    expect(map[L[0]][0][0].txt).toEqual(['08:00 às 14:00 X']);
  });
});

describe('conferência 24h', () => {
  it('marca a função completa quando fecha 24h e incompleta quando sobra', () => {
    const map = montar([
      P('A', 0, [{ d: 0, a: 6, h: 24, b: 24 }]),
      P('B', 1, [{ d: 1, a: 18, h: 3 }]),
    ], 2);
    const c = funcoes24(map, 2);
    expect(c[F][0]).toEqual({ h: 24, ok: true, conflito: false, fechada: true });
    expect(c[F][1]).toEqual({ h: 3, ok: false, conflito: false, fechada: false });
  });

  it('conta o turno que cruza a meia-noite inteiro no dia em que começa', () => {
    const map = montar([P('A', 0, [{ d: 0, a: 18, h: 12 }])], 2);
    const c = funcoes24(map, 2);
    expect(c[F][0]).toEqual({ h: 12, ok: false, conflito: false, fechada: false });
    expect(c[F][1]).toEqual({ h: 0, ok: false, conflito: false, fechada: false });
  });

  it('soma os turnos seguidos da mesma função sem marcar conflito', () => {
    const a = P('A', 0, [{ d: 0, a: 8, h: 12 }], 'CHEFE DE SOCORRO');
    const b = P('B', 1, [{ d: 0, a: 20, h: 12 }], 'CHEFE DE SOCORRO');
    const map = montar([a, b], 1, [['CHEFE DE SOCORRO'], ['CHEFE DE SOCORRO']]);
    expect(funcoes24(map, 1)['CHEFE DE SOCORRO'][0]).toEqual({ h: 24, ok: true, conflito: false, fechada: true });
  });

  it('sinaliza conflito quando dois turnos coincidem na mesma função', () => {
    const a = P('A', 0, [{ d: 0, a: 8, h: 12 }], 'CHEFE DE SOCORRO');
    const b = P('B', 1, [{ d: 0, a: 8, h: 12 }], 'CHEFE DE SOCORRO');
    const map = montar([a, b], 1, [['CHEFE DE SOCORRO'], ['CHEFE DE SOCORRO']]);
    // soma 24h, mas os dois turnos são no mesmo horário
    expect(funcoes24(map, 1)['CHEFE DE SOCORRO'][0]).toEqual({ h: 24, ok: true, conflito: true, fechada: false });
  });
});

// Integração com o mapa: a grade tem de mostrar exatamente os turnos reais de cada
// pessoa (mesmo dia de início e mesmos horários), uma única vez cada.
describe('grade x mapa', () => {
  const pessoa = (n: string, gr: number, g: string, f: string, i: number): Pessoa => ({ id: i, n, idf: '', gr, g, f, ch: '' });

  const pessoas = [
    pessoa('MÁRCIO', 1, 'A', 'CHEFE DE SOCORRO', 0), pessoa('JULIANO', 1, 'A', 'CONDUTOR', 1),
    pessoa('DIEGO', 2, 'A', 'CONDUTOR', 2), pessoa('RAFAEL', 2, 'A', 'CONDUTOR', 3),
    pessoa('HENRIQUE', 3, 'B', 'CONDUTOR', 4), pessoa('RENAN', 3, 'B', 'CONDUTOR', 5),
    pessoa('FILIPE', 4, 'C', 'CONDUTOR', 6), pessoa('VINÍCIUS', 4, 'C', 'CONDUTOR', 7),
    pessoa('BRUNO', 5, 'D', 'CONDUTOR', 8), pessoa('CARLOS', 5, 'D', 'CONDUTOR', 9),
  ];

  const conferir = (mes: string, cota: number, afs: any[], cxs: any[]) => {
    const R = planejar({ mes, cota, heja: 0, vh: VH0.map(Number).map((v, i) => v || 80 + i), pessoas, afs, cxs });
    // A grade mostra uma linha por pessoa/dia, do primeiro início ao último fim.
    const grade: Record<string, Record<number, { ini: number; fim: number }>> = {};
    const add = (nome: string, d: number, ini: number, fim: number) => {
      const g = (grade[nome] = grade[nome] || {}), v = g[d];
      if (!v) g[d] = { ini, fim };
      else { v.ini = Math.min(v.ini, ini); v.fim = Math.max(v.fim, fim); }
    };
    Object.keys(R.map).forEach((f) => (R.map[f] || []).forEach((row: any[]) => row.forEach((o: any, d: number) => {
      if (!o || !o.txt) return;
      // Plantão de 24h: a grade mostra 08:00 às 08:00 (início às 06:00, fim no dia seguinte).
      if (o.txt.length === 2 && o.txt[0] === '08:00 às 08:00') { add(o.txt[1], d, 6, 30); return; }
      o.txt.forEach((t: string) => {
        const m = t.match(/^(\d\d):(\d\d) às (\d\d):(\d\d) (.+)$/);
        if (!m) return; // afastamento (FER/LTS...): não é turno
        const ini = +m[1] + +m[2] / 60, fim = +m[3] + +m[4] / 60;
        add(m[5], d, ini, fim <= ini ? fim + 24 : fim);
      });
    })));
    const lista = (g: Record<number, { ini: number; fim: number }>) =>
      Object.keys(g).map((d) => `${d}:${g[+d].ini}-${g[+d].fim}`).sort();
    for (const x of R.pes) {
      const reais: Record<number, { ini: number; fim: number }> = {};
      x.P.segs().filter((g: any) => g.s >= 0).forEach((g: any) => {
        const d = Math.floor(g.s / 24), ini = g.s - 24 * d, fim = g.e - 24 * d, v = reais[d];
        if (!v) reais[d] = { ini, fim };
        else { v.ini = Math.min(v.ini, ini); v.fim = Math.max(v.fim, fim); }
      });
      expect({ n: x.n, turnos: lista(grade[x.n] || {}) }).toEqual({ n: x.n, turnos: lista(reais) });
    }
  };

  it('mostra os turnos reais de cada pessoa, cada um uma vez', () => {
    conferir('2026-11', 16000, [{ n: 'RENAN', t: 'FER', d: '10-12' }, { n: 'DIEGO', t: 'LTS', d: '20' }], []);
    conferir('2026-12', 9000, [], []);
    conferir('2026-02', 3000, [{ n: 'MÁRCIO', t: 'FER', d: '1-8' }], []);
    conferir('2026-01', 20000, [], [{ n: 'BRUNO', t: 'CX', d: '5' }]);
  });
});
