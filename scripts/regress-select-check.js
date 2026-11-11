function normalize(columns) {
  return String(columns).replace(/\s+/g, ' ').trim()
}

const gradingSelect = `
  id, user_id, lab_id, assessment_id, status, content_url, score, feedback, submitted_at,
  labs(title, max_score), assessments(title, max_score),
  users!submissions_user_id_fkey(name, email)
`
const enrolmentsSelect = `
  *,
  users (
    name,
    email
  ),
  cohorts (
    name
  ),
  squads (
    name
  )
`

const g = normalize(gradingSelect)
const e = normalize(enrolmentsSelect)

let failures = 0
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg)
    failures++
  } else {
    console.log('PASS:', msg)
  }
}

assert(!/\n/.test(g), 'grading select contains no newline')
assert(!/\n/.test(e), 'enrolments select contains no newline')
assert(g === g.trim(), 'grading select has no leading or trailing whitespace')
assert(e === e.trim(), 'enrolments select has no leading or trailing whitespace')
assert(!/\s{2,}/.test(g), 'grading select has no collapsed internal whitespace')
assert(!/\s{2,}/.test(e), 'enrolments select has no collapsed internal whitespace')
assert(g.includes('labs(title, max_score)'), 'grading keeps labs join')
assert(g.includes('assessments(title, max_score)'), 'grading keeps assessments join')
assert(g.includes('users!submissions_user_id_fkey(name, email)'), 'grading keeps users join')
assert(e.includes('users ( name, email )'), 'enrolments keeps users join')
assert(e.includes('cohorts ( name )'), 'enrolments keeps cohorts join')
assert(e.includes('squads ( name )'), 'enrolments keeps squads join')

console.log(failures === 0 ? 'REGRESSION CHECK PASSED' : failures + ' REGRESSION CHECK(S) FAILED')
process.exit(failures === 0 ? 0 : 1)
