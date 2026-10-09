## 2026-10-09 - Footer ARIA Landmark Preservation
**Learning:** HTML5 `<footer>` elements lose their implicit `contentinfo` ARIA landmark role if nested inside a `<main>` tag, degrading screen reader navigation.
**Action:** Always place site-wide `<footer>` elements as direct children of `<body>` (outside `<main>`) to preserve screen reader accessibility and navigation landmarks.
