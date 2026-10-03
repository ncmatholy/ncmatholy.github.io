"""Check rendered URLs, local assets, and the committed Pages build."""
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

from app import PAGES, app

OUTPUT = Path(__file__).resolve().parents[1] / 'output'


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.local = []
        self.headings = 0
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'h1':
            self.headings += 1
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        for field in ('href', 'src'):
            value = attrs.get(field, '')
            if value.startswith('/'):
                self.local.append(value)


class SiteTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_pages_and_all_existing_url_forms(self):
        for path in ['/', '/index.html'] + [f'/{page}{suffix}' for page in PAGES for suffix in ('', '/', '.html')]:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                parser = Links()
                parser.feed(response.get_data(as_text=True))
                self.assertEqual(parser.headings, 1)
                for href in parser.local:
                    target = urlsplit(href)
                    linked = self.client.get(target.path)
                    self.assertEqual(linked.status_code, 200, href)
                    if target.fragment:
                        linked_parser = Links()
                        linked_parser.feed(linked.get_data(as_text=True))
                        self.assertIn(unquote(target.fragment), linked_parser.ids, href)
                    linked.close()

    def test_custom_not_found(self):
        response = self.client.get('/a-page-that-does-not-exist')
        self.assertEqual(response.status_code, 404)
        self.assertIn(b'This one has no solution.', response.data)
        self.assertIn(b'Back to the homepage', response.data)

    def test_every_original_pdf_is_served(self):
        for path in sorted((OUTPUT / 'static').glob('*/*.pdf')):
            with self.subTest(path=path):
                response = self.client.get('/' + path.relative_to(OUTPUT).as_posix())
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.mimetype, 'application/pdf')
                self.assertTrue(response.data.startswith(b'%PDF-'))
                self.assertEqual(response.data, path.read_bytes())
                response.close()

    def test_committed_pages_match_templates_and_keep_aliases(self):
        for page in ['index', '404'] + PAGES:
            with self.subTest(page=page), app.app_context():
                from flask import render_template
                rendered = render_template(f'{page}.j2')
                self.assertEqual((OUTPUT / f'{page}.html').read_text(), rendered)
                self.assertNotIn('{%', rendered)
                self.assertNotIn('{{', rendered)
                if page in PAGES:
                    self.assertEqual((OUTPUT / page / 'index.html').read_text(), rendered)

    def test_archive_exposes_every_document_without_javascript(self):
        parser = Links()
        parser.feed(self.client.get('/archive/').get_data(as_text=True))
        linked = {urlsplit(href).path for href in parser.local if href.endswith('.pdf')}
        expected = {'/' + path.relative_to(OUTPUT).as_posix() for path in (OUTPUT / 'static').glob('*/*.pdf')}
        self.assertEqual(linked, expected)
        self.assertEqual(len(linked), 6)


if __name__ == '__main__':
    unittest.main()
