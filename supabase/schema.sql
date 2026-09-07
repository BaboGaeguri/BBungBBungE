-- 뿡뿡이 스키마
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 실행하세요. 여러 번 실행해도 안전합니다.

-- ─────────────────────────────────────────────
-- 1. 테이블
-- ─────────────────────────────────────────────

create table if not exists couples (
  id          uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  start_date  date,
  created_at  timestamptz not null default now()
);

-- auth.users 와 1:1. 커플 소속은 여기에 들고 있는다.
create table if not exists profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text not null default '이름 없음',
  photo_url    text,
  couple_id    uuid references couples on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists posts (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references couples on delete cascade,
  author_id  uuid not null references profiles on delete cascade,
  body       text not null default '',
  photos     jsonb not null default '[]'::jsonb,  -- [{ storagePath, width, height }]
  taken_at   date not null,
  created_at timestamptz not null default now(),

  -- 위치. 지역만 직접 고른 경우 좌표는 비어 있다.
  lat               double precision,
  lng               double precision,
  place_name        text,
  region_code       text,
  region_sido       text,
  region_sido_short text,
  region_sigungu    text,
  location_source   text check (location_source in ('exif', 'manual'))
);

create index if not exists posts_couple_taken_idx  on posts (couple_id, taken_at desc);
create index if not exists posts_couple_region_idx on posts (couple_id, region_code);

create table if not exists anniversaries (
  id            uuid primary key default gen_random_uuid(),
  couple_id     uuid not null references couples on delete cascade,
  title         text not null,
  date          date not null,
  repeat_yearly boolean not null default true,
  emoji         text not null default '🎀',
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. 다녀온 지역
--
-- Firestore 였다면 글을 쓸 때마다 카운트를 올리고 지울 때 내리는 코드를 직접
-- 유지해야 했다. SQL 에서는 글에서 바로 계산하면 되므로 집계가 어긋날 일이 없다.
-- ─────────────────────────────────────────────

create or replace view visited_regions
with (security_invoker = on) as
select
  couple_id,
  region_code                                                   as code,
  min(region_sigungu)                                           as name,
  min(region_sido)                                              as sido,
  min(region_sido_short)                                        as sido_short,
  count(*)::int                                                 as visit_count,
  min(taken_at)                                                 as first_visited_at,
  max(taken_at)                                                 as last_visited_at,
  (array_remove(
     array_agg(photos -> 0 ->> 'storagePath' order by taken_at desc),
     null
   ))[1]                                                        as cover_photo_path
from posts
where region_code is not null
group by couple_id, region_code;

-- ─────────────────────────────────────────────
-- 3. 로그인하면 프로필 자동 생성
-- ─────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, display_name, photo_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      '이름 없음'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────
-- 4. 내 커플 id (RLS 정책에서 계속 쓴다)
--
-- security definer 라서 profiles 의 RLS 를 건너뛴다.
-- 이게 없으면 "profiles 를 읽으려면 profiles 를 읽어야" 하는 무한 재귀가 생긴다.
-- ─────────────────────────────────────────────

create or replace function my_couple_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select couple_id from profiles where id = auth.uid()
$$;

-- ─────────────────────────────────────────────
-- 5. 커플 만들기 / 초대코드로 참여하기
-- ─────────────────────────────────────────────

create or replace function create_couple()
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  new_id uuid;
  code   text;
begin
  if (select couple_id from profiles where id = auth.uid()) is not null then
    raise exception '이미 커플에 속해 있어요';
  end if;

  -- 헷갈리는 글자(0/O, 1/I)는 뺀 6자리
  loop
    code := (
      select string_agg(
        substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32)::int + 1, 1),
        ''
      )
      from generate_series(1, 6)
    );
    exit when not exists (select 1 from couples where invite_code = code);
  end loop;

  insert into couples (invite_code) values (code) returning id into new_id;
  update profiles set couple_id = new_id where id = auth.uid();
  return new_id;
end;
$$;

create or replace function join_couple(code text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  target  uuid;
  members int;
begin
  select id into target from couples where invite_code = upper(trim(code));
  if target is null then
    raise exception '그런 초대코드가 없어요. 다시 확인해줄래요?';
  end if;

  select count(*) into members from profiles where couple_id = target;
  if members >= 2 then
    raise exception '이미 두 명이 연결된 커플이에요';
  end if;

  update profiles set couple_id = target where id = auth.uid();
  return target;
end;
$$;

-- ─────────────────────────────────────────────
-- 6. 접근 통제 (RLS)
--    기본은 전부 차단. 아래 정책에 해당할 때만 통과한다.
-- ─────────────────────────────────────────────

alter table couples       enable row level security;
alter table profiles      enable row level security;
alter table posts         enable row level security;
alter table anniversaries enable row level security;

-- 내 프로필과 애인 프로필만
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (id = auth.uid() or (couple_id is not null and couple_id = my_couple_id()));

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- 내가 속한 커플만
drop policy if exists couples_select on couples;
create policy couples_select on couples for select
  using (id = my_couple_id());

drop policy if exists couples_update on couples;
create policy couples_update on couples for update
  using (id = my_couple_id()) with check (id = my_couple_id());

-- 추억과 기념일은 우리 커플 것만
drop policy if exists posts_all on posts;
create policy posts_all on posts for all
  using (couple_id = my_couple_id())
  with check (couple_id = my_couple_id() and author_id = auth.uid());

drop policy if exists anniversaries_all on anniversaries;
create policy anniversaries_all on anniversaries for all
  using (couple_id = my_couple_id())
  with check (couple_id = my_couple_id());

-- ─────────────────────────────────────────────
-- 7. 사진 저장소
--    경로 규칙: {couple_id}/{post_id}/{n}.jpg
-- ─────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists photos_select on storage.objects;
create policy photos_select on storage.objects for select
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = my_couple_id()::text
  );

drop policy if exists photos_insert on storage.objects;
create policy photos_insert on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = my_couple_id()::text
  );

drop policy if exists photos_delete on storage.objects;
create policy photos_delete on storage.objects for delete
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = my_couple_id()::text
  );

-- ─────────────────────────────────────────────
-- 8. 실시간 동기화
--    한쪽이 글을 올리면 다른 쪽 화면이 바로 바뀐다.
-- ─────────────────────────────────────────────

do $$
begin
  alter publication supabase_realtime add table posts;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table couples;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table anniversaries;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table profiles;
exception when duplicate_object then null;
end $$;
