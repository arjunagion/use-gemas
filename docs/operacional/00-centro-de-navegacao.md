# Centro de Navegação Operacional — Use Gemas

Este documento é o **ponto de entrada** do Manual Operacional da Use Gemas. Ele mapeia os três módulos operacionais (Produção, Vendas/PDV e Logística) e serve como ambiente de navegação entre eles.

---

## 1. Mapa do Sistema

```text
🕹️ CENTRO DE NAVEGAÇÃO OPERACIONAL - USE GEMAS
Ambiente de Simulação Dinâmica dos Módulos 1, 2 e 3
                       ┌────────────────────────────────────────┐
                       │        01. HUB CENTRAL (JIM)           │
                       │  • Recebimento de Insumos / Triagem    │
                       │  • Impressão de Etiquetas & SKUs       │
                       └───────────────────┬────────────────────┘
                                           │
                 ┌─────────────────────────┴─────────────────────────┐
                 ▼                                                   ▼
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│     MÓDULO 1: PRODUÇÃO          │                 │     MÓDULO 3: LOGÍSTICA         │
│  • Envio do Lote (50h / 375 un) │                 │  • Rotas (Ter/Qua/Qui)          │
│  • Montagem Home Office         │                 │  • Reabastecimento de Campo     │
│  • Autochecagem Tier 1          │                 │  • Buffer Stock (Gatilho: 15 un) │
└────────────────┬────────────────┘                 └────────────────┬────────────────┘
                 │                                                   │
                 └─────────────────────────┬─────────────────────────┘
                                           ▼
                       ┌────────────────────────────────────────┐
                       │     MÓDULO 2: VENDAS & PDV (PRAIA)     │
                       │  • Abordagem D2C na Orla               │
                       │  • Bipagem de Código de Barras (PDV)   │
                       │  • Baixa Automática no Estoque Central  │
                       │  • Ciclo Financeiro (Repasse Semanal)  │
                       └────────────────────────────────────────┘
```

*Os três módulos operam de forma integrada a partir do Hub Central (JIM).*

---

## 2. Índice de Arquivos por Módulo

| **Módulo** | **Arquivo** | **Escopo** | **Status** |
| :--- | :--- | :--- | :--- |
| **Módulo 1 — Produção** | [`01-producao-e-custos.md`](./01-producao-e-custos.md) | Arquitetura de produção, precificação (COGS/DRE), protocolo de qualidade e romaneio | Em documentação |
| **Módulo 2 — Vendas & PDV** | [`02-vendas-praia-e-comissoes.md`](./02-vendas-praia-e-comissoes.md) | Abordagem D2C na orla, bipagem, baixa de estoque, ciclo financeiro | Em documentação |
| **Módulo 3 — Logística** | [`03-logistica-e-hubs.md`](./03-logistica-e-hubs.md) | Rotas (Ter/Qua/Qui), reabastecimento de campo, buffer stock | Em documentação |

> **Nota:** cada módulo é mantido em arquivo próprio, com o prefixo numérico indicando a ordem de leitura. Não crie arquivos de módulo a partir deste documento.

---

## 3. Estações do Mapa Operacional

### 🏭 Estação A — Módulo 1: A Linha de Produção & Qualidade

- **Onde estamos:** na casa da produtora e no Hub de recebimento.
- **O que acontece aqui:** chegada de miçangas/cristais → montagem no gabarito → controle de qualidade (Tier 1 e Tier 2) → fechamento do lote de R$ 750,00 (375 peças).
- **Para lapidar neste fluxo:**
  - [ ] Como lidar se a produtora atrasar a entrega do lote?
  - [ ] Como reagir se a taxa de peças com defeito superar os 3%?
- **Documento relacionado:** [`01-producao-e-custos.md`](./01-producao-e-custos.md)

### 🏖️ Estação B — Módulo 2: O Balcão de Vendas na Praia (PDV)

- **Onde estamos:** na orla marítima com o vendedor de praia.
- **O que acontece aqui:** abordagem → escolha da peça → bipagem da etiqueta na maquininha → baixa em tempo real no sistema → fechamento do relatório financeiro semanal.
- **Para lapidar neste fluxo:**
  - [ ] O que fazer se a maquininha/leitor ficar sem sinal de internet na praia?
  - [ ] Como proceder se houver divergência entre as peças bipadas e o mostruário físico?
- **Documento relacionado:** [`02-vendas-praia-e-comissoes.md`](./02-vendas-praia-e-comissoes.md)

### 🚚 Estação C — Módulo 3: A Malha Logística do Litoral Norte

- **Onde estamos:** na estrada cobrindo Ubatuba, Ilhabela e São Sebastião.
- **O que acontece aqui:** disparo do alerta do Buffer Stock (estoque < 15 un) → separação do kit de reposição (20 a 30 un) → entrega nas terças, quartas ou quintas.
- **Para lapidar neste fluxo:**
  - [ ] Como atender uma demanda de pico no fim de semana fora dos dias de rota oficial?
  - [ ] Como otimizar a segurança do estoque em trânsito dentro do veículo?
- **Documento relacionado:** [`03-logistica-e-hubs.md`](./03-logistica-e-hubs.md)

---

## 4. Como Usar Este Documento

- **Ponto de entrada:** é o primeiro arquivo a ser lido por qualquer pessoa nova na operação — parte daqui para o módulo específico.
- **Referência cruzada:** cada módulo tem uma estação própria neste mapa, com link direto para o arquivo correspondente.
- **Checklist de decisões em aberto:** os itens `- [ ]` de cada estação registram pendências operacionais a resolver, não documentação já fechada.
- **Índice vivo:** deve ser atualizado sempre que um módulo for criado, renomeado ou concluído (inclusive a coluna **Status**).

---

_Última atualização: 21/out/2026 — Use Gemas_
