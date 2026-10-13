## 2026-10-09 - Footer ARIA Landmark Preservation
**Learning:** HTML5 `<footer>` elements lose their implicit `contentinfo` ARIA landmark role if nested inside a `<main>` tag, degrading screen reader navigation.
**Action:** Always place site-wide `<footer>` elements as direct children of `<body>` (outside `<main>`) to preserve screen reader accessibility and navigation landmarks.
## 2024-10-13 - Smooth CSS Animations for Transforms
**Learning:** When a CSS class defines a hover or active state that applies a `transform` (e.g., `transform: translateY(-4px);` or `transform: scale(0.96);`), the base class's `transition` property must explicitly include `transform` to guarantee a smooth animation and prevent visual snapping.
**Action:** Always verify that interactive elements with transform-based state changes have `transform` explicitly defined in their base transition property.
