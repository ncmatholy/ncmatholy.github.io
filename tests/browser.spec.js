const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const routes = ['/', '/about/', '/staff/', '/archive/', '/404.html'];

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
  const contact = navigation.getByRole('link', { name: 'Get in touch' });
  // Simulate an email application opening without leaving the current document.
  await contact.evaluate(link => link.addEventListener('click', event => event.preventDefault(), { once: true }));
  await contact.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/about/');
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
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
});
