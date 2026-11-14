// Ordem hierárquica das graduações (índice menor = mais antigo).
export const GR = ['1ºSGT', '2ºSGT', '3ºSGT', 'SD N1', 'SD N2', 'SDT'];
// Valores de hora do modelo (MAPA.xlsx); o 1ºSGT não consta no modelo e deve ser informado.
export const VH0 = ['', '68.81', '62.15', '42.87', '37.28', '29.82'];
export const FUNCS = [
  'CHEFE DE SOCORRO', 'CONDUTOR', 'CHEFE DE LINHA ESQUERDA', 'CHEFE DE LINHA DIREITA',
  'AUX DE LINHA ESQUERDA', 'AUXILIAR DE LINHA DIREITA', 'SOCORRISTA',
];
export const LET = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const num = (v: any) => parseFloat(String(v).replace(',', '.')) || 0;
export const fmt = (v: number) => Number(v.toFixed(2)).toString().replace('.', ',');
export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
