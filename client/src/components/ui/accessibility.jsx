export function SkipToContent() {
  return <a href="#main-content" className="absolute -top-48 left-0 z-50 bg-brand-600 px-4 py-2 text-white transition-transform focus:translate-y-0">Skip to main content</a>
}

export function VisuallyHidden({ children }) {
  return <span className="sr-only">{children}</span>
}

export function SkipLink() {
  return <a href="#main-content" className="absolute -top-48 left-0 z-50 bg-brand-600 px-4 py-2 text-white transition-transform focus:translate-y-0 focus:outline-none">Skip to main content</a>
}

