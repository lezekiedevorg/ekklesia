import sys
import os
import time
import json
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    screenshots_dir = os.path.join(base_dir, "screenshots")
    os.makedirs(screenshots_dir, exist_ok=True)

    run_timestamp = time.strftime("%Y_%m_%d_%H_%M_%S")
    run_screenshots_dir = os.path.join(screenshots_dir, f"run_{run_timestamp}")
    latest_screenshots_dir = os.path.join(screenshots_dir, "latest")
    os.makedirs(run_screenshots_dir, exist_ok=True)
    os.makedirs(latest_screenshots_dir, exist_ok=True)

    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "run_folder": f"screenshots/run_{run_timestamp}",
        "login": {"status": "PENDING"},
        "pages": {},
        "console_errors": [],
        "network_errors": []
    }

    print("=== DEMARRAGE DE LA SUITE DE TESTS AUTOMATISES E2E (MODE VISIBLE / HEADED) ===")
    print(f"Dossier de sauvegarde historise : {run_screenshots_dir}")
    print(f"Dossier de sauvegarde latest    : {latest_screenshots_dir}")

    with sync_playwright() as p:
        # Lancement en mode visible (headless=False) et slow_mo pour bien observer sur le navigateur
        browser = p.chromium.launch(headless=False, slow_mo=600, args=["--disable-http2"])
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        def handle_console(msg):
            if msg.type in ["error", "warning"]:
                text = msg.text
                report["console_errors"].append({"type": msg.type, "text": text, "url": page.url})
                print(f" -> [CONSOLE {msg.type.upper()}] {page.url} : {text[:150]}")

        def handle_request_failed(request):
            report["network_errors"].append({
                "url": request.url,
                "failure": request.failure,
                "method": request.method
            })
            if "auth/v1" in request.url:
                print(f" -> [RESEAU ERR] {request.method} {request.url} : {request.failure}")

        page.on("console", handle_console)
        page.on("requestfailed", handle_request_failed)

        def save_screenshot(filename):
            p1 = os.path.join(run_screenshots_dir, f"{filename}.png")
            p2 = os.path.join(latest_screenshots_dir, f"{filename}.png")
            page.screenshot(path=p1, full_page=True)
            page.screenshot(path=p2, full_page=True)
            return f"screenshots/run_{run_timestamp}/{filename}.png"

        # 1. TEST DE LOGIN
        print("\n[STEP 1] Navigation vers /login...")
        try:
            page.goto("http://localhost:3000/login")
            page.wait_for_load_state("domcontentloaded")
            page.wait_for_timeout(1000)
            save_screenshot("01_login_initial")
            print(" -> Capture d'ecran 01_login_initial.png enregistree.")

            # Remplissage du formulaire de connexion
            print(" -> Tentative de connexion avec ezekiel@eglise.org / azerty...")
            page.fill("input[type='email']", "ezekiel@eglise.org")
            page.fill("input[type='password']", "azerty")
            save_screenshot("02_login_filled")
            
            page.click("button[type='submit']")
            # Attendre la reponse de login et redirection vers /
            try:
                page.wait_for_url("http://localhost:3000/", timeout=15000)
            except Exception:
                pass
            page.wait_for_timeout(3000)
            
            save_screenshot("03_login_result")
            print(f" -> URL apres login: {page.url}")
            
            if page.url == "http://localhost:3000/" or "login" not in page.url:
                print(" -> [SUCCES] Redirection reussie vers le tableau de bord !")
                report["login"]["status"] = "SUCCESS"
                report["login"]["final_url"] = page.url
            else:
                err_text = page.locator(".text-rose-700").text_content() if page.locator(".text-rose-700").count() > 0 else "Erreur non specifiee ou redirection en attente"
                print(f" -> [AVERTISSEMENT] Toujours sur login ou erreur affichee : {err_text}")
                report["login"]["status"] = "WARNING_OR_ERROR"
                report["login"]["message"] = err_text
                report["login"]["final_url"] = page.url

        except Exception as e:
            print(f" -> [ERREUR CRITIQUE LOGIN] {e}")
            report["login"]["status"] = "CRITICAL_ERROR"
            report["login"]["error"] = str(e)

        # 2. AUDIT SYSTEMATIQUE DE TOUTES LES PAGES
        pages_to_audit = [
            ("/", "04_dashboard", "Tableau de Bord / Accueil"),
            ("/profile", "05_profile", "Profil & Mission"),
            ("/members", "06_members", "Repertoire des Membres"),
            ("/attendance", "07_attendance", "Appel & Fidelite Dominicale"),
            ("/activities", "08_activities", "Discipline Pastorale & Activites"),
            ("/alerts", "09_alerts", "Alertes & Urgences"),
            ("/reports", "10_reports", "Consolidation & Rapports")
        ]

        print("\n[STEP 2] Audit et captures d'ecran des modules pastoraux en mode visible...")
        for path, filename, title in pages_to_audit:
            target_url = f"http://localhost:3000{path}"
            print(f"\n -> Testing [{title}] ({target_url})...")
            try:
                # Si on est deja sur / après le login et que le path est /, pas besoin de recharger agressivement
                if path != "/" or page.url != "http://localhost:3000/":
                    page.goto(target_url)
                
                page.wait_for_load_state("domcontentloaded")
                # Attendre que le h1 ou h2 soit visible pour confirmer que l'animation de chargement est terminee
                try:
                    page.wait_for_selector("h1, h2", timeout=8000)
                except Exception:
                    pass
                page.wait_for_timeout(2000)
                
                rel_screenshot_path = save_screenshot(filename)
                
                h1_text = page.locator("h1").first.text_content() if page.locator("h1").count() > 0 else (
                    page.locator("h2").first.text_content() if page.locator("h2").count() > 0 else "Aucun h1/h2"
                )
                
                report["pages"][path] = {
                    "title": title,
                    "status": "SUCCESS",
                    "url": page.url,
                    "heading": h1_text.strip() if h1_text else "N/A",
                    "screenshot": rel_screenshot_path
                }
                print(f"    [OK] Screenshot pris: {filename}.png | Titre : {h1_text.strip() if h1_text else 'N/A'}")
            except Exception as e:
                print(f"    [ERR] Echec sur {path}: {e}")
                report["pages"][path] = {
                    "title": title,
                    "status": "ERROR",
                    "error": str(e)
                }

        browser.close()

    # Save JSON report
    report_file_json = os.path.join(base_dir, "audit_report.json")
    with open(report_file_json, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # Save Markdown report
    report_file_md = os.path.join(base_dir, "audit_report.md")
    with open(report_file_md, "w", encoding="utf-8") as f:
        f.write(f"# Rapport d'Audit E2E - Gestion Eglise\n\n")
        f.write(f"**Date :** {report['timestamp']}\n\n")
        f.write(f"## 1. Statut de la connexion ({report['login']['status']})\n")
        f.write(f"- **URL finale :** `{report['login'].get('final_url', 'N/A')}`\n")
        if "message" in report["login"]:
            f.write(f"- **Message / Erreur :** {report['login']['message']}\n")
        
        f.write(f"\n## 2. Synthèse par Page\n\n")
        f.write("| Module | Chemin | Statut | Titre Principal | Capture d'Écran |\n")
        f.write("| :--- | :--- | :---: | :--- | :--- |\n")
        for p, r in report["pages"].items():
            icon = "✅" if r.get("status") == "SUCCESS" else "❌"
            f.write(f"| **{r.get('title')}** | `{p}` | {icon} | {r.get('heading', 'N/A')} | `{r.get('screenshot', 'N/A')}` |\n")
        
        if report["console_errors"]:
            f.write(f"\n## 3. Erreurs et Avertissements Console ({len(report['console_errors'])})\n\n")
            for err in report["console_errors"][:15]:
                f.write(f"- `[{err['type'].upper()}]` **{err['url']}** : {err['text']}\n")
                
        if report["network_errors"]:
            f.write(f"\n## 4. Erreurs Réseau ({len(report['network_errors'])})\n\n")
            for net in report["network_errors"][:15]:
                f.write(f"- `{net['method']}` **{net['url']}** : {net.get('failure', 'Failed')}\n")

    print(f"\n=== AUDIT TERMINE ! Rapports generes : ===")
    print(f" - JSON : {report_file_json}")
    print(f" - MD   : {report_file_md}")

if __name__ == "__main__":
    main()
