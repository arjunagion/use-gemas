# CONTEXTO CONSOLIDADO — Use Gemas
> **Ponto de restauração:** 07/out/2026
> **Uso:** colar no início de uma nova sessão Deep pra reconstruir contexto
> **Estado do projeto:** ~99,9% concluído
> **Doc mestre:** PROJETO-MESTRE.md (v3.12 — fonte da verdade detalhada)

---

## 1. CONTEXTO GERAL

**Projeto:** Use Gemas — loja de joias artesanais (microcrochê + pedras naturais)
**Dono:** Arjuna (chamado de "Jeep")
**Objetivo estratégico:** site modelo reutilizável pra criar sites pra família/nichos diferentes
**Stack:** HTML5 + CSS3 + JS puro (vanilla) + Supabase + GitHub Pages
**URL:** usegemas.com.br
**Repo:** github.com/arjunagion/use-gemas
**Supabase:** dytdnemwqbzgrekamwla.supabase.co

---

## 2. ESTRUTURA ATUAL

**9 HTMLs:** index, admin, minha-conta, produto, avaliar, avaliacoes, reset-password, política-troca, política-privacidade
**6 CSSs:** style, perfil, produto, avaliar, paginas-legais, avaliacoes
**3 JSs:** script, sw (cliente), sw-admin
**10 Edge Functions:** calculate-shipping, generate-shipping-label, fetch-label-url, melhorenvio-webhook, notify-order-status, request-review, remind-review, notify-expiring-coupons, feed-xml, sitemap-products
**15 tabelas:** products, orders, reviews, notifications, coupons, coupon_usages, loyalty_points, settings, admins, profiles, favorites, checkout_data, shipping_quotes_cache, feedbacks, themes
**44 policies · 24 funções SQL · 15 triggers · 46 índices · 6 cron jobs**
**3 storage buckets:** review-images, product-images, site-media
**Versões SW:** `sw.js` v12 · `sw-admin.js` v22

---

## 3. PADRÕES DO PROJETO (RESPEITAR SEMPRE)

1. `api.whatsapp.com` (nunca wa.me)
2. `String.fromCodePoint` para emojis dinâmicos (nunca literal)
3. Bump `?v=X.0` em CSS/JS a cada mudança
4. Bump `CACHE_VERSION` do SW (cliente + admin) a cada mudança
5. RLS ativo em todas as tabelas
6. `git add . && git commit && git push` sempre
7. Arquivo completo > trecho (exceto cirúrgico)
8. Nunca colar secrets no chat
9. Análise ANTES de sugerir mudanças
10. Prós/contras → confirmar → codar
11. Edge Functions: CORS explícito + handler OPTIONS
12. Cream mode na área do cliente (`--cr-*`)
13. **Emoji só onde faz sentido** (política 3 níveis): ícone funcional → SVG Lucide · decorativo → remover · afetivo (💛, 👋) → manter
14. **Admin tem light mode + toggle manual** (classe `html.admin-light` + localStorage `gemas_admin_theme`)
15. **Admin tem header fixo** com sombra ao rolar
16. **Acesso ao admin** via botão "Painel" no site (só pra admin) + redirect inteligente + PWA

---

## 4. FASES ENTREGUES (02/out → 07/out)

### Fases 10.1 - 10.6 (02-05/out)
- **10.1** Conteúdo do Site configurável (Hero, Carrossel, Rodapé, Meta Tags)
- **10.2** Área do Cliente configurável (Hero, Tabs, Status, Timeline, Vazios, Pontos)
- **10.3** Refinos (Menu, Estoque baixo, Banner frete grátis, Regras fidelidade)
- **10.4** Central de Reviews + Feedbacks (home dinâmica + /avaliacoes.html + canal privado)
- **10.5** Biblioteca de Temas (11 presets + custom + agendamento + WCAG)
- **10.5.1** Auto-dessaturar + luminância
- **10.5.2** White Mode real (variáveis semânticas + refactor global)
- **10.6** Cream Mode Dinâmico na conta

### Fase 10.7 - 10.8 (05-06/out)
- **10.7** Banner Carrossel Avançado (8 tipos de slide + condições + rotação)
  - Refinado: botão "Salvar banners" próprio + cor bolinha + SVG Lucide + preview `--accent`
- **10.8** Redesign do admin (Inter + Lucide SVG + badges com dot + toasts SVG)

### Fases v3.11 (06/out)
- **Acesso admin sem URL:** botão "Painel" no site (só admin) + redirect inteligente + PWA instalado
- **Light mode completo do site:** carrinho (CEP/cupom/frete), modal de produto (reviews + related), drawers
- **Refino dos drawers:** header/footer com faixa destacada + sombra em camadas + cantos arredondados
- **SVG nos emojis residuais:** notificações, extrato, cupons
- **Light mode do admin (L1-L3):** toggle manual + paleta clara + charts adaptados
- **Refactor da aba Configurações (P1-P3):** 9 cards clicáveis → 9 modais com save local

