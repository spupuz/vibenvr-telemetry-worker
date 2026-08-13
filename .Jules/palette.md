## 2024-08-11 - Adding aria-live to dynamic elements
**Learning:** Screen readers miss dynamic status updates like spinners or error bars that toggle `display` unless instructed to monitor them.
**Action:** Add `role="status" aria-live="polite"` to loaders and `role="alert" aria-live="assertive"` to error messages.
## 2024-08-13 - Add Accessibility to SVGs and Support Reduced Motion
**Learning:** The dashboard UI uses inline SVGs for icons adjacent to labels, which should be explicitly hidden from screen readers using `aria-hidden="true"` to prevent redundant or confusing readouts. Additionally, the dashboard features CSS animations that do not check for reduced motion preferences by default.
**Action:** Consistently add `aria-hidden="true"` to purely decorative SVGs across the template and incorporate `@media (prefers-reduced-motion: reduce)` in the CSS block for all future UI features.
