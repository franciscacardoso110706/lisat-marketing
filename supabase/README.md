# Configuração do Supabase (base de dados + login)

Segue estes passos **uma vez** para pôr a base de dados e o login a funcionar.
Não é preciso saber programar — é tudo cliques no painel do Supabase e do Google.

---

## 1. Criar o projeto Supabase

1. Vai a <https://supabase.com> e cria conta (grátis).
2. **New project** → dá um nome (ex: `lisat-marketing`), escolhe uma password para a base de dados (guarda-a) e a região `West EU (London)` ou `Central EU (Frankfurt)`.
3. Espera ~2 minutos até o projeto ficar pronto.

## 2. Correr o esquema da base de dados

1. No painel do projeto, menu lateral → **SQL Editor** → **New query**.
2. Abre o ficheiro [`schema.sql`](./schema.sql), copia **tudo** e cola no editor.
3. Carrega em **Run**. Deve dizer *Success*. (Podes voltar a correr sempre que quiseres — não apaga dados.)

## 3. Criar-te a ti como líder (bootstrap)

Ainda no **SQL Editor**, corre esta linha com o **email da tua conta Google**:

```sql
insert into public.members (space_id, email, name, role, area)
values ('00000000-0000-0000-0000-000000000001',
        'o-teu-email@gmail.com', 'O Teu Nome', 'leader', 'Social Media')
on conflict (lower(email)) do update set role = 'leader', active = true;
```

> Este passo manual é necessário só para o **primeiro** líder. A partir daí, adicionas os
> restantes membros dentro da própria app (página **Equipa**).

## 4. Ativar o login com Google

**4a. No Google Cloud Console** (<https://console.cloud.google.com>):

1. Cria um projeto (ou usa um existente).
2. **APIs & Services → OAuth consent screen**: tipo *External*, preenche nome da app e email de suporte, guarda.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized redirect URIs**: cola aqui o valor que o Supabase te dá no passo seguinte
     (algo como `https://<o-teu-projeto>.supabase.co/auth/v1/callback`).
   - Guarda e copia o **Client ID** e o **Client secret**.

**4b. No Supabase**: menu **Authentication → Providers → Google**:

1. Ativa o Google.
2. Cola o **Client ID** e o **Client secret** do passo anterior.
3. Copia o **Callback URL** que aparece aqui e confirma que é o mesmo que puseste no Google (passo 4a).
4. Guarda.

**4c. URLs da app**: menu **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:5173` (durante o desenvolvimento). Depois do deploy, muda para o endereço do Vercel.
- **Redirect URLs**: adiciona `http://localhost:5173` e (mais tarde) o endereço do Vercel.

## 5. Ligar a app à base de dados

1. No Supabase: **Project Settings → API**. Copia:
   - **Project URL**
   - **anon public** key
2. Na raiz do projeto, copia `.env.local.example` para `.env.local` e preenche:

```
VITE_SUPABASE_URL=https://<o-teu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<a-anon-key>
```

> A `anon key` é **pública** por design — a segurança dos dados é garantida pelas políticas
> RLS no `schema.sql`, não por esconder esta chave.

---

## Pronto

Agora podes correr a app localmente:

```
npm install
npm run dev
```

Abre <http://localhost:5173>, entra com a tua conta Google (a que puseste no passo 3) e
deves ver o menu de **líder**.

### Como funciona o acesso (resumo)

- O login é feito com Google.
- Só entra quem tiver o **email na tabela `members`** (a lista de autorizados).
- Quem entrar com um Google não autorizado vê um ecrã de *"acesso não autorizado"*.
- O **líder** (`role = 'leader'`) vê e gere tudo; o **membro** vê só o que lhe diz respeito.
- Tudo isto é imposto pela base de dados (RLS), não apenas escondido na interface.
