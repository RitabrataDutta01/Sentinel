import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getProfile, saveProfile } from '../lib/supabase'
import { signOut } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { Shield, User, Mail, Settings as SettingsIcon, LogOut, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../lib/useTheme'
import { cn } from '../lib/utils'

const PERSONAS = [
  'Consulting Style',
  'Warm & Collaborative',
  'Professional / Detached',
  'Aggressive / Confrontational',
  'Defensive / Evasive',
  'Manipulative / Political',
]

const ROLES = ['Student', 'Early career', 'Mid-level', 'Senior', 'Manager']

function SectionHeader({ title, icon: Icon, description, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon className="h-5 w-5 text-accent" aria-hidden="true" />}
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {description && <p className="text-sm text-muted mb-4">{description}</p>}
      {children}
    </div>
  )
}

function FormField({ label, description, children, htmlFor }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {description && <p className="text-xs text-muted">{description}</p>}
      {children}
    </div>
  )
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Loading settings…
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-12 max-w-3xl">
      <div className="flex flex-col gap-8">
        <SectionHeader
          title="Profile"
          icon={User}
          description="Your personal information and display name"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First name" htmlFor="firstName">
              <Input
                id="firstName"
                value={profile?.first_name ?? ''}
                onChange={(e) => update('first_name', e.target.value)}
                className="border border-border bg-surface px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </FormField>
            <FormField label="Last name" htmlFor="lastName">
              <Input
                id="lastName"
                value={profile?.last_name ?? ''}
                onChange={(e) => update('last_name', e.target.value)}
                className="border border-border bg-surface px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </FormField>
            <FormField label="Experience level" htmlFor="role">
              <select
                id="role"
                value={profile?.role ?? 'Student'}
                onChange={(e) => update('role', e.target.value)}
                className="border border-border bg-surface px-3 py-2.5 rounded-lg text-sm text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="border border-border/50 bg-surface/50 px-3 py-2.5 rounded-lg text-sm text-muted"
              />
            </FormField>
          </div>
        </SectionHeader>

        <SectionHeader
          title="Default session"
          icon={SettingsIcon}
          description="How new sessions are configured by default"
        >
          <div className="flex flex-col gap-5">
            <FormField label="Default interviewer persona" htmlFor="persona">
              <select
                id="persona"
                value={profile?.default_archetype || PERSONAS[0]}
                onChange={(e) => update('default_archetype', e.target.value)}
                className="border border-border bg-surface px-3 py-2.5 rounded-lg text-sm text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              >
                {PERSONAS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Brutal honesty by default"
              description="New sessions start with brutal mode toggled on"
            >
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-foreground">Brutal honesty mode</p>
                  <p className="text-xs text-muted">The counterpart calls out vagueness aggressively.</p>
                </div>
                <Switch
                  checked={!!profile?.harsh_feedback}
                  onCheckedChange={(v) => update('harsh_feedback', v)}
                  id="brutal-toggle"
                />
              </label>
            </FormField>
          </div>
        </SectionHeader>

        <SectionHeader
          title="Appearance"
          icon={Sun}
          description="Choose how Sentinel looks"
        >
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              {[{ value: 'dark', label: 'Dark', icon: Moon }, { value: 'light', label: 'Light', icon: Sun }].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium transition-all',
                    theme === value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface hover:bg-surface-raised text-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </SectionHeader>

        <SectionHeader
          title="Account"
          icon={Shield}
          description="Manage your account and sign out"
        >
          <Button
            variant="outline"
            onClick={() => signOut().finally(() => (window.location.href = '/'))}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </SectionHeader>

        <div className="pt-4 border-t border-border">
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? 'Saving…' : 'Save preferences'}
          </Button>
        </div>
      </div>
    </div>
  )
}