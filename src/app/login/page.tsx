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

      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.message) {
        setMessage(result.message);
      } else if (result?.success) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 p-4 relative overflow-hidden font-sans">
      {/* Decorative warm light background blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-3xl shadow-2xl shadow-indigo-500/10 p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 shadow-lg shadow-indigo-500/25 mb-4 transform hover:scale-105 transition-transform duration-300 font-black text-2xl text-white">
            GÉ
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gestion Église
          </h1>
          <p className="text-sm font-extrabold text-indigo-600 mt-1 tracking-wide">
            Puissance • Gloire • Sagesse
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Plateforme spirituelle pour bergers, responsables et pasteur
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 shadow-2xs font-semibold">
            <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 shadow-2xs font-semibold">
            <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
              Adresse Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="berger@eglise.org"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 focus:bg-white transition-all duration-200 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 focus:bg-white transition-all duration-200 shadow-2xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-[0.98]"
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
              "S'inscrire à l'application"
            ) : (
              "Se connecter"
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
