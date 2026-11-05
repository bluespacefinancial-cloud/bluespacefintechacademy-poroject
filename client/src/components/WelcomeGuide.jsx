import { useState } from 'react'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useNavigate } from 'react-router-dom'

const WELCOME_STEPS = {
  Student: [
    {
      title: 'Welcome to your learning portal',
      content: 'Your dashboard shows your current module progress, attendance, and grades. Use "My Learning" to access course content and "Lab Workspace" to submit assignments.',
      action: 'Go to My Learning',
      route: '/my-learning',
    },
    {
      title: 'Join your squad',
      content: 'You\'ve been assigned to a squad with fellow students. Collaborate on projects, share notes, and attend weekly clinics together.',
      action: 'View My Squad',
      route: '/my-squad',
    },
    {
      title: 'Complete your capstone',
      content: 'Your capstone assessment is the final project for certification. Submit your repository link when ready for review.',
      action: 'View Capstone',
      route: '/capstone',
    },
  ],
  Instructor: [
    {
      title: 'Welcome to your teaching portal',
      content: 'Your dashboard shows your assigned modules and squads. Use "Labs to Review" to grade submissions and "Student Monitoring" to track progress.',
      action: 'View Labs to Review',
      route: '/labs-to-review',
    },
    {
      title: 'Manage your squads',
      content: 'Review squad assignments and mentor students during weekly clinics. Use "Mentor Clinics" to schedule office hours.',
      action: 'View Squads',
      route: '/squads',
    },
    {
      title: 'Grade submissions',
      content: 'Review and grade student lab submissions. Provide feedback and scores to help students progress.',
      action: 'Start Grading',
      route: '/grading',
    },
  ],
  Partner: [
    {
      title: 'Welcome to your partner portal',
      content: 'Use "Course Studio" to create and manage courses for academy students. Submit courses for academy review and approval.',
      action: 'Create Course',
      route: '/partner-courses',
    },
    {
      title: 'Track course progress',
      content: 'Monitor student enrolment and completion rates for your published courses.',
      action: 'View Catalogue',
      route: '/partner-catalog',
    },
  ],
  Administrator: [
    {
      title: 'Welcome to your admin portal',
      content: 'Use "User Management" to activate accounts and assign roles. Review applications, manage cohorts, and oversee partner agencies.',
      action: 'Manage Users',
      route: '/user-management',
    },
    {
      title: 'Review applications',
      content: 'Pending student, instructor, and partner applications await your review in the applications queue.',
      action: 'Review Applications',
      route: '/applications',
    },
    {
      title: 'Monitor academy operations',
      content: 'View reports, placement data, and partner course submissions from the dashboard.',
      action: 'View Reports',
      route: '/reports',
    },
  ],
}

export default function WelcomeGuide({ role }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(`welcome_${role}`) === 'true')
  const steps = WELCOME_STEPS[role] || WELCOME_STEPS.Student

  const next = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      localStorage.setItem(`welcome_${role}`, 'true')
      setDismissed(true)
      navigate(steps[step].route)
    }
  }

  const previous = () => setStep(s => Math.max(s - 1, 0))

  if (dismissed) return null

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md">
      <Card className="bg-deep-600 text-white shadow-xl">
        <CardHeader className="flex items-start justify-between pb-3">
          <div className="flex-1">
            <CardTitle className="text-white font-semibold">{current.title}</CardTitle>
            <p className="text-sm text-deep-100/90">{current.content}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { localStorage.setItem(`welcome_${role}`, 'true'); setDismissed(true) }}
            className="text-white/60 hover:text-white"
          >
            ✕
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-deep-100/80">
              <span>{step + 1}</span>
              <span>/</span>
              <span>{steps.length}</span>
            </div>
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={previous} className="text-white/60 hover:text-white">
                  <ArrowLeft size={14} /> Back
                </Button>
              )}
              <Button
                onClick={next}
                variant="default"
                size="sm"
                className="bg-brand-600 hover:bg-brand-500"
              >
                {isLast ? 'Get Started' : 'Next'}
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
