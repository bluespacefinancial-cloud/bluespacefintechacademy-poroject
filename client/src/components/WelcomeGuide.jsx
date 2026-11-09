import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  X,
  BookOpen,
  Code2,
  Video,
  Users,
  Award,
  Shield,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { Button } from './ui/button'

const ORIENTATION_DATA = {
  Student: [
    {
      badge: 'Welcome Fellow',
      title: 'Welcome to BlueSPACE Fintech Academy',
      subtitle: 'Your 16-Week Engineering Journey',
      icon: Award,
      content:
        'You are enrolled in an intensive, industry-aligned fellowship built to take software and finance professionals to enterprise-ready fintech practitioners.',
      highlights: [
        'Structured 16-week progression across 4 comprehensive stages.',
        'Core coverage: Financial APIs, Ledger Systems, Payment Rails, FinOps & Cloud.',
        'Cohort-based accountability with dedicated faculty mentors and fellow peers.',
      ],
      tags: ['16 Weeks', 'Core Banking', 'Payment Rails', 'FinOps'],
      actionText: 'Next: How Learning Works',
    },
    {
      badge: 'Curriculum & Labs',
      title: 'Weekly Coursework & Hands-On Labs',
      subtitle: 'Master by Building, Not Just Watching',
      icon: Code2,
      content:
        'Each week brings conceptual lectures paired directly with hands-on coding labs. You submit real GitHub repositories to be inspected against automated tests and faculty rubrics.',
      highlights: [
        'Video and audio lessons with downloadable architecture notes in My Learning.',
        'Submit public or private GitHub repository URLs in your Lab Workspace.',
        'Detailed instructor grading with rubric scores, line feedback, and remediation queues.',
      ],
      tags: ['GitHub Repositories', 'Unit Tests', 'Rubric Grading'],
      actionText: 'Next: Live Classes & Clinics',
    },
    {
      badge: 'Faculty Mentorship',
      title: 'Live Masterclasses & Mentor Clinics',
      subtitle: 'Direct Access to Senior Fintech Practitioners',
      icon: Video,
      content:
        'Learning is backed by weekly interactive sessions. Attend live workshops for real-time Q&A, and book 1-on-1 office hours when you encounter roadblocks.',
      highlights: [
        'Weekly Cohort Masterclasses streamed live with recordings archived.',
        '1-on-1 Mentor Clinics: reserve 30-minute office hour slots with faculty.',
        'Direct Google Meet bridges accessible straight from your dashboard.',
      ],
      tags: ['Cohort Streams', '1-on-1 Clinics', 'Office Hours'],
      actionText: 'Next: Squad Collaboration',
    },
    {
      badge: 'Team Delivery',
      title: 'Squad Workspace & Live Project Sprints',
      subtitle: 'Collaborate Like Real Fintech Engineering Teams',
      icon: Users,
      content:
        'During Weeks 9-12, fellows are grouped into multi-disciplinary squads to build live fintech use cases: ledger migration engines, fraud detection pipelines, or payment switches.',
      highlights: [
        'Sprint Deliverables: Submit architecture diagrams, PRs, and live demo URLs.',
        'Cross-functional team roster with designated squad leads and track specialists.',
        'Periodic sprint demos and peer code reviews before mentor checkpoints.',
      ],
      tags: ['Squad Sprints', 'Agile Standups', 'Live Use Cases'],
      actionText: 'Next: Graduation & Credentials',
    },
    {
      badge: 'Graduation Benchmark',
      title: 'Capstone Defense & Industry Certification',
      subtitle: 'Earn Verifiable Industry Credentials',
      icon: Award,
      content:
        'Graduation requires maintaining active attendance, completing your capstone project, and defending your architecture before the faculty evaluation panel.',
      highlights: [
        'Minimum 80% curriculum completion and passing lab score required.',
        'Final Capstone: Production-grade fintech service deployed with live evidence.',
        'Cryptographically verifiable graduation certificate and partner talent placement.',
      ],
      tags: ['Verifiable Certificate', 'Capstone Defense', 'Talent Placement'],
      actionText: 'Explore Dashboard',
      route: '/my-learning',
    },
  ],
  Instructor: [
    {
      badge: 'Faculty Welcome',
      title: 'Welcome to the Faculty Console',
      subtitle: 'Guiding the Next Generation of Fintech Engineers',
      icon: Award,
      content:
        'Manage your assigned cohorts, evaluate practical student labs, author curriculum modules, and conduct mentor clinics.',
      highlights: [
        'Unified grading queue for GitHub repository inspections.',
        'Host 1-on-1 clinics and cohort live workshops.',
        'Monitor fellow attendance and milestone completion.',
      ],
      tags: ['Teaching', 'Mentorship', 'Grading'],
      actionText: 'Next: Grading Queue',
    },
    {
      badge: 'Evaluation',
      title: 'Priority Lab Grading Queue',
      subtitle: 'Actionable Code Feedback',
      icon: Code2,
      content:
        'Review incoming student submissions, inspect pull requests, assign rubric scores (0-100), and guide remediation when needed.',
      highlights: [
        'Direct GitHub repository links and inline test notes.',
        'One-click rubric feedback presets for consistent evaluation.',
        'Flag submissions for remediation with guidance.',
      ],
      tags: ['Rubrics', 'GitHub Inspection', 'Feedback'],
      actionText: 'Next: Clinics & Sessions',
    },
    {
      badge: 'Mentorship',
      title: 'Host Mentor Clinics & Live Streams',
      subtitle: 'Bridge Theory and Production Practice',
      icon: Video,
      content:
        'Publish available office hours for student 1-on-1 booking and manage scheduled cohort workshops with Google Meet links.',
      highlights: [
        'Set clinic capacities, start/end dates, and topics.',
        'Review booked fellow roster ahead of sessions.',
      ],
      tags: ['Office Hours', 'Live Streams'],
      actionText: 'Start Teaching',
      route: '/grading',
    },
  ],
  Partner: [
    {
      badge: 'Partner Agency',
      title: 'Welcome to the Partner Studio',
      subtitle: 'Publishing Industry-Certified Fintech Curricula',
      icon: BookOpen,
      content:
        'Author specialized courses, attach video/audio lectures and practical labs, and submit for academy curriculum approval.',
      highlights: [
        'Course Studio for authoring modular units.',
        'Track review status and reviewer feedback.',
        'Distribute credentials to fellows across active cohorts.',
      ],
      tags: ['Course Studio', 'Specializations', 'Credentialing'],
      actionText: 'Open Course Studio',
      route: '/partner-courses',
    },
  ],
  Administrator: [
    {
      badge: 'System Operations',
      title: 'Welcome to Academy Operations',
      subtitle: 'Comprehensive Platform Governance',
      icon: Shield,
      content:
        'Administer cohorts, review admissions applications, oversee curriculum approval, and manage talent placement outcomes.',
      highlights: [
        'Admissions pipeline review for student and instructor applicants.',
        'Cohort scheduling, track allocation, and seat capacity.',
        'Comprehensive academy reports and placement metrics.',
      ],
      tags: ['Operations', 'Admissions', 'Cohorts', 'Reports'],
      actionText: 'Enter Admin Console',
      route: '/dashboard',
    },
  ],
}

