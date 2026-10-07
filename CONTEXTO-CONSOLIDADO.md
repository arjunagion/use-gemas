# CONTEXTO CONSOLIDADO — Use Gemas
> **Ponto de restauração:** 07/out/2026 (noite)
> **Uso:** colar no início de uma nova sessão Deep pra reconstruir contexto
> **Estado do projeto:** ~99,9% concluído
> **Doc mestre:** PROJETO-MESTRE.md (v3.13 — fonte da verdade detalhada)

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
**17 tabelas:** products, orders, reviews, notifications, coupons, coupon_usages, loyalty_points, settings, admins, profiles, favorites, checkout_data, shipping_quotes_cache, feedbacks, themes, **service_reminders, service_credentials**
**46 policies · 24+ funções SQL · 15+ triggers · 46+ índices · 6 cron jobs**
**3 storage buckets:** review-images, product-images, site-media
**Versões SW:** `sw.js` v12 · `sw-admin.js` v24

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
13. **Emoji só onde faz sentido** (3 níveis): funcional → SVG Lucide · decorativo → remover · afetivo (💛, 👋) → manter
14. **Admin tem light mode + toggle manual** (`html.admin-light` + localStorage `gemas_admin_theme`)
15. **Admin tem header fixo** com sombra ao rolar
16. **Acesso ao admin** via botão "Painel" no site + redirect inteligente + PWA

---

## 4. FASES ENTREGUES (02/out → 07/out)

### Fases 10.1 - 10.6 (02-05/out)
- 10.1 Conteúdo do Site configurável
- 10.2 Área do Cliente configurável
- 10.3 Refinos (Menu, Estoque, Banner frete, Fidelidade)
- 10.4 Central de Reviews + Feedbacks
- 10.5 Biblioteca de Temas + White Mode + auto-dessaturar
- 10.6 Cream Mode Dinâmico

### Fases 10.7 - 10.8 (05-06/out)
- 10.7 Banner Carrossel Avançado (8 tipos + condições + rotação)
- 10.8 Redesign do admin (Inter + Lucide SVG)

### Fases v3.11 (06/out)
- Acesso admin sem URL (botão "Painel" + redirect + PWA)
- Light mode completo do site
- Refino dos drawers
- SVG nos emojis residuais
- Light mode admin (L1-L3)
- Refactor aba Configurações (P1-P3)

### Fases v3.12 (07/out)
- Feature de promoção completa (P1-P4 + SQL RPC)
- Admin header fixo
- Favicon custom SVG
- Correções mobile admin (filtros, Pontos, Financeiro, sidebar)
- Bug fix site público (contraste review + scroll tabs)

### Fases v3.13 (07/out — noite)
- Sistema de Lembretes (expiração de serviços)
- Sistema de Acessos (índice de credenciais sem senha)
- Bitwarden configurado (vault.bitwarden.eu)

---

## 5. DECISÕES ARQUITETURAIS (ADRs 1-32)

**Base:** Supabase · GitHub Pages · Vanilla JS · Melhor Envio · Brevo · Zoho · PWA · Pontos próprios · CORS explícito · Ledger pontos · Carrinho localStorage · Notificações virtuais · Frete dual-mode · Reviews híbridas

**Configuração:** Conteúdo configurável · Labels em settings · Regras fidelidade em settings · Consolidação banners · Biblioteca de Temas · Auto-dessaturar · Cream Dinâmico

**Admin:** Redesign (Inter + Lucide) · Light mode toggle · Configurações com cards+modais · Limpeza emoji 3 níveis

**Acesso:** Botão "Painel" + redirect + PWA · Drawers destacados · Promoção híbrida · Header fixo · Favicon SVG

**Gestão (v3.13):** Sistema de Lembretes · Sistema de Acessos (sem senha) + Bitwarden

---

## 6. PENDÊNCIAS ATIVAS

**🔴 Bloqueadores reais (não-código):**
- Fotos oficiais dos produtos
- Tráfego pago

**🟡 Alta prioridade (produção):**
- `MELHORENVIO_SANDBOX=true` → `false` (quando tiver pedido real)

