# Módulo 1 — Produção e Custos

Este módulo cobre a arquitetura de produção, a precificação (COGS/DRE) e o controle de qualidade da Use Gemas, integrando-se aos Módulos 2 (Vendas/PDV) e 3 (Logística).

---

## 0. Centro de Navegação Operacional

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

*Os três módulos operam de forma integrada. Este documento detalha o **Módulo 1**.*

---

## 1. Modelagem de Negócio

### 1.1 Hero Product

O **Hero Product** da Use Gemas é a peça de semijoia com gemas/cristais montada em **Home Office** pela produtora parceira, a partir dos insumos enviados pelo **Hub Central (JIM)**.

Por que ele concentra margem e esforço de produção:

- **Escala com custo unitário baixo:** o lote padrão de **375 peças** dilui o custo de insumos e de logística de entrada em um único ciclo de abastecimento.
- **Processo repetível:** a montagem sobre gabarito permite padronizar a execução e reduzir a variabilidade entre peças — condição para manter o refugo sob controle.
- **Giro rápido no PDV:** sendo o item de entrada da operação de praia, é o SKU que sustenta o volume de bipagem no Módulo 2 e, portanto, o reabastecimento do Módulo 3.

**Parâmetros do lote padrão de produção:**

| **Parâmetro** | **Valor** |
| :--- | :--- |
| Carga de trabalho | **50 horas** |
| Volume produzido | **375 unidades** |
| Custo-alvo do lote | **R$ 750,00** |
| Custo unitário-alvo | **R$ 2,00/peça** |

### 1.2 COGS (Custo dos Bens Vendidos)

O COGS reúne todos os custos diretamente atribuíveis à produção de uma peça. A coluna de percentual é a composição relativa dentro do custo unitário-alvo de **R$ 2,00/peça** (R$ 750,00 ÷ 375 unidades).

| **Componente** | **Descrição** | **% do COGS** | **Observações** |
| :--- | :--- | :--- | :--- |
| **Matéria-prima** | Miçangas, gemas e cristais utilizados na montagem | [a confirmar com Jeep] | Recebida e triada no Hub Central (JIM) |
| **Embalagem + Etiqueta/SKU** | Embalagem individual, etiqueta de marca e código de barras | [a confirmar com Jeep] | Impressão de etiquetas/SKUs ocorre no Hub |
| **Mão de obra por peça** | Remuneração da produtora parceira (outsourcing por peça) | [a confirmar com Jeep] | Modelo por peça aprovada — ver seção 2.2 |
| **Frete de insumo** | Custo de entrada dos insumos no Hub JIM | [a confirmar com Jeep] | Frete de entrada; frete de saída pertence ao Módulo 3 |
| **Perdas/Scrap** | Refugo natural do processo (baseline ≤ 3% do lote) | [a confirmar com Jeep] | Meta de scrap na seção 3.3 |
| **Total** | **Custo direto de produção** | **100%** | **[a confirmar com Jeep]** por componente |

> **Custo unitário-alvo:** R$ 750,00 ÷ 375 peças = **R$ 2,00/peça**.

### 1.3 DRE Simplificada

Estrutura de resultado alvo por unidade de negócio. Os percentuais são baseline e devem ser revisados trimestralmente.

| **Linha** | **Fórmula** | **Valor-alvo (%)** |
| :--- | :--- | :--- |
| **Receita Bruta** | Preço de venda × volume vendido | [a confirmar com Jeep] |
| **(−) Impostos** | % sobre a receita bruta | [a confirmar com Jeep] |
| **(−) COGS** | Custo dos Bens Vendidos (seção 1.2) | [a confirmar com Jeep] |
| **= Lucro Bruto** | Receita bruta − Impostos − COGS | [a confirmar com Jeep] |
| **(−) Despesas Operacionais** | Custos fixos de operação (hub, sistemas, administrativo) | [a confirmar com Jeep] |
| **= EBITDA** | Lucro bruto − Despesas operacionais | [a confirmar com Jeep] |
| **(−) Marketing** | Investimento em aquisição e mídia | [a confirmar com Jeep] |
| **= Lucro Líquido** | EBITDA − Marketing | [a confirmar com Jeep] |

