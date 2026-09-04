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
**Action:** When creating elements with CSS overflow scrolling, always ensure they include `tabindex="0"`, `role="region"`, and an accessible name (e.g., `aria-labelledby="[id-of-title]"`) so users can focus on the container and scroll it using arrow keys.

## 2026-10-25 - Explicit Toggle States and Single-key Shortcuts
**Learning:** Toggle buttons should always use action verbs describing the result (e.g., "Switch to Light Mode") rather than ambiguously displaying the destination state ("Light Mode"), which can be misconstrued as current status. Additionally, when implementing single-key global shortcuts (like 'T'), missing modifier checks can trigger the UI state when users type in input fields or use OS-level shortcuts.
**Action:** Consistently pair toggle texts with explicit verbs, and implement robust event listener checks (`!e.ctrlKey && !e.altKey && !e.metaKey` and `activeElement` tag exclusion) for single-letter keyboard shortcuts.

## 2026-11-12 - Visual Affordance for Keyboard Shortcuts
**Learning:** Keyboard shortcuts hidden in `title` attributes (e.g. "Switch to Light Mode (T)") are often missed by users who do not hover, reducing the discoverability of power-user features.
**Action:** Expose single-key global shortcuts visually within the button UI using `<kbd>` elements, while hiding them on mobile devices where hardware keyboards are typically unavailable.

## 2026-09-01 - Prevent keyboard shortcuts from breaking button context and improve badge clarity
**Learning:** Adding `<kbd>` tags inside buttons causes screen readers to append the key character to the button's name (e.g. "Switch to Dark Mode T"). Additionally, standalone numbers in badges (like GitHub stars) lack context when read by screen readers.
**Action:** Always add `aria-hidden="true"` to visual keyboard hints inside interactive elements. For badges displaying standalone data, use a `.sr-only` utility class to add descriptive words (like "stars") for screen readers.
## 2026-08-31 - Undefined CSS Variables Break Text Contrast
**Learning:** Incorrect CSS variable references (e.g. `var(--muted)` instead of `var(--text-muted)`) silently fail, falling back to body text color which can ruin visual hierarchy in dense data dashboards without throwing any developer warnings. Similarly, missing palette definitions (like `--err` for negative trends) can cause critical user feedback to blend in or adopt misleading primary colors.
**Action:** Always verify that mapped CSS variables exist in the `:root` definitions. When adding missing state variables (like error states), ensure they are added to both base `:root` and `.dark` modifier blocks to maintain consistency across theme toggles.
## 2026-11-20 - Adding Accessibility Labels to Canvas Charts
**Learning:** HTML `<canvas>` elements are completely opaque to screen readers, meaning users who rely on assistive technologies will miss all visual data representations unless explicitly labeled, leading to a broken or incomplete dashboard experience.
**Action:** Always add `role="img"` and descriptive `aria-label` attributes to `<canvas>` elements that display charts or graphs so they can be announced properly by screen readers with the necessary context.
## 2026-11-20 - Ensure CSS Variables For Theme-Responsive Components
**Learning:** Hardcoding hex values like `#ef4444` in theme-agnostic elements (e.g. `.err-box`) breaks their ability to adapt when switching between Light/Dark mode.
**Action:** Always reference CSS variables (`var(--err)`) instead of hex values when styling elements so they respond to the root theme definition.

## 2026-11-20 - Prevent Screen Readers from Announcing Decorative Dividers
**Learning:** Decorative inline text nodes used as visual dividers (e.g., `|` in footers) are read aloud by screen readers (e.g. "vertical bar"), creating a noisy, confusing experience.
**Action:** Wrap decorative text characters in elements with `aria-hidden="true"` to hide them from assistive technology.
