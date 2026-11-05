import { useState, useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import { ChevronRight, ArrowLeft, X, ExternalLink, Compass } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { useNavigate } from 'react-router-dom'

const WELCOME_STEPS = {
  Student: [
    {
      target: 'tour-sidebar',
      badge: 'Sidebar Navigation',
      title: 'Academy command center',
      content: 'This sidebar is your primary navigation. Access live classes, interactive labs, squad projects, and graduation credentials from any screen.',
    },
    {
      target: 'tour-nav-my-learning',
      badge: 'Curriculum & Lessons',
      title: 'My Learning portal',
      content: '"My Learning" contains your complete weekly syllabus, video lectures, and reading materials. Start and review lesson content at your own pace.',
      action: 'Go to My Learning',
      route: '/my-learning',
    },
    {
      target: 'tour-nav-lab-workspace',
      badge: 'Practical Coding',
      title: 'Lab Workspace & grading',
      content: 'Complete hands-on fintech labs, submit your GitHub repositories for evaluation, and read detailed grading feedback from instructors.',
      action: 'Open Lab Workspace',
      route: '/lab-workspace',
    },
    {
      target: 'student-current-learning',
      badge: 'Active Module',
      title: 'Resume active coursework',
      content: 'Jump directly back into your in-progress module with one click, continue where you left off, and track your completion progress.',
      action: 'Continue Learning',
      route: '/my-learning',
    },
    {
      target: 'student-live-class',
      badge: 'Live Workshops',
      title: 'Live sessions & clinics',
      content: 'Never miss a session. Join upcoming cohort masterclasses, virtual workshops, and 1-on-1 mentor clinics directly from this card.',
      action: 'View Calendar',
      route: '/live-classes',
    },
    {
      target: 'student-tasks',
      badge: 'Action Items',
      title: 'Pending tasks & lab submissions',
      content: 'Keep track of all upcoming lab deadlines, submission status, and instructor reviews all in one place.',
      action: 'Open Workspace',
      route: '/lab-workspace',
    },
    {
      target: 'student-launchpad',
      badge: 'Quick Launchpad',
      title: 'Academy shortcuts',
      content: 'Quickly jump into peer code reviews, cohort squad channels, live classes, and your final capstone graduation project.',
    },
  ],
  Instructor: [
    {
      target: 'tour-sidebar',
      badge: 'Sidebar Navigation',
      title: 'Teaching console navigation',
      content: 'Quickly switch between assigned cohorts, curriculum modules, grading queues, live clinic schedules, and student squads.',
    },
    {
      target: 'tour-nav-labs-to-review',
      badge: 'Grading Queue',
      title: 'Labs to Review & evaluations',
      content: 'Review incoming student lab submissions, inspect code repositories, assign rubric scores, and return constructive feedback.',
      action: 'Review Labs',
      route: '/labs-to-review',
    },
    {
      target: 'instructor-metrics',
      badge: 'Teaching Metrics',
      title: 'Cohort & workload indicators',
      content: 'Monitor your assigned cohorts, authored modules, and pending student submissions awaiting evaluation.',
    },
    {
      target: 'instructor-reviews',
      badge: 'Grading Queue',
      title: 'Priority lab grading queue',
      content: 'Access pending student lab submissions directly from your dashboard to review code, provide feedback, and assign grades.',
      action: 'Grade Labs',
      route: '/labs-to-review',
    },
    {
      target: 'instructor-modules',
      badge: 'Curriculum Management',
      title: 'Author & manage teaching modules',
      content: 'View modules assigned to your cohorts, author new lesson content, attach practical labs, and update publication status.',
      action: 'Open Modules',
      route: '/my-modules',
    },
    {
      target: 'instructor-squads',
      badge: 'Mentorship',
      title: 'Assigned student squads',
      content: 'Mentor your squads through practical fintech challenges and schedule office hours in Mentor Clinics.',
      action: 'View Squads',
      route: '/squads',
    },
  ],
  Partner: [
    {
      target: 'tour-sidebar',
      badge: 'Sidebar Navigation',
      title: 'Partner portal navigation',
      content: 'Access your Course Studio, manage your partner agency profile, and view academy curriculum distributions.',
    },
    {
      target: 'partner-action',
      badge: 'Course Studio',
      title: 'Launch Course Studio',
      content: 'Author specialized fintech curriculum with video/audio lessons, reading material, and practical lab assignments.',
      action: 'Open Studio',
      route: '/partner-courses',
    },
    {
      target: 'partner-metrics',
      badge: 'Portfolio Metrics',
      title: 'Course pipeline status',
      content: 'Track drafts in progress, modules submitted for academy review, and live published courses available to students.',
    },
    {
      target: 'partner-courses',
      badge: 'Course Directory',
      title: 'Manage course revisions & submissions',
      content: 'View academy review status, inspect reviewer feedback, and update published curriculum.',
      action: 'Manage Courses',
      route: '/partner-courses',
    },
  ],
  Administrator: [
    {
      target: 'tour-sidebar',
      badge: 'Sidebar Navigation',
      title: 'System administration console',
      content: 'Full administrative control over user accounts, admissions queues, cohort schedules, curriculum approval, and placement tracking.',
    },
    {
      target: 'admin-metrics',
      badge: 'Operations Metrics',
      title: 'Academy indicators',
      content: 'Real-time counters for active cohorts, enrolled fellows, pending admissions applicants, and partner course submissions.',
    },
    {
      target: 'admin-applications',
      badge: 'Admissions Pipeline',
      title: 'Review candidate applications',
      content: 'Audit and approve applicant submissions for student seats, instructor credentials, and partner organizations.',
      action: 'Open Queue',
      route: '/applications',
    },
    {
      target: 'admin-partner-reviews',
      badge: 'Curriculum Quality',
      title: 'Partner course approvals',
      content: 'Evaluate partner course drafts, ensure academy pedagogy standards, and approve for student enrolment.',
      action: 'Review Courses',
      route: '/partner-course-review',
    },
    {
      target: 'admin-cohorts',
      badge: 'Cohort Scheduling',
      title: 'Cohort management',
      content: 'Configure cohort start dates, student capacities, and tracks for upcoming academic cycles.',
      action: 'Manage Cohorts',
      route: '/cohorts',
    },
  ],
}

export default function WelcomeGuide({ role, forceOpen = false, onClose }) {
  const navigate = useNavigate()
  const storageKey = `welcome_${role || 'general'}`
  const [dismissed, setDismissed] = useState(() => {
    if (forceOpen) return false
    return localStorage.getItem(storageKey) === 'true'
  })
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const tooltipRef = useRef(null)

  const steps = WELCOME_STEPS[role] || WELCOME_STEPS.Student

  useEffect(() => {
    if (forceOpen) {
      setDismissed(false)
      setStep(0)
    }
  }, [forceOpen])

  useEffect(() => {
    const handleReopen = () => {
      setDismissed(false)
      setStep(0)
    }
    window.addEventListener('open-welcome-guide', handleReopen)
    return () => window.removeEventListener('open-welcome-guide', handleReopen)
  }, [])

  const updatePosition = useCallback(() => {
    if (dismissed) return
    const current = steps[step]
    if (!current?.target) {
      setTargetRect(null)
      return
    }

    const targetEl = document.querySelector(`[data-tour="${current.target}"]`)
    if (!targetEl) {
      setTargetRect(null)
      return
    }

    const rect = targetEl.getBoundingClientRect()
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
    })
  }, [dismissed, step, steps])

  useEffect(() => {
    if (dismissed) return

    const current = steps[step]
    if (!current?.target) return

    const targetEl = document.querySelector(`[data-tour="${current.target}"]`)
    if (targetEl) {
      // If target is in the main body (not the fixed sidebar), scroll to it leaving header offset
      const isSidebar = current.target.startsWith('tour-sidebar') || current.target.startsWith('tour-nav')
      if (!isSidebar) {
        const elementTop = targetEl.getBoundingClientRect().top + window.scrollY
        const headerOffset = 80 // 56px sticky topbar + 24px breathing space
        window.scrollTo({
          top: Math.max(0, elementTop - headerOffset),
          behavior: 'smooth',
        })
      }
    }

    const timeout = setTimeout(updatePosition, 180)
    return () => clearTimeout(timeout)
  }, [step, dismissed, steps, updatePosition])

  useEffect(() => {
    if (dismissed) return

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [dismissed, updatePosition])

  const dismiss = () => {
    localStorage.setItem(storageKey, 'true')
    setDismissed(true)
    if (onClose) onClose()
  }

  const next = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
    } else {
      dismiss()
      if (steps[step]?.route) {
        navigate(steps[step].route)
      }
    }
  }

  const previous = () => setStep((s) => Math.max(s - 1, 0))

  if (dismissed) return null

  const current = steps[step] || steps[0]
  const isLast = step === steps.length - 1

  const CARD_WIDTH = 380
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  let tooltipStyle = {}
  let isTargetingSidebar = false

  if (!isMobile && targetRect) {
    isTargetingSidebar = targetRect.left < 200

    if (isTargetingSidebar) {
      // Place cleanly to the RIGHT of the sidebar
      const cardTop = Math.max(76, Math.min(targetRect.top + targetRect.height / 2 - 80, window.innerHeight - 300))
      tooltipStyle = {
        position: 'fixed',
        top: `${cardTop}px`,
        left: `${Math.min(targetRect.right + 20, window.innerWidth - CARD_WIDTH - 24)}px`,
        width: `${CARD_WIDTH}px`,
        zIndex: 50,
      }
    } else {
      // Main canvas element
      const spaceBelow = window.innerHeight - targetRect.bottom
      const spaceAbove = targetRect.top

      let cardTop = targetRect.bottom + 16
      if (spaceBelow < 260 && spaceAbove > 260) {
        cardTop = Math.max(76, targetRect.top - 240)
      } else {
        cardTop = Math.min(cardTop, window.innerHeight - 280)
      }

      // Clamp horizontally beside sidebar
      const minLeft = 280
      const maxLeft = window.innerWidth - CARD_WIDTH - 24
      const desiredLeft = targetRect.left
      const cardLeft = Math.max(minLeft, Math.min(desiredLeft, maxLeft))

      tooltipStyle = {
        position: 'fixed',
        top: `${cardTop}px`,
        left: `${cardLeft}px`,
        width: `${CARD_WIDTH}px`,
        zIndex: 50,
      }
    }
  } else {
    // Mobile or fallback: fixed bottom sheet
    tooltipStyle = {
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      right: '16px',
      maxWidth: '460px',
      margin: '0 auto',
      zIndex: 50,
    }
  }

  // Generous padding around target so highlight NEVER intersects text
  const PADDING = 8

  return (
    <>
      {/* Dimmed backdrop to focus eye */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/25 pointer-events-none transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Target highlight box with generous padding */}
      {targetRect && !isMobile && (
        <div
          className="fixed pointer-events-none z-40 transition-all duration-200 ease-out rounded-xl border-2 border-deep-600 bg-deep-600/5 ring-4 ring-deep-600/20"
          style={{
            top: `${targetRect.top - PADDING}px`,
            left: `${targetRect.left - PADDING}px`,
            width: `${targetRect.width + PADDING * 2}px`,
            height: `${targetRect.height + PADDING * 2}px`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Tour Guide Card */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="transition-all duration-200 ease-out max-h-[calc(100vh-100px)] flex flex-col"
        role="dialog"
        aria-label="Interactive tour guide"
      >
        <Card className="border border-gray-200/90 bg-white text-gray-900 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
          <CardContent className="p-5 flex flex-col justify-between">
            <div>
              {/* Header: Badge & Step count */}
              <div className="flex items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-deep-600 bg-deep-50 px-2 py-0.5 rounded border border-deep-100">
                    <Compass size={12} />
                    {current.badge || `Step ${step + 1}`}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {step + 1} of {steps.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Close guide"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Title & Body */}
              <h2 className="text-base font-bold text-gray-900 tracking-tight leading-snug mt-1">
                {current.title}
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mt-1.5">
                {current.content}
              </p>
            </div>

            {/* Actions Bar */}
            <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-gray-400 hover:text-gray-700 font-medium"
              >
                Skip tour
              </button>

              <div className="flex items-center gap-2">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={previous}
                    className="h-8 px-2.5 text-xs text-gray-700 border-gray-200"
                  >
                    <ArrowLeft size={13} className="mr-1" />
                    Back
                  </Button>
                )}

                {current.route && current.action && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      dismiss()
                      navigate(current.route)
                    }}
                    className="h-8 px-2.5 text-xs text-deep-600 border-deep-200 hover:bg-deep-50"
                  >
                    {current.action}
                    <ExternalLink size={12} className="ml-1" />
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  onClick={next}
                  className="h-8 px-3 text-xs bg-deep-600 text-white hover:bg-deep-700"
                >
                  {isLast ? 'Got it' : 'Next'}
                  {!isLast && <ChevronRight size={13} className="ml-1" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

WelcomeGuide.propTypes = {
  role: PropTypes.string,
  forceOpen: PropTypes.bool,
  onClose: PropTypes.func,
}