> **Nota:** os percentuais acima são baseline e devem ser revisados trimestralmente. Todo valor não parametrizado no Centro de Navegação Operacional está marcado como **[a confirmar com Jeep]** — não substituir por estimativa.

---

## 2. Engenharia de Produção

### 2.1 Modelo de Outsourcing e Fluxo do Hub JIM

A produção da Use Gemas é **terceirizada** (outsourcing) para atelier/produtora parceira que opera em **Home Office**, utilizando gabarito próprio para montagem. A Use Gemas não mantém célula produtiva interna: ela controla insumos, padrão de qualidade e recebimento no **Hub Central (JIM)**.

**Critérios de seleção de parceiro:**

- **Capacidade:** absorver o lote padrão de **375 unidades** por ciclo.
- **Qualidade:** manter o Scrap Rate em **≤ 3%** do lote.
- **Prazo:** concluir o lote dentro da carga de **50 horas** de trabalho.

**Fluxo operacional:**

```text
Hub JIM (insumos + SKUs) → Produtora (montagem Home Office + gabarito) → QC Tier 1 → Recebimento no Hub → QC Tier 2 → Liberação para Módulos 2 e 3
```

### 2.2 Remuneração por Peça

O pagamento é feito **por peça aprovada**, não por hora trabalhada, no modelo de outsourcing com atelier parceiro. No lote padrão, isso equivale a **R$ 2,00/peça** (R$ 750,00 ÷ 375 unidades).

Justificativa do modelo:

- **Alinhamento de incentivo:** o ganho da produtora cresce com o volume aprovado, e não com o tempo gasto.
- **Custo unitário previsível:** o controlador sabe exatamente o custo de mão de obra por peça liberada, sem rateio de horas.
- **Qualidade acoplada ao pagamento:** como a remuneração incide sobre peças aprovadas no Tier 2, o retrabalho recai sobre o processo da produtora.

| **Tipo de Peça** | **Complexidade** | **Valor por Peça (R$)** | **SLA (dias)** | **Observações** |
| :--- | :--- | :--- | :--- | :--- |
| **Gargantilha Simples (SKU-GS)** | Baixa | **2,00** (média do lote padrão) | [a confirmar com Jeep] | SKU de maior rotatividade |
| **Gargantilha c/ Detalhe (SKU-GD)** | Média | [a confirmar com Jeep] | [a confirmar com Jeep] | Requer conferência de acabamento adicional |
| **Pulseira (SKU-PL)** | Baixa | [a confirmar com Jeep] | [a confirmar com Jeep] | — |
| **Tornozeleira (SKU-TZ)** | Baixa | [a confirmar com Jeep] | [a confirmar com Jeep] | — |

> **Regra de reajuste:** revisão **semestral** do valor por peça, com base no índice de custo de insumos acrescido da inflação do período. O SLA é expresso em dias corridos a partir da entrega do lote pela Use Gemas.

---

## 3. Protocolo de Qualidade

### 3.1 Poka-Yoke

**Poka-Yoke** é o princípio de projetar o processo de forma que o erro se torne fisicamente improvável ou imediatamente detectável. Na montagem de semijoias com gemas/cristais, isso significa transferir a precisão do olho da artesã para dispositivos e checklists.

Dispositivos e checklists anti-erro adotados:

- **Gabarito físico de medida:** régua/canaleta com o padrão de montagem cravado, que define comprimento e espaçamento das peças sem depender de medição manual.
- **Checklist de acabamento:** verificação obrigatória de fecho, engate e polimento antes do fechamento do kit.
- **Conferência dupla de pesagem/contagem por kit:** contagem na origem pela produtora e reconferência no recebimento do Hub.
- **Etiqueta SKU com código de barras bipável no PDV:** elimina digitação manual e erro de baixa no estoque central no momento da venda (Módulo 2).

### 3.2 2-Tier QC (Controle de Qualidade em Duas Camadas)

O controle de qualidade ocorre em duas camadas independentes, de modo que nenhum lote chega ao cliente sem passar por uma inspeção que não seja a do próprio produtor.

**Tier 1 — Autochecagem da Produtora.** Executada pela produtora **antes do envio** do lote ao Hub. Ela inspeciona:

