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
    escala.ts     grade da escala + conferência das 24h por função e dia
    completar.ts  realocação de turnos para fechar as 24h de cada função
    plan.ts       fluxo completo: escala -> meta -> cota restante -> divisão -> horas extras
    constants.ts  graduações, valores de hora iniciais, funções
    plan.test.ts, escala.test.ts, completar.test.ts  testes
  export/xlsx.ts  gera o .xlsx (folhas MapaDeHoras, Escala e Carga horária) com ExcelJS
  components/     tabelas (escala, mapa, resumo) e painel de afastamentos/condutores extras
  App.tsx         tela
```

## Regras principais

- Plantão de 24h aparece no mapa como 18h num dia e 6h no seguinte (o mapa conta o dia civil);
  na escala ele fica numa linha só, como `08:00 às 08:00`. Essa diferença de limite de dia é esperada.
- A grade usa os horários reais de cada turno e mostra cada turno inteiro no dia em que começa:
  um complemento de 12h das 18:00 às 06:00 aparece como `18:00 às 06:00`, não como dois blocos de 6h.
- Quando a pessoa tem mais de um turno no mesmo dia, as horas são somadas e o nome aparece **uma única
  vez** na célula, com o horário do primeiro turno até o fim do último (ex.: `08:00 às 00:00 FILIPE`).
  A conferência continua contando só as horas efetivamente trabalhadas, não o intervalo entre turnos.
- Dois turnos no mesmo horário não ficam na mesma função: o segundo abre outra função, mesmo que a
  primeira ainda não tenha chegado a 24h. Assim a função nunca tem duas pessoas no mesmo horário.
- Quem está na mesma guarnição trabalha nos mesmos dias (início do ciclo por guarnição, até 4 guarnições).
- Meta mensal = 5,7 h x dias do mês, arredondada para cima; cada dia afastado reduz 5,7 h.
- Depois de um plantão de 24h há 12h de descanso; os turnos menores vão de preferência no dia seguinte.
- A conferência 24h soma as horas de cada função no dia (plantão de 24h conta 24h; turno que cruza a
  meia-noite conta inteiro no dia em que começa) e verifica se há conflito de horário. A função é
  "fechada" quando soma 24h e não tem dois turnos no mesmo horário; só então uma nova função é aberta
  (ou quando o turno não couber mais nas 24h / coincidir com outro).
- As funções de linha são reagrupadas: os turnos parciais de chefe/auxiliar (direita e esquerda) são
  somados em blocos de até 24h, sem sobrepor horários, antes de ocupar outra função de linha; o nome da
  função com mais horas no grupo é mantido e as demais usam os nomes livres. Uma função de linha que já
  tem plantão de 24h no dia não recebe turnos parciais. Chefe de socorro, condutor e socorrista não
  entram nesse reagrupamento e nenhuma hora nova é criada.
- Na aba Escala, a linha "Conferência 24h" mostra cada função por dia: ✓ quando fecha 24h sem conflito,
  ✗ quando faltam horas e ⚠ quando há dois turnos no mesmo horário. O mesmo resumo sai na folha Escala
  do `.xlsx`.
- Depois de montada a escala 1 dia para 3, as funções com menos de 24h são completadas **movendo turnos
  que já estão na carga da pessoa** (ordinárias ou extras), sem criar horas: o turno sai de outro dia e
  entra na lacuna da função, respeitando o descanso e sem sobrepor horários. Chefe de socorro e condutor
  não doam turnos (para não quebrar a cobertura do dia). O total mensal de cada pessoa não muda.
- Quando não há turno que possa ser movido (horários ocupados ou carga insuficiente), a lacuna permanece
  e é contada nos avisos e no resumo "Funções/dia ainda com falta". A opção "Completar 24h realocando
  turnos da própria carga" liga/desliga essa etapa ao gerar a escala.
- Plantões que passam da meta viram horas extraordinárias e saem da cota.
- Cota restante = cota total - HE já lançadas; a divisão é igual em R$ entre quem não teve a cota (em horas) editada.
- Por dia: um chefe de socorro (o de maior graduação) e um condutor; o excedente assume função de linha
  (chefe de linha direita, chefe de linha esquerda, auxiliar direita, auxiliar esquerda).

## Pendências conhecidas

- Ainda não lê a escala antiga em `.xlsx` (o início do ciclo vem da guarnição).
- O mapa não é editável célula a célula.
- Os módulos em `core/` e `export/` foram portados com `// @ts-nocheck`; vale tipá-los aos poucos.
