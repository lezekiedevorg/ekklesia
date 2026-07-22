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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-md border border-slate-200/80 font-semibold text-sm">
          <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Chargement de votre profil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] pb-24 font-sans">
      <Navbar role={profile?.role || "shepherd"} userName={profile ? `${profile.first_name} ${profile.last_name}` : undefined} />

      <main className="max-w-xl mx-auto p-4 mt-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/80">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Mon Profil Spirituel
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Gérez votre identité, votre rôle et votre groupe de rattachement
              </p>
            </div>
            <div className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
              {profile?.role === "pastor" ? "Pasteur" : profile?.role === "leader" ? "Responsable" : "Berger"}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold shadow-2xs">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold shadow-2xs">
              {message}
            </div>
          )}

          {profile && (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                  Téléphone (WhatsApp)
                </label>
                <input
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                  Rôle Spirituel
                </label>
                <select
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value as Profile["role"] })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
                >
                  <option value="shepherd">Berger (En charge des fidèles / âmes)</option>
                  <option value="leader">Responsable de Groupe (Supervise un des 3 groupes)</option>
                  <option value="pastor">Pasteur (Vue d&apos;ensemble et supervision générale)</option>
                </select>
              </div>

              {profile.role !== "pastor" && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                    Groupe de Rattachement
                  </label>
                  <select
                    value={profile.group_id || ""}
                    onChange={(e) => setProfile({ ...profile, group_id: e.target.value || null })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
                  >
                    <option value="">Sélectionnez votre groupe...</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        Groupe {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 active:scale-[0.98]"
                >
                  {saving ? "Enregistrement en cours..." : "Sauvegarder mon profil"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
