# 📖 MANUAL OPERACIONAL USE GEMAS
## Módulo 3: Logística de Abastecimento Regional, Estrutura de Hubs e Gestão de Rotas

### 1. ARQUITETURA DE EXPANSÃO TERRITORIAL (LITORAL NORTE)

#### **1.1. Praça de Atuação e Divisão de Polígonos**
- **Cobertura Geográfica:** Orla marítima do Litoral Norte de São Paulo.
- **Divisão Operacional por Setores:**
  - **Setor Norte:** Ubatuba (Praia Grande, Tenório, Itamambuca, Félix e região).
  - **Setor Centro-Sul:** São Sebastião (Maresias, Juquehy, Camburi e Centro).
  - **Setor Insular:** Ilhabela (Praia do Curral, Perequê, Feiticeira e orla principal).

#### **1.2. Estrutura de Hub Central e Pontos de Apoio (Stock Hubs)**
- **Hub Central (Matriz/Estoque Principal):** Responsável pelo recebimento da produção, etiquetagem com código de barras (SKU), controle de qualidade Tier 2 e armazenagem geral.
- **Pontos de Apoio / Sub-Hubs de Campo:** Locais estratégicos ou cofres/pouchs selados sob responsabilidade do líder regional para pronto atendimento de reabastecimento na orla.

---

### 2. GESTÃO DE ESTOQUE DE CAMPO E PONTO DE PEDIDO (BUFFER STOCK)

#### **2.1. Níveis de Estoque por Vendedor (Kit de Batalha)**
- **Estoque Mapeado (Capacidade Ideal):** 50 peças ativas por mostruário.
- **Estoque Mínimo de Segurança (Buffer Stock):** 15 peças.
- **Gatilho de Reabastecimento (Ponto de Pedido):** Quando o sistema PDV (ou contagem física parcial) registrar que restam apenas 15 peças ativas no mostruário, o sistema emite alerta para envio de lote de reposição.

#### **2.2. Lote Padrão de Reposição (Restock Pack)**
- **Composição:** Lotes lacrados contendo **20 a 30 peças** variadas (priorizando os SKUs de maior rotatividade bipados no sistema) para reabastecimento imediato.

---

### 3. CRONOGRAMA DE ROTAS E MALHA LOGÍSTICA (DELIVERY SCHEDULE)

#### **3.1. Rota Programada de Abastecimento e Auditoria**
Para otimizar deslocamento, tempo e custo de combustível, os atendimentos de campo seguem uma agenda fixa de rotas:

| Dia da Semana | Setor Atendido | Ação Principal |
| :--- | :--- | :--- |
| **Terça-feira** | **Setor Insular (Ilhabela)** | Abastecimento de estoque + Auditoria de sistema. |
| **Quarta-feira** | **Setor Norte (Ubatuba)** | Abastecimento de estoque + Auditoria de sistema. |
| **Quinta-feira** | **Setor Centro-Sul (São Sebastião)** | Abastecimento de estoque + Auditoria de sistema. |
| **Sexta a Domingo** | **Operação de Praia Total** | Foco 100% em vendas (sem intervenção logística pesada). |

#### **3.2. Transporte Seguro e Preservação do Produto**
- **Maletas / Pouchs Anti-Umidade:** Transporte dos lotes em maletas rígidas e seladas com sachês de sílica gel para blindagem total contra a maresia, umidade e areia.
- **Protocolo de Lacre em Trânsito:** Cada lote de reposição viaja acompanhado de lacre numerado para conferência no momento da entrega ao vendedor.

---

### 4. GUIA DE EMISSÃO E TRANSPORTE DE LOTE DE REPOSIÇÃO

```text
===================================================================
           USE GEMAS - GUIA DE TRANSPORTE DE LOTE REGIONAL
===================================================================
Data de Envio: ____/____/2026       Setor Destino: ________________
Código do Lacre: #______________     Vendedor Recipiente: __________

CONTEÚDO DO LOTE DE REPOSIÇÃO (CÓDIGO DE BARRAS / SKU):
- Gargantilhas Simples (SKU-GS):    ________ unidades
- Gargantilhas c/ Detalhe (SKU-GD): ________ unidades
- Pulseiras (SKU-PL):               ________ unidades
- Tornozeleiras (SKU-TZ):           ________ unidades
- TOTAL DE PEÇAS NO LOTE:           ________ unidades

CONFERÊNCIA DE RECEBIMENTO EM CAMPO:
[ ] Lacre Íntegro e Sem Violação
[ ] Leitura por Código de Barras (PDV) Batida com a Guia
[ ] Peças Entradas no Estoque Ativo do Vendedor no ERP

Assinatura do Entregador/Logística: _______________________________
Assinatura do Vendedor Recipiente: ________________________________
===================================================================
```
