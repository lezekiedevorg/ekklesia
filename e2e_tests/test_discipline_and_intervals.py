import os
import sys
import time
import subprocess
import requests
from playwright.sync_api import sync_playwright

# Ensure utf-8 output on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:3000"

def ensure_server_running():
    try:
        resp = requests.get(BASE_URL, timeout=2)
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
            resp = requests.get(BASE_URL, timeout=2)
            if resp.status_code == 200:
                return proc
        except Exception:
            pass
    raise RuntimeError("Could not start server on port 3000.")

def test_discipline_and_intervals():
    server_proc = ensure_server_running()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1280, "height": 800})
            page = context.new_page()
            page.on("console", lambda msg: print(f"BROWSER CONSOLE [{msg.type}]: {msg.text}"))
            page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

            print("1. Logging in as ezekiel@eglise.org...")
            page.goto(f"{BASE_URL}/login")
            page.fill("input[type='email']", "ezekiel@eglise.org")
            page.fill("input[type='password']", "azerty")
            page.click("button[type='submit']")
            page.wait_for_url(lambda url: "/login" not in url, timeout=15000)
            time.sleep(1)

            print("2. Navigating to Discipline page (/activities)...")
            page.goto(f"{BASE_URL}/activities")
            time.sleep(3)
            os.makedirs("e2e_tests/screenshots/discipline", exist_ok=True)
            page.screenshot(path="e2e_tests/screenshots/discipline/debug_activities.png")
            print(f"Current page title/content sample: {page.content()[:500]}")

            page.wait_for_selector("h1", timeout=5000)

            # Check for week interval in header or subheader
            content = page.content()
            assert "au" in content or "Du" in content, "Week interval formatting ('Du ... au ...') not found on Discipline page!"

            print("3. Checking for new discipline form inputs...")
            prayer_checkbox = page.locator("input[name='daily_prayer_done']")
            meditation_checkbox = page.locator("input[name='daily_meditation_done']")
            book_input = page.locator("input[name='meditated_book']")

            assert prayer_checkbox.count() > 0, "daily_prayer_done checkbox missing!"
            assert meditation_checkbox.count() > 0, "daily_meditation_done checkbox missing!"
            assert book_input.count() > 0, "meditated_book input missing!"

            print("4. Filling out form and submitting...")
            prayer_checkbox.check()
            meditation_checkbox.check()
            book_input.fill("Évangile de Jean, Ch. 1-5")
            
            page.click("button[type='submit']")
            
            page.wait_for_selector("text=Discipline spirituelle de la semaine enregistrée avec succès !", timeout=10000)
            print("PASS: Form submitted and success message displayed!")

            print("5. Navigating to Reports page (/reports) to check interval display...")
            page.goto(f"{BASE_URL}/reports")
            page.wait_for_selector("h1", timeout=10000)
            reports_content = page.content()
            assert "au" in reports_content or "Du" in reports_content, "Week interval formatting ('Du ... au ...') not found on Reports page!"

            page.screenshot(path="e2e_tests/screenshots/discipline/01_discipline_success.png")

            print("PASS: Discipline and interval E2E test passed successfully!")
            browser.close()
    finally:
        if server_proc:
            server_proc.terminate()

if __name__ == "__main__":
    try:
        test_discipline_and_intervals()
    except Exception as e:
        print(f"FAIL: {e}")
        sys.exit(1)
