-- =====================================================================
--  AI Vendor Risk Radar — complete database setup for Supabase (Postgres)
--  Run this whole file ONCE in the Supabase SQL Editor (new project).
--  Then set the reset PIN (see step at the very bottom).
--
--  All companies, incidents, authorities and numbers in this file are
--  FICTIONAL. Created for BTMA 631 / BIMA 610, Group Project 1.
-- =====================================================================

create schema if not exists private;   -- not exposed through the Supabase API

-- ---------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------

-- PROVIDER: an AI vendor that a company might buy from
create table public.provider (
  id              bigint generated always as identity primary key,
  name            text not null check (char_length(name) between 2 and 60),
  tagline         text check (char_length(tagline) <= 120),
  hq_city         text not null check (char_length(hq_city) between 2 and 60),
  hq_country      text not null check (char_length(hq_country) between 2 and 60),
  founded_year    int  check (founded_year between 1990 and 2030),
  flagship_model  text check (char_length(flagship_model) <= 60),
  segment         text not null default 'both'
                  check (segment in ('consumer', 'enterprise', 'both')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index provider_name_unique on public.provider (lower(name));

-- CRITERION: a data-protection criterion with a weight (0 = ignored, 5 = critical)
create table public.criterion (
  id           bigint generated always as identity primary key,
  name         text not null check (char_length(name) between 2 and 60),
  description  text not null check (char_length(description) between 5 and 300),
  weight       smallint not null default 2 check (weight between 0 and 5),
  sort_order   smallint not null default 100,
  created_at   timestamptz not null default now()
);
create unique index criterion_name_unique on public.criterion (lower(name));

-- RATING: associative entity PROVIDER x CRITERION (M:N with attributes)
create table public.rating (
  provider_id   bigint not null references public.provider(id)  on delete cascade,
  criterion_id  bigint not null references public.criterion(id) on delete cascade,
  score         smallint not null default 50 check (score between 0 and 100),
  note          text check (char_length(note) <= 280),
  updated_at    timestamptz not null default now(),
  primary key (provider_id, criterion_id)
);
create index rating_criterion_idx on public.rating (criterion_id);

-- INCIDENT: breaches, fines, vulnerabilities, policy violations (1:M from PROVIDER)
create table public.incident (
  id               bigint generated always as identity primary key,
  provider_id      bigint not null references public.provider(id) on delete cascade,
  title            text not null check (char_length(title) between 5 and 120),
  description      text check (char_length(description) <= 600),
  incident_type    text not null check (incident_type in
                     ('data_breach', 'security_vulnerability', 'regulatory_fine', 'policy_violation')),
  severity         text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status           text not null default 'reported' check (status in
                     ('reported', 'under_investigation', 'confirmed', 'fine_imposed', 'appealed', 'annulled')),
  occurred_on      date not null check (occurred_on >= date '2015-01-01'),
  fine_amount_eur  numeric(14,2) check (fine_amount_eur >= 0),
  authority        text check (char_length(authority) <= 80),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint fine_only_for_fines
    check (fine_amount_eur is null or incident_type = 'regulatory_fine')
);
create index incident_provider_idx on public.incident (provider_id);

-- DATA_CENTER: where a provider stores/processes data (1:M from PROVIDER)
create table public.data_center (
  id            bigint generated always as identity primary key,
  provider_id   bigint not null references public.provider(id) on delete cascade,
  city          text not null check (char_length(city) between 2 and 60),
  country       text not null check (char_length(country) between 2 and 60),
  jurisdiction  text not null check (jurisdiction in ('EU', 'US', 'CA', 'UK', 'CN', 'SG', 'JP', 'OTHER')),
  purpose       text not null default 'inference'
                check (purpose in ('training', 'inference', 'storage', 'backup')),
  latitude      numeric(8,5) not null check (latitude between -90 and 90),
  longitude     numeric(8,5) not null check (longitude between -180 and 180),
  created_at    timestamptz not null default now()
);
create index data_center_provider_idx on public.data_center (provider_id);

-- ACTIVITY_LOG: written only by triggers, read by the live feed
create table public.activity_log (
  id             bigint generated always as identity primary key,
  occurred_at    timestamptz not null default now(),
  entity         text not null,
  action         text not null check (action in ('insert', 'update', 'delete', 'reset')),
  provider_name  text,
  message        text not null
);

-- Private config (reset PIN). NOT reachable via the API.
create table private.app_config (
  key    text primary key,
  value  text not null
);

-- ---------------------------------------------------------------------
-- 2. HELPER FUNCTIONS & TRIGGERS
-- ---------------------------------------------------------------------

create function private.label(p text) returns text
language sql immutable as $$
  select case p
    when 'reported'            then 'Reported (unconfirmed)'
    when 'under_investigation' then 'Under investigation'
    when 'confirmed'           then 'Confirmed'
    when 'fine_imposed'        then 'Fine imposed'
    when 'appealed'            then 'Appealed'
    when 'annulled'            then 'Annulled'
    else initcap(replace(p, '_', ' '))
  end
$$;

create function private.is_seeding() returns boolean
language sql stable as $$
  select coalesce(current_setting('app.seeding', true), 'off') = 'on'
$$;

-- updated_at maintenance
create function private.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger provider_touch  before update on public.provider
  for each row execute function private.touch_updated_at();
create trigger incident_touch  before update on public.incident
  for each row execute function private.touch_updated_at();
create trigger rating_touch    before update on public.rating
  for each row execute function private.touch_updated_at();

-- Every provider gets a rating row for every criterion (default score 50)
create function private.fill_ratings_for_provider() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.rating (provider_id, criterion_id)
  select new.id, c.id from public.criterion c
  on conflict do nothing;
  return new;
end $$;

create trigger provider_fill_ratings after insert on public.provider
  for each row execute function private.fill_ratings_for_provider();

-- Every new criterion gets a rating row for every provider (default score 50)
create function private.fill_ratings_for_criterion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.rating (provider_id, criterion_id)
  select p.id, new.id from public.provider p
  on conflict do nothing;
  return new;
end $$;

create trigger criterion_fill_ratings after insert on public.criterion
  for each row execute function private.fill_ratings_for_criterion();

-- ---- Activity log triggers ------------------------------------------

create function private.log_provider() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  n_inc int; n_dc int;
begin
  if private.is_seeding() then return coalesce(new, old); end if;

  if tg_op = 'INSERT' then
    insert into activity_log (entity, action, provider_name, message)
    values ('provider', 'insert', new.name,
            format('New vendor added: %s (%s)', new.name, new.hq_country));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into activity_log (entity, action, provider_name, message)
    values ('provider', 'update', new.name,
            case when old.name <> new.name
                 then format('Vendor renamed: %s → %s', old.name, new.name)
                 else format('Vendor profile updated: %s', new.name) end);
    return new;
  else -- DELETE (BEFORE trigger, so children still exist and can be counted)
    select count(*) into n_inc from incident    where provider_id = old.id;
    select count(*) into n_dc  from data_center where provider_id = old.id;
    insert into activity_log (entity, action, provider_name, message)
    values ('provider', 'delete', old.name,
            format('Vendor removed: %s (cascade: %s incidents, %s data centers, all ratings)',
                   old.name, n_inc, n_dc));
    return old;
  end if;
end $$;

create trigger provider_log_ins_upd after insert or update on public.provider
  for each row execute function private.log_provider();
create trigger provider_log_del before delete on public.provider
  for each row execute function private.log_provider();

create function private.log_incident() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  pname text;
  r     public.incident%rowtype;
begin
  if private.is_seeding() then return coalesce(new, old); end if;
  if tg_op = 'DELETE' then r := old; else r := new; end if;

  select name into pname from provider where id = r.provider_id;
  if pname is null then return r; end if;  -- parent already gone (cascade) → no spam

  if tg_op = 'INSERT' then
    insert into activity_log (entity, action, provider_name, message)
    values ('incident', 'insert', pname,
            format('%s: new incident "%s" (%s severity)', pname, new.title, new.severity));
  elsif tg_op = 'UPDATE' then
    insert into activity_log (entity, action, provider_name, message)
    values ('incident', 'update', pname,
            case when old.status <> new.status
                 then format('%s: "%s" moved from %s to %s', pname, new.title,
                             private.label(old.status), private.label(new.status))
                 when old.severity <> new.severity
                 then format('%s: "%s" severity changed %s → %s', pname, new.title,
                             old.severity, new.severity)
                 else format('%s: incident "%s" edited', pname, new.title) end);
  else
    insert into activity_log (entity, action, provider_name, message)
    values ('incident', 'delete', pname,
            format('%s: incident "%s" retracted', pname, old.title));
  end if;
  return r;
end $$;

create trigger incident_log after insert or update or delete on public.incident
  for each row execute function private.log_incident();

create function private.log_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  pname text; cname text;
begin
  if private.is_seeding() or old.score = new.score then return new; end if;
  select name into pname from provider  where id = new.provider_id;
  select name into cname from criterion where id = new.criterion_id;
  insert into activity_log (entity, action, provider_name, message)
  values ('rating', 'update', pname,
          format('%s: "%s" score %s → %s', pname, cname, old.score, new.score));
  return new;
end $$;

create trigger rating_log after update on public.rating
  for each row execute function private.log_rating();

create function private.log_criterion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if private.is_seeding() then return new; end if;
  if tg_op = 'INSERT' then
    insert into activity_log (entity, action, message)
    values ('criterion', 'insert', format('New criterion added: %s (weight %s)', new.name, new.weight));
  elsif old.weight <> new.weight then
    insert into activity_log (entity, action, message)
    values ('criterion', 'update', format('Weight of "%s" changed %s → %s', new.name, old.weight, new.weight));
  end if;
  return new;
end $$;

create trigger criterion_log after insert or update on public.criterion
  for each row execute function private.log_criterion();

create function private.log_data_center() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  pname text;
  r     public.data_center%rowtype;
begin
  if private.is_seeding() then return coalesce(new, old); end if;
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  select name into pname from provider where id = r.provider_id;
  if pname is null then return r; end if;

  insert into activity_log (entity, action, provider_name, message)
  values ('data_center', lower(tg_op), pname,
          case tg_op
            when 'INSERT' then format('%s opened a data center in %s, %s', pname, r.city, r.country)
            when 'UPDATE' then format('%s updated its data center in %s', pname, r.city)
            else               format('%s closed its data center in %s, %s', pname, r.city, r.country)
          end);
  return r;
end $$;

create trigger data_center_log after insert or update or delete on public.data_center
  for each row execute function private.log_data_center();

-- ---------------------------------------------------------------------
-- 3. SCORING VIEWS (single source of truth for every client)
-- ---------------------------------------------------------------------
--  base_score  = weighted average of the criterion scores (0–100)
--  penalty     = sum over incidents of
--                severity points (low 3, medium 6, high 10, critical 15)
--              × status factor (reported 0.3, under_investigation 0.5, confirmed 1.0,
--                               fine_imposed 1.2, appealed 0.8, annulled 0)
--              × recency factor (1.0 if within last 24 months, else 0.5)
--                capped at 40
--  total_score = max(0, base_score − penalty)
--  risk_tier   = low (≥ 75) | moderate (60–74.9) | elevated (45–59.9) | high (< 45)

create view public.provider_score with (security_invoker = true) as
with base as (
  select r.provider_id,
         sum(r.score * c.weight)::numeric / nullif(sum(c.weight), 0) as base_score
  from public.rating r
  join public.criterion c on c.id = r.criterion_id
  group by r.provider_id
),
pen as (
  select i.provider_id,
         sum(
           (case i.severity when 'low' then 3 when 'medium' then 6
                            when 'high' then 10 when 'critical' then 15 end)
         * (case i.status when 'reported' then 0.3 when 'under_investigation' then 0.5
                          when 'confirmed' then 1.0 when 'fine_imposed' then 1.2
                          when 'appealed' then 0.8 when 'annulled' then 0 end)
         * (case when i.occurred_on >= current_date - interval '24 months' then 1.0 else 0.5 end)
         ) as penalty,
         count(*) as incident_count,
         count(*) filter (where i.status in ('reported', 'under_investigation', 'appealed')) as open_incident_count,
         max(i.occurred_on) as last_incident_on
  from public.incident i
  group by i.provider_id
),
scored as (
  select p.id as provider_id,
         round(coalesce(b.base_score, 50), 1)                        as base_score,
         round(least(coalesce(pen.penalty, 0), 40), 1)               as penalty,
         round(greatest(0, coalesce(b.base_score, 50)
                         - least(coalesce(pen.penalty, 0), 40)), 1)  as total_score,
         coalesce(pen.incident_count, 0)                             as incident_count,
         coalesce(pen.open_incident_count, 0)                        as open_incident_count,
         pen.last_incident_on
  from public.provider p
  left join base b  on b.provider_id = p.id
  left join pen     on pen.provider_id = p.id
)
select s.*,
       case when s.total_score >= 75 then 'low'
            when s.total_score >= 60 then 'moderate'
            when s.total_score >= 45 then 'elevated'
            else 'high' end as risk_tier
from scored s;

-- Convenience view for the ranking page: provider data + score + rank
create view public.provider_ranking with (security_invoker = true) as
select p.*,
       s.base_score, s.penalty, s.total_score, s.risk_tier,
       s.incident_count, s.open_incident_count, s.last_incident_on,
       dense_rank() over (order by s.total_score desc) as rank,
       (select count(*) from public.data_center d where d.provider_id = p.id) as data_center_count,
       (select string_agg(distinct d.jurisdiction, ',' order by d.jurisdiction)
          from public.data_center d where d.provider_id = p.id)             as jurisdictions
from public.provider p
join public.provider_score s on s.provider_id = p.id;

-- ---------------------------------------------------------------------
-- 4. SEED DATA (fictional) + RESET
-- ---------------------------------------------------------------------

create function private.seed_demo() returns void
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.seeding', 'on', true);

  insert into criterion (name, description, weight, sort_order) values
    ('Training default',     'Are user conversations used to train models unless the user opts out? Higher score = not used by default.', 3, 1),
    ('Opt-out quality',      'How easy, complete and retroactive is the opt-out from data use?',                                       2, 2),
    ('Data retention',       'How long are conversations and files kept after deletion or inactivity?',                               2, 3),
    ('Data location',        'Where data is stored and processed, and which legal regime governs government access.',                 3, 4),
    ('Policy transparency',  'Is the privacy policy short, specific and understandable for a non-lawyer?',                            1, 5),
    ('Certifications & audits', 'Independent audits and certifications (e.g. ISO 27001, SOC 2) and how recent they are.',            2, 6);

  insert into provider (name, tagline, hq_city, hq_country, founded_year, flagship_model, segment) values
    ('Nebulyx AI',      'Frontier models for everyone',                       'San Francisco', 'United States', 2019, 'Nebulyx Ultra', 'both'),
    ('Aurelia Systems', 'Sovereign AI, engineered in Europe',                 'Munich',        'Germany',       2021, 'Aurelia 3',     'enterprise'),
    ('Northlight AI',   'Helpful models from the true north',                 'Toronto',       'Canada',        2020, 'Polaris 2',     'both'),
    ('Brightquill',     'The writing assistant your legal team approves of',  'London',        'United Kingdom',2022, 'Quill-2',       'enterprise'),
    ('Hexaprompt',      'Move fast and prompt things',                        'Austin',        'United States', 2024, 'Hexa Turbo',    'consumer'),
    ('Lotusmind',       'Asia''s productivity copilot',                       'Singapore',     'Singapore',     2018, 'Lotus Pro',     'both'),
    ('Fjordwise',       'Boringly private. On purpose.',                      'Oslo',          'Norway',        2020, 'Fjord-7',       'enterprise'),
    ('Jade Lattice AI', 'Scale for a billion users',                          'Shenzhen',      'China',         2019, 'Lattice-X',     'consumer');
  -- the trigger has now created 8 x 6 = 48 rating rows with score 50

  update rating r
  set score = v.score, note = v.note
  from (values
    ('Nebulyx AI','Training default',25,'Consumer chats train models by default'),
    ('Nebulyx AI','Opt-out quality',55,'Opt-out exists but hidden three menus deep'),
    ('Nebulyx AI','Data retention',40,'Deleted chats kept for 30 days, logs longer'),
    ('Nebulyx AI','Data location',50,'US primary, EU region only for enterprise'),
    ('Nebulyx AI','Policy transparency',80,'Clear, well structured policy'),
    ('Nebulyx AI','Certifications & audits',75,'SOC 2 Type II, ISO 27001'),

    ('Aurelia Systems','Training default',85,'No training on customer data'),
    ('Aurelia Systems','Opt-out quality',80,null),
    ('Aurelia Systems','Data retention',75,'30-day retention, configurable'),
    ('Aurelia Systems','Data location',95,'EU-only processing'),
    ('Aurelia Systems','Policy transparency',55,'Accurate but 47 pages of legal German'),
    ('Aurelia Systems','Certifications & audits',85,'ISO 27001, C5 attestation'),

    ('Northlight AI','Training default',70,null),
    ('Northlight AI','Opt-out quality',70,null),
    ('Northlight AI','Data retention',65,null),
    ('Northlight AI','Data location',80,'Canadian data residency available'),
    ('Northlight AI','Policy transparency',75,null),
    ('Northlight AI','Certifications & audits',60,'SOC 2 audit in progress'),

    ('Brightquill','Training default',60,'Opt-in program for model improvement'),
    ('Brightquill','Opt-out quality',65,null),
    ('Brightquill','Data retention',70,null),
    ('Brightquill','Data location',70,'UK and US regions'),
    ('Brightquill','Policy transparency',85,'Plain-English policy, one page'),
    ('Brightquill','Certifications & audits',70,null),

    ('Hexaprompt','Training default',20,'Everything trains everything'),
    ('Hexaprompt','Opt-out quality',30,'Opt-out by email only'),
    ('Hexaprompt','Data retention',25,'Retention: "until further notice"'),
    ('Hexaprompt','Data location',45,'Single US region, no residency options'),
    ('Hexaprompt','Policy transparency',35,'Policy last updated before launch'),
    ('Hexaprompt','Certifications & audits',15,'No independent audit'),

    ('Lotusmind','Training default',55,null),
    ('Lotusmind','Opt-out quality',60,null),
    ('Lotusmind','Data retention',60,null),
    ('Lotusmind','Data location',60,'Singapore and Japan'),
    ('Lotusmind','Policy transparency',65,null),
    ('Lotusmind','Certifications & audits',80,'ISO 27001, ISO 27701'),

    ('Fjordwise','Training default',90,'Never trains on customer data'),
    ('Fjordwise','Opt-out quality',85,'Nothing to opt out of'),
    ('Fjordwise','Data retention',90,'Zero retention by default'),
    ('Fjordwise','Data location',90,'EEA only, GDPR'),
    ('Fjordwise','Policy transparency',80,null),
    ('Fjordwise','Certifications & audits',75,null),

    ('Jade Lattice AI','Training default',45,null),
    ('Jade Lattice AI','Opt-out quality',40,'Opt-out not available in all regions'),
    ('Jade Lattice AI','Data retention',35,'Retention period not specified'),
    ('Jade Lattice AI','Data location',20,'All processing in mainland China'),
    ('Jade Lattice AI','Policy transparency',50,null),
    ('Jade Lattice AI','Certifications & audits',55,null)
  ) as v(pname, cname, score, note)
  join provider  p on p.name = v.pname
  join criterion c on c.name = v.cname
  where r.provider_id = p.id and r.criterion_id = c.id;

  insert into data_center (provider_id, city, country, jurisdiction, purpose, latitude, longitude)
  select p.id, v.city, v.country, v.jur, v.purpose, v.lat, v.lng
  from (values
    ('Nebulyx AI','Ashburn','United States','US','training',39.04372,-77.48749),
    ('Nebulyx AI','Dublin','Ireland','EU','inference',53.34981,-6.26031),
    ('Nebulyx AI','Singapore','Singapore','SG','inference',1.35208,103.81984),
    ('Aurelia Systems','Frankfurt','Germany','EU','training',50.11092,8.68213),
    ('Aurelia Systems','Paris','France','EU','backup',48.85661,2.35222),
    ('Northlight AI','Montréal','Canada','CA','training',45.50169,-73.56726),
    ('Northlight AI','Calgary','Canada','CA','inference',51.04473,-114.07188),
    ('Brightquill','London','United Kingdom','UK','inference',51.50735,-0.12776),
    ('Brightquill','Ashburn','United States','US','backup',39.04372,-77.48749),
    ('Hexaprompt','Portland','United States','US','training',45.51520,-122.67839),
    ('Lotusmind','Singapore','Singapore','SG','training',1.35208,103.81984),
    ('Lotusmind','Tokyo','Japan','JP','inference',35.67620,139.65031),
    ('Fjordwise','Oslo','Norway','EU','inference',59.91387,10.75225),
    ('Fjordwise','Stavanger','Norway','EU','backup',58.96998,5.73311),
    ('Jade Lattice AI','Shenzhen','China','CN','training',22.54310,114.05787),
    ('Jade Lattice AI','Hangzhou','China','CN','inference',30.27408,120.15507)
  ) as v(pname, city, country, jur, purpose, lat, lng)
  join provider p on p.name = v.pname;

  -- Incident dates are relative to "today", so the 24-month recency rule
  -- behaves the same whenever the demo is reset.
  insert into incident (provider_id, title, description, incident_type, severity, status,
                        occurred_on, fine_amount_eur, authority)
  select p.id, v.title, v.descr, v.itype, v.sev, v.status,
         current_date - v.days_ago, v.fine, v.auth
  from (values
    ('Nebulyx AI', 'Chat titles visible to other users',
     'A caching bug showed some users the conversation titles of other users for about nine hours.',
     'data_breach', 'high', 'confirmed', 330, null::numeric, null::text),
    ('Nebulyx AI', 'Fine for missing age verification',
     'The Northland Privacy Commission fined Nebulyx for lacking age checks and an unclear legal basis for training.',
     'regulatory_fine', 'high', 'fine_imposed', 580, 12000000, 'Northland Privacy Commission'),
    ('Aurelia Systems', 'Privacy policy too long to be understandable',
     'A consumer agency complained that the 47-page privacy policy is not reasonably understandable.',
     'policy_violation', 'low', 'confirmed', 240, null, null),
    ('Northlight AI', 'Unprotected test server with log files',
     'A security researcher found a staging server exposing application logs. Content of the logs is still being assessed.',
     'security_vulnerability', 'medium', 'under_investigation', 45, null, null),
    ('Brightquill', 'Admin password on a sticky note',
     'A visitor photo from the office tour showed an admin password on a sticky note next to the server rack. Password rotated the same day.',
     'security_vulnerability', 'medium', 'confirmed', 150, null, null),
    ('Hexaprompt', 'Production database reachable without password',
     'A misconfigured database exposed chat logs and API keys to the open internet for an unknown period.',
     'data_breach', 'critical', 'confirmed', 260, null, null),
    ('Hexaprompt', 'Suspected hacker attack on login system',
     'Users report unknown logins. Hexaprompt says it is "looking into it". Not confirmed.',
     'data_breach', 'high', 'reported', 6, null, null),
    ('Lotusmind', 'Fine for sharing data with ad partners',
     'The Southern Data Authority fined Lotusmind for sharing usage data with advertising partners without valid consent.',
     'regulatory_fine', 'medium', 'fine_imposed', 390, 2500000, 'Southern Data Authority'),
    ('Jade Lattice AI', 'Unclear legal basis for government data access',
     'Regulators in two markets are reviewing whether user data can be accessed by authorities without notice.',
     'policy_violation', 'high', 'under_investigation', 120, null, null),
    ('Jade Lattice AI', 'Old app version leaked device identifiers',
     'An outdated mobile app sent device identifiers to an analytics endpoint over plain HTTP.',
     'security_vulnerability', 'medium', 'confirmed', 900, null, null)
  ) as v(pname, title, descr, itype, sev, status, days_ago, fine, auth)
  join provider p on p.name = v.pname;

  perform set_config('app.seeding', 'off', true);
end $$;

create function public.reset_demo(p_pin text) returns void
language plpgsql security definer set search_path = public, private as $$
declare
  expected text;
begin
  select value into expected from private.app_config where key = 'reset_pin';
  if expected is null or p_pin is null or p_pin <> expected then
    raise exception 'Invalid PIN' using errcode = '28000';
  end if;

  truncate public.rating, public.incident, public.data_center,
           public.provider, public.criterion, public.activity_log
    restart identity cascade;

  perform private.seed_demo();

  insert into public.activity_log (entity, action, message)
  values ('system', 'reset', 'Demo data was reset to the original state');
end $$;

-- ---------------------------------------------------------------------
-- 5. SECURITY: privileges + Row Level Security
-- ---------------------------------------------------------------------
-- The site runs on GitHub Pages without login, so the browser uses the
-- public anon/publishable key. RLS and column privileges define exactly
-- what an anonymous visitor may do.

revoke all on schema private from anon, authenticated;
revoke all on all tables in schema private from anon, authenticated;
revoke all on function private.seed_demo() from public;
revoke all on function public.reset_demo(text) from public;
grant execute on function public.reset_demo(text) to anon, authenticated;

alter table public.provider     enable row level security;
alter table public.criterion    enable row level security;
alter table public.rating       enable row level security;
alter table public.incident     enable row level security;
alter table public.data_center  enable row level security;
alter table public.activity_log enable row level security;

-- Table/column privileges (Supabase grants everything by default; narrow it)
revoke all on public.provider, public.criterion, public.rating,
              public.incident, public.data_center, public.activity_log
  from anon, authenticated;

grant select, insert, update, delete on public.provider    to anon, authenticated;
grant select, insert, update, delete on public.incident    to anon, authenticated;
grant select, insert, update, delete on public.data_center to anon, authenticated;
grant select, insert                 on public.criterion   to anon, authenticated;
grant update (weight)                on public.criterion   to anon, authenticated;  -- only the weight is editable
grant select                         on public.rating      to anon, authenticated;
grant update (score, note)           on public.rating      to anon, authenticated;  -- rows are created by triggers
grant select                         on public.activity_log to anon, authenticated; -- written by triggers only
grant select on public.provider_score, public.provider_ranking to anon, authenticated;

-- Policies
create policy provider_read   on public.provider for select to anon, authenticated using (true);
create policy provider_insert on public.provider for insert to anon, authenticated with check (true);
create policy provider_update on public.provider for update to anon, authenticated using (true) with check (true);
create policy provider_delete on public.provider for delete to anon, authenticated using (true);

create policy incident_read   on public.incident for select to anon, authenticated using (true);
create policy incident_insert on public.incident for insert to anon, authenticated with check (true);
create policy incident_update on public.incident for update to anon, authenticated using (true) with check (true);
create policy incident_delete on public.incident for delete to anon, authenticated using (true);

create policy dc_read   on public.data_center for select to anon, authenticated using (true);
create policy dc_insert on public.data_center for insert to anon, authenticated with check (true);
create policy dc_update on public.data_center for update to anon, authenticated using (true) with check (true);
create policy dc_delete on public.data_center for delete to anon, authenticated using (true);

create policy criterion_read   on public.criterion for select to anon, authenticated using (true);
create policy criterion_insert on public.criterion for insert to anon, authenticated with check (true);
create policy criterion_update on public.criterion for update to anon, authenticated using (true) with check (true);

create policy rating_read   on public.rating for select to anon, authenticated using (true);
create policy rating_update on public.rating for update to anon, authenticated using (true) with check (true);

create policy log_read on public.activity_log for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- 6. REALTIME (live updates on the projector while the class edits)
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table
  public.provider, public.criterion, public.rating,
  public.incident, public.data_center, public.activity_log;

-- ---------------------------------------------------------------------
-- 7. LOAD THE DEMO DATA
-- ---------------------------------------------------------------------
select private.seed_demo();

-- ---------------------------------------------------------------------
-- 8. MANUAL STEP — set your own reset PIN (do NOT commit it to GitHub)
-- ---------------------------------------------------------------------
-- Run this separately in the SQL Editor with your own value:
--
--   insert into private.app_config (key, value) values ('reset_pin', 'choose-a-long-pin')
--   on conflict (key) do update set value = excluded.value;
