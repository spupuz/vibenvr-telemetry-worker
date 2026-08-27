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

## 2024-08-20 - Combine CSS and JS for Reduced Motion Checks
**Learning:** While CSS can handle `prefers-reduced-motion` for style-based transitions, custom JavaScript-driven animations (like dynamic number counters powered by `requestAnimationFrame`) require an explicit `window.matchMedia('(prefers-reduced-motion: reduce)')` check to respect accessibility preferences.
**Action:** Always implement a JavaScript check to bypass custom JS animations for users with vestibular motion sensitivities.

## 2024-08-25 - Skip to Content Links
**Learning:** Keyboard-only and screen reader users are forced to tab through the entire navigation menu on every page load unless a bypass mechanism is provided.
**Action:** Always include a visually hidden "Skip to main content" link as the first focusable element in the document body that becomes visible on focus and links directly to the main content area.

## 2026-08-27 - Keyboard Accessibility for CSS Scrollable Containers
**Learning:** CSS scrollable containers (e.g., `overflow: auto` or `overflow-y: auto`) are not inherently keyboard-navigable or accessible to screen readers, which can trap users or hide content. In `src/dashboard.js`, a leaderboard table was placed in a scrollable div without keyboard support.
**Action:** When creating elements with CSS overflow scrolling, always ensure they include `tabindex="0"`, `role="region"`, and an accessible name (e.g., `aria-label` or `aria-labelledby`) so users can focus on the container and scroll it using arrow keys.
