# Secrets — Edge Functions (Supabase)

> ⚠️ **NUNCA commitar valores.** Este doc lista apenas os NOMES dos secrets
> que estão configurados no painel do Supabase.
>
> Onde configurar: Supabase → Edge Functions → Secrets.

## Secrets ativos

| Nome | Serviço | Para que serve | Onde é usado |
|---|---|---|---|
| `BREVO_API_KEY` | Brevo | Envio de email transacional | notify-order-status, request-review, remind-review, notify-expiring-coupons |
| `MELHORENVIO_CLIENT_ID` | Melhor Envio | OAuth (client_id do app) | — (usado pelo access token) |
| `MELHORENVIO_CLIENT_SECRET` | Melhor Envio | OAuth (secret do app) | — (usado pelo access token) |
| `MELHORENVIO_ACCESS_TOKEN` | Melhor Envio | Autenticação nas chamadas da API | calculate-shipping, generate-shipping-label, fetch-label-url |
| `MELHORENVIO_SANDBOX` | Melhor Envio | Flag de ambiente (`true` = sandbox) | calculate-shipping, generate-shipping-label, fetch-label-url |
| `SERVICE_ROLE_KEY` | Supabase | Chave service_role (bypass RLS) | todas as Edge Functions |
| `SUPABASE_URL` | Supabase | URL do projeto | (injetado automaticamente) |
| `SUPABASE_SECRET_KEYS` | Supabase | Chaves secretas (novo formato) | (injetado automaticamente) |
| `SUPABASE_PUBLISHABLE_KEYS` | Supabase | Chaves públicas (novo formato) | (injetado automaticamente) |

## Como adicionar novo secret

1. Supabase → Edge Functions → Secrets
2. New secret → Nome + Valor
3. Salvar
4. Redeploy das Edge Functions que usam

## ⚠️ Regras

- **NUNCA** colar valores no chat ou em arquivos do repo
- Valores ficam APENAS no painel do Supabase
- Se vazar, rotacionar imediatamente
- Notas sobre rotação de chave (última: Brevo rotacionada em 30/09/2026)
