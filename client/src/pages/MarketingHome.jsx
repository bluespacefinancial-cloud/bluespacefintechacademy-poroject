import { motion } from 'framer-motion'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, BriefcaseBusiness, CheckCircle2, Code2, Layers3, Users, Workflow } from 'lucide-react'
import { Button } from '../components/ui/button'

const photo = (id, width = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
const images = {
  hero: photo('photo-1522202176988-66273c2fd55f', 1600),
  software: photo('photo-1516321318423-f06f85e504b3'),
  operations: photo('photo-1552664730-d307ca884978'),
  project: photo('photo-1521737711867-e3b97375f902'),
}

const tracks = [
  { title: 'Finsoft', label: 'Build digital products', text: 'Create and test fintech software, APIs, transaction systems and cloud services.', image: images.software, alt: 'Learners working together on a laptop', icon: Code2 },
  { title: 'Finops', label: 'Run reliable operations', text: 'Practice reconciliation, reporting and the workflows that keep financial services dependable.', image: images.operations, alt: 'Team discussing operational work around a table', icon: Workflow },
]
const domains = [
  { name: 'FaaS', detail: 'Fintech APIs and partner services', color: 'bg-blue-50 text-[#0000ff]' },
  { name: 'FinCore', detail: 'Ledgers and transaction systems', color: 'bg-sky-50 text-sky-700' },
  { name: 'FinOps', detail: 'Reconciliation and reporting', color: 'bg-amber-50 text-amber-700' },
  { name: 'FinInfra', detail: 'Cloud, delivery and observability', color: 'bg-slate-100 text-slate-700' },
]
const steps = [
  { number: '01', title: 'Learn the foundations', text: 'Build shared knowledge of fintech, financial systems and the language teams use.' },
  { number: '02', title: 'Practice with your cohort', text: 'Work through guided labs, collaborate in squads and get feedback from instructors.' },
  { number: '03', title: 'Show what you can do', text: 'Complete practical projects and build evidence of your skills for what comes next.' },
]
const reveal = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1] } } }

function Reveal({ children, className = '', delay = 0 }) {
  return <motion.div className={className} variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.14 }} transition={{ delay }}>{children}</motion.div>
}

Reveal.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  delay: PropTypes.number,
}

