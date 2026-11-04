import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase'

const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`

async function edgeFetch(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${FUNCTIONS_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json()
  if (!res.ok) {
    throw { response: { status: res.status, data } }
  }
  return data
}

// Auth
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const userData = {
    ...data.user,
    ...(data.user.user_metadata || {}),
  }
  localStorage.setItem('token', data.session.access_token)
  localStorage.setItem('user', JSON.stringify(userData))
  return userData
}

export const logout = async () => {
  await supabase.auth.signOut()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

// Courses / Modules
export const getModules = async (cohortId) => {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('cohort_id', cohortId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// Lessons
export const getLessons = async (moduleId) => {
  return edgeFetch(`/lessons?module_id=${moduleId}`)
}

export const getLessonProgress = async (lessonId) => {
  return edgeFetch(`/lessons/progress?lesson_id=${lessonId}`)
}

export const saveLessonProgress = async (lessonId, progressData) => {
  return edgeFetch('/lessons/progress', {
    method: 'POST',
    body: JSON.stringify({ ...progressData, lesson_id: lessonId }),
  })
}

// Labs & Assessments
export const getLabs = async (moduleId) => {
  const { data, error } = await supabase
    .from('labs')
    .select('*')
    .eq('module_id', moduleId)
  if (error) throw error
  return data
}

export const getSubmissions = async (userId) => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return data
}

export const submitLab = async (labId, contentUrl, squadId) => {
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      user_id: (await supabase.auth.getUser()).data.user.id,
      lab_id: labId,
      content_url: contentUrl,
      squad_id: squadId,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Cohorts (Admin)
export const getCohorts = async () => {
  const { data, error } = await supabase
    .from('cohorts')
    .select('*')
    .order('start_date', { ascending: true })
  if (error) throw error
  return data
}

export const createCohort = async (cohortData) => {
  const { data, error } = await supabase
    .from('cohorts')
    .insert(cohortData)
    .select()
    .single()
  if (error) throw error
  return data
}

// Enrolments (Admin)
export const getEnrolments = async () => {
  const { data, error } = await supabase
    .from('enrolments')
    .select(`
      *,
      users (name, email, type),
      cohorts (name, start_date, end_date)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Use Cases
export const getUseCases = async () => {
  const { data, error } = await supabase
    .from('use_cases')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// Assign Use Case to Squad (Admin)
export const assignUseCase = async (useCaseId, squadId) => {
  const { data, error } = await supabase
    .from('use_cases')
    .update({ squad_id: squadId, status: 'assigned' })
    .eq('id', useCaseId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Placements
export const getPlacements = async () => {
  const { data, error } = await supabase
    .from('placements')
    .select(`
      *,
      users (name, email, type, track)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const createPlacement = async (placementData) => {
  const { data, error } = await supabase
    .from('placements')
    .insert(placementData)
    .select()
    .single()
  if (error) throw error
  return data
}

// Certifications
export const getCertifications = async (userId) => {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Skills Profile
export const saveSkillsProfile = async (profileData) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      skills_profile: profileData.skills,
      role_preferences: profileData.rolePreferences,
      updated_at: new Date().toISOString(),
    })
    .eq('id', (await supabase.auth.getUser()).data.user.id)
    .select()
  if (error) throw error
  return data
}

// Reports (Admin)
export const getCohortReports = async () => {
  return edgeFetch('/reports/cohorts')
}

export const getDomainReports = async () => {
  return edgeFetch('/reports/domains')
}

export const getPlacementReports = async () => {
  return edgeFetch('/reports/placement')
}

export const exportReport = async (reportType) => {
  return edgeFetch('/reports/export', {
    method: 'POST',
    body: JSON.stringify({ report_type: reportType }),
  })
}

// Supabase client for direct access
export { supabase }
export { SUPABASE_URL, SUPABASE_ANON_KEY }
