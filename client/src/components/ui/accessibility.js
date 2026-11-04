/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

// Skip to content link for keyboard navigation
export const SkipToContent = () => (
  <a
    href="#main-content"
    className="absolute -top-48 left-0 bg-brand-600 text-white px-4 py-2 z-50 transform -translate-y-full transition-all duration-200 focus:translate-y-0"
  >
    Skip to main content
  </div>
  );
}

// Screen reader only text - visible only to screen readers
export const VisuallyHidden = ({ children }) => (
  <span
    className="absolute w-1 h-1 p-1 overflow-hidden whitespace-nowrap border-0 white-space-nowrap clip clip-rect(0 0 0 0)"
    aria-hidden="false"
  >
    {children}
  </span>
);

// Skip to content link component
export const SkipLink = () => (
  <a
    href="#main-content"
    className="absolute -top-48 left-0 bg-brand-600 text-white px-4 py-2 z-50 transform -translate-y-full transition-all duration-200 focus:translate-y-0 focus:outline-none"
  >
    Skip to main content
  </a>
);