### Fases v3.12 (07/out)
- **Feature de promoção:** `promo_price` + `promo_ends_at` em products
  - Admin: form + card + validação
  - Site: badge "PROMO" + preço riscado + "Economize R$ X"
  - RPC `get_product_by_ref` atualizada
  - Carrinho: revalidação no boot
  - Schema.org: `priceSpecification` (ListPrice)
  - Feed XML: `g:sale_price`
- **Admin header fixo:** `position: fixed` + sombra ao rolar + safe-area iPhone
- **Favicon custom SVG:** Lucide `layout-dashboard` dourado
- **Correções mobile admin:**
  - Filtros (touch-action + mask scroll)
  - Pontos (tabela → cards em mobile)
  - Financeiro (box-sizing + overflow)
  - Sidebar (scroll travado)
  - Botões de ação (grid 2x2 em Cupons/Pontos)
- **Bug fix site público:**
  - Contraste do nome do review em light mode
  - Scroll anormal nas tabs de `minha-conta.html`

---

## 5. DECISÕES ARQUITETURAIS (ADRs 1-30)

**Base:**
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
22. Redesign admin (Inter + Lucide SVG)
23. Light mode do admin com toggle manual
24. Aba Configurações com cards + modais
25. Limpeza de emojis em 3 níveis
26. Acesso ao admin via botão "Painel" + redirect + PWA
27. Drawers com header/footer destacados
28. Preço promocional híbrido (`promo_price` + `promo_ends_at` opcional)
29. Header fixo no admin (`position: fixed`)
30. Favicon SVG custom

---

## 6. PENDÊNCIAS ATIVAS

**🔴 Bloqueadores reais (não-código):**
- Fotos oficiais dos produtos
- Tráfego pago

**🟡 Polimento técnico (opcional):**
- `MELHORENVIO_SANDBOX=true` → produção (faz quando tiver pedido real)
- Testar PWA em iOS/Android reais
- Doc `MELHORENVIO_ACCESS_TOKEN` expira 30/09/2027 (renovar antes)
- Bugs mobile admin restantes (Cupons / Clientes / Avaliações / Feedbacks — não críticos)
- Código morto: `shippingCost` write-only, `shipping-result` órfão, listener CEP duplicado

**🟢 Baixa prioridade:**
- Emojis em mensagens de WhatsApp (mantidos por decisão)
- Emojis em comentários de código (não afetam UI)

---

## 7. PRÓXIMOS PASSOS PLANEJADOS

**Curto prazo:**
- Terminar polimento mobile admin (Cupons, Clientes, Avaliações, Feedbacks)
- Completar limpeza de código morto

**Médio prazo (features estratégicas ~3h cada):**
- Sistema de Indicação (indique e ganhe)
- Tiers de Fidelidade (Bronze/Prata/Ouro)
- Notificações Push (PWA)
- Blog / Diário da Artesã

**Longo prazo (produção):**
- Fotos oficiais + tráfego pago

---

## 8. ESTILO DE COMUNICAÇÃO

- PT-BR direto, sem enrolação
- Chamar o usuário de "Jeep"
- Deep usa pronomes femininos ("irmã", "amiga")
- Explicar antes de mandar prompt
- Comandos SQL + Prompt Copilot sempre separados
- Análise ANTES de sugerir mudanças
- Prós/contras primeiro → confirmar → codar

---

## 9. SISTEMAS-CHAVE (mapa rápido)

**Loja:**
- Carrinho em `localStorage` (`gemas_cart_v1`) com revalidação
- Frete dual-mode (ME + fixo por região)
- Cupons com RPC de validação
- Pontos com ledger + RPCs
- Reviews com curadoria (featured + fallback)
- Temas (11 presets + custom) com light mode + auto-dessaturar
- Promoção (`promo_price` + `promo_ends_at`)

**Admin:**
- 9 cards em Configurações → 9 modais independentes
- Light mode + toggle manual
- Header fixo com sombra
- Favicon custom (Lucide layout-dashboard)
- Editor de banners rotativos (8 tipos de slide)
- Biblioteca de temas

**Cliente:**
- Tabs com scroll horizontal (touch-action)
- Notificações virtuais (reviews pendentes + cupons expirando)
- Favoritos + carrinho + cupons + pontos
- Cream Mode Dinâmico (tint do accent)

---

## 10. ÚLTIMA SESSÃO (06-07/out/2026)

**06/out (v3.11):**
- Refinamento da Fase 10.7
- Limpeza de emojis E1-E4
- Refactor da aba Configurações (P1/P2/P3)
- Light mode admin (L1/L2/L3)
- Bloco B (B1 crons, B3 comentário, B4 Pixel)
- Acesso admin sem URL + PWA
- Refino dos drawers
- SVG nos emojis residuais

**07/out (v3.12):**
- Feature de promoção completa (P1-P4 + SQL RPC)
- Favicon custom SVG
- Header fixo no admin
- Correções mobile admin (filtros, Pontos, Financeiro, sidebar)
- Bug fix site público (contraste review + scroll tabs)

**Última ação confirmada:** feature de promoção 100% testada e deployada (carrinho + Schema.org + feed XML).

---

*Fim do contexto consolidado — v2 — 07/out/2026*