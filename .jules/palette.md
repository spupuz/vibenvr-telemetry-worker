## 2026-10-09 - Footer ARIA Landmark Preservation
**Learning:** HTML5 `<footer>` elements lose their implicit `contentinfo` ARIA landmark role if nested inside a `<main>` tag, degrading screen reader navigation.
**Action:** Always place site-wide `<footer>` elements as direct children of `<body>` (outside `<main>`) to preserve screen reader accessibility and navigation landmarks.

## $(date +%Y-%m-%d) - Fix CSS Transition Snapping
**Learning:** When adding CSS hover or focus states that include structural changes like `transform` (e.g., `translateY`), omitting `transform` from the base class's `transition` property results in an instant, jarring visual jump instead of a smooth animation.
**Action:** Always verify that all properties modified in a pseudo-class (hover/focus/active) are explicitly included in the base class's `transition` list, especially hardware-accelerated properties like `transform`.
