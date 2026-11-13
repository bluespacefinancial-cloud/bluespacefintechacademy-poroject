import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Building2,
  Globe,
  Loader2,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import { Breadcrumb } from '../components/ui/breadcrumb'
import MediaUpload from '../components/MediaUpload'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'
import toast from 'react-hot-toast'

const STATUS_LABELS = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

const emptyForm = {
  name: '',
  description: '',
  website: '',
  logo_url: '',
}

function normaliseWebsite(value) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export default function PartnerOrganisation() {
  const [partner, setPartner] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const profile = await getCurrentProfile()
      if (!profile) throw new Error('Your profile could not be found')
      if (!profile.partner_id) {
        throw new Error('Your account is not linked to a partner organisation')
      }

      const { data, error: loadError } = await api
        .from('partners')
        .select('id, name, slug, description, website, logo_url, status, created_at, updated_at')
        .eq('id', profile.partner_id)
        .single()
      if (loadError) throw loadError
      if (!data) throw new Error('Your organisation could not be found')

      if (!cancelled) {
        setPartner(data)
        setForm({
          name: data.name || '',
          description: data.description || '',
          website: data.website || '',
          logo_url: data.logo_url || '',
        })
      }
    }

    load()
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || 'Unable to load your organisation')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!partner) return

    if (!form.name.trim()) {
      setError('Organisation name is required')
      return
    }

    setSaving(true)
    const { data, error: saveError } = await api
      .from('partners')
      .update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        website: normaliseWebsite(form.website) || null,
        logo_url: form.logo_url || null,
      })
      .eq('id', partner.id)
      .select('id, name, slug, description, website, logo_url, status, created_at, updated_at')
      .single()
    setSaving(false)

    if (saveError) {
      setError(saveError.message || 'Your organisation profile could not be saved')
      toast.error('Could not save organisation profile')
      return
    }

    if (data) {
      setPartner(data)
      setForm({
        name: data.name || '',
        description: data.description || '',
        website: data.website || '',
        logo_url: data.logo_url || '',
      })
    }
    setError('')
    toast.success('Organisation profile saved')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        Loading organisation…
      </div>
    )
  }

  if (!partner) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-semibold">Unable to load your organisation</p>
        <p className="mt-1 text-xs">{error || 'Your account is not linked to a partner organisation.'}</p>
      </div>
    )
  }

  const statusLabel = STATUS_LABELS[partner.status] || partner.status

  return (
    <div className="w-full space-y-6">
      <Breadcrumb items={[{ to: '/dashboard', label: 'Dashboard' }, { label: 'Organisation Profile' }]} />

      <DashboardHeader
        dataTour="partner-organisation-header"
        title="Organisation profile"
        subtitle={`How ${partner.name} appears to fellows, reviewers and the academy.`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 size={18} className="text-deep-600" aria-hidden="true" />
              Public details
            </CardTitle>
            <CardDescription>
              Keep the name, summary and logo up to date. Changes are visible as soon as you save them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="organisation-name" className="mb-1 block text-xs font-semibold text-foreground">
                  Organisation name
                </label>
                <Input
                  id="organisation-name"
                  value={form.name}
                  onChange={setField('name')}
                  maxLength={120}
                  required
                />
              </div>

              <div>
                <label htmlFor="organisation-website" className="mb-1 block text-xs font-semibold text-foreground">
                  Website
                </label>
                <div className="relative">
                  <Globe
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                  <Input
                    id="organisation-website"
                    value={form.website}
                    onChange={setField('website')}
                    placeholder="https://example.com"
                    className="pl-9"
                    inputMode="url"
                  />
                </div>
                <p className="mt-1 text-[10px] text-gray-500">Enter a domain or full URL. We add https:// when it is missing.</p>
              </div>

              <div>
                <label htmlFor="organisation-description" className="mb-1 block text-xs font-semibold text-foreground">
                  About the organisation
                </label>
                <Textarea
                  id="organisation-description"
                  value={form.description}
                  onChange={setField('description')}
                  rows={5}
                  maxLength={2000}
                  placeholder="Describe your organisation, the fintech problems you work on and the learners you support."
                />
                <p className="mt-1 text-right text-[10px] text-gray-500">
                  {form.description.length}/2000
                </p>
              </div>

              <div>
                <MediaUpload
                  kind="image"
                  label="Organisation logo"
                  value={form.logo_url}
                  helper="Square or wide, transparent PNG works best"
                  onUploaded={(asset) => setForm((current) => ({ ...current, logo_url: asset.url }))}
                  onClear={() => setForm((current) => ({ ...current, logo_url: '' }))}
                />
              </div>

              {error && (
                <p role="alert" className="flex items-start gap-1.5 text-xs text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <p className="text-[11px] text-gray-500">
                  Last saved{' '}
                  {partner.updated_at ? new Date(partner.updated_at).toLocaleString() : 'just now'}
                </p>
                <Button type="submit" disabled={saving} className="bg-deep-600 text-white hover:bg-deep-700">
                  {saving ? (
                    <Loader2 size={14} className="mr-1.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save size={14} className="mr-1.5" aria-hidden="true" />
                  )}
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck size={18} className="text-deep-600" aria-hidden="true" />
              Academy record
            </CardTitle>
            <CardDescription>These fields are managed by the academy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-gray-500">Status</span>
              <Badge variant={partner.status === 'approved' ? 'secondary' : 'outline'} className="capitalize">
                {statusLabel}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500">Public slug</p>
              <p className="mt-1 break-all rounded-md bg-gray-50 px-2.5 py-1.5 font-mono text-xs text-gray-700">
                {partner.slug}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="mt-1 text-xs text-gray-700">
                {partner.created_at ? new Date(partner.created_at).toLocaleDateString() : '—'}
              </p>
            </div>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
              Review status, approval and the public slug are controlled by the academy. Contact your
              programme lead if any of them look wrong.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
