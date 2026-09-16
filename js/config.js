/* ============================================================
   E PROPERTIES BD — Supabase কনফিগারেশন
   ============================================================
   নিচের দুইটা ভ্যালু আপনার নিজের Supabase প্রজেক্ট থেকে বসান:
   Supabase Dashboard -> Project Settings -> API
     - "Project URL"          -> SUPABASE_URL
     - "anon" / "public" key  -> SUPABASE_ANON_KEY

   এই anon key টা browser-এ থাকা স্বাভাবিক এবং নিরাপদ —
   এটা কোনো secret/গোপন key না। আসল সুরক্ষা আসে Supabase-এর
   Row Level Security (RLS) policy থেকে, যা supabase/schema.sql
   ফাইলে সেট করা আছে (public শুধু read করতে পারবে, শুধু লগইন করা
   admin-ই listing/settings write করতে পারবে)।

   কখনোই "service_role" key এখানে বসাবেন না।
   ============================================================ */

const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
