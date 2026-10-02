# Secrets — Edge Functions (Supabase)

> Última atualização: 02/out/2026
> Fonte: Supabase → Edge Functions → Secrets

⚠️ **Este arquivo NUNCA contém valores.** Apenas os NOMES dos secrets. 
Os valores ficam **exclusivamente** no painel do Supabase.

## Como acessar

1. Supabase → Edge Functions → Secrets
2. Adicionar/editar/remover secrets
3. Depois de qualquer mudança, **redeploy das Edge Functions afetadas**

---

## Custom secrets (6 configurados manualmente)

| Nome | Serviço | Propósito | Edge Functions que usam | Atualizado |
|---|---|---|---|---|
| **`BREVO_API_KEY`** | Brevo | Envio de email transacional | `notify-order-status`, `request-review`, `remind-review`, `notify-expiring-coupons` | 30/set/2026 |
| **`MELHORENVIO_CLIENT_ID`** | Melhor Envio | OAuth — client_id do app | (usado apenas na criação do token) | 01/out/2026 |
| **`MELHORENVIO_CLIENT_SECRET`** | Melhor Envio | OAuth — client_secret do app | (usado apenas na criação do token) | 01/out/2026 |
| **`MELHORENVIO_ACCESS_TOKEN`** | Melhor Envio | Autenticação nas chamadas da API | `calculate-shipping`, `generate-shipping-label`, `fetch-label-url` | 01/out/2026 |
| **`MELHORENVIO_SANDBOX`** | Melhor Envio | Flag de ambiente (`true` = sandbox) | `calculate-shipping`, `generate-shipping-label`, `fetch-label-url` | 01/out/2026 |
| **`SERVICE_ROLE_KEY`** | Supabase | Chave service_role (bypass RLS) | Todas as Edge Functions que acessam banco | 01/out/2026 |

---

## Default secrets (injetados automaticamente pelo Supabase)

Esses secrets são **injetados automaticamente** pelo Supabase em toda Edge Function. 
Não precisam ser criados — já existem.

| Nome | Descrição | Status |
|---|---|---|
| `SUPABASE_URL` | URL do projeto (`https://dytdnemwqbzgrekamwla.supabase.co`) | ✅ |
| `SUPABASE_DB_URL` | URL direta de conexão Postgres | ✅ |
| `SUPABASE_PUBLISHABLE_KEYS` | JSON com chaves públicas (novo formato) | ✅ |
| `SUPABASE_SECRET_KEYS` | JSON com chaves secretas (novo formato) | ✅ |
| `SUPABASE_ANON_KEY` | Chave anon pública | ⚠️ DEPRECATED |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role | ⚠️ DEPRECATED |
| `SUPABASE_JWKS` | JWK Set pra validar JWTs | ✅ |
| `SB_REGION` | Região onde a função tá rodando | ✅ |
| `SB_EXECUTION_ID` | ID único da execução (por request) | ✅ |
| `DENO_DEPLOYMENT_ID` | Versão do código deployado | ✅ |

---

## Por que temos `SERVICE_ROLE_KEY` (custom) se já existe `SUPABASE_SERVICE_ROLE_KEY`?

**Contexto:** o Supabase **bloqueia** a criação de secrets com prefixo `SUPABASE_`. Por isso, criamos um secret custom com nome `SERVICE_ROLE_KEY` (sem prefixo), que guarda o mesmo valor.

**No código das Edge Functions:**
```typescript
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") 
    || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");  // fallback pro deprecated
Vantagem: garantimos que funciona em qualquer versão do Supabase (atual ou futura).

Histórico de rotação
Data	Secret	Motivo	Status
30/set/2026	BREVO_API_KEY	Rotação preventiva (chave anterior circulou em chat)	✅ Concluído
01/out/2026	MELHORENVIO_*	Credenciais do sandbox criadas do zero	✅ Concluído
02/out/2026	RESEND_API_KEY	Secret órfão deletado (migração pra Brevo)	✅ Concluído
Como rotacionar
No serviço externo (Brevo, ME, etc): gerar nova chave

No Supabase → Edge Functions → Secrets → editar o secret com valor novo

Redeploy das Edge Functions afetadas (Code → Deploy updates)

Testar que as funções continuam funcionando

SÓ DEPOIS revogar a chave antiga no serviço externo

Atualizar a tabela "Histórico" acima

⚠️ Ordem correta: nova → testar → revogar antiga (nunca revogar antes de testar)

Regras de segurança
✅ FAZER:

Valores ficam só no painel do Supabase

Rotacionar chaves periodicamente (a cada 6-12 meses)

Usar chaves diferentes por ambiente (sandbox ≠ produção)

Registrar rotação no histórico acima

Usar secrets custom sem prefixo SUPABASE_ (quando precisar)

❌ NUNCA:

Commitar valores no repo

Colar valores em chat (mesmo com o Arjuna)

Compartilhar secrets em screenshot

Usar a mesma chave pra tudo

Revogar chave antiga ANTES de testar a nova

Como adicionar novo secret
Supabase → Edge Functions → Secrets

Clica em "New secret" ou "+ Add new secret"

Preenche:

Name: MAIÚSCULAS_COM_UNDERSCORE (sem prefixo SUPABASE_)

Value: o valor real (nunca commitar)

Save

Documentar na tabela "Custom secrets" acima

Redeploy das Edge Functions que usam

Observações
MELHORENVIO_SANDBOX: quando o projeto for pra produção, trocar de true para false (redeploy obrigatório)

MELHORENVIO_ACCESS_TOKEN: expira em 30/09/2027 (renovar antes)

MELHORENVIO_CLIENT_ID + _CLIENT_SECRET: usados apenas pra gerar/renovar o token (não usados em runtime nas funções)

Links úteis
Supabase Secrets: https://supabase.com/docs/guides/functions/secrets

Brevo API Keys: https://app.brevo.com/settings/keys/api

Melhor Envio — Área Dev: https://sandbox.melhorenvio.com.br/painel/integracoes/area-dev