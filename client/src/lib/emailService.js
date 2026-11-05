import { supabase } from './supabase'

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]))

export const emailService = {
  async sendEmail(to, subject, htmlContent, textContent) {
    try {
      if (!supabase) throw new Error('Email delivery is not configured.')
      const { data, error } = await supabase.functions.invoke('email-service', {
        body: { to, subject, html: htmlContent, text: textContent },
      })
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      console.error('Email error:', err)
      return { success: false, error: err.message }
    }
  },

  async sendWelcomeEmail(email, name, role) {
    return this.sendEmail(
      email,
      'Welcome to BlueSPACE Fintech Academy',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e3a8a;">Welcome to BlueSPACE Fintech Academy</h1>
            <p style="color: #64748b;">Welcome ${name}! Your ${role} account is now active.</p>
          </div>
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e3a8a; margin-bottom: 10px;">What's Next?</p>
            <ul style="color: #475569;">
              <li>Explore your dashboard to see your courses</p>
              <li>Start with the Foundations stage</p>
              <li>Join your squad and start collaborating</p>
            </ul>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #64748b;">BlueSPACE Fintech Academy - Training fintech talent on live projects</p>
          </div>
        </div>
      `,
      `Welcome to BlueSPACE Fintech Academy! Welcome ${name}! Your ${role} account is now active.`
    )
  },

  async sendCapstoneSubmittedEmail(email, studentName, track) {
    return this.sendEmail(
      email,
      'Capstone Submission Received',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1e3a8a;">Capstone Submission Received</h2>
            <p style="color: #64748b;">Hello ${studentName},</p>
          </div>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #166534; font-weight: bold;">Your capstone submission has been received and is pending panel review.</p>
            <p style="color: #166534;">Track: ${track}</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #64748b;">BlueSPACE Fintech Academy - Training fintech talent on live projects</p>
          </div>
        </div>
      `,
      `Your capstone submission has been received and is pending panel review. Track: ${track}`
    )
  },

  async sendCertificationEmail(email, name, track, grade) {
    return this.sendEmail(
      email,
      'Congratulations! You are Certified',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e3a8a;">Congratulations! 🎉</h1>
            <p style="color: #64748b;">Congratulations ${name}!</p>
          </div>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #166534; margin-bottom: 10px;">BlueSPACE Fellow Certified</h2>
            <p style="color: #166534;">You have successfully completed the ${track} track with a grade of ${grade}.</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #64748b;">BlueSPACE Fintech Academy - Training fintech talent on live projects</p>
          </div>
        </div>
      `,
      `Congratulations ${name}! You are certified BlueSPACE Fellow (${track}) with grade ${grade}.`
    )
  },

  async sendAssignmentNotification(email, fellowName, assignmentName, courseName) {
    return this.sendEmail(
      email,
      'New Assignment Available',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1e3a8a;">New Assignment</h1>
            <p style="color: #64748b;">Hello ${fellowName},</p>
          </div>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #166534; font-weight: bold;">${courseName}</p>
            <p style="color: #166534;">You have a new assignment: <strong>${assignmentName}</strong></p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #64748b;">BlueSPACE Fintech Academy - Training fintech talent on live projects</p>
          </div>
        </div>
      `,
      `New assignment ${assignmentName} from ${courseName}`
    )
  },

  async sendPlacementNotification(email, fellowName, role, project) {
    return this.sendEmail(
      email,
      'Placement Match Found',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #166534;">Congratulations! Project Match Found</h2>
            <p style="color: #64748b;">Hello ${fellowName},</p>
          </div>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #166534; font-weight: bold;">Role: ${role}</p>
            <p style="color: #166534; font-weight: bold;">Project: ${project}</p>
            <p style="color: #166534;">You have been matched to your first project placement!</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #64748b;">BlueSPACE Fintech Academy - Training fintech talent on live projects</p>
          </div>
        </div>
      `,
      `You have been matched to role ${role} for project ${project}`
    )
  },

  async sendApplicationStatusEmail(email, name, status, reason = '') {
    const approved = status === 'approved'
    const safeName = escapeHtml(name || 'applicant')
    const safeReason = escapeHtml(reason)
    const heading = approved ? 'Your application was approved' : 'Your application was not approved'
    const message = approved
      ? 'Your BlueSPACE Fintech Academy account is active. You can now sign in with the password you created.'
      : (safeReason || 'Please contact the academy team if you would like more information.')
    return this.sendEmail(
      email,
      `BlueSPACE application update: ${approved ? 'approved' : 'not approved'}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px"><h1 style="color:#152c4f">${heading}</h1><p>Hello ${safeName},</p><p>${message}</p><p>BlueSPACE Fintech Academy</p></div>`,
      `Hello ${name || 'applicant'}, ${heading}. ${approved ? 'Your account is active. You can now sign in.' : (reason || 'Please contact the academy team for more information.')}`,
    )
  },
}

export default emailService
