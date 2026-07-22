"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: "pastor" | "leader" | "shepherd";
  group_id: string | null;
}

interface Group {
  id: string;
  name: "Puissance" | "Gloire" | "Sagesse";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }

        // Fetch groups
        const { data: groupsData } = await supabase.from("groups").select("*");
        if (groupsData) setGroups(groupsData);

        // Fetch user profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        } else {
          // Create initial profile if missing
          const newProfile: Profile = {
            id: user.id,
            first_name: user.email?.split("@")[0] || "Nouveau",
            last_name: "Berger",
            phone: "",
            role: "shepherd",
            group_id: groupsData && groupsData.length > 0 ? groupsData[0].id : null,
          };
          await supabase.from("profiles").upsert([newProfile]);
          setProfile(newProfile);
        }
      } catch (err) {
        console.error("Erreur de chargement du profil:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          role: profile.role,
          group_id: profile.role === "pastor" ? null : profile.group_id,
        });

      if (error) throw error;
      setMessage("Profil enregistré avec succès ! Redirection vers le Tableau de bord...");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Erreur lors de la mise à jour.");
      } else {
        setError("Erreur lors de la mise à jour.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f8fafc] to-[#f1f5f9] flex items-center justify-center text-[#1e1b4b] font-sans">
        <div className="glass-panel px-8 py-6 rounded-3xl shadow-xl flex items-center gap-4 border border-white/80 font-bold text-sm">
          <div className="w-6 h-6 rounded-full border-3 border-[#1e1b4b] border-t-transparent animate-spin" />
          <span>Chargement de votre profil spirituel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f8fafc] to-[#f1f5f9] text-[#1e1b4b] pb-24 font-sans selection:bg-[#fea619]/20">
      <Navbar role={profile?.role || "shepherd"} userName={profile ? `${profile.first_name} ${profile.last_name}` : undefined} />

      <main className="max-w-2xl mx-auto p-4 sm:p-6 mt-4 animate-fade-in-up">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-md border border-white/80 relative overflow-hidden">
          {/* Ambient Decorative Glow */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-200/60 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-2 border border-[#fea619]/40 shadow-2xs">
                <span className="material-symbols-outlined text-[15px] text-[#fea619]" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider">Identité Spirituelle</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-headline-md font-extrabold text-[#1e1b4b] tracking-tight">
                Mon Profil & Rôle
              </h1>
              <p className="text-xs sm:text-sm text-[#47464f] mt-1 font-medium">
                Gérez vos informations personnelles et votre groupe de rattachement au sein du Sanctuaire.
              </p>
            </div>
            <div className="self-start sm:self-center px-4 py-1.5 rounded-2xl text-xs font-label-caps font-black uppercase tracking-wider bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-white border border-[#fea619]/40 shadow-md shadow-indigo-950/15 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#fea619] animate-pulse" />
              {profile?.role === "pastor" ? "Pasteur" : profile?.role === "leader" ? "Responsable" : "Berger"}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50/90 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold shadow-md shadow-rose-500/5 flex items-center gap-2.5 animate-fadeIn relative z-10">
              <span className="material-symbols-outlined text-rose-600">error</span>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/5 flex items-center gap-2.5 animate-fadeIn relative z-10">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span>{message}</span>
            </div>
          )}

          {profile && (
            <form onSubmit={handleSave} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/80 border border-slate-200/80 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/80 border border-slate-200/80 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Téléphone (WhatsApp)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined text-slate-400 text-[20px] absolute left-4 top-3.5 pointer-events-none">
                    phone_iphone
                  </span>
                  <input
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/80 border border-slate-200/80 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Rôle Spirituel
                </label>
                <select
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value as Profile["role"] })}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/80 border border-slate-200/80 text-[#1e1b4b] font-black focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all shadow-2xs cursor-pointer"
                >
                  <option value="shepherd">✨ Berger (En charge d&apos;un troupeau de fidèles)</option>
                  <option value="leader">🛡️ Responsable de Groupe (Supervision d&apos;un des 3 groupes)</option>
                  <option value="pastor">👑 Pasteur (Supervision générale et vision globale)</option>
                </select>
              </div>

              {profile.role !== "pastor" && (
                <div>
                  <label className="block text-[11px] font-label-caps font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                    Groupe de Rattachement
                  </label>
                  <select
                    value={profile.group_id || ""}
                    onChange={(e) => setProfile({ ...profile, group_id: e.target.value || null })}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/80 border border-slate-200/80 text-[#1e1b4b] font-black focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]/20 focus:border-[#1e1b4b] focus:bg-white transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="">Sélectionnez votre groupe d&apos;appartenance...</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        ⚡ Groupe {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl font-bold text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Déconnexion
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm text-[#1e1b4b] bg-gradient-to-r from-[#fea619] via-[#ffb947] to-[#fea619] hover:from-amber-400 hover:to-amber-400 shadow-xl shadow-[#fea619]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-[#1e1b4b] border-t-transparent animate-spin" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>💾 Sauvegarder mon profil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
