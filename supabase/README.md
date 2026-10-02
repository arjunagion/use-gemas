# Supabase — Configuração Backend (Use Gemas)

Esta pasta organiza e versiona **tudo que vive no painel do Supabase**:
migrations (schema), código das Edge Functions e documentação de referência
(secrets, storage, auth).

> ⚠️ **A fonte da verdade é o Supabase.** Veja a seção "Fonte da verdade" abaixo.

## Estrutura de pastas

| Pasta / Arquivo | O que contém |
|---|---|
| `functions/` | Uma pasta por Edge Function, com o código (atualmente placeholders) |
| `migrations/` | Scripts SQL do schema (tabelas, policies, triggers, RPCs) |
| `docs/` | Documentação de referência (secrets, storage, auth) |
| `config.toml` | Config opcional do Supabase CLI (comentado por padrão) |
| `.gitignore` | Ignora arquivos locais do Supabase CLI |

### `functions/`
Cada subpasta é uma Edge Function deployada no Supabase. Os arquivos
`index.ts` são **placeholders** — o código real vive no painel
(Supabase → Edge Functions).

### `migrations/`
Scripts SQL numerados. O `001_schema.sql` é um placeholder do schema completo
do banco.

### `docs/`
Documentação que **não é código**, mas precisa ser versionada:
- `secrets.md` — nomes dos secrets (nunca valores)
- `storage.md` — buckets e policies
- `auth.md` — providers e configurações de autenticação

## Como manter atualizado

1. **Schema** — quando mudar algo no SQL Editor do Supabase, atualizar `migrations/`.
2. **Edge Functions** — quando editar uma função no painel, colar o código no `index.ts` correspondente.
3. **Secrets** — quando criar/rotacionar um secret, atualizar `docs/secrets.md`.
4. **Storage/Auth** — quando mudar buckets, policies ou providers, atualizar `docs/`.

## Fonte da verdade

**O Supabase é a fonte da verdade.** O que vale em produção é o que está
configurado no painel (Database, Edge Functions, Storage, Auth, Secrets).

Esta pasta é **versionamento + referência** para onboarding e auditoria. Se
houver divergência entre esta pasta e o painel, **confie no painel** e
atualize esta pasta.

## Links úteis

- Supabase Docs: https://supabase.com/docs
- Supabase CLI: https://supabase.com/docs/guides/cli
- Edge Functions: https://supabase.com/docs/guides/functions
- Storage: https://supabase.com/docs/guides/storage
- Auth: https://supabase.com/docs/guides/auth
- Melhor Envio API: https://docs.melhorenvio.com.br/
- Brevo (SMTP/API): https://developers.brevo.com/
