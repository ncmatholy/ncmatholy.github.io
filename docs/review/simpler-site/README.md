# Simpler website review

The homepage now uses the exact same open-square logo as the header, kept small on desktop and hidden on mobile. The orange corner is slightly larger than the outline’s thickness, and its outer edges line up with the frame. The construction grid, nested squares, page decorations, results-banner drawing, and division-card sigma/infinity symbols have been removed. The orange accent after the header wordmark is a circle.

Important visible text stays at least 16px on desktop and mobile. Archive filters and rows use the shorter NCMO/NCJMO names, with centered vector icons. Every Open PDF arrow points to the top right, and its hover and keyboard-focus motion follows that direction. All existing document and navigation destinations remain available.

The About and Team introductions now use plain descriptions: “Rules, scoring, and divisions for NC(J)MO” and “Meet the organizers and test solvers.” The homepage introduction also states only the two competition names and proof-based format.

These screenshots show desktop (1440px) and mobile (390px) layouts:

| Section | Desktop | Mobile |
| --- | --- | --- |
| Homepage and registration | [View](home-hero-desktop.png) | [View](home-hero-mobile.png) |
| Results banner | [View](home-results-desktop.png) | [View](home-results-mobile.png) |
| Division cards | [View](home-divisions-desktop.png) | [View](home-divisions-mobile.png) |
| Past problems | [View](archive-desktop.png) | [View](archive-mobile.png) |

[Header wordmark with circular accent](brand.png)

Validation: the static build and five Python checks passed, including all six original PDFs and existing URL forms. Browser checks passed for accessibility, local links, reduced motion, archive filtering, keyboard navigation, and email-draft behavior. All five main pages were also checked at 1440, 1024, 768, 390, and 320px: no page overflow, clipped text, or clipped actions; visible text is at least 16px. The historical schedule remains readable through its mobile table scroller.
