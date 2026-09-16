-- ============================================================
-- E PROPERTIES BD — Supabase schema
-- এই পুরো ফাইলটা Supabase Dashboard > SQL Editor এ পেস্ট করে "Run" চাপুন।
-- এটা একবারই চালাতে হবে।
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Properties (listings) ----------

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Flat',
  location text default '',
  price text default '',
  size text default '',
  beds text default 'N/A',
  baths text default 'N/A',
  featured boolean not null default false,
  images text[] not null default '{}',
  video_url text default '',
  description text default '',
  created_at timestamptz not null default now()
);

alter table public.properties enable row level security;

drop policy if exists "properties_public_read" on public.properties;
create policy "properties_public_read"
  on public.properties for select
  to anon, authenticated
  using (true);

drop policy if exists "properties_admin_insert" on public.properties;
create policy "properties_admin_insert"
  on public.properties for insert
  to authenticated
  with check (true);

drop policy if exists "properties_admin_update" on public.properties;
create policy "properties_admin_update"
  on public.properties for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "properties_admin_delete" on public.properties;
create policy "properties_admin_delete"
  on public.properties for delete
  to authenticated
  using (true);

-- ---------- Site settings (header, footer, hero — single row) ----------

create table if not exists public.site_settings (
  id int primary key default 1,
  site_name text default 'E Properties BD',
  tagline text default 'FLATS & PLOTS MARKETPLACE',
  logo_url text default '',
  whatsapp_number text default '8801410893338',
  whatsapp_message text default 'Hi, I am interested in a property listed on E Properties BD.',
  hero_eyebrow text default 'STATUS & ELITE LISTINGS ACROSS DHAKA',
  hero_title text default 'Find your next flat, plot or commercial space — without the runaround.',
  hero_description text default 'Every listing here is added and verified by the E Properties BD team directly, with real photos, walkthrough videos, and one WhatsApp tap to the person who can actually close the deal.',
  footer_text text default 'All listings verified by our team.',
  footer_address text default '',
  facebook_url text default '',
  updated_at timestamptz default now(),
  constraint site_settings_single_row check (id = 1)
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "settings_admin_update" on public.site_settings;
create policy "settings_admin_update"
  on public.site_settings for update
  to authenticated
  using (true)
  with check (true);

-- ---------- Storage bucket for photos (listing photos + logo) ----------

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

drop policy if exists "property_images_public_read" on storage.objects;
create policy "property_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'property-images');

drop policy if exists "property_images_admin_insert" on storage.objects;
create policy "property_images_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'property-images');

drop policy if exists "property_images_admin_update" on storage.objects;
create policy "property_images_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'property-images');

drop policy if exists "property_images_admin_delete" on storage.objects;
create policy "property_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'property-images');

-- ============================================================
-- এরপর: Authentication > Users > Add user থেকে নিজের admin
-- ইমেইল আর পাসওয়ার্ড দিয়ে একটা ইউজার বানান (Auto Confirm User টিক দিয়ে)।
-- এই ইউজারই admin/index.html থেকে লগইন করবে।
-- ============================================================
