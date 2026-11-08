"""Real Chrome tests of the original design token browser playground.
Test only. No customer records, remote assets or application dependencies.
"""
import functools
import http.server
import os
from pathlib import Path
import shutil
import tempfile
import threading
import unittest

from playwright.sync_api import sync_playwright, expect

ROOT=Path(os.environ.get("TOKEN_DEMO_ROOT") or Path(__file__).resolve().parents[1]).resolve()

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_):
        pass

class TokenPlaygroundBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        exe=os.environ.get("BROWSER_EXECUTABLE") or next(
            (p for name in ("google-chrome","chromium","chromium-browser")
             if (p:=shutil.which(name))),None)
        if not exe:
            raise RuntimeError("CHROME_REQUIRED_NO_SKIP")
        cls.engine=sync_playwright().start()
        cls.browser=cls.engine.chromium.launch(executable_path=exe,headless=True,
            args=["--no-sandbox","--disable-dev-shm-usage","--disable-background-networking"])
        cls.server=http.server.ThreadingHTTPServer(("127.0.0.1",0),
            functools.partial(QuietHandler,directory=str(ROOT)))
        cls.worker=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.worker.start()
        cls.origin=f"http://127.0.0.1:{cls.server.server_port}"
        print("Observed Chrome:",cls.browser.version,flush=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.engine.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.worker.join(timeout=5)

    def setUp(self):
        self.context=self.browser.new_context(viewport={"width":375,"height":812},accept_downloads=True)
        self.addCleanup(self.context.close)
        self.external=[]
        self.errors=[]
        def allow_local(route):
            if route.request.url.startswith(self.origin+"/"):
                route.continue_()
            else:
                self.external.append(route.request.url)
                route.abort()
        self.context.route("**/*",allow_local)
        self.page=self.context.new_page()
        self.page.on("pageerror",lambda err:self.errors.append(str(err)))
        self.page.goto(self.origin)
        expect(self.page.locator("#compiled")).to_contain_text("--color-brand: #2563eb;")

    def tearDown(self):
        self.assertEqual(self.external,[],"No external resources")
        self.assertEqual(self.errors,[],"No JavaScript errors")

    def _set(self,selector,value):
        self.page.locator(selector).evaluate(
            "(el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));}",value)

    def test_real_compilation_alias_and_css_download(self):
        css=self.page.locator("#compiled").input_value()
        self.assertIn("--color-action: #2563eb;",css)
        self.assertIn("--spacing-base: 16px;",css)
        expect(self.page.locator("#metric")).to_contain_text("numerical example only")
        self._set("#brand","#ee3377")
        self._set("#surface","#f6f6f6")
        self._set("#spacing","24")
        new_css=self.page.locator("#compiled").input_value()
        self.assertIn("--color-action: #ee3377;",new_css)
        self.assertIn("--color-brand: #ee3377;",new_css)
        self.assertIn("--spacing-base: 24px;",new_css)
        expect(self.page.locator("#spacing-output")).to_have_text("24")
        self.assertEqual(self.page.locator("#preview-action").evaluate(
            "el=>getComputedStyle(el).backgroundColor"),"rgb(238, 51, 119)")
        with self.page.expect_download() as pending:
            self.page.locator("#download").click()
        download=pending.value
        self.assertEqual(download.suggested_filename,"fictional-theme-tokens.css")
        self.assertIsNone(download.failure())
        with tempfile.TemporaryDirectory(prefix="fictional-design-css-") as directory:
            destination=Path(directory)/"theme.css"
            download.save_as(destination)
            self.assertEqual(destination.read_text(encoding="utf-8"),new_css)
        expect(self.page.locator("#status")).to_contain_text("nothing uploaded")
        self.page.locator("#reset").click()
        expect(self.page.locator("#brand")).to_have_value("#2563eb")
        expect(self.page.locator("#spacing-output")).to_have_text("16")
        self.assertEqual(self.page.locator("#compiled").input_value(),css)
        expect(self.page.locator("#brand")).to_be_focused()

    def test_responsive_and_semantic_controls(self):
        self.assertEqual(self.page.locator("h1").count(),1)
        self.assertEqual(self.page.locator("main").count(),1)
        self.assertTrue(self.page.locator('meta[http-equiv="Content-Security-Policy"]').get_attribute("content").find("connect-src 'none'")>=0)
        for width,height in ((320,700),(375,812),(812,375),(1440,900)):
            with self.subTest(width=width):
                self.page.set_viewport_size({"width":width,"height":height})
                layout=self.page.evaluate("""() => ({
                  page:document.documentElement.scrollWidth,
                  viewport:innerWidth,
                  rows:document.querySelectorAll('textarea').length,
                  controls:document.querySelectorAll('input').length
                })""")
                self.assertLessEqual(layout["page"],layout["viewport"])
                self.assertEqual(layout["rows"],1)
                self.assertEqual(layout["controls"],4)

if __name__=="__main__":
    unittest.main(verbosity=2)
