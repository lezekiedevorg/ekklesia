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
    os.makedirs("e2e_tests/screenshots/archive_workflow", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
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

        print("3. Checking top tabs (Membres Actifs vs Archives & Purgatoire)...")
        # In RED phase, this tab button won't exist!
        archive_tab = page.locator("button:has-text('Archives & Purgatoire')")
        if archive_tab.count() == 0:
            page.screenshot(path="e2e_tests/screenshots/archive_workflow/01_red_failure_no_tabs.png")
            raise AssertionError("RED FAILURE: 'Archives & Purgatoire' tab button not found!")

        print("4. Testing direct archive action from card button next to Modifier...")
        card_archive_buttons = page.locator("button:has-text('📦 Archiver')")
        if card_archive_buttons.count() == 0:
            page.screenshot(path="e2e_tests/screenshots/archive_workflow/02_red_failure_no_card_archive_btn.png")
            raise AssertionError("RED FAILURE: '📦 Archiver' button not found right next to '✎ Modifier' on active cards!")

        # Handle dialog confirmation automatically when clicking archive
        page.on("dialog", lambda dialog: dialog.accept())
        card_archive_buttons.first.click()
        time.sleep(2)

        print("5. Checking Archives tab and countdown badge...")
        archive_tab.click()
        time.sleep(1)
        page.screenshot(path="e2e_tests/screenshots/archive_workflow/03_archives_tab.png")

        reintegrate_btn = page.locator("button:has-text('Réintégrer')")
        assert reintegrate_btn.count() > 0, "RED FAILURE: 'Réintégrer' button not found on archived cards."

        delete_permanent_btn = page.locator("button:has-text('Supprimer définitivement')")
        assert delete_permanent_btn.count() > 0, "RED FAILURE: 'Supprimer définitivement' button not found."

        print("PASS: Archive and Purgatory E2E workflow successful!")
        browser.close()

    if server_proc:
        server_proc.terminate()

if __name__ == "__main__":
    main()
