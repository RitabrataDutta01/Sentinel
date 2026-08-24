-- 0002_multi_tenant_orgs.sql
-- Multi-tenant organizations + membership for the HR/team platform.
--
-- Adds:
--   * organizations  — one row per company/team
--   * org_members    — who belongs to which org, with a system role
--                      (admin | hr | member) and status (active | invited)
--
-- RLS strategy:
--   * 0001 (owner-scoped) is untouched — every user still owns their rows.
--   * Org-scoped SELECT policies let HR/admins read sessions and profiles of
--     users in their org. Every policy cross-checks org_members so data never
--     leaks between organizations.
--   * The backend uses the service-role key and is the only writer for org
--     creation / invites / role changes, so direct frontend writes are locked
--     down; the frontend reads via its JWT.
--
-- Idempotent: safe to run repeatedly (IF NOT EXISTS, DROP POLICY IF EXISTS).
-- Run in the Supabase Dashboard -> SQL Editor.

-- ── organizations ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  settings    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── org_members ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  system_role   text NOT NULL DEFAULT 'member' CHECK (system_role IN ('admin','hr','member')),
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited')),
  invited_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id  ON public.org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.org_members(user_id);

-- ── RLS helpers ──────────────────────────────────────────────────
-- SECURITY DEFINER (owned by the migration runner / postgres) so the
-- policies can query org_members without tripping RLS recursion.
-- Note: function parameters are qualified to avoid column-name collisions.

-- Is the current user an active member of this org?
create or replace function public.user_in_org(org_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = user_in_org.org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- Is the current user an admin of this org?
create or replace function public.user_is_admin(org_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = user_is_admin.org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.system_role = 'admin'
  );
$$;

-- ── organizations policies ───────────────────────────────────────
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON TABLE public.organizations TO authenticated;

DROP POLICY IF EXISTS "orgs_select_member" ON public.organizations;
CREATE POLICY "orgs_select_member"
  ON public.organizations FOR SELECT
  USING (public.user_in_org(id));

DROP POLICY IF EXISTS "orgs_update_admin" ON public.organizations;
CREATE POLICY "orgs_update_admin"
  ON public.organizations FOR UPDATE
  USING (public.user_is_admin(id))
  WITH CHECK (public.user_is_admin(id));

-- ── org_members policies ─────────────────────────────────────────
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.org_members TO authenticated;

-- Anyone can read their own row; active members can read their org's roster.
DROP POLICY IF EXISTS "members_select_org" ON public.org_members;
CREATE POLICY "members_select_org"
  ON public.org_members FOR SELECT
  USING (
    auth.uid() = user_id
    OR (status = 'active' AND public.user_in_org(org_id))
  );

-- Only org admins add/invite members.
DROP POLICY IF EXISTS "members_insert_admin" ON public.org_members;
CREATE POLICY "members_insert_admin"
  ON public.org_members FOR INSERT
  WITH CHECK (public.user_is_admin(org_id));

-- Admins manage roles/status; a user may only update their own row as a
-- plain 'member' (e.g. accepting an invite without escalating privileges).
DROP POLICY IF EXISTS "members_update_admin" ON public.org_members;
CREATE POLICY "members_update_admin"
  ON public.org_members FOR UPDATE
  USING (public.user_is_admin(org_id) OR auth.uid() = user_id)
  WITH CHECK (
    public.user_is_admin(org_id)
    OR (auth.uid() = user_id AND system_role = 'member')
  );

-- Only org admins remove members.
DROP POLICY IF EXISTS "members_delete_admin" ON public.org_members;
CREATE POLICY "members_delete_admin"
  ON public.org_members FOR DELETE
  USING (public.user_is_admin(org_id));

-- ── org-scoped visibility for sessions & profiles ────────────────
-- Owner-scoped policies from 0001 remain; these ADD staff visibility and
-- OR together with them. HR/admins can see (not modify) rows belonging to
-- active members of their org.

DROP POLICY IF EXISTS "sessions_select_org_staff" ON public.sessions;
CREATE POLICY "sessions_select_org_staff"
  ON public.sessions FOR SELECT
  USING (
    exists (
      select 1
      from public.org_members owner
      where owner.user_id = sessions.user_id
        and owner.status = 'active'
        and owner.org_id in (
          select viewer.org_id
          from public.org_members viewer
          where viewer.user_id = auth.uid()
            and viewer.status = 'active'
            and viewer.system_role in ('admin','hr')
        )
    )
  );

DROP POLICY IF EXISTS "profiles_select_org_staff" ON public.profiles;
CREATE POLICY "profiles_select_org_staff"
  ON public.profiles FOR SELECT
  USING (
    exists (
      select 1
      from public.org_members target
      where target.user_id = profiles.id
        and target.status = 'active'
        and target.org_id in (
          select viewer.org_id
          from public.org_members viewer
          where viewer.user_id = auth.uid()
            and viewer.status = 'active'
            and viewer.system_role in ('admin','hr')
        )
    )
  );
