# CONTEXTO CONSOLIDADO — Use Gemas
> **Ponto de restauração:** 05/out/2026
> **Uso:** colar no início de uma nova sessão Deep pra reconstruir contexto
> **Estado do projeto:** ~99,9% concluído

---

## 1. CONTEXTO GERAL

**Projeto:** Use Gemas — loja de joias artesanais (microcrochê + pedras naturais)
**Dono:** Arjuna (chamado de "Jeep")
**Objetivo estratégico:** site modelo reutilizável pra criar sites pra família/nichos diferentes
**Stack:** HTML5 + CSS3 + JS puro (vanilla) + Supabase + GitHub Pages
**URL:** usegemas.com.br
**Repo:** github.com/arjunagion/use-gemas
**Supabase:** dytdnemwqbzgrekamwla.supabase.co
**Doc mestre:** PROJETO-MESTRE.md (v3.8, ~99,9% fiel)

---

## 2. ESTRUTURA ATUAL

**9 HTMLs:** index, admin, minha-conta, produto, avaliar, avaliacoes, reset-password, política-troca, política-privacidade
**6 CSSs:** style, perfil, produto, avaliar, paginas-legais, avaliacoes
**3 JSs:** script, sw (cliente), sw-admin
**10 Edge Functions:** calculate-shipping, generate-shipping-label, fetch-label-url, melhorenvio-webhook, notify-order-status, request-review, remind-review, notify-expiring-coupons, feed-xml, sitemap-products
**15 tabelas:** products, orders, reviews, notifications, coupons, coupon_usages, loyalty_points, settings, admins, profiles, favorites, checkout_data, shipping_quotes_cache, feedbacks, themes
**44 policies · 24 funções SQL · 15 triggers · 46 índices · 6 cron jobs**
**3 storage buckets:** review-images, product-images, site-media

---

## 3. PADRÕES DO PROJETO (RESPEITAR SEMPRE)

1. `api.whatsapp.com` (nunca wa.me)
2. `String.fromCodePoint` para emojis dinâmicos (nunca literal)
3. Bump `?v=X.0` em CSS/JS a cada mudança
4. RLS ativo em todas as tabelas
5. `git add . && git commit && git push` sempre
6. Arquivo completo > trecho (exceto cirúrgico)
7. Nunca colar secrets no chat
8. Análise ANTES de sugerir mudanças
9. Prós/contras → confirmar → codar
10. Edge Functions: CORS explícito + handler OPTIONS
11. Cream mode na área do cliente (`--cr-*`)
12. Análise antes de commitar

---

## 4. FASES ENTREGUES (02/out → 05/out)

### FASE 10.1 — Conteúdo do Site configurável
- Hero (tagline, título, subtítulo, CTA, vídeo)
- Carrossel (4 slides JSONB)
- Rodapé (brand + tagline)
- Meta tags (title, description, og:image)
- Novo bucket `site-media` (50MB, mp4/mov/webm/jpeg/png/webp)
- Fallback hardcoded em tudo
- Admin: subseção "Conteúdo do Site" em Configurações

### FASE 10.2 — Área do Cliente configurável
- Hero da conta (badge + subtítulo)
- Tabs (4 labels + ícones)
- Labels de status do pedido (5)
- Timeline (4 steps + cancelado)
- Mensagens de estado vazio (6 contextos)
- Labels de pontos (8)
- Fonte única da verdade: `settings` é lido por cliente E admin
- `getStatusLabel()` lê de `settings.account_status_labels`

### FASE 10.3 — Refinos
- Menu (nav_links JSONB)
- Threshold de estoque baixo (default 2)
- Banner frete grátis condicional (3 colunas)
- Regras de fidelidade em `settings.loyalty_rules` (3 funções SQL reescritas)
- Fix Service Worker (network-first + bump CACHE_VERSION)
- Consolidação dos 2 banners (site-banner ↔ free-shipping-banner)

### FASE 10.4 — Central de Reviews + Feedbacks
- Coluna `featured` em `reviews`
- Nova tabela `feedbacks` (canal privado)
- Home mostra 6 reviews (featured + fallback)
- Nova página `/avaliacoes.html`
- Admin: curadoria (destacar) + aba Feedbacks
- Reciclagem Web3Forms → feedback privado
- Cards clicáveis com PhotoSwipe
- JSON-LD AggregateRating

### FASE 10.5 — Biblioteca de Temas
- Nova tabela `themes`
- 11 presets system (8 dark + 3 light)
- Custom até 20 temas
- Agendamento (cron `apply-scheduled-theme` 04h UTC)
- Favoritos
- Preview em tempo real
- Validação WCAG de contraste

### FASE 10.5.1 — Auto-dessaturar + Luminância
- Auto-dessaturar cores saturadas (>40%) em 60%
- Detecção de luminância (light/dark)
- Classe `.theme-light` / `.theme-dark` no `<html>`

### FASE 10.5.2 — White Mode real
- Variáveis semânticas: `--navbar-bg`, `--modal-overlay-bg`, `--border-subtle`, `--border-strong`, `--shadow-color`, `--card-overlay`, `--input-bg`, `--btn-text-on-accent`, `--gold-rgb`
- Refactor global de CSS:
  - Navbar (+ scrolled)
  - Drawers (cart, wishlist, notifications)
  - Cards (product, testimonial, review, top-product)
  - Modais (overlay, content, box, checkout, auth, coupons, feedback)
  - `produto.css` (paleta própria migrada)
  - `perfil.css` (accent compartilhado)

