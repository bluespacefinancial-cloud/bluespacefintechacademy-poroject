import { api } from './backend'

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]))

const CANONICAL_ORIGIN = 'https://bluespacefintechacademy.vercel.app'
const appOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
    return window.location.origin
  }
  return CANONICAL_ORIGIN
}
// Email clients (Gmail, Outlook, Apple Mail) need a globally accessible absolute HTTPS URL.
const logoUrl = () => `${CANONICAL_ORIGIN}/logo-dark.png`
const signInUrl = (role) => {
  const paths = { Student: '/student-login', Instructor: '/instructor-login', Partner: '/partner-login' }
  return `${appOrigin()}${paths[role] || '/student-login'}`
}

function emailLayout({ heading, greeting, content, actionLabel, actionUrl, preheader = heading }) {
  const safeActionUrl = actionUrl ? escapeHtml(actionUrl) : ''
  const action = actionLabel && safeActionUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 8px"><tr><td bgcolor="#0000ff" style="border-radius:5px"><a href="${safeActionUrl}" style="display:inline-block;padding:13px 20px;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none">${escapeHtml(actionLabel)}</a></td></tr></table>`
    : ''

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(heading)}</title></head><body style="margin:0;background:#f5f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fb;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px"><tr><td style="padding:26px 32px 20px;border-bottom:1px solid #e5e7eb"><img src="${escapeHtml(logoUrl())}" width="220" alt="BlueSPACE Financial Cloud" style="display:block;width:220px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none"></td></tr><tr><td style="padding:30px 32px 34px"><h1 style="margin:0 0 18px;color:#0000ff;font-size:24px;line-height:1.3">${escapeHtml(heading)}</h1><p style="margin:0 0 16px;font-size:15px;line-height:1.65">${greeting}</p>${content}${action}</td></tr><tr><td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e5e7eb;color:#64748b;font-size:12px;line-height:1.6">BlueSPACE Fintech Academy<br>Practical fintech learning through focused tracks and real project work.<br><a href="${escapeHtml(signInUrl())}" style="color:#0000ff">Visit your academy</a></td></tr></table></td></tr></table></body></html>`
}

function paragraph(text, style = 'color:#475569') {
  return `<p style="margin:0 0 14px;${style};font-size:15px;line-height:1.65">${text}</p>`
}

function makeEmail({ heading, name, message, actionLabel = 'Sign in to BlueSPACE', actionUrl = signInUrl(), preheader }) {
  const safeName = escapeHtml(name || 'there')
  const safeMessage = escapeHtml(message)
  return emailLayout({
    heading,
    greeting: `Hello ${safeName},`,
    content: paragraph(safeMessage),
    actionLabel,
    actionUrl,
    preheader,
  })
}

export const emailService = {
  async sendEmail(to, subject, htmlContent, textContent) {
    try {
      if (!api) throw new Error('Email delivery is not configured.')
      const { data, error } = await api.functions.invoke('email-service', {
        body: { to, subject, html: htmlContent, text: textContent },
      })
      if (error) {
        const response = await error.context?.clone?.().json?.().catch(() => null)
        throw new Error(response?.error || error.message || 'Email delivery failed')
      }
      return { success: true, data }
    } catch (err) {
      console.error('Email error:', err)
      return { success: false, error: err.message }
    }
  },

  async sendWelcomeEmail(email, name, role) {
    const safeRole = escapeHtml(role || 'academy')
    const message = role === 'Student'
      ? 'Your application is approved and your student account is active. Sign in to review your fellowship track, learning modules and cohort updates.'
      : role === 'Instructor'
        ? 'Your application is approved and your instructor account is active. Sign in to review your teaching assignments, cohort modules and learner submissions.'
        : role === 'Partner'
          ? 'Your application is approved and your partner account is active. Sign in to review your agency workspace and partner course tools.'
          : 'Your BlueSPACE account is ready. Sign in to continue.'
    return this.sendEmail(
      email,
      'Welcome to BlueSPACE Fintech Academy',
      makeEmail({ heading: 'Welcome to BlueSPACE', name, message, actionUrl: signInUrl(role), preheader: `${safeRole} account information` }),
      `Welcome ${name || 'to BlueSPACE'}. ${message}`,
    )
  },

  async sendCapstoneSubmittedEmail(email, studentName, track) {
    const safeTrack = escapeHtml(track || 'your fellowship')
    const message = `We received your ${safeTrack} capstone submission. The academy panel will review it and update your account when a decision is ready.`
    return this.sendEmail(email, 'Capstone submission received', makeEmail({ heading: 'Submission received', name: studentName, message, actionLabel: 'Open your dashboard' }), `Hello ${studentName || 'there'}. ${message}`)
  },

  async sendCertificationEmail(email, name, track, grade) {
    const safeTrack = escapeHtml(track || 'fellowship')
    const safeGrade = escapeHtml(grade ?? 'N/A')
    const message = `You have completed the ${safeTrack} track with a final grade of ${safeGrade}. Your certification is ready in your academy account.`
    return this.sendEmail(email, 'Your BlueSPACE certification is ready', emailLayout({ heading: 'Congratulations on your certification', greeting: `Hello ${escapeHtml(name || 'there')},`, content: paragraph(message), actionLabel: 'View your certification', actionUrl: `${appOrigin()}/certificates` }), `Congratulations ${name || 'there'}. ${message}`)
  },

  async sendAssignmentNotification(email, fellowName, assignmentName, courseName) {
    const safeCourse = escapeHtml(courseName || 'your course')
    const safeAssignment = escapeHtml(assignmentName || 'New assignment')
    const message = `A new assignment, ${safeAssignment}, is available in ${safeCourse}. Sign in to read the instructions and due date.`
    return this.sendEmail(email, 'New assignment available', makeEmail({ heading: 'New assignment', name: fellowName, message, actionLabel: 'View assignment' }), `Hello ${fellowName || 'there'}. ${message}`)
  },

  async sendPlacementNotification(email, fellowName, role, project) {
    const safeRole = escapeHtml(role || 'project role')
    const safeProject = escapeHtml(project || 'your new project')
    const message = `The academy team has matched you with the ${safeRole} opportunity on ${safeProject}. Sign in to review the placement details and next steps.`
    return this.sendEmail(email, 'A BlueSPACE placement match is ready', makeEmail({ heading: 'Placement match found', name: fellowName, message, actionLabel: 'Review placement' }), `Hello ${fellowName || 'there'}. ${message}`)
  },

  async sendApplicationStatusEmail(email, name, status, reason = '', role = 'Student') {
    const approved = status === 'approved'
    const heading = approved ? 'Your application is approved' : 'An update on your application'
    const message = approved
      ? `Your application to join BlueSPACE as a ${role.toLowerCase()} is approved. Your account is active. Sign in to access your ${role === 'Student' ? 'fellowship dashboard' : role === 'Instructor' ? 'teaching workspace' : 'partner workspace'}.`
      : `Your application was not approved at this time. ${reason || 'Please contact the academy team if you would like more information.'}`
    return this.sendEmail(
      email,
      `BlueSPACE application update: ${approved ? 'approved' : 'not approved'}`,
      makeEmail({ heading, name, message, actionLabel: approved ? 'Sign in to BlueSPACE' : 'Visit BlueSPACE', actionUrl: signInUrl(role), preheader: heading }),
      `Hello ${name || 'applicant'}. ${message}`,
    )
  },
}

export default emailService
