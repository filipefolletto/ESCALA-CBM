// @ts-nocheck
// Depois de gerada a escala 1 dia para 3 (plantões de 24h), as lacunas das funções
// são preenchidas reposicionando turnos que a pessoa já tem na sua carga horária.
// Nenhuma hora é criada: o turno sai de onde estava e entra na função com falta.
import { escalaMap, funcoes24 } from './escala';

const FIXAS = ['CHEFE DE SOCORRO', 'CONDUTOR'];

export function completar24(pes, D, RL) {
  const horas = () => {
    const h = {};
    pes.forEach((x, k) => {
      (x.P.segs ? x.P.segs() : []).forEach((g) => {
        const d = Math.floor(g.s / 24);
        if (g.s < 0 || d < 0 || d >= D) return;
        const f = RL[k][d] || x.f;
        if (!h[f]) h[f] = Array(D).fill(0);
        h[f][d] += g.b === 24 ? 24 : (g.e - g.s);
      });
    });
    return h;
  };
  // Intervalos ocupados pela função no dia, lidos da própria grade (a mesma
  // fonte usada pela conferência 24h). Inclui a cauda do plantão de 24h.
  const intervalos = (map, f, d) => {
    const iv: number[][] = [];
    (map[f] || []).forEach((row: any[]) => {
      const o = row && row[d];
      if (!o || !o.txt) return;
      if (o.ivs) { o.ivs.forEach(([a, b]: number[]) => iv.push([a * 60, b * 60])); return; }
      o.txt.forEach((t: string) => {
        const m = t.match(/^(\d\d):(\d\d) às (\d\d):(\d\d)/);
        if (!m) return;
        const a = +m[1] * 60 + +m[2], b = +m[3] * 60 + +m[4];
        iv.push([a, (((b - a + 1440) % 1440) || 1440) + a]);
      });
    });
    return iv;
  };
  // iv e t estão em minutos; len (duração do turno) está em horas.
  const livre = (iv, t, len) => iv.every(([a, b]) => t + len * 60 <= a || b <= t);

  let trocas = 0;
  for (let pass = 0; pass < 12; pass++) {
    let mudou = false;
    const h = horas(), map = escalaMap(pes, D, RL);
    Object.keys(h).forEach((f) => {
      for (let d = 0; d < D; d++) {
        let falta = 24 - h[f][d];
        if (h[f][d] <= 0 || falta <= 0.001) continue;
        const iv = intervalos(map, f, d);
        const cand = pes.map((x, k) => ({ x, k }))
          .filter((o) => (RL[o.k][d] || o.x.f) === f)
          .sort((a, b) => (a.x.hO - a.x.P.meta) - (b.x.hO - b.x.P.meta) || (a.x.gr - b.x.gr) || (a.x.i - b.x.i));
        for (const { x, k } of cand) {
          const meus = (x.P.segs ? x.P.segs() : []).filter((g) => g.b !== 24 && Math.floor(g.s / 24) !== d);
          for (const g of meus) {
            const len = g.e - g.s;
            if (len > falta + 0.001) continue;
            const ds = Math.floor(g.s / 24), fs = RL[k][ds] || x.f;
            // Não retira de chefe de socorro/condutor (cobertura do dia) nem de
            // uma função que ficaria parcial: isso só trocaria uma lacuna por outra.
            if (FIXAS.includes(fs)) continue;
            if (h[fs] && h[fs][ds] - len > 0.001 && h[fs][ds] - len < 24 - 0.001) continue;
            for (let t = 0; t + len <= 24 * 60; t += 60) {
              if (!livre(iv, t, len)) continue;
              if (!x.P.mover(g, 24 * d + t / 60)) continue;
              // O turno passa a aparecer na função que recebeu as horas, inclusive
              // nos dias seguintes se ele cruzar a meia-noite.
              const ate = Math.floor((24 * d + t / 60 + len - 0.001) / 24);
              for (let q = d; q <= ate && q < D; q++) if (!RL[k][q]) RL[k][q] = f;
              if (!(x.P.segs ? x.P.segs() : []).some((q: any) =>
                (q.s < 0 && ds === 0) || Math.floor(q.s / 24) === ds)) RL[k][ds] = '';
              h[f][d] += len; falta -= len; trocas++; mudou = true;
              if (h[fs]) h[fs][ds] -= len;
              iv.push([t, t + len * 60]);
              break;
            }
            if (falta <= 0.001) break;
          }
          if (falta <= 0.001) break;
        }
      }
    });
    if (!mudou) break;
  }
  // O reposicionamento não muda os totais, mas os caches precisam refletir o mapa final.
  pes.forEach((x) => {
    x.ord = x.P.cells('o'); x.ext = x.P.cells('x');
    x.hO = x.P.hrs('o'); x.hX = x.P.hrs('x');
  });
  return { trocas };
}

export function lacunas(map, D) {
  const c = funcoes24(map, D), out = [];
  Object.keys(c).forEach((f) => c[f].forEach((v, d) => {
    if (v.h > 0 && !v.fechada) out.push({ f, d: d + 1, h: v.h, falta: Math.max(0, 24 - v.h), conflito: v.conflito });
  }));
  return out;
}