### FASE 10.6 — Cream Mode Dinâmico
- Área do cliente com tint sutil do accent (5%)
- Texto derivado: `darken(accent, 55%)` — contraste AAA
- Fallback pra cream clássico se tema light
- `applyThemeAccentOnly()` reforçada com helpers HSL

### FASE 10.7 — Banner Carrossel Avançado (PENDENTE de implementação)
- **Status:** SQL rodado, prompts ainda não aplicados
- 8 tipos de slide (static, link, dynamic_shipping, shipping_achieved, installments, coupon, warning, flash_promo)
- Condições por slide (min_cart_value, device, time_start/end, first_visit_only)
- Rotação configurável (5s default, pause on hover, dots, swipe)
- Migração automática dos 2 banners atuais

### Extras entregues
- Redesign admin: fonte Inter + SVG Lucide (sidebar + botões + toasts + badges)
- Botão "Loja" no `produto.html`
- Fix banner frete grátis seguir tema
- PROJETO-MESTRE v3.0 → v3.8

---

## 5. DECISÕES ARQUITETURAIS (ADRs 1-21)

1. Supabase (não Firebase)
2. GitHub Pages (não Vercel/Netlify)
3. Vanilla JS (não React/Vue)
4. Melhor Envio (não API Correios direta)
5. Brevo (não SendGrid/Resend)
6. Zoho Mail (não Gmail Business)
7. PWA nativo (não app nativo)
8. Sistema de pontos próprio (não Smile/Loyalme)
9. CORS explícito em Edge Functions
10. Ledger pra pontos (não saldo)
11. Carrinho em localStorage (não servidor)
12. Notificações virtuais calculadas (não todas reais)
13. Frete dual-mode regionalizado (ME + fixo por região)
14. Central de Reviews híbrida (featured + fallback)
15. Conteúdo do Site configurável
16. Labels do cliente em `settings` (fonte única)
17. Regras de fidelidade em `settings`
18. Consolidação de banners
19. Biblioteca de Temas
20. Auto-dessaturar cores saturadas
21. Cream Mode Dinâmico

---

## 6. BUGS NOTÁVEIS E FIXES

- **Banner dourado não seguia tema:** `#site-banner` tinha gradient hardcoded. Fix: `var(--gold)`.
- **Service Worker servindo CSS/JS antigos:** estratégia cache-first pra assets locais. Fix: network-first + bump CACHE_VERSION.
- **Nomes de variáveis CSS dessincronizados:** `applyThemeToRoot` escrevia `--bg`, `--text`, `--bg-panel` mas CSS usava `--bg-main`, `--text-primary`, `--bg-elevated`. Fix: mapeamento correto.
- **Cards de review com fundo claro + texto claro em light mode:** `.testimonial-card`, `.review-card` migrados pra `--bg-card`.
- **Drawers com fundo claro + texto claro em light mode:** `.cart-drawer`, `.wishlist-drawer`, `.notifications-drawer` migrados.
- **Navbar `scrolled` escurecia em light mode:** `.navbar.scrolled` sobrescrito com `html.theme-light`.
- **Fontes "todas iguais" no editor de temas:** falta carregar do Google Fonts no admin. Fix: `ensureAdminFontLoaded()`.
- **Cache do admin impedindo ver redesign:** `sw-admin.js` CACHE_NAME v5 → v6.

---

## 7. PENDÊNCIAS ATIVAS

**🔴 Bloqueadores reais (não-código):**
- Fotos oficiais dos produtos
- Tráfego pago

**🟡 Fase 10.7 pendente (código):**
- Banner Carrossel Avançado — SQL já rodado, prompts faltam

**🟡 Polimento técnico (opcional):**
- Trocar `MELHORENVIO_SANDBOX=true` → `false`
- Deletar Pixel Meta antigo (9288...)
- Separar cron jobs no mesmo horário (06h UTC)
- Emojis via `innerHTML` fora da etiqueta
- Testar PWA em iOS/Android reais

**🟢 Emojis residuais no admin:**
- 8 accordions em Configurações (Hero, Carrossel, Rodapé, Meta Tags, Área do Cliente, Refinos, Identidade Visual, Banners Rotativos)
- Labels internos (MP4/MOV, etc)

---

## 8. PRÓXIMOS PASSOS PLANEJADOS

**Curto prazo (opcional):**
- Terminar Fase 10.7 (Banner Carrossel Avançado)
- Limpar emojis residuais dos accordions
- Fechar polimento técnico

**Médio prazo (features estratégicas ~3h cada):**
- Sistema de Indicação (indique e ganhe)
- Tiers de Fidelidade (Bronze/Prata/Ouro)
- Notificações Push (PWA)
- Blog / Diário da Artesã

**Longo prazo (produção):**
- Fotos oficiais + tráfego pago

---

## 9. ESTILO DE COMUNICAÇÃO

- PT-BR direto, sem enrolação
- Chamar o usuário de "Jeep"
- Deep usa pronomes femininos ("irmã", "amiga")
- Explicar antes de mandar prompt
- Comandos SQL + Prompt Copilot sempre separados
- Análise ANTES de sugerir mudanças
- Prós/contras primeiro → confirmar → codar

---

## 10. ÚLTIMA SESSÃO (05/out/2026)

**O que foi feito:**
- Redesign completo do admin (Inter + SVG Lucide)
- Substituição de ~50 emojis
- Bump sw-admin CACHE_NAME v5 → v6
- Auditoria pós-fix (limpeza confirmada)

**O que ficou pendente:**
- Fase 10.7 (Banner Carrossel Avançado) — SQL rodado, prompts faltam
- 8 emojis residuais nos accordions do admin

**Última ação confirmada:** redesign admin visível em desktop (>1100px)

---

*Fim do contexto consolidado — v1 — 05/out/2026*