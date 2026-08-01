"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/components/common/PageLoader";

interface WhatsAppStatus {
  status: "connected" | "qr_ready" | "initializing" | "error";
  qrCode?: string;
  message: string;
}

export default function WhatsAppSetupPage() {
  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/whatsapp/qr");
      const data = await response.json();
      setWaStatus(data);
    } catch (err) {
      console.error("Erreur vérification statut:", err);
      setWaStatus({ status: "error", message: "Erreur de connexion au serveur" });
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Vérifier toutes les 5 secondes si pas encore connecté
    const interval = setInterval(() => {
      if (waStatus?.status !== "connected") {
        checkStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [waStatus?.status]);

  if (loading) return <PageLoader label="Vérification du statut WhatsApp..." />;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-800 pb-20 font-sans selection:bg-indigo-500 selection:text-white">
      <main className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="glass-panel p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-green-500/5 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-3.5 border border-[#fea619]/40 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-[#fea619]">settings</span>
              <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider">Configuration WhatsApp</span>
            </div>
            <h1 className="font-headline-md font-black text-2xl sm:text-3xl text-[#1e1b4b] tracking-tight">
              Connexion WhatsApp
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium leading-relaxed">
              Connectez votre numéro WhatsApp pour envoyer des messages à vos fidèles directement depuis l&apos;application.
            </p>
          </div>
        </div>

        {/* Statut */}
        <div className="glass-panel p-8 rounded-3xl text-center">
          {waStatus?.status === "connected" && (
            <>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <span className="material-symbols-outlined text-white text-[40px]">check_circle</span>
              </div>
              <h2 className="text-xl font-black text-[#1e1b4b] mb-2">WhatsApp Connecté !</h2>
              <p className="text-sm text-slate-600 font-medium mb-6">
                Votre WhatsApp est prêt à envoyer des messages. Vous pouvez maintenant utiliser toutes les fonctionnalités de messagerie.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold">Connecté et opérationnel</span>
              </div>
            </>
          )}

          {waStatus?.status === "qr_ready" && (
            <>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                <span className="material-symbols-outlined text-white text-[40px]">qr_code_scanner</span>
              </div>
              <h2 className="text-xl font-black text-[#1e1b4b] mb-2">Scannez le QR Code</h2>
              <p className="text-sm text-slate-600 font-medium mb-6">
                Ouvrez WhatsApp sur votre téléphone, allez dans <strong>Appareils connectés</strong> et scannez le code ci-dessous.
              </p>

              {/* QR Code */}
              <div className="inline-block p-4 bg-white rounded-2xl shadow-lg border border-slate-200 mb-6">
                {waStatus.qrCode ? (
                  <img src={waStatus.qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-medium">
                  1. Ouvrez WhatsApp sur votre téléphone
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  2. Allez dans <strong>Paramètres → Appareils connectés</strong>
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  3. Appuyez sur <strong>Connecter un appareil</strong> et scannez ce code
                </p>
              </div>
            </>
          )}

          {waStatus?.status === "initializing" && (
            <>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                <span className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
              <h2 className="text-xl font-black text-[#1e1b4b] mb-2">Initialisation en cours...</h2>
              <p className="text-sm text-slate-600 font-medium">
                Le client WhatsApp est en cours de démarrage. Veuillez patienter quelques instants.
              </p>
            </>
          )}

          {waStatus?.status === "error" && (
            <>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/30">
                <span className="material-symbols-outlined text-white text-[40px]">error</span>
              </div>
              <h2 className="text-xl font-black text-[#1e1b4b] mb-2">Erreur de connexion</h2>
              <p className="text-sm text-slate-600 font-medium mb-4">{waStatus.message}</p>
              <button
                onClick={checkStatus}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md transition-all cursor-pointer"
              >
                Réessayer
              </button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="glass-panel p-6 rounded-3xl">
          <h3 className="text-lg font-black text-[#1e1b4b] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">info</span>
            Comment ça fonctionne
          </h3>
          <div className="space-y-4">
            {[
              {
                icon: "link",
                title: "Connexion unique",
                description: "Une fois connecté, WhatsApp reste actif même si vous fermez le navigateur.",
              },
              {
                icon: "send",
                title: "Envoi de messages",
                description: "Envoyez des messages personnalisés à vos fidèles directement depuis l'application.",
              },
              {
                icon: "smart_toy",
                title: "Agent IA",
                description: "L'agent IA contacte automatiquement les membres pour des conversations spirituelles.",
              },
              {
                icon: "security",
                title: "Sécurité",
                description: "La connexion utilise le protocole officiel WhatsApp Web. Vos messages sont chiffrés de bout en bout.",
              },
            ].map((item) => (
              <div key={item.icon} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="material-symbols-outlined text-indigo-600 mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-sm font-bold text-[#1e1b4b]">{item.title}</p>
                  <p className="text-xs text-slate-600 font-medium">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton rafraîchir */}
        <div className="text-center">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {checking ? (
              <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            )}
            Rafraîchir le statut
          </button>
        </div>
      </main>
    </div>
  );
}