export default function WelcomeGuide({ role, forceOpen = false, onClose }) {
  const navigate = useNavigate()
  const storageKey = `orientation_completed_${role || 'student'}`

  const [dismissed, setDismissed] = useState(() => {
    if (forceOpen) return false
    return localStorage.getItem(storageKey) === 'true'
  })
  const [step, setStep] = useState(0)

  const screens = ORIENTATION_DATA[role] || ORIENTATION_DATA.Student
  const current = screens[step] || screens[0]
  const isLast = step === screens.length - 1

  useEffect(() => {
    if (forceOpen) {
      // Reopening the guide is an external signal, not state derivable from render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(false)
      setStep(0)
    }
  }, [forceOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (dismissed) return
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowRight' && !isLast) setStep((s) => s + 1)
      if (e.key === 'ArrowLeft' && step > 0) setStep((s) => s - 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dismissed, isLast, step])

  const handleClose = () => {
    localStorage.setItem(storageKey, 'true')
    setDismissed(true)
    if (onClose) onClose()
  }

  const handleAction = () => {
    if (isLast) {
      handleClose()
      if (current.route) navigate(current.route)
    } else {
      setStep((s) => s + 1)
    }
  }

  if (dismissed) return null

  const IconComponent = current.icon || Award

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="orientation-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Centered Modal Card */}
      <div className="relative w-full max-w-xl bg-white border border-gray-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 animate-sheet-up">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  {current.badge} • Step {step + 1} of {screens.length}
                </span>
              </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Skip orientation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Headline with Icon */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-deep-50 border border-deep-100 flex items-center justify-center text-deep-600 shrink-0">
              <IconComponent size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-deep-600 tracking-wide">{current.subtitle}</p>
              <h3 id="orientation-title" className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5 leading-snug">
                {current.title}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {current.content}
          </p>

          {/* Key Highlights Checklist */}
          {current.highlights && (
            <div className="rounded-xl border border-gray-200/90 bg-gray-50/50 p-4 space-y-2.5 text-xs text-gray-700">
              {current.highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{highlight}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {current.tags && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {current.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium px-2 py-0.5 rounded text-gray-600 border border-gray-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-4">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5" aria-label="Step progress">
            {screens.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === step ? 'w-6 bg-deep-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Jump to screen ${idx + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                className="text-xs border-gray-200 h-9 px-3"
              >
                <ChevronLeft size={14} className="mr-1" />
                Previous
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={handleAction}
              className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold h-9 px-4"
            >
              <span>{current.actionText}</span>
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

WelcomeGuide.propTypes = {
  role: PropTypes.string,
  forceOpen: PropTypes.bool,
  onClose: PropTypes.func,
}
