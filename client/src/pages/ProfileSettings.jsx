import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/profile'

const ROLE_CONFIG = {
  Student: { label: 'Student Fellow', color: 'bg-brand-50 text-brand-700 border-brand-100' },
  Instructor: { label: 'Instructor', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  Partner: { label: 'Partner Agency', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  Administrator: { label: 'Academy Administrator', color: 'bg-slate-50 text-slate-700 border-slate-100' },
}

export default function ProfileSettings() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const p = await getCurrentProfile()
      if (!p) {
        navigate('/student-login')
        return
      }
      setProfile(p)
      setEditForm({
        name: p.name || '',
        email: p.email || '',
        phone: p.phone || '',
        avatar: p.avatar || '',
      })
    } catch (err) {
      setError(err.message || 'Unable to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const updates = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        avatar: editForm.avatar,
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', profile.id)

      if (updateError) throw updateError

      setMessage('Profile updated successfully')
      setEditing(false)
      setProfile({ ...profile, ...updates })
    } catch (updateError) {
      setError(updateError.message || 'Unable to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New password and confirmation do not match')
      setSaving(false)
      return
    }

    if (passwordForm.new_password.length < 8) {
      setError('Password must be at least 8 characters')
      setSaving(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.new_password,
      })

      if (updateError) throw updateError

      setMessage('Password updated successfully')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (updateError) {
      setError(updateError.message || 'Unable to update password')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading profile...</span>
        </div>
      </div>
    )
  }

  const roleConfig = ROLE_CONFIG[profile.type] || ROLE_CONFIG.Student

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Profile Settings</h1>
            <p className="text-sm text-gray-500">
              Manage your academy account and preferences
            </p>
          </div>
          <Button
            variant={editing ? 'outline' : 'default'}
            onClick={() => setEditing(!editing)}
            disabled={saving}
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {message && (
        <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-bold mb-2 shrink-0">
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>
              <h2 className="text-lg font-bold text-deep-600">{profile.name}</h2>
              <p className="text-sm text-gray-600 mb-3">{profile.email}</p>
              <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className={`text-xs font-medium ${profile.is_active === 1 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {profile.is_active === 1 ? 'Active' : 'Inactive'}
                </span>
                {profile.is_active === 1 ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">{editing ? 'Edit Profile' : 'Account Details'}</CardTitle>
            </CardHeader>
            <CardContent>
              {!editing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-deep-600 uppercase tracking-wider">Full Name</label>
                      <p className="text-sm text-gray-600">{profile.name}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-deep-600 uppercase tracking-wider">Email</label>
                      <p className="text-sm text-gray-600">{profile.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-deep-600 uppercase tracking-wider">Phone</label>
                    <p className="text-sm text-gray-600">{profile.phone || 'Not provided'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-deep-600 uppercase tracking-wider">Role</label>
                    <p className="text-sm text-gray-600">{roleConfig.label}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-deep-600 uppercase tracking-wider">Academy Status</label>
                    <p className={`text-sm ${profile.is_active === 1 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {profile.is_active === 1 ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEdit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-deep-600 uppercase tracking-wider">Full Name</label>
                      <Input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Full name"
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-deep-600 uppercase tracking-wider">Email</label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="Email address"
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-deep-600 uppercase tracking-wider">Phone</label>
                    <Input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Phone number"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-deep-600 uppercase tracking-wider">Avatar URL</label>
                    <Input
                      type="url"
                      value={editForm.avatar}
                      onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      disabled={saving}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" type="button" onClick={() => { setEditing(false); setEditForm({ name: profile.name, email: profile.email, phone: profile.phone, avatar: profile.avatar }); setError(''); setMessage('') }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-deep-600 uppercase tracking-wider">Current Password</label>
                  <Input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    placeholder="••••••••"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-deep-600 uppercase tracking-wider">New Password</label>
                  <Input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    placeholder="••••••••"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-deep-600 uppercase tracking-wider">Confirm Password</label>
                  <Input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    placeholder="••••••••"
                    disabled={saving}
                  />
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? 'Updating...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
