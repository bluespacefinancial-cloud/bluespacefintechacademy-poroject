/**
 * Notifications store a machine-ish `type` and a human `data` string. These
 * helpers keep the wording and the destination in one place so the bell menu
 * and the full notifications page cannot drift apart.
 */

/**
 * Turn `module_unlocked` into `Module unlocked`, while leaving hand-written
 * labels such as `New submission` untouched.
 */
export function humaniseNotificationType(type) {
  if (!type) return 'Update'
  const text = String(type).replace(/[_-]+/g, ' ').trim()
  if (/[A-Z]/.test(String(type))) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const ROUTE_RULES = [
  { tokens: ['partner'], Student: '/partner-catalog', Partner: '/partner-courses', Administrator: '/partner-course-review' },
  { tokens: ['clinic'], Student: '/mentor-clinics', Instructor: '/mentor-clinics', Administrator: '/mentor-clinics' },
  { tokens: ['certificate'], Student: '/certificates', Instructor: '/certificates', Administrator: '/certificates' },
  { tokens: ['squad'], Student: '/my-squad', Instructor: '/squads', Administrator: '/squads' },
  { tokens: ['project', 'deliverable'], Student: '/my-squad', Instructor: '/project-review', Administrator: '/project-review' },
  { tokens: ['module'], Student: '/my-learning', Instructor: '/my-modules', Administrator: '/curriculum' },
  { tokens: ['announcement'], Student: '/announcements', Instructor: '/announcements', Administrator: '/announcements' },
  { tokens: ['grade', 'graded', 'feedback', 'submission', 'lab'], Student: '/lab-workspace', Instructor: '/grading', Administrator: '/grading' },
  { tokens: ['live', 'class'], Student: '/live-classes', Instructor: '/live-classes', Administrator: '/live-classes' },
]

/**
 * Resolve the destination for a notification without guessing from substrings
 * in the wrong order (`live_projects` used to open Live Classes).
 */
export function notificationRoute(type, role = 'Student') {
  const normalised = String(type || '').toLowerCase()
  for (const rule of ROUTE_RULES) {
    if (rule.tokens.some((token) => normalised.includes(token))) {
      return rule[role] || rule.Student || '/notifications'
    }
  }
  return '/notifications'
}
