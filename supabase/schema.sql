-- ============================================================================
--  LISAT · App de Marketing — Esquema da base de dados (Supabase / Postgres)
-- ============================================================================
--  Como usar:
--    1. Cria um projeto grátis em https://supabase.com
--    2. Abre "SQL Editor" no painel do teu projeto
--    3. Cola este ficheiro inteiro e carrega em "Run"
--    4. Segue o bootstrap do líder no fim deste ficheiro (secção SEED)
--
--  Podes voltar a correr este ficheiro do início — é idempotente (usa
--  "if not exists" / "on conflict"). NÃO apaga dados existentes.
-- ============================================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- Espaço/departamento por omissão (arquitetura pronta para multi-departamento).
-- UUID fixo para simplificar o seed e o bootstrap.
--   Marketing — LISAT = 00000000-0000-0000-0000-000000000001

-- ----------------------------------------------------------------------------
--  TABELAS
-- ----------------------------------------------------------------------------

create table if not exists public.spaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.members (
  id            uuid primary key default gen_random_uuid(),
  space_id      uuid not null default '00000000-0000-0000-0000-000000000001'
                  references public.spaces(id) on delete cascade,
  email         text not null,
  auth_user_id  uuid,                       -- preenchido no 1.º login (ver link_current_user)
  name          text not null,
  area          text,
  role          text not null default 'member' check (role in ('leader','member')),
  contact       text,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);
-- Email único (sem distinção de maiúsculas) — chave da lista de autorizados.
create unique index if not exists members_email_unique on public.members (lower(email));

create table if not exists public.areas (
  id        uuid primary key default gen_random_uuid(),
  space_id  uuid not null default '00000000-0000-0000-0000-000000000001'
              references public.spaces(id) on delete cascade,
  name      text not null,
  color     text not null default '#64748b'
);
-- Remove áreas duplicadas antigas antes de impor a unicidade (mantém uma de cada).
delete from public.areas a using public.areas b
  where a.ctid < b.ctid
    and a.space_id = b.space_id
    and lower(a.name) = lower(b.name);
