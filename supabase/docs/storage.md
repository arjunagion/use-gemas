# Storage — Buckets (Supabase)

> Última atualização: 02/out/2026
> Fonte: Supabase → Storage → Buckets

## Buckets configurados

| Bucket | Visibilidade | File Size Limit | MIME Types permitidos | Policies |
|---|---|---|---|---|
| **`review-images`** | Público | **15 MB** | `image/jpeg`, `image/png`, `image/webp` | 5 |
| **`product-images`** | Público | **30 MB** | `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/quicktime` | 4 |

**Total: 2 buckets, 9 policies.**

## Estrutura de pastas

### `review-images/`
Fotos anexadas às avaliações de clientes (logados ou guests).

Padrão sugerido de pasta:
review-images/
└── {user_id ou guest_token}/
└── {review_id}/
├── foto-1.jpg
├── foto-2.jpg
└── foto-3.jpg

text

### `product-images/`
Fotos e vídeos dos produtos (gerenciado pelo admin).

Padrão sugerido:
product-images/
└── {product_ref}/
├── capa.jpg
├── foto-2.jpg
├── foto-3.jpg
└── video.mp4

text

## Policies por bucket

### `review-images` (5 policies)

| Nome | Comando | Role | O que faz |
|---|---|---|---|
| `Guests can upload review photos` | INSERT | `anon` | Visitantes (não logados) podem subir fotos de review (guest) |
| `Public read for review images` | SELECT | `public` | Qualquer um pode ler/ver as fotos |
| `Authenticated can upload review images` | INSERT | `authenticated` | Cliente logado pode subir fotos |
| `Users can delete own review images` | DELETE | `authenticated` | Cliente pode deletar as próprias fotos |
| `Admins can delete any review images` | DELETE | `authenticated` | Admin pode deletar qualquer foto |

### `product-images` (4 policies)

| Nome | Comando | Role | O que faz |
|---|---|---|---|
| `Public read for product images` | SELECT | `public` | Qualquer um pode ler/ver as fotos |
| `Admins can upload product images` | INSERT | `authenticated` | Só admin pode subir fotos de produto |
| `Admins can update product images` | UPDATE | `authenticated` | Só admin pode atualizar |
| `Admins can delete product images` | DELETE | `authenticated` | Só admin pode deletar |

## Regras de uso

### Fotos de review
- **Formatos:** JPEG, PNG, WebP
- **Tamanho máx:** 15 MB por arquivo
- **Limite por review:** 3 fotos (regra do app)
- **Upload:** cliente logado OR guest (com token válido)

### Fotos de produto
- **Formatos:** JPEG, PNG, WebP, MP4, MOV
- **Tamanho máx:** 30 MB por arquivo
- **Upload:** apenas admin (via painel admin.html)
- **Uso:** galeria de produto (produto.html + modal do index)

## Como manter atualizado

1. **Novo bucket?** Adicionar linha na tabela do topo
2. **Nova policy?** Adicionar na seção do bucket
3. **Mudou limite/tipo?** Atualizar tabela
4. Commit + push

## Como adicionar novo bucket

1. Supabase → Storage → **New bucket**
2. Configurar:
   - Nome (kebab-case)
   - Público ou privado
   - File size limit
   - MIME types
3. Criar policies em **Storage → Policies**
4. Documentar neste arquivo
5. Commit

## Links úteis

- Docs: https://supabase.com/docs/guides/storage
- Policies: https://supabase.com/docs/guides/storage/security/access-control
- Resize/CDN: https://supabase.com/docs/guides/storage/image-transformations