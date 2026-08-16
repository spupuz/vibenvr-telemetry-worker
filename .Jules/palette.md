## 2024-08-11 - Adding aria-live to dynamic elements
**Learning:** Screen readers miss dynamic status updates like spinners or error bars that toggle `display` unless instructed to monitor them.
**Action:** Add `role="status" aria-live="polite"` to loaders and `role="alert" aria-live="assertive"` to error messages.
## 2024-08-13 - Add Accessibility to SVGs and Support Reduced Motion
**Learning:** The dashboard UI uses inline SVGs for icons adjacent to labels, which should be explicitly hidden from screen readers using `aria-hidden="true"` to prevent redundant or confusing readouts. Additionally, the dashboard features CSS animations that do not check for reduced motion preferences by default.
**Action:** Consistently add `aria-hidden="true"` to purely decorative SVGs across the template and incorporate `@media (prefers-reduced-motion: reduce)` in the CSS block for all future UI features.
## 2024-05-23 - Visual Affordance for Tooltips and Toggle Button A11y
**Learning:** Non-interactive elements like generic cards using 'title' tooltips lack visual affordance (sighted users don't know they have a tooltip). Also, theme toggles need 'aria-pressed' to explicitly communicate their state as a toggle switch to screen readers.
**Action:** Always add 'cursor: help' to non-interactive elements containing informative 'title' attributes, and 'aria-pressed' to toggle buttons that maintain state.
## 2024-08-15 - Action-oriented Toggle Buttons vs aria-pressed
**Learning:** When changing a toggle button's text to show the *destination* state (e.g., changing from showing "Dark Mode" to "Light Mode" when currently in Dark Mode), the `aria-pressed` attribute becomes semantically incorrect and confusing for screen readers because the label itself is changing.
**Action:** When converting a state-oriented toggle to an action-oriented toggle (by swapping labels and icons to the destination state), ensure you remove the `aria-pressed` attribute from both the HTML and the JavaScript state handlers.
