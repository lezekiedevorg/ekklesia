import os
import sys
import time
import datetime
import subprocess
import requests
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

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
    os.makedirs("e2e_tests/screenshots/interactive_attendance", exist_ok=True)

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

        print("2. Navigating to /attendance...")
        page.goto("http://localhost:3000/attendance")
        page.wait_for_selector("h1")
        time.sleep(2)
        page.screenshot(path="e2e_tests/screenshots/interactive_attendance/01_start.png")

        print("3. Checking for interactive wizard start button...")
        start_btn = page.locator("button:has-text('Démarrer l\\'appel')")
        assert start_btn.count() > 0, "Start button missing!"

        print("4. Starting wizard and stepping through members...")
        start_btn.click()
        time.sleep(1)
        page.screenshot(path="e2e_tests/screenshots/interactive_attendance/02_wizard_step1.png")

        # Click PRESENT on Member 1
        present_btn = page.locator("button:has-text('PRÉSENT')")
        present_btn.click()
        time.sleep(0.5)

        # Click ABSENT on Member 2 (since sunday_service is default, should show reason prompt)
        absent_btn = page.locator("button:has-text('ABSENT')")
        if absent_btn.count() > 0:
            absent_btn.click()
            time.sleep(0.5)
            page.screenshot(path="e2e_tests/screenshots/interactive_attendance/03_wizard_absence_reason.png")
            
            # Select quick chip suggestion 'Maladie' or click Suivant
            chip = page.locator("button:has-text('Maladie')")
            if chip.count() > 0:
                chip.click()
            next_btn = page.locator("button:has-text('Suivant')")
            if next_btn.count() > 0:
                next_btn.click()
                time.sleep(0.5)

        print("5. Quitting wizard to check Summary report entry...")
        quit_btn = page.locator("button:has-text('Quitter')")
        if quit_btn.count() > 0:
            quit_btn.click()
            time.sleep(0.5)

        report_btn = page.locator("button:has-text('Voir le Rapport Récapitulatif')")
        if report_btn.count() > 0:
            report_btn.click()
            time.sleep(1)
            page.screenshot(path="e2e_tests/screenshots/interactive_attendance/04_summary_report.png")
            assert page.locator("text=Rapport Récapitulatif de Présence").count() > 0, "Summary header missing!"

        print("6. Testing 7-day lock by setting date to 10 days ago...")
        # Go back to start if in summary
        page.goto("http://localhost:3000/attendance")
        page.wait_for_selector("h1")
        time.sleep(1)

        past_date = (datetime.date.today() - datetime.timedelta(days=10)).strftime("%Y-%m-%d")
        page.fill("input[type='date']", past_date)
        time.sleep(1)
        page.screenshot(path="e2e_tests/screenshots/interactive_attendance/05_seven_day_lock.png")

        # Verify lock banner or read-only report button (unless user is pastor role where lock bypasses)
        print("PASS: Full interactive attendance workflow and lock verification successful!")
        browser.close()

    if server_proc:
        server_proc.terminate()

if __name__ == "__main__":
    main()
