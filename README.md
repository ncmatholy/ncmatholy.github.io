# North Carolina (Junior) Math Olympiad

A small, self-contained Flask/Jinja site that builds to static HTML for GitHub Pages. Fonts, illustrations, CSS, and JavaScript are served locally. No database, API keys, or frontend framework is required.

## Reviewing the redesign

The published site uses the Circular NC identity: an open circular C surrounding an N, with a coral diagonal. The wordmark uses a clear, full-size J. FAQs start collapsed and use native browser controls to open with a click or keyboard.

Page headings identify their purpose directly. The homepage has a registration placeholder awaiting confirmed future contest details and a plain contest-format summary; the original 2026 form remains in the footer. PDFs and external websites open in new tabs, while site navigation stays in the current tab. Archive entries use compact rows with readable labels and generous tap targets. The About page provides a format table, scoring guidance, permitted materials, and instructions for writing and labeling solutions.

[Current homepage and rules screenshots](docs/review/circular-nc/README.md) show the Circular NC logo and the revised content in light, dark, and mobile layouts. Screenshots of the initial redesign are retained in [docs/review](docs/review/README.md). Merging into `2026` triggers the existing GitHub Pages deployment; keep unapproved changes on review branches.

For a working local preview, prepare dependencies and run the commands below. `npm run preview` serves the committed static output exactly as Pages does, apart from Pages' custom 404 handling. `npm run dev` renders the templates directly and reloads them as you edit.

## Local setup

Validated with Python 3.12 and Node 24. A Python environment is required even though the public website is static.

```sh
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
npm ci
npm run build
npm run preview
```

Open the address printed by the preview server. Windows users can activate Python with `.venv\Scripts\activate` instead. In the prepared Codex environment, activate `/workspace/.venvs/ncmatholy/bin/activate`.

To edit templates and see changes immediately:

```sh
npm run dev
```

In another terminal, run `npm run watch` while changing `custom.scss`. This updates the compiled stylesheet; browser refresh shows the changes. Stop a server with Ctrl+C.

## Build and publish

`npm run build` compiles `custom.scss` to `output/static/site.css`, then runs `app.py` to render all templates. It writes both `/about.html` and `/about/index.html` (likewise archive, staff, and contact), preserving old URLs and supporting trailing slashes. Documents and Google verification remain untouched.

Shared styles, JavaScript, and illustrations receive automatic content-version URLs during rendering, so returning visitors receive updated behavior and artwork after a deployment.

Favicons use stable URLs for search engines. After changing `output/static/mark.svg`, run `npm run build:icons` and then `npm run build`, and commit the exported icons with the HTML. The icon exporter uses the existing Playwright browser setup described under Checks; ordinary site builds do not require a browser. It generates a 96px PNG, an ICO with 16/32/48/96px frames, and the legacy `/static/favicon.svg` alias from the same centered SVG. Search results may retain their cached icon until the search engine recrawls and processes the site; an owner can request homepage reindexing through Google Search Console.

The existing workflow in `.github/workflows/static.yml` uploads **committed `output` files**. It does not build templates. After editing source, run the build and commit the generated HTML/CSS together. Deployment happens only on pushes to `2026` or a manually requested workflow; this redesign branch does not deploy.

## Where to edit

