import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getProfile, saveProfile } from '../lib/supabase'
import { signOut } from '../lib/supabase'
import PageShell from '../components/layout/PageShell'
import PageHero from '../components/layout/PageHero'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'

const PERSONAS = [
  'Consulting Style',
  'Warm & Collaborative',
  'Professional / Detached',
  'Aggressive / Confrontational',
  'Defensive / Evasive',
  'Manipulative / Political',
]

const ROLES = ['Student', 'Early career', 'Mid-level', 'Senior', 'Manager']

export default function Settings() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((p) => !cancelled && setProfile(p))
      .catch(() => !cancelled && setProfile(null))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  function update(key, value) {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveProfile(profile)
      toast.success('Profile saved')
    } catch (err) {
      toast.error(err.message || 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageShell className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Loading settings…
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell className="px-6 py-12">
      <div className="w-full">
        <PageHero
          eyebrow="Settings"
          title="Preferences"
          subtitle="How Sentinel shows up, and how your default sessions are tuned."
        />

        <div className="flex flex-col gap-8">
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-sm font-medium text-muted mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={profile?.first_name ?? ''}
                  onChange={(e) => update('first_name', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={profile?.last_name ?? ''}
                  onChange={(e) => update('last_name', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="role">Experience level</Label>
                <select
                  id="role"
                  value={profile?.role ?? 'Student'}
                  onChange={(e) => update('role', e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent transition-colors"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email ?? ''} disabled />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-sm font-medium text-muted mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-mood-neutral" /> Default session
            </h2>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="persona">Default interviewer persona</Label>
                <select
                  id="persona"
                  value={profile?.default_archetype || PERSONAS[0]}
                  onChange={(e) => update('default_archetype', e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent transition-colors"
                >
                  {PERSONAS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-primary">Brutal honesty by default</p>
                  <p className="text-xs text-muted">New sessions start with brutal mode toggled on.</p>
                </div>
                <Switch checked={!!profile?.harsh_feedback} onCheckedChange={(v) => update('harsh_feedback', v)} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-sm font-medium text-muted mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-mood-cold" /> Account
            </h2>
            <Button variant="outline" onClick={() => signOut().finally(() => (window.location.href = '/'))}>
              Sign out
            </Button>
          </section>

          <Button onClick={handleSave} disabled={saving} className="self-start">
            {saving ? 'Saving…' : 'Save preferences'}
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
