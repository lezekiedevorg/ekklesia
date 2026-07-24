"use client";

import { useEffect, useState } from "react";

// L'event n'existe que sur Chromium (Android/desktop). iOS n'en a pas : Safari
// oblige à passer par Partager → Sur l'écran d'accueil.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function ServiceWorkerRegister() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registered:", reg.scope))
        .catch((err) => console.error("SW registration failed:", err));
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!installEvent) return null;

  return (
    <div
      data-testid="pwa-install-banner"
      className="fixed bottom-4 inset-x-4 z-50 flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_32px_-4px_rgba(30,27,75,0.18)] p-3 sm:max-w-md sm:mx-auto"
    >
      <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-tr from-[#1e1b4b] via-[#312e81] to-[#4338ca] flex items-center justify-center border border-[#fea619]/40 shadow-lg shadow-indigo-950/25">
        <span className="material-symbols-outlined text-[#fea619] text-[22px]">install_mobile</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-headline-md font-extrabold text-sm text-[#1e1b4b] tracking-tight">
          Installer l&apos;application
        </p>
        <p className="text-xs font-semibold text-slate-500 truncate">
          Accès rapide depuis votre écran d&apos;accueil
        </p>
      </div>
      <button
        type="button"
        onClick={async () => {
          await installEvent.prompt();
          await installEvent.userChoice;
          setInstallEvent(null); // l'event n'est utilisable qu'une fois
        }}
        className="px-4 py-2 shrink-0 rounded-xl bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-[#fea619] text-xs font-bold shadow-lg shadow-[#1e1b4b]/30 border border-[#fea619]/50 hover:scale-[1.02] transition-all"
      >
        Installer
      </button>
      <button
        type="button"
        aria-label="Fermer"
        onClick={() => setInstallEvent(null)}
        className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}