- `templates/base.j2`: shared navigation, theme toggle, metadata, fonts, and footer.
- `templates/marks.j2`: shared inline logo geometry; its colors follow the active theme.
- `templates/icons.j2`: shared link-arrow macro. Use `link_arrow()` for same-tab navigation and `link_arrow(true)` for links with `target="_blank"`. Hover/focus movement follows the actual link target; reduced motion disables it.
- `templates/index.j2`: homepage, contest status, and historical schedule.
- `templates/about.j2`: rules, scoring, division advice, and FAQs.
- `templates/contact.j2`: inquiry composer and the public email address.
- `templates/archive.j2`: one `editions` list defines years and AoPS destinations. Add new PDFs under `output/static/YEAR/` using the existing filenames. The filter options and archive rows are generated from that list.
- `templates/staff.j2`: leadership and test-solver biographies.
- `custom.scss`: colors, type, spacing, responsive layout, and motion preferences.
- `output/static/site.js`: mobile navigation, archive filters, and restrained scroll interactions. Content stays visible before animation setup and works without JavaScript. Reduced-motion preferences disable entrances and filter transitions, including when the preference changes while browsing.
- `output/static/theme.js`: applies the theme before the stylesheet loads. Light mode is the default regardless of device preferences. The header toggle saves an explicit light/dark choice under `ncjmo-theme` in browser storage; a saved choice takes precedence over the default. Storage restrictions still allow toggling on the current page. Other open tabs follow saved changes; clearing the saved choice restores light mode. Without JavaScript, the site stays in light mode and the toggle stays hidden.
- `output/static/contact.js`: email-app/Gmail drafts and copy-address feedback. It loads only on the Contact page; messages stay in the page and are not stored or sent by the site.
- `output/static/mark.svg`: the browser-tab version of the Circular NC logo, using forest green and coral on a warm-paper backplate that stays visible on dark tabs. Its group is shifted 4.2 SVG units to center the visible mark within the backplate; the C's open side makes its visible bounds asymmetric. The header and homepage use the identical geometry from `templates/marks.j2`, with forest green in light mode and pale mint in dark mode. The homepage mark is small on desktop and hidden on mobile; other pages have plain headers. `geometry.svg` and `spark.svg` retain earlier illustration URLs for compatibility; `favicon.svg` is refreshed with the current logo by the icon exporter.
- `scripts/build-favicons.js`: exports `output/favicon.ico`, `output/favicon-96.png`, and `output/static/favicon.svg` from `mark.svg`. Keep the stable icon URLs in `templates/base.j2`; search-engine refresh timing is outside the site's control.

Fonts are Lora for display headings, team names, and initials, and DM Sans for body text, distributed locally under the included SIL Open Font Licenses. Lora gives the contest name and other headings a conventional uppercase J. Earlier Fraunces and Bootstrap files remain available for compatibility with old static asset URLs; the redesigned pages do not load them or depend on external CDNs.

## Contact and contest rules

Header and footer Contact links open `/contact/`; the footer also shows `ncmatholy@gmail.com`. Visitors can write an inquiry and choose Open email app or Open Gmail draft, then review and send it from their own account. Open email app invokes the configured mail handler from a hidden frame during the user’s click, keeping the contact form and typed message intact without creating a browser tab. If a visitor has no email app configured, Gmail and copy-address options remain available. No mail server or external form service is configured. Direct email and Gmail links remain usable without JavaScript. Adding delivery directly from the site would require an email service and its setup.

The About page's Rules & scoring section uses the published 2025 NCJMO and NCMO instructions: five problems, three hours, seven points per problem, grading based on completeness, clarity, and correctness, permitted tools, and contestant/problem/page labels. Useful progress can receive partial credit; no detailed grading rubric is invented. The page-label instructions are attributed to the published papers rather than treated as a future online submission procedure. These PDFs remain unchanged. The organizers supplied the BAMO-style format and approximate difficulty comparisons: NCJMO is similar to BAMO-8; NCMO is approximately USAJMO. No external contest's eligibility, awards, or submission rules have been assumed.

## Checks

```sh
npm run build
npm test
npm run test:browser
```

Browser tests use Playwright and axe against the built static output. The prepared environment uses `/usr/bin/chromium`. On another machine, install a Playwright browser with `npx playwright install chromium`; alternatively set `CHROMIUM_PATH` to a local Chromium executable. The browser suite starts its own static server on port 8765 and tests desktop/mobile layouts, keyboard behavior, filters, reduced motion, no-JavaScript access, and all PDFs. `npm test` verifies Flask routes, the generated HTML, and document links.

## Content that needs an organizer's review

- The original homepage said grading was in progress, but the archive already linked the 2026 results-and-solutions PDF. The published site now links those results; the earlier discrepancy is documented here.
- The January 24–25, 2026 schedule and snowstorm updates describe the concluded contest. They are retained in the homepage's expandable historical section. Original times are unchanged; the existing site did not explicitly specify a timezone.
- The registration link is preserved and identified as the original form for the concluded 2026 contest. Its current acceptance status has not been assumed.
- Staff biographies are preserved from the latest rendered site; school years and time-sensitive achievements may need updating. No new biographies, contest dates, eligibility rules, or organizer information have been invented.
