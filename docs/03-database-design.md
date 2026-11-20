# Part 03: Database Design

## Schema Overview

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   organizations  │       │   org_members    │       │     profiles     │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │◄──────│ org_id (FK)      │       │ id (PK)          │
│ name             │       │ user_id (FK)     │       │ role             │
│ settings (jsonb) │       │ system_role      │       │ created_at       │
│ created_at       │       │ status           │       │ first_name       │
└──────────────────┘       │ invited_by       │       │ last_name        │
                           │ created_at       │       └────────┬─────────┘
                           └────────┬─────────┘                │
                                    │                          │
                                    ▼                          │
                           ┌──────────────────┐                │
                           │     sessions     │                │
                           ├──────────────────┤                │
                           │ id (PK)          │                │
                           │ user_id (FK)     │────────────────┘
                           │ scenario         │
                           │ context          │
                           │ personality      │
                           │ brutal_mode      │
                           │ current_mood     │
                           │ mood_timeline    │
                           │ history (jsonb)  │
                           │ evaluation_report│
                           │ created_at       │
                           └──────────────────┘
```

---

## 📋 Table Definitions

### profiles
Stores user profile information. Created by backend on signup or OAuth backfill.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, FK → auth.users.id | Matches Supabase auth user |
| `role` | text | DEFAULT 'student' | User's experience level |
| `created_at` | timestamp | DEFAULT now() | Auto-generated |
| `first_name` | text | nullable | User's first name |
| `last_name` | text | nullable | User's last name |

> **Note:** User preferences (`default_difficulty`, `default_archetype`, `interrupts`, `harsh_feedback`) live in Supabase **auth metadata** (`auth.users.raw_user_meta_data`), not in this table.

---

### sessions
Stores complete simulation session data as JSON blobs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Primary key |
| `user_id` | uuid | FK → profiles.id | Session owner |
| `scenario` | text | NOT NULL | Interview type |
| `context` | text | nullable | Role + difficulty |
| `personality` | text | NOT NULL | AI archetype |
| `brutal_mode` | boolean | DEFAULT false | Brutal honesty mode |
| `current_mood` | integer | DEFAULT 5 | AI mood (1-10) |
| `mood_timeline` | integer[] | DEFAULT '{5}' | Mood history |
| `history` | jsonb | DEFAULT '[]' | Conversation [{role, parts}] |
| `evaluation_report` | jsonb | nullable | Full evaluation JSON |
| `created_at` | timestamp | DEFAULT now() | Creation time |

> **Note:** `duration_sec` is stored inside `evaluation_report` JSON blob — no dedicated column.

---

### organizations (Migration 0002)
One row per company/team.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Also used as join invite code |
| `name` | text | NOT NULL | Organization name |
| `settings` | jsonb | DEFAULT '{}' | Reserved for future config |
| `created_at` | timestamptz | DEFAULT now() | Creation time |

---

### org_members (Migration 0002)
Multi-tenant membership with system roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Primary key |
| `org_id` | uuid | FK → organizations.id (CASCADE) | Organization |
| `user_id` | uuid | FK → auth.users.id (CASCADE) | User |
| `system_role` | text | CHECK IN ('admin','hr','member') DEFAULT 'member' | System role |
| `status` | text | CHECK IN ('active','invited') DEFAULT 'active' | Membership status |
| `invited_by` | uuid | FK → auth.users.id (nullable) | Inviter |
| `created_at` | timestamptz | DEFAULT now() | Creation time |

**Constraints:**
- Unique constraint on `(org_id, user_id)`
- All membership writes go through backend (service key)
- Frontend only reads

---

## 🔗 Relationships

```
organizations (1) ──────< (N) org_members (N) >────── (1) profiles
                                              │
                                              │ (1) sessions (N)
                                              ▼
                                        sessions
