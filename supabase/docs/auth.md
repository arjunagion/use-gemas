# Auth — Providers (Supabase)

> Última atualização: 02/out/2026
> Fonte: Supabase → Authentication

## Providers ativos

| Provider | Status | Tipo |
|---|---|---|
| **Email + Senha** | ✅ Ativo | Credenciais (email/senha) |
| **Google OAuth** | ✅ Ativo | Social login |

**Todos os outros providers estão desabilitados** (Phone, Apple, GitHub, Facebook, etc).

## Usuários cadastrados

Total: 6

| Nome | Email | Providers |
|---|---|---|
| Arjuna Rodriguez | arjunabwr@gmail.com | Email + Google |
| Arjuna Gion | arjunamorenogion@gmail.com | Email + Google |
| Bruna Rodrigues | bruna_rodrigues.jesus@hotmail.com | Email + Google |
| silvia botelho da silva | silviabotelho139@gmail.com | Email |
| tulaci botelho | tulacibr@gmail.com | Email |
| zurisadai ferreira | zurifferreira80@gmail.com | Email |

## Site URL

- **Site URL:** `https://usegemas.com.br`
- **Uso:** redirecionamento padrão quando nenhuma redirect URI bate com a lista

## Redirect URLs (8 configuradas)

| # | URL | Ambiente |
|---|---|---|
| 1 | `http://localhost:8080/reset-password.html` | Dev local |
| 2 | `http://localhost:5500/reset-password.html` | Dev local |
| 3 | `https://arjunagion.github.io/use-gemas/reset-password.html` | GitHub Pages (legado) |
| 4 | `https://usegemas.com.br/reset-password.html` | Produção (reset) |
| 5 | `https://usegemas.com.br` | Produção (raiz) |
| 6 | `https://usegemas.com.br/**` | Produção (wildcard) |
| 7 | `https://usegemas.com.br/minha-conta.html` | Produção (área cliente) |
| 8 | `https://usegemas.com.br/index.html` | Produção (home) |

## Fluxos implementados

### Cadastro (email/senha)
1. Cliente preenche form em `index.html`
2. `supabaseClient.auth.signUp()` → Supabase Auth cria `auth.users`
3. Trigger `handle_new_user` cria registro em `public.profiles`
4. Redireciona pra `minha-conta.html`

### Login (email/senha)
1. `supabaseClient.auth.signInWithPassword()`
2. Sessão persiste em localStorage

### Login com Google (OAuth)
1. `supabaseClient.auth.signInWithOAuth({ provider: 'google' })`
2. Redireciona pra Google → autoriza → callback Supabase
3. Supabase cria/atualiza `auth.users`
4. Trigger `handle_new_user` cria `profiles`
5. Redireciona pra `minha-conta.html`

### Recuperação de senha
1. Cliente clica em "Esqueci minha senha"
2. `supabaseClient.auth.resetPasswordForEmail()`
3. Email com link PKCE
4. Link abre `reset-password.html`
5. Cliente define nova senha

## Configuração OAuth Google

- **Provider:** Google
- **Client ID:** (configurado no Supabase — não commitar)
- **Client Secret:** (configurado no Supabase — não commitar)
- **Redirect URI (Google Cloud):** `https://dytdnemwqbzgrekamwla.supabase.co/auth/v1/callback`
- **Authorized origins (Google Cloud):** `https://usegemas.com.br`

## Observações

- **OAuth Server está desabilitado** — o Use Gemas não é um provedor de identidade pra apps terceiros
- **Auth Hooks (BETA):** não configurado
- **Passkeys (BETA):** não usado
- **MFA:** não configurado

## Links úteis

- Docs: https://supabase.com/docs/guides/auth
- Google OAuth: https://supabase.com/docs/guides/auth/social-login/auth-google
- PKCE: https://supabase.com/docs/guides/auth/sessions/pkce-flow