-- Evita áreas duplicadas (mesma área no mesmo espaço).
create unique index if not exists areas_space_name_unique
  on public.areas (space_id, lower(name));

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  space_id     uuid not null default '00000000-0000-0000-0000-000000000001'
                 references public.spaces(id) on delete cascade,
  title        text not null,
  description  text,
  area_id      uuid references public.areas(id) on delete set null,
  assignee_id  uuid references public.members(id) on delete set null,
  status       text not null default 'todo' check (status in ('todo','doing','done')),
  due_date     date,
  position     double precision not null default 0,
  created_by   uuid references public.members(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  author_id   uuid references public.members(id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.submissions (
  id               uuid primary key default gen_random_uuid(),
  space_id         uuid not null default '00000000-0000-0000-0000-000000000001'
                     references public.spaces(id) on delete cascade,
  title            text not null,
  description      text,
  type             text not null default 'ideia'
                     check (type in ('ideia','pedido','impedimento','outro')),
  submitted_by     uuid references public.members(id) on delete set null,
  status           text not null default 'pending'
                     check (status in ('pending','accepted','rejected')),
  leader_note      text,
  related_task_id  uuid references public.tasks(id) on delete set null,
  created_task_id  uuid references public.tasks(id) on delete set null,
  created_at       timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id                  uuid primary key default gen_random_uuid(),
  space_id            uuid not null default '00000000-0000-0000-0000-000000000001'
                        references public.spaces(id) on delete cascade,
  title               text not null,
  description         text,
  type                text not null default 'evento'
                        check (type in ('conteudo','reuniao','evento','academico')),
  start_date          date not null,
  end_date            date,
  all_day             boolean not null default true,
  related_sponsor_id  uuid,
  created_by          uuid references public.members(id) on delete set null,
  created_at          timestamptz not null default now()
);

create table if not exists public.sponsors (
  id                  uuid primary key default gen_random_uuid(),
  space_id            uuid not null default '00000000-0000-0000-0000-000000000001'
                        references public.spaces(id) on delete cascade,
  name                text not null,
  contact             text,
  owner_id            uuid references public.members(id) on delete set null,
  stage               text not null default 'lead'
                        check (stage in ('lead','contactado','reuniao','proposta','fechado','perdido')),
  next_followup_date  date,
  notes               text,
  position            double precision not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
-- Liga o evento de calendário ao sponsor (definido depois de existir a tabela sponsors)
alter table public.calendar_events
  drop constraint if exists calendar_events_sponsor_fk;
alter table public.calendar_events
  add constraint calendar_events_sponsor_fk
  foreign key (related_sponsor_id) references public.sponsors(id) on delete set null;

create table if not exists public.links (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null default '00000000-0000-0000-0000-000000000001'
                references public.spaces(id) on delete cascade,
  title       text not null,
  url         text not null,
  description text,
  position    double precision not null default 0,
  created_by  uuid references public.members(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
--  FUNÇÕES AUXILIARES (SECURITY DEFINER — correm com privilégios elevados para
--  poderem ler a tabela "members" sem cair em recursão de RLS).
--  A identificação do utilizador é feita pelo email da sessão Google (JWT).
-- ----------------------------------------------------------------------------

create or replace function public.jwt_email()
returns text
language sql stable
as $$ select nullif(lower(auth.jwt() ->> 'email'), '') $$;

create or replace function public.current_member_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.members
  where active and lower(email) = public.jwt_email()
  limit 1
$$;

create or replace function public.current_space_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select space_id from public.members
  where active and lower(email) = public.jwt_email()
  limit 1
$$;

create or replace function public.is_leader()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.members
    where active and lower(email) = public.jwt_email() and role = 'leader'
  )
$$;

create or replace function public.current_area()
returns text
language sql stable security definer set search_path = public
as $$
  select area from public.members
  where active and lower(email) = public.jwt_email()
  limit 1
$$;

-- Chamada pela app após o login para carimbar o auth_user_id (só para efeitos
-- de mostrar "ligado / ainda não entrou" no diretório). O acesso em si é
-- decidido pelo email, por isso funciona mesmo que o membro seja adicionado
-- depois de já ter tentado entrar uma vez.
create or replace function public.link_current_user()
returns void
language sql security definer set search_path = public
as $$
  update public.members
     set auth_user_id = auth.uid()
   where lower(email) = public.jwt_email()
     and (auth_user_id is null or auth_user_id is distinct from auth.uid())
$$;

-- Mantém updated_at atualizado
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

drop trigger if exists sponsors_touch on public.sponsors;
create trigger sponsors_touch before update on public.sponsors
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
--  ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table public.spaces           enable row level security;
alter table public.members          enable row level security;
alter table public.areas            enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_comments    enable row level security;
alter table public.submissions      enable row level security;
alter table public.calendar_events  enable row level security;
alter table public.sponsors         enable row level security;
alter table public.links            enable row level security;

-- Helper para (re)criar políticas sem erro se já existirem: fazemos drop antes.

-- SPACES: cada utilizador vê apenas o seu espaço.
drop policy if exists spaces_select on public.spaces;
create policy spaces_select on public.spaces for select to authenticated
  using (id = public.current_space_id());

-- MEMBERS: todos veem o diretório do seu espaço; só o líder escreve.
drop policy if exists members_select on public.members;
create policy members_select on public.members for select to authenticated
  using (space_id = public.current_space_id());

drop policy if exists members_insert on public.members;
create policy members_insert on public.members for insert to authenticated
  with check (public.is_leader() and space_id = public.current_space_id());

drop policy if exists members_update on public.members;
create policy members_update on public.members for update to authenticated
  using (public.is_leader() and space_id = public.current_space_id())
  with check (public.is_leader() and space_id = public.current_space_id());

drop policy if exists members_delete on public.members;
create policy members_delete on public.members for delete to authenticated
  using (public.is_leader() and space_id = public.current_space_id());

-- AREAS: todos leem; só o líder escreve.
drop policy if exists areas_select on public.areas;
create policy areas_select on public.areas for select to authenticated
  using (space_id = public.current_space_id());
drop policy if exists areas_write on public.areas;
create policy areas_write on public.areas for all to authenticated
  using (public.is_leader() and space_id = public.current_space_id())
  with check (public.is_leader() and space_id = public.current_space_id());

-- TASKS: líder vê tudo; membro vê só as suas. Criar/atualizar (mudar estado)/
-- apagar é SÓ do líder — o membro nunca altera o estado da tarefa.
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated
  using (
    space_id = public.current_space_id()
    and (public.is_leader() or assignee_id = public.current_member_id())
  );
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated
  with check (public.is_leader() and space_id = public.current_space_id());
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated
  using (public.is_leader() and space_id = public.current_space_id())
  with check (public.is_leader() and space_id = public.current_space_id());
drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated
  using (public.is_leader() and space_id = public.current_space_id());

-- TASK_COMMENTS: visíveis/insríveis por quem vê a tarefa.
drop policy if exists task_comments_select on public.task_comments;
create policy task_comments_select on public.task_comments for select to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.space_id = public.current_space_id()
        and (public.is_leader() or t.assignee_id = public.current_member_id())
    )
  );
drop policy if exists task_comments_insert on public.task_comments;
create policy task_comments_insert on public.task_comments for insert to authenticated
  with check (
    author_id = public.current_member_id()
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.space_id = public.current_space_id()
        and (public.is_leader() or t.assignee_id = public.current_member_id())
    )
  );

-- SUBMISSIONS: membro cria e vê as suas; líder vê/gere todas.
drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions for select to authenticated
  using (
    space_id = public.current_space_id()
    and (public.is_leader() or submitted_by = public.current_member_id())
  );
drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions for insert to authenticated
  with check (
    space_id = public.current_space_id()
    and submitted_by = public.current_member_id()
  );
drop policy if exists submissions_update on public.submissions;
create policy submissions_update on public.submissions for update to authenticated
  using (public.is_leader() and space_id = public.current_space_id())
  with check (public.is_leader() and space_id = public.current_space_id());
drop policy if exists submissions_delete on public.submissions;
create policy submissions_delete on public.submissions for delete to authenticated
  using (public.is_leader() and space_id = public.current_space_id());

-- CALENDAR_EVENTS: todos leem; só o líder escreve.
drop policy if exists events_select on public.calendar_events;
create policy events_select on public.calendar_events for select to authenticated
  using (space_id = public.current_space_id());
drop policy if exists events_write on public.calendar_events;
create policy events_write on public.calendar_events for all to authenticated
  using (public.is_leader() and space_id = public.current_space_id())
  with check (public.is_leader() and space_id = public.current_space_id());

-- SPONSORS: líder gere; membros da área "Sponsors" veem (só leitura).
drop policy if exists sponsors_select on public.sponsors;
create policy sponsors_select on public.sponsors for select to authenticated
  using (
    space_id = public.current_space_id()
    and (public.is_leader() or lower(coalesce(public.current_area(), '')) = 'sponsors')
  );
drop policy if exists sponsors_write on public.sponsors;
create policy sponsors_write on public.sponsors for all to authenticated
  using (public.is_leader() and space_id = public.current_space_id())
  with check (public.is_leader() and space_id = public.current_space_id());

-- LINKS: todos leem; só o líder escreve.
drop policy if exists links_select on public.links;
create policy links_select on public.links for select to authenticated
  using (space_id = public.current_space_id());
drop policy if exists links_write on public.links;
create policy links_write on public.links for all to authenticated
  using (public.is_leader() and space_id = public.current_space_id())
  with check (public.is_leader() and space_id = public.current_space_id());

-- ============================================================================
--  ENTREGÁVEIS (ficheiros anexados às tarefas, com aprovação do líder)
-- ============================================================================

create table if not exists public.task_attachments (
  id           uuid primary key default gen_random_uuid(),
  space_id     uuid not null default '00000000-0000-0000-0000-000000000001'
                 references public.spaces(id) on delete cascade,
  task_id      uuid not null references public.tasks(id) on delete cascade,
  uploaded_by  uuid references public.members(id) on delete set null,
  file_path    text not null,             -- caminho no bucket: {task_id}/{uuid}.{ext}
  file_name    text not null,             -- nome original do ficheiro
  mime_type    text,
  size_bytes   integer,
  status       text not null default 'pending'
                 check (status in ('pending','approved','rejected')),
  leader_note  text,
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);

alter table public.task_attachments enable row level security;

-- Mesma visibilidade da tarefa: líder vê tudo; membro só as suas.
drop policy if exists attachments_select on public.task_attachments;
create policy attachments_select on public.task_attachments for select to authenticated
  using (
    space_id = public.current_space_id()
    and (
      public.is_leader()
      or exists (
        select 1 from public.tasks t
        where t.id = task_id and t.assignee_id = public.current_member_id()
      )
    )
  );

-- O membro anexa nas suas tarefas; o líder em qualquer uma.
drop policy if exists attachments_insert on public.task_attachments;
create policy attachments_insert on public.task_attachments for insert to authenticated
  with check (
    space_id = public.current_space_id()
    and uploaded_by = public.current_member_id()
    and (
      public.is_leader()
      or exists (
        select 1 from public.tasks t
        where t.id = task_id and t.assignee_id = public.current_member_id()
      )
    )
  );

-- Só o líder aprova/rejeita.
drop policy if exists attachments_update on public.task_attachments;
create policy attachments_update on public.task_attachments for update to authenticated
  using (public.is_leader() and space_id = public.current_space_id())
  with check (public.is_leader() and space_id = public.current_space_id());

-- Apagar: o líder, ou quem carregou o ficheiro.
drop policy if exists attachments_delete on public.task_attachments;
create policy attachments_delete on public.task_attachments for delete to authenticated
  using (
    space_id = public.current_space_id()
    and (public.is_leader() or uploaded_by = public.current_member_id())
  );

-- Bucket de armazenamento (privado). O acesso aos ficheiros é por URL assinado.
insert into storage.buckets (id, name, public)
values ('task-files', 'task-files', false)
on conflict (id) do nothing;

-- Políticas de armazenamento: o caminho começa pelo id da tarefa ({task_id}/...),
-- por isso restringimos por tarefa tal como na tabela.
drop policy if exists task_files_select on storage.objects;
create policy task_files_select on storage.objects for select to authenticated
  using (
    bucket_id = 'task-files'
    and exists (
      select 1 from public.tasks t
      where t.id = ((storage.foldername(name))[1])::uuid
        and t.space_id = public.current_space_id()
        and (public.is_leader() or t.assignee_id = public.current_member_id())
    )
  );

drop policy if exists task_files_insert on storage.objects;
create policy task_files_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'task-files'
    and exists (
      select 1 from public.tasks t
      where t.id = ((storage.foldername(name))[1])::uuid
        and t.space_id = public.current_space_id()
        and (public.is_leader() or t.assignee_id = public.current_member_id())
    )
  );

