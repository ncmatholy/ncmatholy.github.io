const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const routes = ['/', '/about/', '/staff/', '/archive/', '/contact/', '/404.html'];

for (const route of routes) {
  test(`${route} renders an accessible layout with working local links and assets`, async ({ page, request }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const response = await page.goto(route);
    expect(response.ok()).toBeTruthy();
    await page.evaluate(() => document.fonts.ready);
    // Contrast checks should inspect the final page, after the entrance fade.
    await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished)));
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();

    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);

    // Validate destinations and assets from the rendered page.
    const paths = await page.evaluate(() => [...new Set(
      [...document.querySelectorAll('a[href], img[src], script[src], link[href]')]
        .map(element => new URL(element.getAttribute('href') || element.getAttribute('src'), location.href))
        .filter(url => url.origin === location.origin)
        .map(url => url.pathname)
    )]);
    for (const path of paths) {
      expect((await request.get(path)).ok(), `Broken local link or asset: ${path}`).toBeTruthy();
    }
    expect(errors).toEqual([]);
  });
}

test('keyboard users can skip navigation and reach main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('FAQ answers start closed and open with mouse or keyboard', async ({ page }) => {
  await page.goto('/about/');
  const answers = page.locator('.faq-list details > p');
  await expect(answers).toHaveCount(2);
  for (const answer of await answers.all()) await expect(answer).toBeHidden();

  const summaries = page.locator('.faq-list summary');
  await summaries.nth(0).click();
  await expect(answers.nth(0)).toBeVisible();
  await expect(answers.nth(1)).toBeHidden();
  await summaries.nth(0).focus();
  await page.keyboard.press('Enter');
  await expect(answers.nth(0)).toBeHidden();
  await summaries.nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(answers.nth(1)).toBeVisible();
});

test('mobile navigation opens with a keyboard, closes with Escape, and follows links', async ({ page }) => {
  test.skip(page.viewportSize().width > 760, 'The menu is only used on narrow screens.');
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /^(Menu|Close)$/ });
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).toBeHidden();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(navigation.getByRole('link', { name: 'About the contest' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await expect(navigation).toBeHidden();
  await page.keyboard.press('Enter');
  const contact = navigation.getByRole('link', { name: 'Contact', exact: true });
  await contact.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/contact/');
  await expect(page.getByRole('heading', { level: 1, name: 'Contact' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).toBeHidden();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/about/');
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
});

test('rules and scoring explain the format and each division’s difficulty', async ({ page }) => {
  await page.goto('/about/#rules-scoring');
  const rules = page.locator('#rules-scoring');
  await expect(rules).toBeVisible();
  await expect(rules).toContainText(/five problems|5 problems/i);
  await expect(rules).toContainText(/three[- ]hours?|3[- ]hours?/i);
  await expect(rules).toContainText(/7 points/);
  await expect(rules).toContainText(/35 points/);
  await expect(page.locator('#divisions')).toContainText(/BAMO.?8/);
  await expect(page.locator('#divisions')).toContainText(/USAJMO/);
});

test('Gmail drafts preserve typed content and open independently of the contact page', async ({ page, context }) => {
  // Mock Gmail rather than visiting an account or sending an inquiry.
  await context.route('https://mail.google.com/**', route => route.fulfill({
    contentType: 'text/html',
    body: '<title>Gmail draft test</title><p>Draft destination</p>',
  }));
  await page.goto('/contact/');
  const subject = 'Competition inquiry: π & + / next year?';
  const message = 'Hello NC(J)MO!\nCan you explain “partial credit” & 7 + 7?\n谢谢 — José';
  await page.getByRole('textbox', { name: 'Subject', exact: true }).fill(subject);
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill(message);

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Open Gmail draft' }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  const destination = new URL(popup.url());
  expect(destination.origin).toBe('https://mail.google.com');
  expect(destination.searchParams.get('to')).toBe('ncmatholy@gmail.com');
  expect(destination.searchParams.get('su')).toBe(subject);
  expect(destination.searchParams.get('body')).toBe(message);
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  await expect(page).toHaveURL('/contact/');
  await expect(page.getByRole('textbox', { name: 'Subject', exact: true })).toHaveValue(subject);
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue(message);
  await expect(page.locator('#contact-draft-status')).toContainText('Review and send your draft in Gmail.');
  await popup.close();
});

test('email drafts validate required messages and preserve their encoded contents', async ({ page }) => {
  await page.goto('/contact/');
  const subjectInput = page.getByRole('textbox', { name: 'Subject', exact: true });
  const messageInput = page.getByRole('textbox', { name: 'Message', exact: true });
  const compose = page.getByRole('button', { name: 'Open email draft' });
  const subject = 'π, proofs & a + sign?';
  const message = 'First line & second question?\nTwo + two = four.\n你好';
  await subjectInput.fill(subject);

  // Chromium reports requests to open an email application through CDP.
  // Inspect the native launch request without accessing a mail account or sending mail.
  const session = await page.context().newCDPSession(page);
  await session.send('Page.enable');
  const requestedDrafts = [];
  session.on('Page.windowOpen', event => {
    if (event.url.startsWith('mailto:')) requestedDrafts.push(event.url);
  });
  await compose.click();
  await expect(messageInput).toBeFocused();
  await expect(page.locator('#contact-draft-status')).toBeEmpty();
  expect(requestedDrafts).toEqual([]);
  await expect(subjectInput).toHaveValue(subject);
  await expect(page).toHaveURL('/contact/');

  await messageInput.fill(message);
  await compose.click();
  await expect.poll(() => requestedDrafts.length).toBe(1);
  const destination = new URL(requestedDrafts[0]);
  expect(destination.protocol).toBe('mailto:');
  expect(destination.pathname).toBe('ncmatholy@gmail.com');
  expect(destination.searchParams.get('subject')).toBe(subject);
  expect(destination.searchParams.get('body')).toBe(message);
  await expect(page).toHaveURL('/contact/');
  await expect(subjectInput).toHaveValue(subject);
  await expect(messageInput).toHaveValue(message);
  await expect(page.locator('#contact-draft-status')).toContainText('Review and send the draft in your email app.');
  await session.detach();
});

test('the contact address can be copied to the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/contact/');
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.locator('#contact-copy-status')).toHaveText('Email address copied.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('ncmatholy@gmail.com');
});

test('a denied clipboard selects and focuses the address for manual copying', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => { throw new DOMException('Clipboard denied', 'NotAllowedError'); },
      },
    });
  });
  await page.goto('/contact/');
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.locator('#contact-copy-status')).toHaveText('Select and copy the email address above: ncmatholy@gmail.com.');
  await expect(page.locator('#contact-email-address')).toBeFocused();
  expect(await page.evaluate(() => window.getSelection().toString())).toBe('ncmatholy@gmail.com');
});

