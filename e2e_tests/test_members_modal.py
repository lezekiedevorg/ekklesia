import os
import time
import subprocess
import requests
from playwright.sync_api import sync_playwright

def ensure_server_running():
    try:
        resp = requests.get("http://localhost:3000", timeout=2)
        if resp.status_code == 200:
            print("Server is already running on port 3000.")
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
                print("Server started successfully.")
                return proc
        except Exception:
            pass
    raise RuntimeError("Could not start server on port 3000.")

def main():
    server_proc = ensure_server_running()
    
    os.makedirs("e2e_tests/screenshots/members_modal", exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        print("1. Navigating to login...")
        page.goto("http://localhost:3000/login")
        page.wait_for_selector("input[type='email']")

        page.fill("input[type='email']", "ezekiel@eglise.org")
        page.fill("input[type='password']", "azerty")
        page.click("button[type='submit']")

        print("2. Waiting for navigation after login...")
        page.wait_for_url(lambda url: "/login" not in url, timeout=15000)
        print(f"Logged in! Current URL: {page.url}")

        print("3. Navigating to /members...")
        page.goto("http://localhost:3000/members")
        page.wait_for_selector("h1")
        time.sleep(2)
        page.screenshot(path="e2e_tests/screenshots/members_modal/01_members_list_with_edit_buttons.png")
        print("Captured 01_members_list_with_edit_buttons.png")

        print("4. Testing 'Inscrire une nouvelle âme' modal...")
        page.click("text=Inscrire une nouvelle âme")
        page.wait_for_selector("h2:has-text('Inscrire une nouvelle âme')")
        time.sleep(1)
        page.screenshot(path="e2e_tests/screenshots/members_modal/02_create_modal.png")
        print("Captured 02_create_modal.png")

        print("5. Closing create modal and clicking 'Modifier' on the first card...")
        page.click("button:has-text('✕')")
        time.sleep(1)

        edit_buttons = page.locator("button:has-text('✎ Modifier')")
        if edit_buttons.count() > 0:
            edit_buttons.first.click()
            page.wait_for_selector("h2:has-text('Modifier les informations & statut')")
            time.sleep(1)
            page.screenshot(path="e2e_tests/screenshots/members_modal/03_edit_modal_with_all_4_statuses.png")
            print("Captured 03_edit_modal_with_all_4_statuses.png")
        else:
            print("No edit buttons found on cards.")

        browser.close()

    if server_proc:
        server_proc.terminate()
        print("Server process terminated.")

if __name__ == "__main__":
    main()
