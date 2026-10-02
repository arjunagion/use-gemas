# Auth — Providers (Supabase)

## Providers ativos

| Provider | Status | Configuração |
|---|---|---|
| Email + Senha | ✅ Ativo | Cadastro + login + reset (PKCE) |
| Google OAuth | ✅ Ativo | Client ID do Google Cloud |

## Configurações

- **Confirmação de email:** (a confirmar)
- **Reset de senha:** via `reset-password.html` (PKCE)
- **Sessão:** persistente (localStorage)
- **Redirect pós-login:** `minha-conta.html` (com `?login=1` ou `?review=ORDER_ID`)

## Configuração OAuth Google

- Provider: Google
- Client ID: (do Google Cloud — não commitar)
- Redirect URI: `https://dytdnemwqbzgrekamwla.supabase.co/auth/v1/callback`
- Authorized origins: `https://usegemas.com.br`

## Links úteis

- Docs: https://supabase.com/docs/guides/auth
