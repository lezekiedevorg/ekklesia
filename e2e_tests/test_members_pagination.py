import os
import time
import subprocess
import requests
from playwright.sync_api import sync_playwright

def ensure_server_running():
    try:
        resp = requests.get("http://localhost:3000", timeout=2)
        if resp.status_code == 200:
            return None
    except Exception:
        pass

    print("Starting Next.js dev server on port 3000...")
    proc = subprocess.Popen(
        ["npm", "run", "dev"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        shell=True
    )
    for _ in range(30):
        time.sleep(1)
        try:
            resp = requests.get("http://localhost:3000", timeout=2)
            if resp.status_code == 200:
                return proc
        except Exception:
            pass
    raise RuntimeError("Could not start server on port 3000.")

def main():
    server_proc = ensure_server_running()
    os.makedirs("e2e_tests/screenshots/pagination", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        print("1. Logging in...")
        page.goto("http://localhost:3000/login")
        page.fill("input[type='email']", "ezekiel@eglise.org")
        page.fill("input[type='password']", "azerty")
        page.click("button[type='submit']")
        page.wait_for_url(lambda url: "/login" not in url, timeout=15000)

        print("2. Navigating to /members...")
        page.goto("http://localhost:3000/members")
        page.wait_for_selector("h1")
        time.sleep(2)

        print("3. Checking for pagination controls...")
        pagination_controls = page.locator("data-testid=pagination-controls")
        if pagination_controls.count() == 0:
            # Fallback check for "Précédent" / "Suivant" buttons
            prev_btn = page.locator("button:has-text('Précédent')")
            next_btn = page.locator("button:has-text('Suivant')")
            if prev_btn.count() == 0 or next_btn.count() == 0:
                page.screenshot(path="e2e_tests/screenshots/pagination/01_red_failure_no_pagination.png")
                raise AssertionError("RED FAILURE: Pagination controls ('Précédent' / 'Suivant' buttons) not found on /members page!")

        print("4. Testing pagination navigation...")
        # Check initial cards count on page 1
        cards_page_1 = page.locator("h3").count()
        print(f"Cards on Page 1: {cards_page_1}")
        assert cards_page_1 <= 12, f"Expected at most 12 cards per page initially, found {cards_page_1}"

        # Click Suivant if enabled
        next_btn = page.locator("button:has-text('Suivant')")
        if not next_btn.is_disabled():
            next_btn.click()
            time.sleep(1)
            page.screenshot(path="e2e_tests/screenshots/pagination/02_page_2.png")
            cards_page_2 = page.locator("h3").count()
            print(f"Cards on Page 2: {cards_page_2}")
            assert cards_page_2 > 0, "Expected cards on page 2 after clicking Suivant"

        print("PASS: Pagination E2E workflow successful!")
        browser.close()

    if server_proc:
        server_proc.terminate()

if __name__ == "__main__":
    main()
