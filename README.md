# North Carolina (Junior) Math Olympiad

A small, self-contained Flask/Jinja site that builds to static HTML for GitHub Pages. Fonts, illustrations, CSS, and JavaScript are served locally. No database, API keys, or frontend framework is required.

## Reviewing the redesign

The published site uses the Proof identity: an open-square mark, nested-square illustrations, and a three-dot mathematical accent. The wordmark uses a clear, full-size J. FAQs start collapsed and use native browser controls to open with a click or keyboard.

Page headings identify their purpose directly. The homepage has a registration placeholder awaiting confirmed future contest details; the original 2026 form remains in the footer. PDFs and external websites open in new tabs, while site navigation stays in the current tab. Archive entries use compact rows with readable labels and generous tap targets.

Screenshots of the initial redesign are retained in [docs/review](docs/review/README.md). Merging into `2026` triggers the existing GitHub Pages deployment; keep unapproved changes on review branches.

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

The existing workflow in `.github/workflows/static.yml` uploads **committed `output` files**. It does not build templates. After editing source, run the build and commit the generated HTML/CSS together. Deployment happens only on pushes to `2026` or a manually requested workflow; this redesign branch does not deploy.

## Where to edit

- `templates/base.j2`: shared navigation, metadata, fonts, and footer.
- `templates/index.j2`: homepage, contest status, and historical schedule.
- `templates/about.j2`: rules, scoring, division advice, and FAQs.
- `templates/contact.j2`: inquiry composer and the public email address.
- `templates/archive.j2`: one `editions` list defines years and AoPS destinations. Add new PDFs under `output/static/YEAR/` using the existing filenames. The filter options and archive rows are generated from that list.
- `templates/staff.j2`: leadership and test-solver biographies.
- `custom.scss`: colors, type, spacing, responsive layout, and motion preferences.
- `output/static/site.js`: mobile navigation, archive filters, and restrained scroll interactions. Content stays visible before animation setup and works without JavaScript. Reduced-motion preferences disable entrances and filter transitions, including when the preference changes while browsing.
- `output/static/contact.js`: email-app/Gmail drafts and copy-address feedback. It loads only on the Contact page; messages stay in the page and are not stored or sent by the site.
- `output/static/mark.svg`: the simple open-square logo, shared by the header, homepage, and browser tab so their proportions and colors match. It uses forest green and coral on a warm-paper backplate, which blends into the page and stays visible on dark tabs. The homepage mark is small on desktop and hidden on mobile; other pages have plain headers. `geometry.svg`, `spark.svg`, and `favicon.svg` retain earlier asset URLs for compatibility.

Fonts are Lora for display headings, team names, and initials, and DM Sans for body text, distributed locally under the included SIL Open Font Licenses. Lora gives the contest name and other headings a conventional uppercase J. Earlier Fraunces and Bootstrap files remain available for compatibility with old static asset URLs; the redesigned pages do not load them or depend on external CDNs.

## Contact and contest rules

Header and footer Contact links open `/contact/`; the footer also shows `ncmatholy@gmail.com`. Visitors can write an inquiry and choose Open email app or Open Gmail draft, then review and send it from their own account. Open email app invokes the configured mail handler from a hidden frame during the user’s click, keeping the contact form and typed message intact without creating a browser tab. If a visitor has no email app configured, Gmail and copy-address options remain available. No mail server or external form service is configured. Direct email and Gmail links remain usable without JavaScript. Adding delivery directly from the site would require an email service and its setup.

The About page's Rules & scoring section uses the published 2025 NCJMO and NCMO instructions: five problems, three hours, seven points per problem, and grading based on completeness, clarity, and correctness. These PDFs remain unchanged. The organizers supplied the BAMO-style format and approximate difficulty comparisons: NCJMO is similar to BAMO-8; NCMO is approximately USAJMO. No external contest's eligibility, awards, or submission rules have been assumed.

## Checks

```sh
npm run build
npm test
npm run test:browser
```

Browser tests use Playwright and axe against the built static output. The prepared environment uses `/usr/bin/chromium`. On another machine, install a Playwright browser with `npx playwright install chromium`; alternatively set `CHROMIUM_PATH` to a local Chromium executable. The browser suite starts its own static server on port 8765 and tests desktop/mobile layouts, keyboard behavior, filters, reduced motion, no-JavaScript access, and all PDFs. `npm test` verifies Flask routes, the generated HTML, and document links.

## Content that needs an organizer's review

- The original homepage said grading was in progress, but the archive already linked the 2026 results-and-solutions PDF. The published site shows the existing results and retains the earlier message in a historical note.
- The January 24–25, 2026 schedule and snowstorm updates describe the concluded contest. They are retained in the homepage's expandable historical section. Original times are unchanged; the existing site did not explicitly specify a timezone.
- The registration link is preserved and identified as the original form for the concluded 2026 contest. Its current acceptance status has not been assumed.
- Staff biographies are preserved from the latest rendered site; school years and time-sensitive achievements may need updating. No new biographies, contest dates, eligibility rules, or organizer information have been invented.
