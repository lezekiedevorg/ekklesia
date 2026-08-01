"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/components/common/PageLoader";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: string;
  consecutive_absences: number;
}

interface Template {
  id: string;
  name: string;
  category: string;
  body: string;
}

interface SendMessageResult {
  memberId: string;
  name: string;
  phone: string;
  success: boolean;
  error?: string;
}

export default function MessagesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendMessageResult[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Charger les membres
        let membersQuery = supabase
          .from("members")
          .select("id, first_name, last_name, phone, status, consecutive_absences")
          .is("archived_at", null)
          .not("phone", "is", null)
          .order("first_name");

        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (prof && prof.role === "shepherd") {
          membersQuery = membersQuery.eq("shepherd_id", user.id);
        }

        const { data: mems } = await membersQuery;
        if (mems) setMembers(mems as Member[]);

        // Charger les templates
        const { data: tmpls } = await supabase
          .from("whatsapp_templates")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (tmpls) setTemplates(tmpls as Template[]);
      } catch (err) {
        console.error("Erreur chargement:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, supabase]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setMessage(template.body);
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const selectAll = () => {
    const filtered = filteredMembers.map((m) => m.id);
    setSelectedMembers(filtered);
  };

  const deselectAll = () => {
    setSelectedMembers([]);
  };

  const handleSend = async () => {
    if (selectedMembers.length === 0 || !message) return;

    setSending(true);
    setResults(null);

    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberIds: selectedMembers,
          message,
          templateId: selectedTemplate || undefined,
        }),
      });

      const data = await response.json();
      setResults(data.results || []);

      if (data.sent > 0) {
        setSelectedMembers([]);
        setMessage("");
        setSelectedTemplate("");
      }
    } catch (err) {
      console.error("Erreur envoi:", err);
    } finally {
      setSending(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      searchQuery === "" ||
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone?.includes(searchQuery);

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "absent" && m.consecutive_absences >= 2) ||
      m.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) return <PageLoader label="Chargement des données..." />;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-800 pb-20 font-sans selection:bg-indigo-500 selection:text-white">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="glass-panel p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-green-500/5 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-3.5 border border-[#fea619]/40 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-[#fea619]">chat</span>
              <span className="font-label-caps font-extrabold text-[11px] uppercase tracking-wider">Messages WhatsApp</span>
            </div>
            <h1 className="font-headline-md font-black text-2xl sm:text-3xl lg:text-4xl text-[#1e1b4b] tracking-tight">
              Envoyer des Messages
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-2 font-medium max-w-2xl leading-relaxed">
              Envoyez des messages WhatsApp personnalisés à vos fidèles. Utilisez des templates ou rédigez vos propres messages.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panneau gauche: Sélection membres */}
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-lg font-black text-[#1e1b4b] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">group</span>
              Destinataires
              <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                {selectedMembers.length} sélectionné{selectedMembers.length > 1 ? "s" : ""}
              </span>
            </h2>

            {/* Recherche et filtres */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Tous</option>
                <option value="absent">Absents ≥2 dim.</option>
                <option value="new_convert">Nouveaux convertis</option>
                <option value="in_integration">En intégration</option>
                <option value="active">Actifs</option>
                <option value="member">Confirmés</option>
              </select>
            </div>

            {/* Actions rapides */}
            <div className="flex gap-2 mb-4">
              <button onClick={selectAll} className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer">
                Tout sélectionner
              </button>
              <button onClick={deselectAll} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">
                Tout désélectionner
              </button>
            </div>

            {/* Liste des membres */}
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {filteredMembers.map((member) => (
                <label
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedMembers.includes(member.id)
                      ? "bg-indigo-50 border-indigo-300 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-[#1e1b4b] truncate">
                      {member.first_name} {member.last_name}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">{member.phone}</div>
                  </div>
                  {member.consecutive_absences >= 2 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {member.consecutive_absences} abs.
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Panneau droit: Composition message */}
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-lg font-black text-[#1e1b4b] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">edit_note</span>
              Message
            </h2>

            {/* Sélection template */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Template (optionnel)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- Choisir un template --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone de texte */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Contenu du message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                placeholder="Rédigez votre message ici...&#10;&#10;Variables disponibles:&#10;{prenom} - Prénom du membre&#10;{nom} - Nom du membre&#10;{nom_complet} - Nom complet&#10;{berger} - Votre nom"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Variables */}
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-bold text-amber-800 mb-2">Variables disponibles :</p>
              <div className="flex flex-wrap gap-2">
                {["{prenom}", "{nom}", "{nom_complet}", "{berger}"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setMessage((prev) => prev + v)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton envoi */}
            <button
              onClick={handleSend}
              disabled={sending || selectedMembers.length === 0 || !message}
              className="w-full py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {sending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Envoyer à {selectedMembers.length} membre{selectedMembers.length > 1 ? "s" : ""}
                </>
              )}
            </button>

            {/* Résultats */}
            {results && (
              <div className="mt-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Résultats</h3>
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      r.success ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {r.success ? "check_circle" : "error"}
                    </span>
                    <span className="font-bold">{r.name}</span>
                    <span className="ml-auto">{r.success ? "Envoyé" : r.error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
