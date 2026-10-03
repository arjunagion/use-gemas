# PROJETO-MESTRE — Use Gemas (v3.4)

> **Documento de referência oficial — v3.4** — estado do código em **02/10/2026**.
> **Novo em v3.4:** Fase 10.4 completa — Central de Reviews dinâmica (home + `/avaliacoes.html` + admin com curadoria híbrida `featured`) + reciclagem do Web3Forms em canal de feedback privado (nova tabela `feedbacks` + aba no admin).
> Gerado por varredura completa do repositório local (`use-gemas`), incluindo a pasta `supabase/`.
> Regra de ouro: **zero suposição** — tudo que não está no repo está marcado como *"não encontrado no repositório"*.
> **Fonte da verdade:** o **Supabase** para backend; esta pasta/arquivo é **versionamento + referência**.

---

## Índice

1. [Arquivos do repositório](#1-arquivos-do-repositório)
2. [Funcionalidades implementadas](#2-funcionalidades-implementadas)
3. [Integrações externas](#3-integrações-externas)
4. [Banco de dados](#4-banco-de-dados)
5. [Stack técnica](#5-stack-técnica)
6. [Números atuais](#6-números-atuais)
7. [Estado de cada funcionalidade crítica](#7-estado-de-cada-funcionalidade-crítica)
8. [Pendências conhecidas](#8-pendências-conhecidas)
9. [Próximas features planejadas](#9-próximas-features-planejadas)
10. [Regras de ouro](#10-regras-de-ouro-convenções-do-projeto)
11. [Diagramas](#11-diagramas)
12. [Ecossistema completo de serviços](#12-ecossistema-completo-de-serviços)
13. [Documentação por camada](#13-documentação-por-camada)
14. [Decisões arquiteturais (ADRs)](#14-decisões-arquiteturais-adrs)
15. [Roadmap sugerido](#15-roadmap-sugerido)
16. [Changelog resumido](#16-changelog-resumido)
17. [Observações técnicas da varredura](#17-observações-técnicas-da-varredura)
18. [Sistema de Frete — Dual Mode](#18-sistema-de-frete--dual-mode)
19. [Central de Reviews (Fase 10.4)](#19-central-de-reviews-fase-104)

---

## 1. Arquivos do repositório

### 1.1 HTML (9 arquivos)

| Arquivo | Linhas | Tamanho | Propósito |
|---|---|---|---|
| `admin.html` | ~7.100 | ~270 KB | Painel administrativo (HTML + CSS + JS inline) |
| `minha-conta.html` | 2.672 | 115,6 KB | Área do cliente (pedidos, dados, favoritos, cupons, benefícios) |
| `index.html` | ~1.100 | ~60 KB | Loja principal (vitrine + checkout + auth + reviews dinâmicas) |
| `produto.html` | 1.100 | 53,5 KB | Página de detalhe do produto |
| `reset-password.html` | 601 | 22,5 KB | Redefinição de senha (PKCE do Supabase) |
| `avaliar.html` | 455 | 19,2 KB | Página de avaliação guest (link do email) |
| `avaliacoes.html` | ~350 | ~15 KB | **NOVO** — Central de Reviews pública (filtros + paginação) |
| `politica-privacidade.html` | 263 | 15,5 KB | Política de privacidade |
| `politica-troca.html` | 190 | 10,8 KB | Política de troca/devolução |

### 1.2 CSS (6 arquivos)

| Arquivo | Linhas | Tamanho | Propósito |
|---|---|---|---|
| `estilo/style.css` | 4.661 | 97,5 KB | Estilo da loja (dark + dourado) |
| `estilo/perfil.css` | 2.929 | 64,4 KB | Estilo da área do cliente (cream mode) |
| `estilo/produto.css` | 869 | 17,7 KB | Estilo da página de produto |
| `estilo/avaliar.css` | 542 | 11,7 KB | Estilo da página de avaliação guest |
| `estilo/avaliacoes.css` | ~200 | ~4 KB | **NOVO** — Estilo da Central de Reviews pública |
| `estilo/paginas-legais.css` | 401 | 8,9 KB | Estilo das páginas legais |

> O `admin.html` tem CSS **inline** (não há `admin.css` separado).

### 1.3 JS (3 arquivos)

| Arquivo | Linhas | Tamanho | Propósito |
|---|---|---|---|
| `estilo/script.js` | 5.128 | 181,9 KB | Lógica principal da loja |
| `sw.js` | 227 | 8,5 KB | Service Worker PWA cliente (`ug-cliente-v1`) |
| `sw-admin.js` | 161 | 6,4 KB | Service Worker PWA admin (`ug-admin-v4`) |

### 1.4 Backend — `supabase/` (novo, versionado)

| Arquivo/Pasta | Linhas | Propósito |
|---|---|---|
| `supabase/migrations/001_schema.sql` | 2.113 | Schema completo do banco (13 tabelas, 40 policies, 24 funções, 14 triggers, 42 índices, 5 crons) |
| `supabase/functions/` (10 `index.ts`) | 2.828 | Código real das 10 Edge Functions |
| `supabase/docs/secrets.md` | 134 | Nomes dos secrets (sem valores) |
| `supabase/docs/storage.md` | 101 | Buckets + policies |
| `supabase/docs/auth.md` | 91 | Providers + redirect URLs |
| `supabase/README.md` | — | Guia da pasta (fonte da verdade = Supabase) |
| `supabase/config.toml` | — | Config opcional do Supabase CLI (comentado) |
| `supabase/.gitignore` | — | Ignora `.branches/.temp/.env` |

### 1.5 Configs / outros

| Arquivo | Linhas | Propósito |
|---|---|---|
| `manifest.json` | 60 | Manifesto PWA cliente (com shortcuts) |
| `manifest-admin.json` | 34 | Manifesto PWA admin |
| `robots.txt` | 6 | Bloqueia `/admin.html`, `/reset-password.html`, `/avaliar.html` |
| `sitemap.xml` | 21 | Sitemap estático (home + 2 páginas legais) |
| `CNAME` | 1 | Domínio `usegemas.com.br` |
| `supabase-trigger-pontos-ganhos.sql` | 88 | (legado) SQL avulso do trigger — agora também em `001_schema.sql` |
| `LICENSE` | — | Licença do projeto |
| `.gitattributes` | — | Fim-de-linha do Git |

### 1.6 Mídias (`estilo/midias/` — 13 arquivos)

| Arquivo | Propósito |
|---|---|
| `favicon.png`, `logo.png` | Ícone/logo do site |
| `og-capa.jpg` | Imagem Open Graph (1200×630) |
| `icone-admin-192.png`, `icone-admin-512.png` | Ícones PWA (cliente e admin) |
| `IMG_2501.mp4`, `IMG_2559.mp4`, `IMG_2563.mp4`, `IMG_2585.mp4` | Vídeos (hero/carrossel) |
| `photo_2026-09-17_*.jpg` (3) | Fotos de produtos (temporárias) |

---

## 2. Funcionalidades implementadas

### 🛒 Loja (cliente)

| Funcionalidade | Descrição | Status |
|---|---|---|
| Vitrine + busca + filtros | Grid vindo do Supabase, busca por nome/REF, filtro por categoria | ✅ |
| Carrinho persistente | `localStorage` (`gemas_cart_v1`), restaurado no boot, revalidação | ✅ |
| Frete dinâmico (Melhor Envio) | CEP → `calculate-shipping` → radio de cotações; 3 estados (grátis/fixo/a calcular) | ✅ |
| Checkout | Form + CEP (ViaCEP) + envio WhatsApp + criação no Supabase | ✅ |
| Cupom no carrinho | Aplicar/remover cupom, desconto no total | ✅ |
| Favoritos (wishlist) | Drawer + "adicionar todos ao carrinho" | ✅ |
| Página de produto | Galeria (PhotoSwipe), reviews, relacionados, compartilhar | ✅ |
| **Central de Reviews (Fase 10.4)** | Grid dinâmico na home (6 reviews: `featured` + fallback recentes) | ✅ |
| **Página pública `/avaliacoes.html`** | Listagem completa + filtros (5★, com foto, produto) + paginação | ✅ |
| **Curadoria híbrida de reviews** | Admin marca reviews como "destacada"; fallback automático pras recentes | ✅ |
| **Feedback privado (Web3Forms reciclado)** | Form na home → tabela `feedbacks` (status: new/read/archived) | ✅ |

### 👤 Área do Cliente (`minha-conta.html`)

| Funcionalidade | Status |
|---|---|
| Meus Pedidos (lista + modal + carrossel de notificações) | ✅ |
| Meus Dados (perfil) | ✅ |
| Favoritos | ✅ |
| Meus Cupons (disponíveis + histórico) | ✅ |
| 💎 Meus Benefícios (saldo, extrato, troca por cupom) | ✅ |

### 🔐 Autenticação

| Funcionalidade | Status |
|---|---|
| Cadastro + login (email/senha) | ✅ |
| Login com Google OAuth | ✅ |
| Recuperação de senha (PKCE + `reset-password.html`) | ✅ |

### 🎛️ Admin Panel (`admin.html`)

| Funcionalidade | Status |
|---|---|
| Dashboard | ✅ |
| Produtos (CRUD + estoque + galeria) | ✅ |
| Pedidos (status + modal com Etiqueta de Envio) | ✅ |
| Clientes | ✅ |
| Cupons (CRUD + usos) | ✅ |
| 💎 Pontos (resumo, tabela, extrato, ajuste, CSV) | ✅ |
| Avaliações (moderação + destaque + resposta) | ✅ |
| **Feedbacks (canal privado, novo)** | ✅ |
| Financeiro (Chart.js) | ✅ |
| Configurações (frete, contato, banner) | ✅ |

### 📦 Estoque / Pedidos

| Funcionalidade | Status |
|---|---|
| Baixa automática (`decrease_product_stock`) | ✅ |
| Restauração (`restore_product_stock`) | ✅ |
| Recompra (`?open_cart` / reorder) | ✅ |

### ⭐ Avaliações — cliente + guest + moderação → ✅

### 🔔 Notificações — reais + virtuais + sininho + carrossel + pontos ganhos (trigger) → ✅

### 🎟️ Cupons — tipos, regras, aplicação, admin, carteira → ✅

### 💎 Pontos/Fidelidade — ganho (trigger), saldo, resgate, extrato, admin → ✅

### 📧 Emails Transacionais

| Email | Dispara quando | Onde |
|---|---|---|
| Reset de senha | Supabase Auth | Supabase |
| Status do pedido | Edge `notify-order-status` (Brevo) | `supabase/functions/notify-order-status` |
| Solicitação de review | cron `request-review` (~7d) | `supabase/functions/request-review` |
| Lembrete de review | cron `remind-review` (~5d) | `supabase/functions/remind-review` |
| Cupom expirando | cron `notify-expiring-coupons` (≤5d) | `supabase/functions/notify-expiring-coupons` |
| Depoimento | Web3Forms | `index.html` |

### 📊 Google Shopping — feed XML via Edge `feed-xml` → ✅

### 🛍️ Meta Business — pixel `1408966774044848` + eventos (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase) → ✅

### 🚚 Frete Real (Melhor Envio) — cotação, etiqueta, PDF, webhook rastreio → ✅ (webhook via `melhorenvio-webhook`)

### 🚀 SEO — meta tags, Schema.org (Organization/WebSite/Product), sitemap (`sitemap.xml` + Edge `sitemap-products`), robots → ✅

### 📱 PWA — cliente (`sw.js`) + admin (`sw-admin.js`) + banner de instalação → ✅

### 🌐 Domínio — `usegemas.com.br` (CNAME) + HTTPS do GitHub Pages → ✅

---

## 3. Integrações externas

| Serviço | Para que serve | Onde configurado | Credencial (nome) |
|---|---|---|---|
| **Supabase** | Auth, DB, Edge Functions, Storage, Cron | `script.js:96-97`, `admin.html:3848-3849` etc. | `SUPABASE_URL` = `https://dytdnemwqbzgrekamwla.supabase.co`; `SUPABASE_KEY` (anon) |
| **Google Analytics 4** | Analytics | `index.html:66-80`, `produto.html:64-78` | `G-5S8HJR13T8` |
| **Meta Pixel** | Ads/eventos | `index.html`, `produto.html` | `1408966774044848` |
| **Web3Forms** | ~~Depoimentos~~ (removido) | — | — |
| **Supabase `feedbacks`** | Canal de feedback privado (substitui Web3Forms) | `index.html` + `admin.html` | — |
| **ViaCEP** | Endereço por CEP | `script.js` | — |
| **Melhor Envio** | Cotação + etiqueta + rastreio | Edge Functions + `settings` | `MELHORENVIO_*` (secrets) |
| **Brevo** | Email transacional | Edge Functions | `BREVO_API_KEY` (secret) |
| **PhotoSwipe 5.4.4** | Galeria | `index.html`, `produto.html` (CDN jsDelivr) | — |
| **Chart.js 4.4.1** | Gráficos financeiro | `admin.html:24` (CDN jsDelivr) | — |
| **Google Fonts** | Cormorant Garamond + Montserrat | `index.html`, `produto.html`, `admin.html` | — |
| **WhatsApp Business** | Pedido/contato | `api.whatsapp.com` | `5511982053330` |
| **Instagram** | Social | footer | `use.gemas` |
| **Supabase JS SDK @2** | Cliente Supabase | CDN jsDelivr | — |

---

## 4. Banco de dados

> ✅ O schema agora está **versionado** em `supabase/migrations/001_schema.sql` (2.113 linhas). Fonte da verdade segue sendo o Supabase.

### 4.1 Tabelas (14 — com RLS habilitado em todas)

| Tabela | Colunas principais |
|---|---|
| `admins` | user_id (PK), created_at |
| `products` | id, ref (UNIQUE), name, price, category, gem, description, materials, gallery, stock, active, created_at, updated_at |
| `orders` | id, user_id, customer_name/doc/phone/email, cep, street, number, complement, neighborhood, city, state, notes, items (JSONB), subtotal, shipping_cost, total, status, created_at, updated_at, shipped_at, review_requested_at, review_reminder_sent_at, guest_token, discount_amount, discount_code, shipping_method, shipping_service_id, shipping_carrier, shipping_estimated_days, shipping_quote_data (JSONB), tracking_code, tracking_url, melhorenvio_order_id, label_url, label_generated_at, label_status, label_error |
| `reviews` | id, order_id, product_ref, user_id, customer_name, customer_email, rating, title, comment, photos, verified_purchase, admin_response, status, **featured**, created_at, updated_at |
| `notifications` | id, user_id, type, title, message, link, metadata (JSONB), read_at, created_at |
| `coupons` | id, code (UNIQUE), description, discount_type, discount_value, min_purchase, max_discount, free_shipping, first_purchase_only, usage_limit_total, usage_limit_per_user, times_used, customer_email, starts_at, expires_at, active, created_by, email_notified_at |
| `coupon_usages` | id, coupon_id (FK), order_id, user_id, customer_email, discount_applied, used_at |
| `loyalty_points` | id, user_id, customer_email, order_id, coupon_id, points, type (CHECK earned/redeemed/expired/adjustment), description, expires_at, created_by, created_at, expired_at |
| `settings` | id (single row), whatsapp, instagram, shipping_fixed, free_shipping_min, banner_message, shipping_origin_cep, shipping_default_*, shipping_enabled_carriers (JSONB), melhorenvio_* (sandbox, token, sender) |
| `profiles` | id (PK, = auth.users.id), name, email, phone, created_at |
| `favorites` | id, user_id, product_name, product_ref, product_price, created_at, UNIQUE(user_id, product_ref) |
| `checkout_data` | user_id (PK), name, doc, phone, cep, street, number, complement, neighborhood, city, state, notes, updated_at |
| `shipping_quotes_cache` | id, cep_origem, cep_destino, peso_kg, valor_declarado, quotes (JSONB), expires_at (24h), created_at |
| `feedbacks` | id, user_id, customer_name, customer_email, rating, category, message, status (new/read/archived), created_at |

### 4.2 Policies (42)

Distribuídas entre as 13 tabelas (destaques):
- **orders**: "Anyone can create orders", "Guests can view guest orders", "Users can view own orders", "Admins can view/update/delete all orders"
- **reviews**: leitura de aprovadas (público), leitura/criação própria, guest por `guest_token`, admin full
- **coupons**: leitura de ativos (público), admin full
- **loyalty_points**: leitura própria por `auth.uid()` OU `auth.jwt() ->> 'email'`, admin full
- **notifications**: leitura/update/delete própria + admin full
- **settings**: `settings_read_all`, `settings_insert_admins`, `settings_update_admins`
- **shipping_quotes_cache**: "Only service_role manages shipping cache"
- **feedbacks**: "Anyone can create feedback" (anon + authenticated), "Admins can manage all feedbacks" (admin only)

### 4.3 Funções SQL (24)

**10 RPCs** (chamadas pelo frontend):
`get_product_by_ref`, `validate_coupon`, `apply_coupon_to_order`, `get_loyalty_balance`, `redeem_points_as_coupon`, `get_loyalty_summary`, `get_loyalty_extrato`, `adjust_loyalty_points`, `decrease_product_stock`, `restore_product_stock`

**14 trigger functions**:
`update_coupons_updated_at`, `update_products_updated_at`, `update_reviews_updated_at`, `normalize_coupon_code`, `generate_guest_token`, `set_guest_token`, `set_shipped_at`, `handle_new_user`, `notify_order_status_change`, `notify_review_status_change`, `credit_loyalty_points_on_paid`, `notify_points_earned`, `cleanup_old_notifications`, `expire_loyalty_points`

### 4.4 Triggers (14 — 13 no public + 1 no schema `auth`)

`trigger_normalize_coupon_code`, `trigger_coupons_updated_at`, `trigger_notify_points_earned`, `trigger_set_guest_token`, `trigger_set_shipped_at`, `trigger_credit_loyalty_points`, `trigger_notify_order_status_change`, `"notify-order-status"`, `trigger_products_updated_at`, `trigger_reviews_updated_at`, `trigger_notify_review_status_change` + `on_auth_user_created` (comentado, roda em `auth.users` via `handle_new_user`).

### 4.5 Índices (44)

Cobertura: `coupon_usages` (4), `coupons` (4), `loyalty_points` (6), `notifications` (3), `orders` (7), `reviews` (5), `shipping_quotes_cache` (2) — mais PKs/UNIQUEs do CREATE TABLE.

- `idx_reviews_featured` (parcial, WHERE featured = true AND status = 'approved')
- `idx_feedbacks_status_created`

### 4.6 Cron jobs (5 — pg_cron + pg_net)

| Job | Horário (UTC) | Ação |
|---|---|---|
| `request-review` | 06h | GET `request-review` |
| `remind-review` | 07h | GET `remind-review` |
| `cleanup-notifications` | 05h | `cleanup_old_notifications()` |
| `notify-expiring-coupons` | 08h | GET `notify-expiring-coupons` |
| `expire-loyalty-points` | 06h | `expire_loyalty_points()` |

### 4.7 Edge Functions (10 — código real em `supabase/functions/`)

| Function | Linhas | Responsabilidade |
|---|---|---|
| `calculate-shipping` | 274 | Cotação de frete (Correios + Jadlog) |
| `generate-shipping-label` | 383 | Gera etiqueta no ME (add + checkout + generate) |
| `fetch-label-url` | 277 | Busca URL do PDF no ME |
| `melhorenvio-webhook` | 181 | Recebe webhooks do ME (rastreio/status) |
| `notify-order-status` | 441 | Email de status do pedido (Brevo) |
| `request-review` | 308 | Email pedindo review (~7d) |
| `remind-review` | 302 | Lembrete de review (~5d) |
| `notify-expiring-coupons` | 341 | Avisa cupons expirando |
| `feed-xml` | 253 | Feed XML Google Merchant Center |
| `sitemap-products` | 68 | Sitemap dinâmico de produtos |

### 4.8 Storage (2 buckets, 9 policies)

| Bucket | Visibilidade | MIME | Policies |
|---|---|---|---|
| `review-images` | Público | jpeg/png/webp (15 MB) | 5 |
| `product-images` | Público | jpeg/png/webp/mp4/mov (30 MB) | 4 |

### 4.9 Secrets (6 custom)

`BREVO_API_KEY`, `MELHORENVIO_CLIENT_ID`, `MELHORENVIO_CLIENT_SECRET`, `MELHORENVIO_ACCESS_TOKEN`, `MELHORENVIO_SANDBOX`, `SERVICE_ROLE_KEY` (custom, sem prefixo `SUPABASE_`).

---

## 5. Stack técnica

| Camada | Tecnologia |
|---|---|
| Frontend | HTML5 + CSS3 + JS puro (Vanilla, ES6+) — sem framework |
| Backend | Supabase (Auth, Postgres, Edge Functions, Storage, Cron/pg_cron) |
| Hospedagem | GitHub Pages (CNAME `usegemas.com.br`) |
| CDNs | jsDelivr (Supabase SDK, PhotoSwipe, Chart.js), Google Fonts, googletagmanager |
| Bibliotecas | Supabase JS SDK @2, PhotoSwipe 5.4.4, Chart.js 4.4.1 |

---

## 6. Números atuais

| Métrica | Valor |
|---|---|
| Páginas HTML | 9 |
| Arquivos CSS | 6 |
| Arquivos JS | 3 |
| Edge Functions | 10 |
| Tabelas | 14 |
| Policies | 42 |
| Funções SQL | 24 |
| Triggers | 14 |
| Índices | 44 |
| Cron jobs | 5 |
| Storage buckets | 2 |
| Secrets custom | 6 |
| RPCs | 10 |
| Linhas de código (frontend) | ~29k |
| Linhas de código (backend: schema + functions) | ~4,9k |
| **Progresso geral** | **~99,5%** |

---

## 7. Estado de cada funcionalidade crítica

| Funcionalidade | Estado | Observação |
|---|---|---|
| Cadastro + login | ✅ 100% | Supabase Auth + Google OAuth |
| Carrinho persistente | ✅ 100% | localStorage + revalidação |
| Checkout + frete | ✅ 100% | Melhor Envio + ViaCEP + WhatsApp |
| Cupons | ✅ 100% | validate/apply via RPC |
| Pontos/fidelidade | ✅ 100% | triggers + RPCs no banco versionado |
| Reviews | ✅ 100% | cliente + guest + moderação |
| Notificações | ✅ 100% | reais + virtuais + carrossel |
| Etiquetas Melhor Envio | ✅ 100% | geração, PDF, rastreio |
| Webhook rastreio | ✅ 100% | `melhorenvio-webhook` |
| PWA admin | ✅ 100% | `sw-admin.js` |
| PWA cliente | ⚠️ Funcional com ressalvas | falta teste real iOS/Android |
| Página de produto | ✅ 100% | PhotoSwipe + reviews + relacionados |

---

## 8. Pendências conhecidas

### 🔥 Crítica — bloqueia operação

- **Fotos oficiais dos produtos** — hoje há apenas imagens temporárias e vídeos placeholder.

### ⚠️ Alta — impacta UX ou negócio

- **`MELHORENVIO_SANDBOX=true`** — trocar pra produção antes de operar de verdade.
- **Testar PWA cliente em iOS e Android reais.**
- **Deletar Pixel Meta antigo (`9288...`)** — garantir que só o `1408966774044848` esteja ativo.
- **`MELHORENVIO_ACCESS_TOKEN` expira em 30/09/2027** — renovar antes.

### 🟡 Média

- **Otimização de performance** — compressão de imagens + lazy-load.
- **Cron jobs `request-review` e `expire-loyalty-points` rodam no mesmo horário (06h UTC)** — separar pra logs mais limpos.

### 🟢 Baixa — polimento

- **Emoji via `innerHTML`** fora da etiqueta do admin — padronizar com `String.fromCodePoint`.
- **Documentar `melhorenvio_sender_doc` vs `customer_doc`** em comentário na Edge Function.

---

## 9. Próximas features planejadas (não implementadas)

- Tiers de fidelidade (bronze/prata/ouro)
- Sistema de indicação (indique e ganhe)
- Notificações push (web push)
- Frete real em outros estados/regiões
- Relatórios avançados (coorte, LTV, repurchase)
- Cupom de aniversário automático
- Reviews com vídeo

---

## 10. Regras de ouro (convenções do projeto)

1. **WhatsApp** — sempre `api.whatsapp.com`, **nunca** `wa.me`.
2. **Emojis em JS** — usar `String.fromCodePoint(...)` (ex.: `0x1F48E` = 💎).
3. **Versionamento** — bump `?v=X.0` em todo CSS/JS alterado (nos HTMLs que referenciam).
4. **z-index** — `.modal-overlay` acima de drawers.
5. **RLS** — usar `auth.jwt() ->> 'email'` em vez de subquery em `auth.users`.
6. **Service Workers** — filtrar `Range` (206) + `.catch()`; não cachear CDNs externas.
7. **Postgres** — `MAX()` não funciona em UUID (usar `ARRAY_AGG`/`ORDER BY ... LIMIT 1`).
8. **Edge Functions** — CORS explícito + handler `OPTIONS` no topo do `serve()`.
9. **Supabase errors** — 42501/403 = RLS, tratar silenciosamente.
10. **Cream mode** — área do cliente usa `--cr-*` e helpers próprios (`formatBRL`, `showReviewToast`, `.btn-cream`/`.btn-review-cancel`).
11. **Commits** — prefixo (`feat:`, `style:`, `fix:`, `refactor:`, `chore:`, `docs:`), commit + push.
12. **Secrets** — nunca commitar valores; rotação: nova → testar → revogar antiga.

---

## 11. Diagramas

### Diagrama 1 — Fluxo de compra

```
Cliente → Carrinho → CEP → Cotação (calculate-shipping) → Escolhe frete
   → Checkout (ViaCEP) → Pedido criado → WhatsApp → Admin marca "pago"
   → Etiqueta (generate-shipping-label) → PDF (fetch-label-url)
   → Envio → Webhook (melhorenvio-webhook) → Notificação
```

### Diagrama 2 — Fluxo de fidelidade

```
Pedido "pago" → trigger credit_loyalty_points_on_paid → INSERT loyalty_points
   → trigger notify_points_earned → Notificação "Você ganhou X pontos!"
   → Carteira → Resgate (redeem_points_as_coupon) → Cupom → apply_coupon_to_order
```

### Diagrama 3 — Fluxo de review

```
Pedido "enviado" → cron request-review (~7d) → Email → Cliente avalia
   → (remind-review se não avaliou) → Admin modera → Site mostra
```

### Diagrama 4 — Arquitetura técnica

```
┌─────────────────┐        ┌──────────────────────────────────────────────┐
│  GitHub Pages    │  HTTPS │  Supabase                                    │
│  (usegemas.com.br)│◄──────►│  ├─ Auth (email + Google)                    │
│  HTML/CSS/JS     │        │  ├─ Postgres (RLS + 14 triggers + 10 RPCs)    │
└────────┬─────────┘        │  ├─ Edge Functions (10)                       │
         │                  │  ├─ Storage (2 buckets)                       │
         │                  │  └─ Cron (5 jobs, pg_cron)                    │
         │                  └──────────────┬───────────────────────────────┘
         │        ┌────────────────────────┼───────────────────┐
         ▼        ▼                        ▼                   ▼
   ┌──────────┐ ┌──────────┐       ┌──────────────┐     ┌──────────┐
   │ Melhor   │ │ ViaCEP   │       │ GA4/Meta/    │     │ Brevo    │
   │ Envio    │ │          │       │ WhatsApp     │     │ (email)  │
   └──────────┘ └──────────┘       └──────────────┘     └──────────┘
```

---

## 12. Ecossistema completo de serviços

### Categoria 1 — Marketing & Analytics

| Serviço | Para que serve | Plano/Conta | Onde é usado | URL |
|---|---|---|---|---|
| Google Analytics 4 (`G-5S8HJR13T8`) | Tracking de eventos, funis, conversões | Free | `index.html`, `produto.html` | analytics.google.com |
| Google Merchant Center | Feed de produtos pro Google Shopping | Free | via Edge `feed-xml` | merchantcenter.google.com |
| Meta Business Suite | Pixel (`1408966774044848`), catálogo, campanhas | Free | `index.html`, `produto.html` | business.facebook.com |
| Meta Ads Manager | Campanhas pagas | — | (externo) | adsmanager.facebook.com |
| Google Cloud | Projeto na nuvem, APIs, credenciais OAuth | Free | OAuth Google (Supabase) | console.cloud.google.com |
| WhatsApp Business | Comunicação com clientes | Free | `api.whatsapp.com` (`5511982053330`) | business.whatsapp.com |
| Instagram (`use.gemas`) | Presença social | Free | footer/social | instagram.com/use.gemas |

### Categoria 2 — Backend & Infraestrutura

| Serviço | Para que serve | Plano/Conta | URL |
|---|---|---|---|
| Supabase | Postgres + auth + edge functions + storage + cron | Free tier | supabase.com |
| GitHub Pages | Hospedagem estática | Free | pages.github.com |
| Registro.br | Registro do domínio `usegemas.com.br` | Anual | registro.br |

### Categoria 3 — Email & Comunicação

| Serviço | Para que serve | URL |
|---|---|---|
| Brevo | Email transacional (SMTP + API) | brevo.com |
| Zoho Mail | Caixa profissional (`contato@`, `pedidos@usegemas.com.br`) | zoho.com/mail |

### Categoria 4 — Logística

| Serviço | Para que serve | URL |
|---|---|---|
| Melhor Envio | Cotação + etiquetas + rastreio | melhorenvio.com.br |
| Correios | Transportadora (via API ME) | correios.com.br |
| Jadlog | Transportadora (via API ME) | jadlog.com.br |

### Categoria 5 — Desenvolvimento & Ferramentas Dev

| Ferramenta | Papel |
|---|---|
| VS Code | Editor principal |
| Git | Versionamento local |
| GitHub Desktop | Interface gráfica do Git |
| GitHub | Repo + Pages |
| **DeepSeek (Deep)** | Assistente de IA — revisão, arquitetura, SQL/Edge Functions, debug, mentoria (modelo: DeepSeek V4 Pro) |
| **GitHub Copilot** | Assistente de IA no editor — aplicação de mudanças, autocomplete, refactor |

---

## 13. Documentação por camada

### 13.1 Frontend
- **8 HTMLs**: index (loja), produto, minha-conta, admin, avaliar, reset-password, política-troca, política-privacidade.
- **5 CSS**: style (loja, dark), perfil (área cliente, cream), produto, avaliar, paginas-legais.
- **3 JS**: script.js (lógica principal), sw.js (PWA cliente), sw-admin.js (PWA admin).
- **CDNs**: jsDelivr, Google Fonts, googletagmanager.
- **Bibliotecas**: Supabase SDK @2, PhotoSwipe 5.4.4, Chart.js 4.4.1.

### 13.2 Backend (Supabase)
- **Auth**: 2 providers (Email + Google), 8 redirect URLs.
- **Postgres**: 13 tabelas, 40 policies, 24 funções, 14 triggers, 42 índices.
- **RPCs**: 10 (validate_coupon, apply_coupon_to_order, get_loyalty_*, etc.).
- **Edge Functions**: 10 (código em `supabase/functions/`).
- **Storage**: 2 buckets (review-images, product-images).
- **Cron**: 5 jobs (pg_cron + pg_net).

### 13.3 Integrações
APIs externas: Melhor Envio (cotação/etiqueta/webhook), ViaCEP (endereço), Brevo (email), Google OAuth, GA4, Meta Pixel, Web3Forms, WhatsApp.

### 13.4 DevOps
- **Git + GitHub Desktop**: branch `main`, commit padrão com prefixo.
- **GitHub Pages**: deploy automático do push na `main`.
- **Supabase**: migrations (`001_schema.sql`) e deploys de Edge Functions via painel (sem CI/CD ainda).

---

## 14. Decisões arquiteturais (ADRs)

| # | Decisão | Alternativas | Por quê |
|---|---|---|---|
| 1 | Supabase (não Firebase) | Firebase, Appwrite, custom | Postgres + RLS + RPCs + Edge Functions |
| 2 | GitHub Pages (não Vercel/Netlify) | Vercel, Netlify, Cloudflare | Já tava no GitHub + CNAME funcionando |
| 3 | Vanilla JS (não React/Vue) | React, Vue, Svelte | Sem build step, deploy direto |
| 4 | Melhor Envio (não API Correios direta) | Correios SOAP, Frenet | 1 API pra N transportadoras |
| 5 | Brevo (não SendGrid/Resend) | SendGrid, Resend, Mailgun | Free tier generoso + API simples |
| 6 | Zoho Mail (não Gmail Business) | Google Workspace, Outlook | Free tier com domínio próprio |
| 7 | PWA nativo (não app nativo) | React Native, Flutter | Zero loja, instala direto do site |
| 8 | Sistema de pontos próprio (não Smile/Loyalme) | Smile, Loyalme | Integração direta com cupons existentes |
| 9 | CORS explícito em Edge Functions | — | Evita bloqueio preflight + retrabalho |
| 10 | Ledger pra pontos (não saldo) | Coluna `balance` | Auditoria + histórico + expiração por lote |
| 11 | Carrinho em localStorage (não servidor) | Session server-side | Sem auth obrigatória, UX imediata |
| 12 | Notificações virtuais calculadas (não todas reais) | Gravar todas no banco | Reduz writes + sempre atualizadas |
| 13 | Frete dual-mode regionalizado (ME + fixo por região) | Só ME / só fixo global | Continuidade do serviço se o ME cair + proteção contra prejuízo em CEPs distantes |
| 14 | Central de Reviews híbrida (featured + fallback) | Só automático / só manual | Controle quando quer + nunca fica vazio. Reaproveita infra de reviews existente. |

---

## 15. Roadmap sugerido

### Agora (esta semana)
0. ✅ ~~Fase 10.4 — Central de Reviews + Feedbacks~~ (concluída em 02/out/2026)
1. Substituir fotos/vídeos placeholder dos produtos.
2. Testar PWA cliente em iOS/Android reais.
3. Deletar Pixel Meta antigo (`9288...`).

### Depois (este mês)
- **Fase 10.1 — Conteúdo configurável** (Hero + Carrossel + Rodapé + Meta tags via admin) — sem depoimentos
4. Aplicar o seletor de frete novo no `produto.html`.
5. Atualizar `sitemap.xml` estático (ou automatizar com `sitemap-products`).
6. Otimização de performance (compressão, lazy-load).

### Mais tarde (trimestre)
7. Tiers de fidelidade.
8. Notificações push.
9. Relatórios avançados no admin.
10. Cupom de aniversário automático.

### Quando sobrar tempo
11. Reviews com vídeo.
12. Sistema de indicação.
13. Limpeza de código morto (shippingCost write-only, etc.).

---

## 16. Changelog resumido (últimos 15 dias)

- **02/out/2026** — Fase 10.4 completa: Central de Reviews dinâmica (home + `/avaliacoes.html` + admin com curadoria híbrida `featured`) + reciclagem do Web3Forms em canal de feedback privado (nova tabela `feedbacks` + aba no admin) + cards clicáveis com PhotoSwipe + JSON-LD AggregateRating.
- **02/out/2026** — Frete dual-mode regionalizado (toggle ME/fixo + 5 faixas + fallback + botão "Calcular outro CEP").
- **02/out/2026** — Frete dual-mode completo: toggle ME/fixo no admin + 5 faixas regionais (SP/Sudeste/Sul/Centro-Norte-NE) + fallback automático + botão "Calcular outro CEP" + refatoração do helper `getRegionKeyFromCep()` pra usar 2 dígitos do CEP.
- **02/out/2026** — Sistema de frete dual-mode: toggle ME/fixo no admin + fallback automático + port do seletor ME pro produto.html + seção 18 do doc mestre.
- **02/out/2026** — `PROJETO-MESTRE.md` v3.1: seção 17 (observações de varredura) + pendências reorganizadas; `.gitignore` e `docs/` completos na pasta `supabase/`.
- **02/out/2026** — Estrutura `supabase/` completa (10 Edge Functions + schema 001 + docs secrets/storage/auth).
- **01/out/2026** — FASE 9.7: webhook de rastreio do Melhor Envio.
- **01/out/2026** — FASE 9.6: etiquetas ME (geração + PDF + CSS admin).
- **01/out/2026** — FASE 9.5: dimensões atualizadas da caixa (settings).
- **30/set/2026** — FASE 9 completa (Melhor Envio integrado).
- **30/set/2026** — FASE 8 completa (pontos/fidelidade).
- **30/set/2026** — Sistema de cupons completo.
- **30/set/2026** — Sistema de notificações completo.
- **30/set/2026** — Sistema de reviews completo.

---

## 17. Observações técnicas da varredura (02/out/2026)

> Notas de auditoria do código. Nem tudo é bug — algumas são apenas pontos de atenção ou decisões conscientes que valem documentar.

### 17.1 Inconsistências detectadas

#### Edge Function `notify-order-status` — env var diferente

Arquivo: `supabase/functions/notify-order-status/index.ts`

```typescript
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
```

Todas as outras functions usam:
```typescript
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") 
    || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
```

**Impacto:** se o secret custom `SERVICE_ROLE_KEY` for usado (e o `SUPABASE_SERVICE_ROLE_KEY` continuar deprecated/vazio), essa function **falha** ao conectar no banco.

**Correção:** padronizar o fallback.

---

#### Edge Function `feed-xml` — usa ANON_KEY

Arquivo: `supabase/functions/feed-xml/index.ts`

```typescript
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
```

**Status:** decisão aparentemente consciente (feed público, RLS já bloqueia produtos inativos). **Não é bug.** Só falta documentar no cabeçalho do arquivo.

---

#### Trigger HTTP `notify-order-status`

Arquivo: `001_schema.sql` (seção 5. triggers)

```sql
CREATE TRIGGER "notify-order-status"
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
        'https://dytdnemwqbzgrekamwla.supabase.co/functions/v1/notify-order-status',
        'POST',
        '{"Content-type":"application/json"}',
        '{}',
        '5000'
    );
```

**Dependência:** `supabase_functions.http_request()` é uma função especial do Supabase. Se o projeto for recriado sem essa extensão, o trigger falha.

**Alternativa:** migrar pra `pg_net` (mais nativo e portátil).

---

### 17.2 Código morto / lixo latente

#### `shippingCost` write-only

Arquivo: `estilo/script.js`

Após o refactor do frete pra 3 estados (grátis / fixo / Melhor Envio), a variável `shippingCost` continua sendo escrita em alguns pontos mas **nunca é lida** com significado. Não quebra nada, mas confunde.

**Ação:** remover nas próximas limpezas.

---

#### `shipping-result` órfão

Arquivo: `index.html` + `estilo/script.js`

Elemento `#shipping-result` (frete fixo antigo) ainda existe em `produto.html`, mas no `index.html` foi substituído por `#shipping-options`. A referência órfã fica guardada por `if` em `updateCartUI`.

**Ação:** limpar junto com o refactor do frete no `produto.html`.

---

#### Listener duplicado de máscara de CEP

Arquivo: `index.html`

Existem 2 listeners aplicando máscara `00000-000` no `#cep-input`:
1. Um antigo (linha ~X)
2. Um novo, dentro de `initShipping()`

Idempotente (o segundo sobrescreve o primeiro), mas código morto.

**Ação:** remover o antigo.

---

#### Emoji via `innerHTML`

Arquivo: `admin.html` (seção "Etiqueta de Envio" no modal do pedido)

```html
<span class="pedido-etiqueta-icon">${statusIcon}</span>
```

`statusIcon` contém emoji literal (`⏳`, `⚠️`, `✅`, `❌`) passado via `innerHTML`. Funciona, mas o padrão do projeto é `String.fromCodePoint`.

**Ação:** padronizar nas próximas refatorações.

---

### 17.3 Observações menores

#### `description` selecionado mas não usado

Arquivo: `estilo/script.js` (`updateCartUI`) + `minha-conta.html` (`loadMyPoints`)

O campo `description` de `loyalty_points` é selecionado na query mas nunca renderizado no extrato do cliente (que usa `type` pra montar label). Não é bug, mas desperdício de banda.

---

#### Cron jobs no mesmo horário

`request-review` (0 6 * * *) + `expire-loyalty-points` (0 6 * * *)

Ambos rodam às **06h UTC (03h BRT)**. Não há conflito real (pg_cron executa em paralelo), mas logs misturados podem atrapalhar debug.

**Ação (opcional):** separar — ex: `expire-loyalty-points` às 06h, `request-review` às 09h.

---

#### `melhorenvio_sender_doc` vs `customer_doc` — mesmo CPF

O `docs/secrets.md` e o `PROJETO-MESTRE.md` mencionam que, ao gerar etiqueta, o ME recusa se `sender_doc === customer_doc`. Isso aconteceu em testes locais onde o admin testava consigo mesmo. **Não é bug** — é proteção do ME contra auto-envio.

**Documentar em comentário na Edge Function `generate-shipping-label`** pro próximo dev não tropeçar.

---

#### Access Token do ME — expira em 12 meses

`MELHORENVIO_ACCESS_TOKEN` **expira em 30/09/2027**. Sem renovação automática configurada, o projeto vai **parar de gerar etiquetas e cotações** nessa data.

**Ação futura:** documentar em calendário + criar alerta 30 dias antes. Alternativa robusta: implementar refresh automático via `MELHORENVIO_CLIENT_ID` + `MELHORENVIO_CLIENT_SECRET`.

---

#### Trigger `handle_new_user` — schema `auth`

O trigger `on_auth_user_created` (que cria linha em `public.profiles` quando alguém se cadastra) roda em **`auth.users`**, não em `public`. Por isso, **não está no `001_schema.sql`** (que só cobre `public`).

Se recriar o projeto do zero, **precisa criar esse trigger manualmente**:

```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Documentar em `supabase/README.md`** como passo obrigatório pós-restore.

---

### 17.4 Checklist para recriação completa do banco

Se um dia o Supabase precisar ser recriado do zero (disaster recovery / novo projeto):

1. ✅ Rodar `001_schema.sql` no SQL Editor (cria 13 tabelas + 40 policies + 24 funções + 14 triggers + 42 índices + 5 crons)
2. ⚠️ **Habilitar extensões:** `pg_cron`, `pg_net`, `supabase_functions`
3. ⚠️ **Criar trigger manual** em `auth.users`: `on_auth_user_created` → `public.handle_new_user()`
4. ⚠️ **Criar buckets** em Storage: `review-images` (15MB, jpeg/png/webp) + `product-images` (30MB, jpeg/png/webp/mp4/mov)
5. ⚠️ **Criar 9 policies de Storage** (5 review-images + 4 product-images)
6. ⚠️ **Configurar Secrets:** `BREVO_API_KEY`, `MELHORENVIO_*` (4), `SERVICE_ROLE_KEY`
7. ⚠️ **Configurar Auth:** 2 providers (Email + Google) + 8 redirect URLs
8. ⚠️ **Deploy das 10 Edge Functions** (`supabase/functions/*`)
9. ⚠️ **Configurar webhook** no Melhor Envio → `melhorenvio-webhook`
10. ⚠️ **Inserir linha única** em `settings` (id=1) com defaults

**Tempo estimado:** ~2h.

---

## 18. Sistema de Frete — Dual Mode (ME + Fixo por região)

> Documentado em 02/out/2026 — versão final implementada.

### 18.1 Objetivo

Garantir continuidade da operação caso o Melhor Envio (ME) apresente instabilidade, timeout ou indisponibilidade. O frete fixo atua como **reserva automática** sem que o cliente perceba interrupção. Além disso, a reserva é **regionalizada** (5 faixas) pra evitar prejuízo em CEPs distantes.

### 18.2 Modelo de dados

Coluna em `settings`:

| Coluna | Tipo | Valores | Default |
|---|---|---|---|
| `shipping_mode` | TEXT | `'me'` \| `'fixed'` | `'me'` |
| `shipping_fixed` | NUMERIC | (fallback global) | 0 |
| `shipping_fixed_sp` | NUMERIC | SP (CEP 01-19) | 0 |
| `shipping_fixed_sudeste` | NUMERIC | RJ/ES/MG (CEP 20-39) | 0 |
| `shipping_fixed_sul` | NUMERIC | PR/SC/RS (CEP 80-99) | 0 |
| `shipping_fixed_centro_norte_ne` | NUMERIC | BA/SE/PE/CE/PA/DF/etc (CEP 40-79) | 0 |
| `free_shipping_min` | NUMERIC | (frete grátis) | 400 |

### 18.3 Lógica de decisão (prioridade)

**1. Frete grátis (soberano)** — Se `subtotal >= free_shipping_min` → frete = R$ 0. Aplica em qualquer modo.

**2. Modo explícito (`shipping_mode`)**:
- `'fixed'` → ignora ME completamente; usa valor regional (ou global como reserva).
- `'me'` → tenta ME.

**3. Fallback automático (só em `'me'`)**:
- ME OK → usa cotações ME.
- ME falha + `shipping_fixed_*` da região > 0 → usa valor regional.
- ME falha + região vazia + `shipping_fixed` global > 0 → usa valor global.
- ME falha + sem nenhum fallback → erro "Frete indisponível".

### 18.4 Identificação de região

Helper `getRegionKeyFromCep(cep)` usa os **2 primeiros dígitos** do CEP (alinhado com a tabela dos Correios):

| Prefixo CEP | Região | Coluna em `settings` |
|---|---|---|
| 01-19 | SP | `shipping_fixed_sp` |
| 20-39 | RJ/ES/MG (Sudeste) | `shipping_fixed_sudeste` |
| 40-79 | BA/SE/PE/CE/PA/DF/GO/MT/MS/TO (Centro-Oeste + Norte + Nordeste) | `shipping_fixed_centro_norte_ne` |
| 80-99 | PR/SC/RS (Sul) | `shipping_fixed_sul` |

### 18.5 UI do admin

Em **Configurações → Frete**:
- Toggle radio de modo: "Melhor Envio" (padrão) ou "Frete fixo"
- Campo "Frete fixo (R$)" (fallback global)
- Campo "Frete grátis acima de (R$)"
- Subseção colapsável "Frete fixo por região (opcional)" com 4 inputs regionais

Validação: se modo `'fixed'` escolhido, `shipping_fixed` global precisa ser > 0.

### 18.6 Estados do carrinho (UI do cliente)

| Estado | Aparência |
|---|---|
| ME carregando | Input de CEP + botão "Calcular" |
| ME OK | Radio com 3-4 opções (menor preço primeiro) |
| ME falhou + fallback regional | Card único "Frete padrão: R$ X,XX" + botão "Calcular outro CEP" |
| ME falhou + sem fallback | Feedback vermelho "Frete indisponível" |
| Modo fixo + CEP digitado | Card único "Frete padrão: R$ X,XX" + botão "Calcular outro CEP" |
| Frete grátis (qualquer modo) | Card verde "FRETE GRÁTIS ✨" + botão "Calcular outro CEP" |

### 18.7 Arquivos envolvidos

- `settings` (banco) — `shipping_mode` + 4 colunas regionais
- `admin.html` — toggle + 4 inputs regionais + validação
- `estilo/script.js` — `getRegionKeyFromCep()` + `getFixedShippingForCep()` + decisão em `calculateShipping()`
- `index.html` + `produto.html` — estrutura DOM do seletor (idêntica)

---

## 19. Central de Reviews (Fase 10.4)

### 19.1 Objetivo

Substituir depoimentos fictícios hardcoded por um feed dinâmico de reviews reais
aprovadas. Zero manutenção, prova social autêntica, e SEO com rich snippets
(AggregateRating).

### 19.2 Modelo de dados

Coluna nova em `reviews`:

| Coluna | Tipo | Valores | Default |
|---|---|---|---|
| `featured` | BOOLEAN | true/false | false |

Nova tabela `feedbacks` (canal privado, separado de reviews):

| Coluna | Tipo | Valores |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | nullable (FK auth.users) |
| `customer_name` | TEXT | nullable |
| `customer_email` | TEXT | nullable |
| `rating` | INTEGER | nullable (1-5) |
| `category` | TEXT | suggestion/compliment/complaint/bug/other |
| `message` | TEXT | NOT NULL |
| `status` | TEXT | new / read / archived (default: new) |
| `created_at` | TIMESTAMPTZ | default now() |

### 19.3 Lógica de exibição na home

**Curadoria híbrida:**
1. Busca reviews `status='approved' AND featured=true` (máx 6)
2. Se faltar, completa com recentes aprovadas (sem duplicar)
3. Renderiza grid responsivo (3 col home, 2 col tablet, 1 col mobile)
4. Cada card: estrelas + foto (se tiver) + texto truncado (180 chars) + nome abreviado (Marina R.) + nome do produto + selo "compra verificada"

**Fallback vazio:** se zero reviews aprovadas, mostra estado vazio "💛 Ainda não temos avaliações publicadas."

### 19.4 Página `/avaliacoes.html`

- Listagem completa com paginação client-side (20 por vez)
- Filtros: Todas / 5 estrelas / Com foto / por produto (`?produto=UG-XXX`)
- JSON-LD AggregateRating no `<head>`
- Reusa componente `.testimonial-card` da home
- Cards clicáveis → PhotoSwipe lightbox

### 19.5 Admin — Curadoria + Feedbacks

**Avaliações:**
- Filtro "⭐ Destacadas" adicionado
- Botão "⭐ Destacar" / "★ Destacada" no card de moderação

**Feedbacks (novo):**
- Aba dedicada com badge de novos
- Filtros: Todos / Novos / Lidos / Arquivados
- Ações: Marcar como lido / Arquivar / Restaurar / Excluir
- Busca por nome, email ou texto

### 19.6 Reciclagem do Web3Forms

**Antes:** form Web3Forms → email do dono (depoimentos fictícios apareciam no site)

**Agora:** botão "💬 Deixe seu feedback" na home → modal → tabela `feedbacks`
- Canal privado (não aparece no site)
- Rating opcional (1-5)
- Categoria opcional
- Status: new → read → archived

### 19.7 Arquivos envolvidos

- `reviews` (banco) — coluna `featured`
- `feedbacks` (banco) — tabela nova
- `index.html` — seção dinâmica + modal de feedback
- `avaliacoes.html` (novo) — Central pública
- `estilo/avaliacoes.css` (novo) — CSS da página
- `estilo/style.css` — estilos dos cards de review + modal de feedback
- `estilo/script.js` — `loadHomeReviews()`, `openFeedbackModal()`, `openReviewPhotosLightbox()`
- `admin.html` — aba Feedbacks + toggle `featured` em reviews
- `sitemap.xml` — entrada `/avaliacoes.html`

---

*Fim do documento. Gerado por varredura do repositório local em 02/10/2026 — v3.4.*