export default function MarketingHome() {
  return (
    <div className="min-h-screen overflow-hidden bg-white text-deep-700">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <Link to="/" aria-label="BlueSPACE home" className="shrink-0"><img src="/logo-dark.png" alt="BlueSPACE Financial Cloud" className="h-9 w-auto sm:h-10" /></Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-gray-600 md:flex" aria-label="Main navigation">
            <a href="#tracks" className="transition-colors hover:text-[#0000ff]">Fellowships</a>
            <a href="#learning" className="transition-colors hover:text-[#0000ff]">How it works</a>
            <a href="#domains" className="transition-colors hover:text-[#0000ff]">Domains</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="border-gray-200"><Link to="/student-login">Sign in</Link></Button>
            <Button asChild size="sm" className="bg-[#0000ff] text-white hover:bg-[#0000cc]"><Link to="/register">Apply <ArrowRight size={14} className="ml-1.5" /></Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-10 sm:pt-14 md:grid-cols-[0.92fr_1.08fr] md:gap-12 md:pb-20 md:pt-16 lg:px-8 lg:pt-20">
          <Reveal>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#0000ff]"><span className="h-1.5 w-1.5 rounded-full bg-[#0000ff]" /> BlueSPACE Fintech Academy</div>
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-deep-700 sm:text-5xl lg:text-[3.65rem]">Build practical fintech skills. <span className="text-[#0000ff]">Deliver real work.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">A hands-on learning experience for people ready to understand, build and operate the systems behind financial services.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="h-11 bg-[#0000ff] px-5 text-white hover:bg-[#0000cc]"><Link to="/register">Explore the academy <ArrowRight size={16} className="ml-2" /></Link></Button>
              <Button asChild variant="outline" className="h-11 border-gray-200 px-5"><a href="#tracks">Explore fellowship tracks <ArrowDown size={15} className="ml-2" /></a></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600">
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#0000ff]" />Project-based learning</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#0000ff]" />Fintech-focused curriculum</span>
            </div>
          </Reveal>
          <Reveal delay={0.12} className="relative">
            <div className="relative overflow-hidden rounded-2xl bg-gray-100">
              <img src={images.hero} alt="A diverse group of learners collaborating around a laptop" className="h-[300px] w-full object-cover sm:h-[410px] lg:h-[480px]" fetchPriority="high" />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white p-4 shadow-lg sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-xs sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0000ff]">Learn by doing</p>
                <p className="mt-2 text-base font-semibold text-deep-700">Build confidence through real practice and thoughtful feedback.</p>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="border-y border-gray-100 bg-gray-50/80">
          <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:grid-cols-3 sm:gap-8 sm:py-7 lg:px-8">
            {[
              { icon: BookOpen, title: 'Structured learning', text: 'Clear foundations and focused tracks' },
              { icon: Users, title: 'Cohort collaboration', text: 'Learn alongside a supportive team' },
              { icon: BriefcaseBusiness, title: 'Industry context', text: 'Connect skills to real fintech work' },
            ].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#0000ff] shadow-sm"><Icon size={19} /></span><div><p className="text-sm font-semibold text-deep-700">{title}</p><p className="mt-0.5 text-xs text-gray-500 sm:text-sm">{text}</p></div></div>)}
          </div>
        </section>

        <section id="tracks" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8">
          <Reveal className="max-w-2xl"><p className="text-sm font-bold text-[#0000ff]">Fellowship tracks</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-deep-700 sm:text-4xl">Choose a path that fits your goals</h2><p className="mt-4 leading-7 text-gray-600">Both tracks start with shared fintech foundations, then move into practical domain work with guidance and feedback.</p></Reveal>
          <div className="mt-9 grid gap-5 md:grid-cols-2">
            {tracks.map(({ title, label, text, image, alt, icon: Icon }, index) => <Reveal key={title} delay={index * 0.1}>
              <article className="group h-full overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5">
                <div className="relative overflow-hidden"><img src={image} alt={alt} loading="lazy" className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-60" /><span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0000ff] shadow-sm"><Icon size={20} /></span></div>
                <div className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0000ff]">{label}</p><div className="mt-2 flex items-center justify-between"><h3 className="text-2xl font-bold text-deep-700">{title}</h3><ArrowUpRight size={19} className="text-gray-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#0000ff]" /></div><p className="mt-2 max-w-lg text-sm leading-6 text-gray-600">{text}</p></div>
              </article>
            </Reveal>)}
          </div>
        </section>

        <section id="learning" className="scroll-mt-24 bg-gray-50">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:py-20 md:grid-cols-[0.8fr_1.2fr] md:items-center lg:px-8">
            <Reveal><p className="text-sm font-bold text-[#0000ff]">A practical journey</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-deep-700 sm:text-4xl">From learning to confident delivery</h2><p className="mt-4 leading-7 text-gray-600">Move through a clear path that connects the concepts to the kind of work fintech teams do every day.</p><Link to="/register" className="mt-6 inline-flex items-center text-sm font-semibold text-[#0000ff] hover:underline">Start your application <ArrowRight size={15} className="ml-2" /></Link></Reveal>
            <div className="space-y-3">{steps.map((step, index) => <Reveal key={step.number} delay={index * 0.08}><div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:gap-5 sm:p-5"><span className="pt-0.5 text-sm font-bold tracking-wide text-[#0000ff]">{step.number}</span><div><h3 className="font-semibold text-deep-700">{step.title}</h3><p className="mt-1 text-sm leading-6 text-gray-600">{step.text}</p></div></div></Reveal>)}</div>
          </div>
        </section>

        <section id="domains" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8">
          <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><p className="text-sm font-bold text-[#0000ff]">AI Fintech Factory</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-deep-700 sm:text-4xl">Explore the systems behind fintech</h2></div><p className="max-w-md text-sm leading-6 text-gray-600">Build a wider view of the technology and operations that make modern financial services work.</p></Reveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{domains.map((domain, index) => <Reveal key={domain.name} delay={index * 0.05}><article className="h-full rounded-xl border border-gray-200 p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"><span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${domain.color}`}>{domain.name}</span><p className="mt-4 text-sm leading-6 text-gray-600">{domain.detail}</p></article></Reveal>)}</div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16 sm:pb-20 lg:px-8">
          <Reveal><div className="grid overflow-hidden rounded-2xl bg-deep-800 md:grid-cols-[1fr_0.85fr]">
            <div className="p-7 text-white sm:p-10 lg:p-12"><span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-200"><Layers3 size={16} /> Learn together. Build with purpose.</span><h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">Ready to build your fintech skills?</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/75">Join a learning community focused on practical skills, meaningful projects and the future of financial services.</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild className="bg-[#0000ff] text-white hover:bg-[#0000cc]"><Link to="/register">Start an application <ArrowRight size={15} className="ml-2" /></Link></Button><Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/student-login">Sign in</Link></Button></div></div>
            <div className="min-h-52 md:min-h-full"><img src={images.project} alt="Colleagues collaborating on a project" loading="lazy" className="h-full min-h-52 w-full object-cover" /></div>
          </div></Reveal>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 sm:grid-cols-[1fr_auto] sm:items-center lg:px-8">
          <div><Link to="/" aria-label="BlueSPACE home"><img src="/logo-dark.png" alt="BlueSPACE Financial Cloud" className="h-9 w-auto" /></Link><p className="mt-3 max-w-md text-sm leading-6 text-gray-500">Practical fintech learning for the people building and operating what comes next.</p></div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-gray-600"><a href="#tracks" className="hover:text-[#0000ff]">Fellowships</a><a href="#learning" className="hover:text-[#0000ff]">How it works</a><Link to="/instructor-login" className="hover:text-[#0000ff]">Instructor sign in</Link><Link to="/partner-login" className="hover:text-[#0000ff]">Partner sign in</Link><Link to="/admin-login" className="hover:text-[#0000ff]">Academy staff</Link></div>
          <div className="border-t border-gray-200 pt-5 text-xs text-gray-500 sm:col-span-2">© {new Date().getFullYear()} BlueSPACE Fintech Academy</div>
        </div>
      </footer>
    </div>
  )
}
