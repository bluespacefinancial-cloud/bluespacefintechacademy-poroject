import { useEffect, useState } from 'react'
import { Users, X, Edit3 } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '../components/ui/select'
import { api } from '../lib/backend'

const ROLE_COLORS = {
  Student: 'bg-blue-600 text-white font-semibold border-transparent',
  Instructor: 'bg-emerald-600 text-white font-semibold border-transparent',
  Partner: 'bg-purple-600 text-white font-semibold border-transparent',
  Administrator: 'bg-slate-700 text-white font-semibold border-transparent',
}

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterActive, setFilterActive] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await api
        .from('users')
        .select('id, name, email, type, is_active, avatar, created_at, last_login_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error loading users:', err)
      setError(err.message || 'Unable to load users')
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = filterRole === 'all' || u.type === filterRole
    const matchesActive = filterActive === 'all' || (u.is_active === 1) === (filterActive === 'active')
    return matchesSearch && matchesRole && matchesActive
  })

  const startEdit = (user) => {
    setEditForm({
      name: user.name,
      email: user.email,
      type: user.type,
      is_active: user.is_active === 1,
    })
    setEditingId(user.id)
    setError('')
    setMessage('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
    setError('')
    setMessage('')
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    setSaving(editingId)
    setError('')
    try {
      const { error: updateError } = await api
        .from('users')
        .update({
          name: editForm.name,
          email: editForm.email,
          type: editForm.type,
          is_active: editForm.is_active ? 1 : 0,
        })
        .eq('id', editingId)
      if (updateError) throw updateError
      setMessage('User updated')
      setEditingId(null)
      await loadUsers()
    } catch (saveError) {
      setError(saveError.message || 'Unable to update user')
    } finally {
      setSaving(null)
    }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return
    try {
      const { error: delError } = await api.from('users').delete().eq('id', id)
      if (delError) throw delError
      setMessage('User deleted')
      await loadUsers()
    } catch (delError) {
      setError(delError.message || 'Unable to delete user')
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">User Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage academy user accounts, roles and activation status
            </p>
          </div>
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</span>
          <Select value={filterRole} onValueChange={(value) => setFilterRole(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Student">Student</SelectItem>
              <SelectItem value="Instructor">Instructor</SelectItem>
              <SelectItem value="Partner">Partner</SelectItem>
              <SelectItem value="Administrator">Administrator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
          <Select value={filterActive} onValueChange={(value) => setFilterActive(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Users</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {users.filter((u) => u.is_active === 1).length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {users.filter((u) => u.is_active !== 1).length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inactive</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={32} className="mx-auto mb-3 opacity-50" />
            <p>No users found</p>
          </div>
        ) :
          filtered.map((user) => (
            <Card
              key={user.id}
              className={`cursor-pointer hover:border-brand-200 transition-colors duration-150 ${editingId === user.id ? 'bg-brand-50' : ''}`}
            >
              {editingId === user.id ? (
                <>
                  <td colSpan={5} className="p-4">
                    <Card>
                      <CardContent className="p-4">
                        <form onSubmit={saveEdit} className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-4">
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Name</label>
                              <Input type="text" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Email</label>
                              <Input type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Role</label>
                              <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={editForm.type} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Student">Student</SelectItem>
                                  <SelectItem value="Instructor">Instructor</SelectItem>
                                  <SelectItem value="Partner">Partner</SelectItem>
                                  <SelectItem value="Administrator">Administrator</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-end">
                              <label className="text-xs font-medium text-deep-600 mr-2">Active</label>
                              <Select value={String(editForm.is_active)} onValueChange={(v) => setEditForm({ ...editForm, is_active: v === 'true' })}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={editForm.is_active ? 'Active' : 'Inactive'} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Active</SelectItem>
                                  <SelectItem value="false">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-2">
                            <Button type="submit" disabled={saving === user.id}>{saving === user.id ? 'Saving...' : 'Save'}</Button>
                            <Button variant="outline" type="button" onClick={cancelEdit}>Cancel</Button>
                            <Button variant="destructive" type="button" onClick={() => deleteUser(user.id)}>Delete</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </td>
                </>
              )
              : (
                <>
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600 shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm">{user.name}</CardTitle>
                        <CardDescription className="text-[10px]">{user.email}</CardDescription>
                      </div>
                    </div>
                    <Badge className={ROLE_COLORS[user.type] || 'text-gray-600'}>
                      {user.type}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Status</span>
                        <Badge variant={user.is_active === 1 ? 'solidEmerald' : 'solidRose'} className="text-[10px] font-bold">
                          {user.is_active === 1 ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Last Login</span>
                        <span className="text-xs text-gray-600">{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between pt-3">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); startEdit(user) }}>
                      <Edit3 size={12} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); deleteUser(user.id) }}>
                      <X size={12} />
                    </Button>
                  </CardFooter>
                </>
              )}
            </Card>
          ))}
      </div>
    </div>
  )
}