drop policy if exists task_files_delete on storage.objects;
create policy task_files_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'task-files'
    and exists (
      select 1 from public.tasks t
      where t.id = ((storage.foldername(name))[1])::uuid
        and t.space_id = public.current_space_id()
        and (public.is_leader() or t.assignee_id = public.current_member_id())
    )
  );

-- ----------------------------------------------------------------------------
--  SEED
-- ----------------------------------------------------------------------------

-- Espaço por omissão
insert into public.spaces (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Marketing — LISAT')
on conflict (id) do nothing;

-- Áreas por omissão (com cores para os filtros e etiquetas)
insert into public.areas (space_id, name, color) values
  ('00000000-0000-0000-0000-000000000001', 'Documentário',    '#0ea5e9'),
  ('00000000-0000-0000-0000-000000000001', 'Website',         '#10b981'),
  ('00000000-0000-0000-0000-000000000001', 'Posts Instagram', '#e1306c'),
  ('00000000-0000-0000-0000-000000000001', 'Posts Linkedin',  '#0a66c2'),
  ('00000000-0000-0000-0000-000000000001', 'Sponsors',        '#f59e0b'),
  ('00000000-0000-0000-0000-000000000001', 'Merch',           '#8b5cf6'),
  ('00000000-0000-0000-0000-000000000001', 'Apresentações',   '#14b8a6')
on conflict do nothing;

-- ============================================================================
--  BOOTSTRAP DO LÍDER  ←←←  IMPORTANTE: FAZ ISTO UMA VEZ
--  Substitui o email abaixo pelo email da TUA conta Google e corre esta linha.
--  (É a única forma de criar o primeiro líder, porque as políticas RLS só
--   deixam um líder existente adicionar membros.)
-- ============================================================================
--
--  insert into public.members (space_id, email, name, role, area)
--  values ('00000000-0000-0000-0000-000000000001',
--          'o-teu-email@gmail.com', 'O Teu Nome', 'leader', 'Social Media')
--  on conflict (lower(email)) do update set role = 'leader', active = true;
--
-- ============================================================================
