-- 0001_enable_rls.sql
-- Enable Row Level Security on Sentinel's tables and scope every policy
-- to the row's owner (Supabase auth.uid()).
--
-- Why it's safe:
--   * The backend connects with the service-role key (sb_secret_...) which
--     bypasses RLS, so create_session / append_message / save_evaluation /
--     signup keep working untouched.
--   * The frontend talks to PostgREST with the publishable (anon) key and a
--     signed-in user's JWT, so auth.uid() resolves to that user.
--
-- Idempotent: safe to run repeatedly (DROP POLICY IF EXISTS, ENABLE RLS).
-- Run it in the Supabase Dashboard -> SQL Editor, or via `supabase db push`.

-- ── profiles ──────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── sessions ──────────────────────────────────────────────────────
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sessions TO authenticated;

DROP POLICY IF EXISTS "sessions_select_own" ON public.sessions;
CREATE POLICY "sessions_select_own"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions_insert_own" ON public.sessions;
CREATE POLICY "sessions_insert_own"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions_update_own" ON public.sessions;
CREATE POLICY "sessions_update_own"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions_delete_own" ON public.sessions;
CREATE POLICY "sessions_delete_own"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);
