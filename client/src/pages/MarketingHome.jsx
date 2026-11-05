import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, BriefcaseBusiness, CheckCircle2, Code2, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const pathways = ['Foundations', 'Domain immersion', 'Live projects', 'Certification']
const domains = [
  { name: 'FaaS', description: 'Fintech APIs and partner services' },
  { name: 'FinCore', description: 'Ledgers and transaction systems' },
  { name: 'FinOps', description: 'Reconciliation and reporting' },
  { name: 'FinInfra', description: 'Cloud, delivery and observability' },
]

export default function MarketingHome() {
  return (
    <div className="min-h-screen bg-white text-deep-600">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link to="/" aria-label="BlueSPACE home"><img src="/logo-dark.png" alt="BlueSPACE Financial Cloud" className="h-9 w-auto" /></Link>
          <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex" aria-label="Main navigation">
            <a href="#tracks" className="hover:text-deep-700">Fellowships</a>
            <a href="#learning" className="hover:text-deep-700">How it works</a>
            <a href="#domains" className="hover:text-deep-700">Domains</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/student-login">Sign in</Link></Button>
            <Button asChild size="sm" className="bg-deep-600 text-white hover:bg-deep-700"><Link to="/register">Apply</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:items-center lg:px-8 lg:py-24">
          <div>
            <Badge variant="outline" className="mb-5 border-deep-200 text-deep-700">BlueSPACE Fintech Academy</Badge>
            <h1 className="max-w-xl text-4xl font-bold leading-tight text-deep-700 sm:text-5xl">Build practical fintech skills. Deliver real work.</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600">Learn through focused fellowship tracks, hands-on projects, and feedback from instructors and industry partners.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="bg-deep-600 text-white hover:bg-deep-700"><Link to="/register">Apply to the academy <ArrowRight size={16} className="ml-2" /></Link></Button>
              <Button asChild variant="outline"><a href="#tracks">Explore the tracks</a></Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-deep-600" />Project-based learning</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-deep-600" />Fintech-focused curriculum</span>
            </div>
          </div>
          <Card className="border-deep-200 shadow-none">
            <CardHeader className="border-b border-gray-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Your learning pathway</p>
              <CardTitle className="text-xl">Learn, build, demonstrate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 pt-4">
              {pathways.map((item, index) => <div key={item} className="flex items-center gap-4 border-b border-gray-100 py-4 last:border-0"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bluespace-50 text-sm font-semibold text-deep-700">{index + 1}</span><div><p className="font-semibold text-deep-700">{item}</p><p className="text-sm text-gray-500">{index === 0 ? 'Build shared fintech foundations.' : index === 1 ? 'Focus on a technical or operational domain.' : index === 2 ? 'Work with a squad on practical challenges.' : 'Show your skills and prepare for next steps.'}</p></div></div>)}
            </CardContent>
          </Card>
        </section>

        <section id="tracks" className="border-y border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
            <div className="max-w-2xl"><p className="text-sm font-semibold text-deep-700">Fellowship tracks</p><h2 className="mt-2 text-3xl font-bold text-deep-700">Choose a path that fits your goals</h2><p className="mt-3 text-gray-600">Both tracks share core fintech foundations and move into hands-on domain work.</p></div>
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <Card className="shadow-none"><CardHeader><Code2 className="mb-2 text-deep-600" size={22} /><CardTitle className="text-xl">Finsoft</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed text-gray-600">Build and test fintech software, APIs, transaction systems, and cloud services.</p></CardContent></Card>
              <Card className="shadow-none"><CardHeader><BookOpen className="mb-2 text-deep-600" size={22} /><CardTitle className="text-xl">Finops</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed text-gray-600">Work on fintech operations, reconciliation, reporting, and reliable service workflows.</p></CardContent></Card>
            </div>
          </div>
        </section>

        <section id="learning" className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3 md:items-start">
            <div className="md:col-span-1"><p className="text-sm font-semibold text-deep-700">Built around practice</p><h2 className="mt-2 text-3xl font-bold text-deep-700">Learn with a team</h2></div>
            <div className="space-y-4 text-gray-600 md:col-span-2"><p>Fellows learn in cohorts, collaborate in squads, complete labs, and present project work for review.</p><p>Instructors guide learning and review submissions. Partner agencies can contribute courses, project briefs, mentorship, and placement opportunities.</p><div className="flex flex-wrap gap-3 pt-2"><Button asChild variant="outline"><Link to="/instructor-login"><Users size={15} className="mr-2" />Instructor sign in</Link></Button><Button asChild variant="outline"><Link to="/partner-login"><BriefcaseBusiness size={15} className="mr-2" />Partner sign in</Link></Button></div></div>
          </div>
        </section>

        <section id="domains" className="border-t border-gray-200">
          <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
            <div className="max-w-2xl"><p className="text-sm font-semibold text-deep-700">AI Fintech Factory domains</p><h2 className="mt-2 text-3xl font-bold text-deep-700">Learn across the systems behind fintech</h2></div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{domains.map((domain) => <Card key={domain.name} className="shadow-none"><CardContent className="p-5"><p className="font-semibold text-deep-700">{domain.name}</p><p className="mt-1 text-sm text-gray-500">{domain.description}</p></CardContent></Card>)}</div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-14 lg:px-8">
          <div className="flex flex-col gap-5 rounded-xl bg-deep-700 p-7 text-white md:flex-row md:items-center md:justify-between md:p-9">
            <div><h2 className="text-2xl font-bold">Ready to build your fintech skills?</h2><p className="mt-2 text-sm text-white/80">Start an application or sign in to continue your learning.</p></div>
            <div className="flex flex-wrap gap-3"><Button asChild className="bg-white text-deep-700 hover:bg-gray-100"><Link to="/register">Start an application</Link></Button><Button asChild variant="outline" className="border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/student-login">Sign in</Link></Button></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm text-gray-500 lg:px-8">
          <span>BlueSPACE Fintech Academy</span>
          <div className="flex gap-4"><Link to="/admin-login" className="hover:text-deep-700">Academy staff</Link><Link to="/register" className="hover:text-deep-700">Apply</Link></div>
        </div>
      </footer>
    </div>
  )
}
