"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('isSignUp', String(isSignUp));

      if (isSignUp) {
        const result = await loginAction(formData);
        if (result?.error) {
          setError(result.error);
        } else if (result?.message) {
          setMessage(result.message);
        } else if (result?.success) {
          window.location.href = '/';
          return;
        }
      } else {
        // Exécuter d'abord la connexion côté client pour écrire immédiatement les cookies Supabase dans le navigateur
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        // Double sécurité : synchronisation côté serveur
        await loginAction(formData).catch(() => {});
        window.location.href = '/';
        return;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Une erreur est survenue.");
      } else {
        setError("Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-4 relative overflow-hidden font-sans">
      {/* Divine Luxe Ambient Background Glows */}
      <div className="absolute top-1/6 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-1/6 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/15 via-amber-400/10 to-transparent rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: "2s" }} />

      <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(30,27,75,0.12)] p-8 sm:p-10 relative z-10 animate-fade-in-up">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#1e1b4b] via-[#312e81] to-[#4338ca] shadow-xl shadow-indigo-950/25 mb-5 transform hover:scale-105 hover:rotate-3 transition-all duration-300 border border-[#fea619]/40 group">
            <span className="material-symbols-outlined text-[#fea619] text-[40px] group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
              church
            </span>
          </div>
          <h1 className="text-3xl font-headline-md font-extrabold text-[#1e1b4b] tracking-tight">
            Gestion Église
          </h1>
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fea619] animate-pulse" />
            Puissance • Gloire • Sagesse
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium leading-relaxed max-w-xs mx-auto">
            Plateforme spirituelle d&apos;excellence pour bergers, responsables et pasteur.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-3 shadow-2xs animate-fade-in-up">
            <span className="material-symbols-outlined text-rose-500 text-[20px] shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-start gap-3 shadow-2xs animate-fade-in-up">
            <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0">check_circle</span>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-[11px] font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-2">
              Adresse Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined text-slate-400 text-[20px] absolute left-4 top-3.5 pointer-events-none">
                mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ezekiel@eglise.org"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all duration-200 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <span className="material-symbols-outlined text-slate-400 text-[20px] absolute left-4 top-3.5 pointer-events-none">
                lock
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all duration-200 shadow-2xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 rounded-2xl font-headline-md font-extrabold text-sm text-white bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] hover:from-[#312e81] hover:to-[#4338ca] shadow-lg shadow-indigo-950/25 border border-[#fea619]/40 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connexion en cours...
              </span>
            ) : isSignUp ? (
              <>
                <span className="material-symbols-outlined text-[20px] text-[#fea619]">person_add</span>
                S&apos;inscrire à l&apos;application
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px] text-[#fea619]">login</span>
                Se connecter au Sanctuaire
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 pt-5">
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">
            🛡️ L&apos;accès est géré par l&apos;administration de l&apos;église.<br/>
            Contactez un administrateur pour obtenir vos accès ou modifier votre rôle.
          </p>
        </div>
      </div>
    </div>
  );
}
