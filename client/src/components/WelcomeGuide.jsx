import { useState, useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import { ChevronRight, ArrowLeft, X, ExternalLink } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { useNavigate } from 'react-router-dom'

const WELCOME_STEPS = {
  Student: [
    {
      target: 'student-header',
      title: 'Welcome to your learning dashboard',
      content: 'This dashboard gives you a complete overview of your academy journey, track progress, and key tasks.',
    },
    {
      target: 'student-metrics',
      title: 'Performance & progress indicators',
      content: 'Monitor your course completion rate, live class attendance, current grade, and completed lessons at a glance.',
    },
    {
      target: 'student-current-learning',
      title: 'Current module in progress',
      content: 'Jump directly back into your lessons, watch videos, read materials, and complete hands-on lab exercises.',
      action: 'Go to My Learning',
      route: '/my-learning',
    },
    {
      target: 'student-squad',
      title: 'Your assigned squad',
      content: 'Meet your squad teammates, collaborate on projects, and prepare for group mentoring clinics.',
      action: 'View My Squad',
      route: '/my-squad',
    },
    {
      target: 'student-deadlines',
      title: 'Upcoming deadlines',
      content: 'Keep track of module milestones and deliverable timelines to stay on schedule for graduation.',
    },
  ],
  Instructor: [
    {
      target: 'instructor-header',
      title: 'Instructor teaching dashboard',
      content: 'Welcome to your teaching workspace. Manage cohorts, author modules, and evaluate student work from one central console.',
    },
    {
      target: 'instructor-metrics',
      title: 'Teaching overview metrics',
      content: 'Key numbers for your assigned cohorts, authored and published modules, and pending lab submissions waiting for your review.',
    },
    {
      target: 'instructor-modules',
      title: 'Your teaching modules',
      content: 'Access course modules for your assigned cohorts. Create lessons, attach practical labs, and update publication status.',
      action: 'Open modules',
      route: '/my-modules',
    },
    {
      target: 'instructor-squads',
      title: 'Assigned student squads',
      content: 'View squads under your mentorship. Coordinate clinic sessions, answer student questions, and support practical work.',
      action: 'View squads',
      route: '/squads',
    },
    {
      target: 'instructor-reviews',
      title: 'Submissions waiting for review',
      content: 'Review and grade student lab code and assessments. Provide detailed rubric feedback to help students progress.',
      action: 'Review labs',
      route: '/labs-to-review',
    },
  ],
  Partner: [
    {
      target: 'partner-header',
      title: 'Partner agency workspace',
      content: 'Welcome to your partner portal. Build specialized fintech courses, submit them for review, and reach academy fellows.',
    },
    {
      target: 'partner-metrics',
      title: 'Course portfolio breakdown',
      content: 'Keep tabs on courses currently in draft, courses under review by academy staff, and published offerings.',
    },
    {
      target: 'partner-action',
      title: 'Course Studio access',
      content: 'Launch the Course Studio to build curriculum structure, write module descriptions, and author practical labs.',
      action: 'Open course studio',
      route: '/partner-courses',
    },
    {
      target: 'partner-courses',
      title: 'Your course directory',
      content: 'Review the current status of each course draft, check reviewer feedback, and submit revisions for approval.',
      action: 'Manage courses',
      route: '/partner-courses',
    },
  ],
  Administrator: [
    {
      target: 'admin-header',
      title: 'Academy operations console',
      content: 'High-level administration for user permissions, cohorts, admissions queues, and partner content approvals.',
    },
    {
      target: 'admin-metrics',
      title: 'Academy operational metrics',
      content: 'Monitor active cohorts, total enrolled fellows, pending admissions applications, and partner courses under review.',
    },
    {
      target: 'admin-applications',
      title: 'Pending applications queue',
      content: 'Review candidate applications for student seats, instructor roles, and partner agencies.',
      action: 'Open queue',
      route: '/applications',
    },
    {
      target: 'admin-partner-reviews',
      title: 'Partner course approvals',
      content: 'Review submitted curricula from partner institutions, verify standards, and approve for student enrolment.',
      action: 'Review courses',
      route: '/partner-course-review',
    },
    {
      target: 'admin-cohorts',
      title: 'Active & planned cohorts',
      content: 'Track scheduled cohort start dates, student capacities, and assigned tracks across the academy.',
      action: 'Manage cohorts',
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
  const [placement, setPlacement] = useState('bottom')
  const tooltipRef = useRef(null)

  const steps = WELCOME_STEPS[role] || WELCOME_STEPS.Student

  // If forceOpen prop changes, reset dismissed state
  useEffect(() => {
    if (forceOpen) {
      setDismissed(false)
      setStep(0)
    }
  }, [forceOpen])

  // Listen for custom trigger events to reopen tour
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

    // Determine vertical placement based on viewport space
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    if (spaceBelow >= 240) {
      setPlacement('bottom')
    } else if (spaceAbove >= 240) {
      setPlacement('top')
    } else {
      setPlacement('bottom')
    }
  }, [dismissed, step, steps])

  // Scroll target into view and update coordinates when step changes
  useEffect(() => {
    if (dismissed) return

    const current = steps[step]
    if (!current?.target) return

    const targetEl = document.querySelector(`[data-tour="${current.target}"]`)
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // Allow smooth scroll to settle before measuring
    const timeout = setTimeout(updatePosition, 180)
    return () => clearTimeout(timeout)
  }, [step, dismissed, steps, updatePosition])

  // Reposition on scroll and resize
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

  // Compute tooltip position
  const CARD_WIDTH = 380
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  let style = {}
  if (!isMobile && targetRect) {
    const horizontalMargin = 20
    const desiredLeft = targetRect.left
    const maxLeft = window.innerWidth - CARD_WIDTH - horizontalMargin
    const clampedLeft = Math.max(horizontalMargin, Math.min(desiredLeft, maxLeft))

    if (placement === 'bottom') {
      style = {
        position: 'fixed',
        top: `${Math.min(targetRect.bottom + 12, window.innerHeight - 260)}px`,
        left: `${clampedLeft}px`,
        width: `${CARD_WIDTH}px`,
        zIndex: 50,
      }
    } else {
      style = {
        position: 'fixed',
        bottom: `${Math.max(window.innerHeight - targetRect.top + 12, 20)}px`,
        left: `${clampedLeft}px`,
        width: `${CARD_WIDTH}px`,
        zIndex: 50,
      }
    }
  } else {
    // Mobile or fallback: neatly positioned at bottom
    style = {
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      right: '16px',
      maxWidth: '440px',
      margin: '0 auto',
      zIndex: 50,
    }
  }

  return (
    <>
      {/* Target spotlight border overlay (no gradient, clean solid highlight) */}
      {targetRect && !isMobile && (
        <div
          className="fixed pointer-events-none z-40 transition-all duration-200 ease-out rounded-xl border-2 border-deep-600 ring-4 ring-deep-600/15"
          style={{
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Floating Tour Guide Tooltip */}
      <div
        ref={tooltipRef}
        style={style}
        className="transition-all duration-200 ease-out"
        role="dialog"
        aria-label="Interactive guide"
      >
        <Card className="border border-gray-200 bg-white text-gray-900 shadow-xl rounded-xl overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 pb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-deep-600 bg-deep-50 px-2 py-0.5 rounded">
                    Step {step + 1} of {steps.length}
                  </span>
                </div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight leading-snug">
                  {current.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Close guide"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mt-1">
              {current.content}
            </p>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
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
