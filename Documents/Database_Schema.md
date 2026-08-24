# Database Schema

## profiles
Stores user profile information. A row is created by the backend on signup
(`POST /auth/signup`) or OAuth backfill (`POST /auth/oauth/profile`) using the
service-role key — the frontend never creates it directly.

| Column       | Type      | Description              |
|--------------|-----------|--------------------------|
| id           | uuid      | Primary key (matches Supabase auth.users) |
| role         | text      | User role (default: "student") |
| created_at   | timestamp | Auto-generated creation timestamp |
| first_name   | text      | User's first name |
| last_name    | text      | User's last name |

User preferences (`default_difficulty`, `default_archetype`, `interrupts`,
`harsh_feedback`) live in Supabase **auth metadata** (`auth.users.raw_user_meta_data`),
not in `profiles`.

---

## sessions
Stores simulation session data.

| Column            | Type      | Description |
|-------------------|-----------|-------------|
| id                | uuid      | Primary key |
| user_id           | uuid      | Foreign key to profiles.id |
| scenario          | text      | Interview type (e.g. "Technical", "Behavioral") |
| context           | text      | Role + difficulty description (e.g. "Design · Senior level") |
| personality       | text      | AI archetype (e.g. "corporate", "aggressive") |
| brutal_mode       | boolean   | Enables brutal honesty mode for senior difficulty |
| current_mood      | integer   | Current AI mood (1–10) |
| mood_timeline     | integer[] | Ordered list of mood values across the conversation |
| history           | jsonb     | Conversation history array [{role, parts}] |
| evaluation_report | jsonb     | Evaluation result from /evaluate endpoint (nullable) |
| created_at        | timestamp | Auto-generated creation timestamp |

---

## Table Relationships

```
organizations
  ↓ (org_id)
org_members ──── profiles (via user_id)
  ↓ (user_id)
sessions (owned by profiles.id)
```

- `sessions` stores the full conversation history and evaluation reports as JSON blobs — no separate messages, evaluations, or mood_transitions tables are needed.
- `profiles.id` matches `auth.users.id`; `sessions.user_id` references it.

---

## organizations (0002)
One row per company/team.

| Column      | Type      | Description |
|-------------|-----------|-------------|
| id          | uuid      | Primary key (also used as the join invite code) |
| name        | text      | Organization name |
| settings    | jsonb     | Reserved for org-level config (default `{}`) |
| created_at  | timestamptz | Auto-generated creation timestamp |

## org_members (0002)
Who belongs to which organization, with a **system role** (unrelated to `profiles.role`, which stays the user's *experience level*).

| Column       | Type      | Description |
|--------------|-----------|-------------|
| id           | uuid      | Primary key |
| org_id       | uuid      | FK → organizations.id (cascade delete) |
| user_id      | uuid      | FK → auth.users.id (cascade delete) |
| system_role  | text      | `admin` \| `hr` \| `member` (default `member`) |
| status       | text      | `active` \| `invited` (default `active`) |
| invited_by   | uuid      | FK → auth.users.id (who sent the invite, nullable) |
| created_at   | timestamptz | Auto-generated creation timestamp |

Unique constraint on `(org_id, user_id)`. All membership writes go through the backend (service key); the frontend only reads.

---

## Row Level Security

Both tables have RLS **enabled** and every policy is scoped to the row owner (`auth.uid()`). See `supabase/migrations/0001_enable_rls.sql` (owner-scoped) and `supabase/migrations/0002_multi_tenant_orgs.sql` (org-scoped) for the canonical, idempotent SQL.

> **Apply them once:** paste both migrations into Supabase Dashboard → SQL Editor and run them. They are idempotent, so re-running is safe.

**Migration 0001 — owner-scoped:**

| Table | Policy | Operation | Allow when |
|-------|--------|-----------|------------|
| profiles | `profiles_select_own` | SELECT | `auth.uid() = id` |
| profiles | `profiles_insert_own` | INSERT | `auth.uid() = id` |
| profiles | `profiles_update_own` | UPDATE | `auth.uid() = id` |
| sessions | `sessions_select_own` | SELECT | `auth.uid() = user_id` |
| sessions | `sessions_insert_own` | INSERT | `auth.uid() = user_id` |
| sessions | `sessions_update_own` | UPDATE | `auth.uid() = user_id` |
| sessions | `sessions_delete_own` | DELETE | `auth.uid() = user_id` |

**Migration 0002 — org-scoped (added on top; policies OR together):**

| Table | Policy | Operation | Allow when |
|-------|--------|-----------|------------|
| sessions | `sessions_select_org_staff` | SELECT | row owner is an active member of the same org as an active `admin`/`hr` member |
| profiles | `profiles_select_org_staff` | SELECT | same-org active `admin`/`hr` member |
| organizations | `orgs_select_member` | SELECT | current user is an active member |
| organizations | `orgs_update_admin` | UPDATE | current user is the org admin |
| org_members | `members_select_org` | SELECT | own row, or active member of the org |
| org_members | `members_insert_admin` | INSERT | current user is the org admin |
| org_members | `members_update_admin` | UPDATE | org admin, or the user themselves (role locked to `member`) |
| org_members | `members_delete_admin` | DELETE | current user is the org admin |

Helper functions `public.user_in_org(org_id)` and `public.user_is_admin(org_id)` (SECURITY DEFINER) keep the policies concise and recursion-free.

Notes:
- The Flask backend uses the **service-role key** (`sb_secret_...`), which bypasses RLS — all server-side writes are unaffected.
- The frontend reads/writes with the publishable key + the signed-in user's JWT, so `auth.uid()` resolves to the current user.
- The frontend never writes `sessions` directly; those policies exist for completeness/parity.
- Duration (`duration_sec`) is stored inside the `evaluation_report` jsonb blob — there is no dedicated column.
