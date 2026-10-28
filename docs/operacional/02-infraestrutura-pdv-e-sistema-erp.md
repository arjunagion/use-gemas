# 📖 MANUAL OPERACIONAL USE GEMAS
## Módulo de Infraestrutura Tecnológica: Sistema ERP (Rota A), Automação de PDV e Custos de Implementação

### 1. ARQUITETURA DO SISTEMA INTEGRADO (ROTA A)

#### **1.1. Core do Sistema: Bling ERP**
- **Função:** Centralização do cadastro de produtos (SKUs), geração de código de barras, controle de estoque central, emissão de etiquetas e relatórios por vendedor.
- **Sincronização Omnichannel:** Baixa em tempo real tanto nas vendas presenciais (praia) quanto nas vendas realizadas no e-commerce (site).
- **Custo Fixo Estimado:** Plano Cobalto / Titânio (~R$ 60,00 a R$ 96,00 / mês).

#### **1.2. Terminal de Vendas de Campo (Smart POS Android)**
- **Hardware:** Maquininha Smart POS com sistema Android, conexão 4G/Wi-Fi e câmera traseira acoplada.
- **Operação de Bipagem:** A câmera traseira atua como leitor óptico de código de barras. O vendedor aponta para a tag da peça, o sistema identifica o SKU, fixa o valor de R$ 59,00 e processa a cobrança via Cartão ou PIX.
- **Custo de Aquisição (Ativo por Vendedor):** ~R$ 300,00 a R$ 450,00 (compra única sem aluguel).

#### **1.3. Unidade de Etiquetagem do Hub (Impressora Térmica)**
- **Equipamento:** Impressora térmica de etiquetas USB (Modelo ex: Elgin L42Pro ou Zebra ZD220).
- **Insumo:** Rolo de etiquetas adesivas formato mini de joia/bijuteria (~R$ 30,00 por rolo de ~1.000 unidades).
- **Custo de Aquisição (Ativo Fixo do Hub):** ~R$ 700,00 a R$ 950,00.

---

### 2. MATRIZ DE INVESTIMENTO INICIAL E CUSTOS OPERACIONAIS

| Item da Infraestrutura | Tipo de Custo | Valor Estimado (R$) | Destinação / Responsável |
| :--- | :--- | :--- | :--- |
| **Bling ERP** | Recorrente (Mensal) | R$ 60,00 / mês | Licença e infraestrutura na nuvem |
| **Impressora Térmica (Elgin/Zebra)** | Ativo Fixo (Único) | ~R$ 800,00 | Central / Hub (Geração de Etiquetas) |
| **Maquininha Smart POS** | Ativo Operacional (Único) | ~R$ 350,00 | Força de Vendas / PDV na praia |
| **Rolos de Etiqueta Mini (Insumo)** | Insumo / Consumo | ~R$ 30,00 | Impressão de tags de código de barras |
| **TOTAL DE INVESTIMENTO INICIAL** | **CAPEX Inicial** | **~R$ 1.240,00** | **Ativos + Insumos + 1º Mês ERP** |

---

### 3. FLUXO TÉCNICO DE CADASTRO, ETIQUETAGEM E BAIXA DE ESTOQUE

```text
[1. HUB CENTRAL]
  └── Cadastra o produto no Bling ERP (SKU: GS-001 - Gargantilha Cristal)
  └── Imprime a etiqueta de código de barras na impressora térmica
  └── Afixa a tag na peça e envia o lote ao Suporte de Vendas

[2. SUPORTE DE VENDAS]
  └── Monta o Kit de Batalha com peças etiquetadas e envia ao Vendedor

[3. VENDAS / PDV (PRAIA)]
  └── Bipa o código de barras da tag usando a câmera da Smart POS
  └── Confirma o pagamento (PIX / Cartão)
  └── O sistema gera baixa automática no Estoque Central via API 4G

[4. RELATÓRIO & CONCILIAÇÃO]
  └── O Bling ERP contabiliza o faturamento bruto e calcula automaticamente a comissão de 20% do vendedor para o ciclo financeiro
```
