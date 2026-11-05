import { motion } from 'framer-motion'
import PropTypes from 'prop-types'

const ease = [0.23, 1, 0.32, 1]

export default function AuthSplitLayout({ image, imageAlt, headline, description, children }) {
  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      <aside className="relative hidden min-h-screen w-1/2 overflow-hidden bg-deep-600 lg:flex lg:items-center lg:justify-center" aria-label={imageAlt}>
        <img
          src={image}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
          onError={(event) => { event.currentTarget.style.display = 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bluespace-700/90 via-bluespace-600/75 to-transparent" />
        <motion.img
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          src="/logo-white.png"
          alt="BlueSPACE Fintech Academy"
          className="absolute left-8 top-8 z-20 h-12 w-auto"
        />
        <div className="relative z-10 max-w-lg px-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.1 }}
            className="mb-4 text-3xl font-bold text-white"
          >
            {headline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.2 }}
            className="text-sm leading-relaxed text-white/90"
          >
            {description}
          </motion.p>
        </div>
      </aside>
      <main className="relative flex min-h-screen w-full flex-col lg:w-1/2">
        <div className="absolute left-6 top-6 z-20 rounded-md bg-bluespace-700 px-2 py-1.5 lg:hidden">
          <img src="/logo-white.png" alt="BlueSPACE Fintech Academy" className="h-8 w-auto" />
        </div>
        {children}
      </main>
    </div>
  )
}

AuthSplitLayout.propTypes = {
  image: PropTypes.string.isRequired,
  imageAlt: PropTypes.string.isRequired,
  headline: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}