test('archive filters preserve shared results and browser history', async ({ page }) => {
  await page.goto('/archive/');
  const visibleDocuments = page.locator('[data-division]:visible');
  await expect(visibleDocuments).toHaveCount(6);
  await page.locator('[data-filter="NCJMO"]').click();
  await expect(visibleDocuments).toHaveCount(4);
  await expect(page.locator('[data-division="both"]:visible')).toHaveCount(2);
  await expect(page.locator('[data-filter="NCJMO"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL('/archive/?division=NCJMO');
  await page.getByRole('combobox', { name: 'Year', exact: true }).selectOption('2025');
  await expect(visibleDocuments).toHaveCount(2);
  await expect(page.locator('[data-year="2026"]')).toBeHidden();
  await expect(page.locator('[data-year="2025"] [data-division="both"]')).toBeVisible();
  await expect(page.locator('[data-archive-count]')).toContainText('2 documents');

  // A bookmarked filter must give the same result after loading a new document.
  await page.reload();
  await expect(visibleDocuments).toHaveCount(2);
  await expect(page.getByRole('combobox', { name: 'Year', exact: true })).toHaveValue('2025');
  await page.locator('[data-filter="NCMO"]').click();
  await expect(page.locator('[data-year="2025"] [data-division="NCMO"]')).toBeVisible();
  await page.goBack();
  await expect(page.locator('[data-filter="NCJMO"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-year="2025"] [data-division="NCJMO"]')).toBeVisible();
  await page.goForward();
  await expect(page.locator('[data-filter="NCMO"]')).toHaveAttribute('aria-pressed', 'true');
});

test('all six archived downloads are PDF documents', async ({ page, request }) => {
  await page.goto('/archive/');
  const pdfs = await page.locator('a[href$=".pdf"]').evaluateAll(links =>
    [...new Set(links.map(link => link.getAttribute('href')))]
  );
  expect(pdfs).toHaveLength(6);
  for (const path of pdfs) {
    const response = await request.get(path);
    expect(response.ok(), path).toBeTruthy();
    expect(response.headers()['content-type'], path).toContain('application/pdf');
    expect((await response.body()).subarray(0, 5).toString(), path).toBe('%PDF-');
  }
});

test('reduced motion removes page and hover animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore past problems', exact: true }).hover();
  const movingElements = await page.evaluate(() =>
    [...document.querySelectorAll('*')].flatMap(element =>
      [null, '::before', '::after'].flatMap(pseudo => {
        const style = getComputedStyle(element, pseudo);
        const hasDuration = value => value.split(',').some(time => parseFloat(time) > 0);
        return hasDuration(style.animationDuration) || hasDuration(style.transitionDuration)
          ? [`${element.tagName}.${element.className}${pseudo || ''}`] : [];
      })
    )
  );
  expect(movingElements).toEqual([]);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('navigation and every archived document remain usable', async ({ page, request }) => {
    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(navigation).toBeVisible();
    await navigation.getByRole('link', { name: 'Past problems' }).click();
    await expect(page).toHaveURL('/archive/');
    await expect(page.locator('[data-archive-controls]')).toBeHidden();
    const pdfs = page.locator('a[href$=".pdf"]');
    await expect(pdfs).toHaveCount(6);
    for (const link of await pdfs.all()) {
      await expect(link).toBeVisible();
      expect((await request.get(await link.getAttribute('href'))).ok()).toBeTruthy();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });

  test('contact has usable email destinations without JavaScript', async ({ page }) => {
    await page.goto('/contact/');
    await expect(page.locator('#contact-form')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Copy email address' })).toBeHidden();
    const email = page.getByRole('link', { name: 'ncmatholy@gmail.com', exact: true });
    await expect(email.first()).toBeVisible();
    for (const address of await email.all()) {
      await expect(address).toHaveAttribute('href', 'mailto:ncmatholy@gmail.com');
    }
    const gmail = page.getByRole('link', { name: 'Open Gmail draft' });
    await expect(gmail).toBeVisible();
    await expect(gmail).toHaveAttribute('target', '_blank');
    await expect(gmail).toHaveAttribute('rel', 'noopener');
    const destination = new URL(await gmail.getAttribute('href'));
    expect(destination.searchParams.get('to')).toBe('ncmatholy@gmail.com');
    expect(destination.searchParams.get('su')).toBe('NC(J)MO inquiry');
    await expect(page.locator('#contact-draft-status')).toBeEmpty();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });
});
