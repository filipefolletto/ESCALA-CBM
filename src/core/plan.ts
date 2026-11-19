import { GR, num, fmt, brl } from './constants';
import { build, dias } from './schedule';
import { roles, cover } from './roles';
import { escalaMap } from './escala';
import { completar24, lacunas } from './completar';

export interface Pessoa { id: number; n: string; idf: string; gr: number; g: string; f: string; ch: string }
export interface Item { n: string; t?: string; d: string }
export interface Entrada {
  mes: string; cota: number; heja: number; vh: number[];
  pessoas: Pessoa[]; afs: Item[]; cxs: Item[]; semCompletar?: boolean;
}

// Passos: 1) escala ordinária por pessoa; 2) meta de 5,7 h/dia; 3) soma das ordinárias;
// 4) cota restante; 5) divisão igual (em R$) entre quem não teve a cota editada; 6) distribuição das horas.
export function planejar(inp: Entrada): any | null {
  const [y, m1] = inp.mes.split('-').map(Number);
  if (!y) return null;
  const m = m1 - 1, D = new Date(y, m1, 0).getDate();
  const seen = new Set<string>();
  const pes: any[] = inp.pessoas
    .map((p, i) => ({ ...p, n: p.n.trim(), g: p.g.trim().toUpperCase(), ch: String(p.ch).trim(), i }))
    .filter((x) => x.n && !seen.has(x.n) && seen.add(x.n));
  if (!pes.length) return null;

  const og: string[] = [];
  pes.forEach((x) => { if (x.g && !og.includes(x.g)) og.push(x.g); });
  pes.sort((a, b) => ((a.g ? og.indexOf(a.g) : 99) - (b.g ? og.indexOf(b.g) : 99)) || (a.gr - b.gr) || (a.i - b.i));

  pes.forEach((x, k) => {
    x.abs = new Set<number>(); x.afc = Array(D).fill('');
    inp.afs.filter((a) => a.n === x.n).forEach((a) => dias(a.d, D).forEach((d) => { x.abs.add(d); x.afc[d] = a.t; }));
    const xd = new Set<number>();
    inp.cxs.filter((a) => a.n === x.n).forEach((a) => dias(a.d, D).forEach((d) => xd.add(d)));
    x.P = build(x.g ? og.indexOf(x.g) % 4 : k % 4, D, x.abs, [...xd]);
    x.vh = inp.vh[x.gr];
  });

  const ordTot = pes.reduce((a, x) => a + x.P.hrs('o'), 0);
  const rest = Math.max(0, inp.cota - inp.heja);
  pes.forEach((x) => { x.cov = x.P.hrs('x'); });
  const ed = pes.filter((x) => x.ch !== ''), au = pes.filter((x) => x.ch === '');
  const edCost = ed.reduce((a, x) => a + Math.max(0, num(x.ch)) * x.vh, 0), nEd = ed.length;
  const covAu = au.reduce((a, x) => a + x.cov * x.vh, 0);
  const per = au.length ? Math.max(0, rest - edCost - covAu) / au.length : 0;
  pes.forEach((x) => {
    x.cotaH = x.ch !== '' ? Math.floor(Math.max(0, num(x.ch))) : x.cov + (x.vh > 0 ? Math.floor(per / x.vh) : 0);
    let h = Math.max(0, x.cotaH - x.cov);
    while (h >= 6) { if (!x.P.put(6, 'x')) break; h -= 6; }
    if (h > 0 && h < 6) x.P.put(h, 'x');
    x.ord = x.P.cells('o'); x.ext = x.P.cells('x'); x.hO = x.P.hrs('o'); x.hX = x.P.hrs('x');
  });
  const heVal = pes.reduce((a, x) => a + x.hX * x.vh, 0);
  const pesM = [...pes].sort((a, b) => (a.gr - b.gr) || (a.i - b.i));
  const RL = roles(pesM, D);
  // Escala 1 dia para 3 pronta: agora usa a carga já distribuída de cada pessoa
  // para fechar as 24h de cada função, movendo turnos (sem criar horas novas).
  const comp = inp.semCompletar ? { trocas: 0 } : completar24(pesM, D, RL);
  const map = escalaMap(pesM, D, RL);
  const lac = lacunas(map, D);
  return {
    pes, pesM, D, y, m, vh: inp.vh, cota: inp.cota, heja: inp.heja, rest, per, ordTot, heVal, nEd, edCost,
    RL, cv: cover(pesM, D, RL), map, comp, lac,
  };
}

export function avisos(R: any): string[] {
  const av: string[] = [];
  if (R.comp?.trocas) av.push(`${R.comp.trocas} turno(s) da própria carga das pessoas foram reposicionados para completar as 24h das funções (nenhuma hora nova foi criada).`);
  if (R.lac?.length) av.push(`Ainda faltam horas em ${R.lac.length} função(ões)/dia após a realocação: não há horas suficientes na carga das pessoas ou os horários já estão ocupados.`);
  if (R.edCost > R.rest) av.push(`As cotas editadas (${brl(R.edCost)}) passam da cota restante (${brl(R.rest)}): as demais pessoas ficam sem horas extras.`);
  GR.forEach((g, k) => { if (R.pes.some((x) => x.gr === k) && !R.vh[k]) av.push(`Informe o valor da hora de ${g}: sem ele não há horas extras para essa graduação.`); });
  R.pes.forEach((x) => {
    if (x.P.xfail.length) av.push(`${x.n}: plantão extra não adicionado no(s) dia(s) ${x.P.xfail.join(', ')} (já está de serviço ou sem 12h de descanso).`);
    if (x.hX > x.cotaH + 0.01) av.push(`${x.n}: ${fmt(x.hX)} h extras, acima da cota de ${x.cotaH} h (plantões de cobertura da escala).`);
    if (Math.abs(x.hO - x.P.meta) > 0.01) av.push(`${x.n}: ordinárias ${fmt(x.hO)} h de ${x.P.meta} h (não coube na escala).`);
  });
  const cv = R.cv;
  ([
    [cv.semG, 'Sem plantão de 24h nos dias'],
    [cv.multG, 'Mais de uma guarnição de serviço nos dias'],
    [cv.semCS, 'Sem CHEFE DE SOCORRO nos dias'],
    [cv.semCD, 'Sem CONDUTOR nos dias'],
    [cv.multCS, 'Mais de um CHEFE DE SOCORRO de serviço nos dias (ficou o de maior graduação; os demais assumiram função de linha)'],
    [cv.multCD, 'Mais de um CONDUTOR de serviço nos dias (ficou o de maior graduação; para ter mais de um, use "Condutores extras")'],
  ] as [number[], string][]).forEach(([a, t]) => { if (a.length) av.push(`${t}: ${a.join(', ')}.`); });
  return av;
}
