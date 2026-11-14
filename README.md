# ESCALA – Mapa de horas

App web (React + Vite + TypeScript) que gera a escala de serviço no formato do `MAPA.xlsx`:
plantão de 24h (ciclo 1×3 por guarnição), meta de 5,7 h por dia do mês, cota de horas extras,
afastamentos e exportação para `.xlsx`. Tudo roda no navegador, sem servidor.

## Como rodar

Requer Node.js 18 ou superior.

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm test         # testes da regra de escala
npm run build    # gera a versão para publicar em dist/
```

## Estrutura

```
src/
  core/
    schedule.ts   regra de escala: plantões 18h+6h, complementos de 12h/6h, extras, descanso de 12h
    roles.ts      função do dia (um chefe de socorro e um condutor por dia) e verificação de cobertura
    escala.ts     grade da escala: uma linha por função, horários a partir das 08:00
    plan.ts       fluxo completo: escala -> meta -> cota restante -> divisão -> horas extras
    constants.ts  graduações, valores de hora iniciais, funções
    plan.test.ts  testes
  export/xlsx.ts  gera o .xlsx (folhas MapaDeHoras, Escala e Carga horária) com ExcelJS
  components/     tabelas (escala, mapa, resumo) e painel de afastamentos/condutores extras
  App.tsx         tela
```

## Regras principais

- Plantão de 24h aparece no mapa como 18h num dia e 6h no seguinte; na escala é `08:00 às 08:00`.
- Quem está na mesma guarnição trabalha nos mesmos dias (início do ciclo por guarnição, até 4 guarnições).
- Meta mensal = 5,7 h x dias do mês, arredondada para cima; cada dia afastado reduz 5,7 h.
- Depois de um plantão de 24h há 12h de descanso; os turnos menores vão de preferência no dia seguinte.
- Plantões que passam da meta viram horas extraordinárias e saem da cota.
- Cota restante = cota total - HE já lançadas; a divisão é igual em R$ entre quem não teve a cota (em horas) editada.
- Por dia: um chefe de socorro (o de maior graduação) e um condutor; o excedente assume função de linha
  (chefe de linha direita, chefe de linha esquerda, auxiliar direita, auxiliar esquerda).

## Pendências conhecidas

- Ainda não lê a escala antiga em `.xlsx` (o início do ciclo vem da guarnição).
- O mapa não é editável célula a célula.
- Os módulos em `core/` e `export/` foram portados com `// @ts-nocheck`; vale tipá-los aos poucos.