```

- `profiles.id` = `auth.users.id` (1:1)
- `sessions.user_id` → `profiles.id` (1:N)
- `org_members.org_id` → `organizations.id` (N:1)
- `org_members.user_id` → `auth.users.id` (N:1)

---

## 🔐 Row Level Security (RLS)

All tables have **RLS ENABLED**. Policies are in two migrations:

### Migration 0001: Owner-Scoped Policies
| Table | Policy | Operation | Condition |
|-------|--------|-----------|-----------|
| profiles | `profiles_select_own` | SELECT | `auth.uid() = id` |
| profiles | `profiles_insert_own` | INSERT | `auth.uid() = id` |
| profiles | `profiles_update_own` | UPDATE | `auth.uid() = id` |
| sessions | `sessions_select_own` | SELECT | `auth.uid() = user_id` |
| sessions | `sessions_insert_own` | INSERT | `auth.uid() = user_id` |
| sessions | `sessions_update_own` | UPDATE | `auth.uid() = user_id` |
| sessions | `sessions_delete_own` | DELETE | `auth.uid() = user_id` |

### Migration 0002: Org-Scoped Policies (OR with 0001)
| Table | Policy | Operation | Condition |
|-------|--------|-----------|-----------|
| sessions | `sessions_select_org_staff` | SELECT | Owner is active member of same org as active admin/hr |
| profiles | `profiles_select_org_staff` | SELECT | Same-org active admin/hr |
| organizations | `orgs_select_member` | SELECT | Current user is active member |
| organizations | `orgs_update_admin` | UPDATE | Current user is org admin |
| org_members | `members_select_org` | SELECT | Own row OR active member of org |
| org_members | `members_insert_admin` | INSERT | Current user is org admin |
| org_members | `members_update_admin` | UPDATE | Org admin, or user themselves (role locked to member) |
| org_members | `members_delete_admin` | DELETE | Current user is org admin |

---

## 🛠️ Helper Functions

```sql
-- Check if user is active member of org
CREATE FUNCTION public.user_in_org(org_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = $1 AND user_id = auth.uid() AND status = 'active'
  );
$$;

-- Check if user is admin of org
CREATE FUNCTION public.user_is_admin(org_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = $1 AND user_id = auth.uid() AND status = 'active' AND system_role = 'admin'
  );
$$;
```

**SECURITY DEFINER** ensures functions run with definer's privileges, avoiding recursion in policies.

---

## 🔄 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **JSONB for history/evaluation** | Flexible schema; full conversation + evaluation in one row |
| **mood_timeline as int[]** | Compact; efficient for timeline charts |
| **No separate messages table** | Reduces joins; session = complete conversation unit |
| **duration_sec in JSON** | Avoids ALTER TABLE; embedded in evaluation_report |
| **Org ID = Invite code** | Simple sharing; UUID is globally unique |
| **System role ≠ Profile role** | System role = org permissions; Profile role = experience level |

---

## 📝 Migrations

### 0001_enable_rls.sql
- Enables RLS on `profiles`, `sessions`
- Creates owner-scoped policies
- Idempotent (safe to re-run)

### 0002_multi_tenant_orgs.sql
- Creates `organizations`, `org_members`
- Creates org-scoped policies (OR with 0001)
- Creates helper functions `user_in_org()`, `user_is_admin()`
- Idempotent (safe to re-run)

---

## 🚀 Applying Migrations

```bash
# In Supabase Dashboard → SQL Editor:
# 1. Paste 0001_enable_rls.sql → Run
# 2. Paste 0002_multi_tenant_orgs.sql → Run

# Both are idempotent — safe to re-run
```

---

## 📊 Data Dictionary Summary

| Table | Rows (est.) | Size | Access Pattern |
|-------|-------------|------|----------------|
| profiles | ~Users | Small | By user_id (PK) |
| sessions | ~Sessions/User | Medium | By user_id + created_at DESC |
| organizations | ~Orgs | Small | By org_id (PK) |
| org_members | ~Members/Org | Small | By org_id + user_id (unique) |

---

*Next: [API Specification →](./04-api-specification.md)*