- Medida e alinhamento das peças contra o gabarito.
- Acabamento do fecho, engate e polimento.
- Contagem e fechamento do kit por SKU.

**Tier 2 — Recebimento Use Gemas (Hub JIM).** Executada no **recebimento**, antes de liberar o lote para Vendas (Módulo 2) e Logística (Módulo 3). Checklist de aceite:

- Conferência de quantidade enviada × recebida por SKU (romaneio — seção 4).
- Recontagem e validação do Scrap Rate do lote contra a meta de ≤ 3%.
- Teste mecânico de fecho e engate em amostragem do lote.
- Verificação de integridade da etiqueta e legibilidade do código de barras.
- Sinal verde para bipagem no PDV apenas após o aceite.

| **Defeito** | **Tier que detecta** | **Ação** |
| :--- | :--- | :--- |
| Medida fora do padrão do gabarito | Tier 1 (origem) | Retrabalho imediato pela produtora antes do envio |
| Acabamento/fecho com falha | Tier 1 (origem) | Retrabalho imediato pela produtora antes do envio |
| Divergência de quantidade no romaneio | Tier 2 (Hub) | Recontagem e abertura de ocorrência com a produtora |
| Etiqueta/SKU ilegível ou ausente | Tier 2 (Hub) | Reimpressão da etiqueta no Hub antes da liberação |
| Scrap Rate acima de 3% | Tier 2 (Hub) | Acionamento do plano de ação da seção 3.3 |
| Defeito não detectado nas duas camadas | — (falha de processo) | Revisão do checklist e do gabarito; registro como desvio |

### 3.3 Scrap Rate

**Definição:** taxa de peças refugadas sobre o total de peças produzidas no lote, apurada no recebimento (Tier 2).

```text
Scrap Rate = (peças refugadas / peças produzidas) × 100
```

**Meta baseline:** ≤ **3%** por lote. No lote padrão de 375 unidades, o teto equivale a aproximadamente **11 peças refugadas** (3% de 375 = 11,25).

**Plano de ação em caso de estouro da meta (> 3%):**

1. **Notificar a produtora** formalmente, com o romaneio e as peças refugadas como evidência.
2. **Revisar gabarito e checklist** do lote, identificando a etapa em que o defeito se origina.
3. **Avaliar retrabalho** das peças refugadas quando o defeito for recuperável.
4. **Considerar desconto na remuneração por peça** ou renegociação do lote — critério a definir com Jeep.

---

## 4. Romaneio

O **Romaneio** é o documento que acompanha fisicamente o lote no trajeto **Hub → Produtora → Hub**. Ele é a fonte de verdade da conferência: registra o que saiu, o que voltou, o que foi refugado e qual o Scrap Rate apurado, servindo de base tanto para a liberação da qualidade (Tier 2) quanto para o fechamento da remuneração por peça.

Sem romaneio assinado no Tier 2, o lote não é liberado para os Módulos 2 e 3.

```text
===================================================================
                  USE GEMAS - FICHA PADRÃO DE ROMANEIO
===================================================================
Use Gemas | Romaneio nº ___ | Data ___/___/___ | Atelier/Produtora ___ | Responsável ___

 Item   | SKU        | Qtd. Enviada | Qtd. Recebida | Qtd. Refugada | Observações
--------|------------|--------------|---------------|---------------|---------------------------
 1      |            |              |               |               |
 2      |            |              |               |               |
 3      |            |              |               |               |
 4      |            |              |               |               |
 5      |            |              |               |               |

Total enviado: ______      Total recebido: ______
Scrap Rate (%): ______     Assinatura QC Tier 2: _____________________________
===================================================================
```

---

## 5. Estação A — Pontos a Lapidar (Módulo 1)

**Onde estamos:** na casa da produtora e no Hub de recebimento.

**O que acontece aqui:** chegada de miçangas/cristais → montagem no gabarito → controle de qualidade (Tier 1 e Tier 2) → fechamento do lote de R$ 750,00 (375 peças).

**Para lapidar neste fluxo:**

- [ ] Como lidar se a produtora atrasar a entrega do lote?
- [ ] Como reagir se a taxa de peças com defeito superar os 3%?

---

_Última atualização: 21/out/2026 — Use Gemas_
