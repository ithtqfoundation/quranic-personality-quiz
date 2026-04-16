-- Create result_page_cards table
create table if not exists result_page_cards (
  id           serial primary key,
  title        text not null,
  card_type    text not null default 'custom',
  order_number integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Create result_page_card_blocks table
create table if not exists result_page_card_blocks (
  id           serial primary key,
  card_id      integer not null references result_page_cards(id) on delete cascade,
  block_type   text not null,
  content      text not null default '',
  order_number integer not null default 0
);

-- Indexes
create index if not exists idx_result_page_cards_order on result_page_cards(order_number);
create index if not exists idx_result_page_card_blocks_card_id on result_page_card_blocks(card_id);
create index if not exists idx_result_page_card_blocks_order on result_page_card_blocks(order_number);

-- Seed: default personality cards so the result page works immediately
-- Only inserts if table is empty (idempotent)
insert into result_page_cards (title, card_type, order_number, is_active)
select title, card_type, order_number, is_active
from (values
  ('Gambaran Umum'::text, 'personality_description'::text, 1, true),
  ('Kekuatan Utama'::text, 'personality_strengths'::text, 2, true),
  ('Tantangan'::text, 'personality_challenges'::text, 3, true)
) as v(title, card_type, order_number, is_active)
where not exists (select 1 from result_page_cards);

-- Enable RLS and add public read policies
alter table result_page_cards enable row level security;
create policy "public read active cards"
  on result_page_cards for select
  using (is_active = true);

alter table result_page_card_blocks enable row level security;
create policy "public read blocks"
  on result_page_card_blocks for select
  using (true);