**🟡 Média (polimento):**
- Bugs mobile admin: Cupons (botões empilhados), Pontos (tabela cortada), Banners modal (título+botão sobrepostos), Cards slide (layout quebrado)
- Compressão de imagens (WebP)

**🟢 Baixa (cosmético/documentação):**
- Bugs mobile admin cosméticos (header "VER SITE", Chart.js labels, badge pedido full-width)
- Código morto: `shippingCost` write-only, `shipping-result` órfão, listener CEP duplicado, `description` não usado em loyalty_points
- Lazy-load nas galerias
- Emojis em mensagens WhatsApp (decisão mantida)
- Emojis em comentários de código
- Sitemap estático vs dinâmico

**📱 Testes:**
- Testar PWA em iOS e Android reais

---

## 7. PRÓXIMO TÓPICO — FEATURE #32 (em execução)

### 🎯 PDF do Pedido no WhatsApp + Email "Pedido Recebido"

**Objetivo:** Jornada profissional com 2 canais:
- **WhatsApp** — canal direto de venda (PDF anexado automaticamente)
- **Email** — formalização/registro (cliente + dono recebem)

**Decisões travadas:**
1. **PDF: 1 página A4** (logo + tabela + totais)
2. **Email: cliente + dono recebem** (dono tem link pro admin)
3. **Trigger SQL** (AFTER INSERT em `orders` → chama Edge `notify-order-created`)

**Jornada completa:**
1. Cliente finaliza → pedido salvo no Supabase
2. PDF gerado local (jsPDF, lazy-load ~200KB)
3. Web Share API → cliente escolhe WhatsApp → PDF anexado (fallback: download manual + WhatsApp Web)
4. Trigger SQL dispara → Edge Function notify-order-created
5. Email "Pedido Recebido" chega pro cliente E pro dono
6. [JÁ EXISTE] Admin marca "pago" → email "Pagamento confirmado"
7. [JÁ EXISTE] Admin marca "enviado" → email "Pedido enviado"

**Escopo técnico:**
- jsPDF (lazy-load via `import()`)
- Web Share API (`navigator.canShare` + `navigator.share`)
- Edge Function `notify-order-created` (Brevo)
- Trigger SQL (padrão `supabase_functions.http_request`)
- Template HTML do email (cliente + dono)

**Tempo estimado:** ~4h em 3 prompts (P1 → P2 → P3)

**Detalhes técnicos:**
- jsPDF import: `https://cdn.jsdelivr.net/npm/jspdf@latest/dist/jspdf.esm.min.js`
- Detecção Web Share: `navigator.canShare && navigator.canShare({ files: [pdfFile] })`
- Fallback: baixar PDF + abrir `api.whatsapp.com` com mensagem curta

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
- Carrinho localStorage + revalidação
- Frete dual-mode (ME + fixo regional)
- Cupons + Pontos + Reviews (RPCs)
- Temas (11 presets + custom + light mode)
- Promoção (`promo_price` + `promo_ends_at`)

**Admin:**
- 9 cards em Configurações → 9 modais
- Light mode + toggle
- Header fixo
- Favicon custom
- Banners rotativos (8 tipos)
- Biblioteca de temas
- **Lembretes** (expiração de serviços)
- **Acessos** (índice de credenciais sem senha)

**Cliente:**
- Tabs com scroll horizontal
- Notificações virtuais
- Favoritos + carrinho + cupons + pontos
- Cream Mode Dinâmico

**Externo:**
- Bitwarden (vault.bitwarden.eu) — cofre de senhas
- Brevo — email transacional
- Melhor Envio — frete
- Zoho Mail — caixa profissional

---

## 10. ÚLTIMA SESSÃO (07/out/2026 — noite)

**O que foi feito:**
- Sistema de Lembretes (SQL + admin + toast + card no Dashboard)
- Bitwarden configurado (conta `.eu`)
- Sistema de Acessos (SQL + admin)
- MESTRE v3.12 → v3.13
- CONTEXTO v2 → v3

**Última ação confirmada:** sub-aba "Acessos" com 8 serviços cadastrados funcionando.

**Próximo passo:** iniciar feature #32 (PDF no WhatsApp + Email Pedido Recebido).

---

*Fim do contexto consolidado — v3 — 07/out/2026*