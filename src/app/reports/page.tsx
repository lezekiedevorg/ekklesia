"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/Navbar";
import { useRouter } from "next/navigation";
import { formatWeekInterval, getMondayDateStr, getSundayDateStr } from "@/lib/utils/dateFormatter";
import WeekSelector from "@/components/common/WeekSelector";
import { computeProgramsSummary } from "@/lib/utils/programs";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: "pastor" | "leader" | "shepherd";
  group_id: string | null;
  groups?: { name: string } | null;
}

interface ProgramSummaryItem {
  program_type: string;
  label: string;
  icon: string;
  present_count: number;
  eligible_count: number;
  ratio_pct: number;
}

interface WeeklyReport {
  [key: string]: any;
  id: string;
  shepherd_id: string;
  group_id: string;
  report_date: string;
  week_end_date?: string;
  report_data?: any;
  summary_data?: any;
  status: "submitted" | "approved" | "rejected";
  content: {
    [key: string]: any;
    total_members: number;
    sunday_present_count: number;
    attendance_ratio_pct: number;
    absentees_with_reasons: { name: string; reason: string }[];
    new_members_progression: { name: string; count: number }[];
    discipline: {
      [key: string]: any;
      daily_prayer_done?: boolean;
      daily_meditation_done?: boolean;
      meditated_book?: string | null;
      evangelization_done?: boolean;
      monthly_prayer_vigil_done?: boolean;
      monthly_in_person_prayer_done?: boolean;
      prayer_q_done?: boolean;
      prayer_i_done?: boolean;
      fasting_q_done?: boolean;
      fasting_i_done?: boolean;
      word_listening_q_done?: boolean;
      word_listening_i_done?: boolean;
      bible_study_q_done?: boolean;
      bible_study_i_done?: boolean;
      meditation_book_name?: string | null;
      meditation_chapter_start?: string | null;
      meditation_chapter_end?: string | null;
      evangelism_q_done?: boolean;
      evangelism_i_done?: boolean;
      mentoring_done?: boolean;
      mentoring_theme?: string | null;
      visits_done?: boolean;
      phone_calls_done?: boolean;
      phone_calls_count?: number;
      pastoral_souls_won?: number;
      pastoral_new_contacts?: number;
      pastoral_first_timers?: number;
      pastoral_home_visits?: number;
      pastoral_sick_visits?: number;
      pastoral_consolation_visits?: number;
      pastoral_followup_calls?: number;
      church_sunday_presence?: boolean;
      church_sunday_reason?: string | null;
      church_tuesday_presence?: boolean;
      church_tuesday_reason?: string | null;
      church_wednesday_presence?: boolean;
      church_wednesday_reason?: string | null;
      church_thursday_presence?: boolean;
      church_thursday_reason?: string | null;
      church_friday_presence?: boolean;
      church_friday_reason?: string | null;
      monthly_vigil_done?: boolean;
      monthly_in_person_done?: boolean;
      monthly_department_done?: boolean;
      monthly_offering_done?: boolean;
    } | null;
    programs_summary?: ProgramSummaryItem[];
    summary_data?: ProgramSummaryItem[];
  };
  profiles?: { first_name: string; last_name: string };
  groups?: { name: string };
}

function DisciplineReportDetails({
  discipline,
  programsSummary = [],
  isDark = false,
}: {
  discipline: any;
  programsSummary?: ProgramSummaryItem[];
  isDark?: boolean;
}) {
  if (!discipline) {
    return (
      <div className={`text-xs font-semibold italic py-2 ${isDark ? "text-indigo-300" : "text-slate-400"}`}>
        Aucune activité spirituelle / pastorale enregistrée pour cette semaine.
      </div>
    );
  }

  const formatQI = (q?: boolean, i?: boolean, fallback?: boolean) => {
    if (q) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Q (7/7j) ✓</span>;
    if (i) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">I (Intermittent) ✓</span>;
    if (fallback) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Oui ✓</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">Non renseigné</span>;
  };

  const formatQILight = (q?: boolean, i?: boolean, fallback?: boolean) => {
    if (q) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">Q (7/7j) ✓</span>;
    if (i) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">I (Intermittent) ✓</span>;
    if (fallback) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300">Oui ✓</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">Non</span>;
  };

  const formatYesNoDark = (done?: boolean) => {
    if (done) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Oui ✓</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">Non</span>;
  };

  const formatYesNoLight = (done?: boolean) => {
    if (done) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">Oui ✓</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">Non</span>;
  };

  const badgeQI = isDark ? formatQI : formatQILight;
  const badgeYesNo = isDark ? formatYesNoDark : formatYesNoLight;

  const formatPresence = (present?: boolean, reason?: string | null) => {
    if (present) {
      return isDark ? (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Présent ✓</span>
      ) : (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">Présent ✓</span>
      );
    }
    return isDark ? (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30" title={reason || undefined}>
        Absent{reason ? ` : ${reason}` : ""}
      </span>
    ) : (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-100 text-rose-800 border border-rose-300" title={reason || undefined}>
        Absent{reason ? ` : ${reason}` : ""}
      </span>
    );
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 1. 🙏 Vie personnelle (Discipline & Consécration) */}
        <div className={`p-4 rounded-xl border ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
          <div className={`text-[11px] font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-[#fea619]" : "text-indigo-900"}`}>
            <span>🙏 1. Vie personnelle (Discipline & Consécration)</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className={isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium"}>Prière Personnelle :</span>
              {badgeQI(discipline.prayer_q_done, discipline.prayer_i_done, discipline.daily_prayer_done)}
            </div>
            <div className="flex items-center justify-between">
              <span className={isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium"}>Jeûne Hebdomadaire :</span>
              {badgeYesNo(discipline.fasting_q_done || discipline.fasting_i_done)}
            </div>
            <div className="flex items-center justify-between">
              <span className={isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium"}>Méditation (Parole) :</span>
              {badgeQI(discipline.bible_study_q_done, discipline.bible_study_i_done, discipline.daily_meditation_done)}
            </div>
            <div className="flex items-center justify-between">
              <span className={isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium"}>Écoute de la Parole :</span>
              {badgeYesNo(discipline.word_listening_q_done || discipline.word_listening_i_done)}
            </div>
            <div className="flex items-center justify-between">
              <span className={isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium"}>Évangélisation Personnelle :</span>
              {badgeQI(discipline.evangelism_q_done, discipline.evangelism_i_done, discipline.evangelization_done)}
            </div>
            {(discipline.meditation_book_name || discipline.meditated_book) && (
              <div className={`pt-2 mt-2 border-t text-xs ${isDark ? "border-white/10 text-indigo-200" : "border-slate-200 text-slate-700"}`}>
                <span className="font-bold">📖 Livre à étudier : </span>
                <span>{discipline.meditation_book_name || discipline.meditated_book}</span>
                {discipline.meditation_chapter_start && (
                  <span> (Chap. {discipline.meditation_chapter_start}{discipline.meditation_chapter_end ? ` à ${discipline.meditation_chapter_end}` : ""})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. 🛡️ Travail du berger (Activités & Suivi Pastoral) */}
        <div className={`p-4 rounded-xl border ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
          <div className={`text-[11px] font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-[#fea619]" : "text-indigo-900"}`}>
            <span>🛡️ 2. Travail du berger & Suivi des Âmes</span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded-lg flex items-center justify-between ${isDark ? "bg-white/5" : "bg-white border border-slate-200"}`}>
                <span className={isDark ? "text-slate-300 font-semibold" : "text-slate-600 font-semibold"}>Évangélisation</span>
                {badgeYesNo(discipline.evangelization_done || discipline.evangelism_q_done || discipline.evangelism_i_done)}
              </div>
              <div className={`p-2 rounded-lg flex items-center justify-between ${isDark ? "bg-white/5" : "bg-white border border-slate-200"}`}>
                <span className={isDark ? "text-slate-300 font-semibold" : "text-slate-600 font-semibold"}>Encadrement</span>
                {badgeYesNo(discipline.mentoring_done || Boolean(discipline.mentoring_theme))}
              </div>
              <div className={`p-2 rounded-lg flex items-center justify-between ${isDark ? "bg-white/5" : "bg-white border border-slate-200"}`}>
                <span className={isDark ? "text-slate-300 font-semibold" : "text-slate-600 font-semibold"}>Visite</span>
                {badgeYesNo(discipline.visits_done || (discipline.pastoral_home_visits || 0) > 0)}
              </div>
              <div className={`p-2 rounded-lg flex items-center justify-between ${isDark ? "bg-white/5" : "bg-white border border-slate-200"}`}>
                <span className={isDark ? "text-slate-300 font-semibold" : "text-slate-600 font-semibold"}>Appels Tél.</span>
                <span className={`font-black px-1.5 py-0.5 rounded ${isDark ? "bg-[#fea619]/20 text-[#fea619]" : "bg-indigo-100 text-indigo-900"}`}>
                  {discipline.phone_calls_count || discipline.pastoral_followup_calls || (discipline.phone_calls_done ? "Oui" : 0)}
                </span>
              </div>
            </div>

            <div className={`pt-2 border-t grid grid-cols-2 gap-2 text-xs font-bold ${isDark ? "border-white/10" : "border-slate-200"}`}>
              <div className={`p-2 rounded-lg flex items-center justify-between ${isDark ? "bg-white/5 text-indigo-200" : "bg-white border border-slate-200 text-slate-700"}`}>
                <span>👤 Invités personnels</span>
                <span className={`font-black text-sm ${isDark ? "text-[#fea619]" : "text-indigo-900"}`}>{discipline.personal_invites_count || 0}</span>
              </div>
              <div className={`p-2 rounded-lg flex items-center justify-between ${isDark ? "bg-white/5 text-indigo-200" : "bg-white border border-slate-200 text-slate-700"}`}>
                <span>👥 Invités par groupe</span>
                <span className={`font-black text-sm ${isDark ? "text-[#fea619]" : "text-indigo-900"}`}>{discipline.group_invites_count || 0}</span>
              </div>
              <div className={`p-2 rounded-lg flex items-center justify-between ${isDark ? "bg-white/5 text-indigo-200" : "bg-white border border-slate-200 text-slate-700"}`}>
                <span>🔄 Âmes revenues</span>
                <span className={`font-black text-sm ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>{discipline.recovered_souls_count || 0}</span>
              </div>
              <div className={`p-2 rounded-lg flex items-center justify-between ${isDark ? "bg-white/5 text-indigo-200" : "bg-white border border-slate-200 text-slate-700"}`}>
                <span>🎧 Écoute du message</span>
                <span className={`font-black text-sm ${isDark ? "text-[#fea619]" : "text-indigo-900"}`}>{discipline.message_listeners_count || 0}</span>
              </div>
            </div>

            <div className={`pt-2 border-t grid grid-cols-3 gap-1.5 text-[11px] ${isDark ? "border-white/10" : "border-slate-200"}`}>
              <div className={`p-1.5 rounded flex items-center justify-between ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                <span>🕊️ Gagnées</span>
                <span className={`font-black ${isDark ? "text-[#fea619]" : "text-indigo-900"}`}>{discipline.pastoral_souls_won || 0}</span>
              </div>
              <div className={`p-1.5 rounded flex items-center justify-between ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                <span>🤝 Contacts</span>
                <span className={`font-black ${isDark ? "text-[#fea619]" : "text-indigo-900"}`}>{discipline.pastoral_new_contacts || 0}</span>
              </div>
              <div className={`p-1.5 rounded flex items-center justify-between ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                <span>🌟 Nouveaux</span>
                <span className={`font-black ${isDark ? "text-[#fea619]" : "text-indigo-900"}`}>{discipline.pastoral_first_timers || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 3. Programme d'église (Présence des Membres) */}
        <div className={`p-4 rounded-xl border ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
          <div className={`text-[11px] font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-[#fea619]" : "text-indigo-900"}`}>
            <span>👥 3. Programme d'église (Présence Membres)</span>
          </div>
          <div className="space-y-2 text-xs">
            {programsSummary && programsSummary.length > 0 ? (
              programsSummary.map((prog) => (
                <div key={prog.program_type} className="flex items-center justify-between">
                  <span className={isDark ? "text-slate-300 flex items-center gap-1 font-medium" : "text-slate-600 flex items-center gap-1 font-medium"}>
                    <span>{prog.icon}</span>
                    <span>{prog.label} :</span>
                  </span>
                  <span className={`font-black px-2 py-0.5 rounded-md ${
                    isDark ? "bg-white/10 text-white border border-white/10" : "bg-white text-slate-900 border border-slate-300"
                  }`}>
                    {prog.present_count} / {prog.eligible_count} <span className="text-[10px] opacity-80">({prog.ratio_pct}%)</span>
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className={isDark ? "text-slate-300" : "text-slate-600"}>Dimanche (Culte) :</span>
                  {formatPresence(discipline.church_sunday_presence, discipline.church_sunday_reason)}
                </div>
                <div className="flex items-center justify-between">
                  <span className={isDark ? "text-slate-300" : "text-slate-600"}>Mardi (Affermissement) :</span>
                  {formatPresence(discipline.church_tuesday_presence, discipline.church_tuesday_reason)}
                </div>
                <div className="flex items-center justify-between">
                  <span className={isDark ? "text-slate-300" : "text-slate-600"}>Mercredi (Fondements) :</span>
                  {formatPresence(discipline.church_wednesday_presence, discipline.church_wednesday_reason)}
                </div>
                <div className="flex items-center justify-between">
                  <span className={isDark ? "text-slate-300" : "text-slate-600"}>Jeudi (Prière en ligne) :</span>
                  {formatPresence(discipline.church_thursday_presence, discipline.church_thursday_reason)}
                </div>
                <div className="flex items-center justify-between">
                  <span className={isDark ? "text-slate-300" : "text-slate-600"}>Vendredi (Veillée / Culte) :</span>
                  {formatPresence(discipline.church_friday_presence, discipline.church_friday_reason)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 4. Activités mensuelles & Chaînes de prière */}
        <div className={`p-4 rounded-xl border ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
          <div className={`text-[11px] font-black uppercase tracking-wider mb-3 flex items-center justify-between ${isDark ? "text-[#fea619]" : "text-indigo-900"}`}>
            <span>📅 4. Activités mensuelles & Chaînes de prière</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className={isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium"}>Intercession avant le culte :</span>
              {badgeYesNo(discipline.monthly_pre_service_intercession)}
            </div>
            <div className="flex items-center justify-between">
              <span className={isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium"}>Prière en présentiel :</span>
              {badgeYesNo(discipline.monthly_in_person_prayer_done || discipline.monthly_in_person_done)}
            </div>
            <div className="flex items-center justify-between">
              <span className={isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium"}>Anagkazo :</span>
              {badgeYesNo(discipline.monthly_anagkazo)}
            </div>
            <div className="flex items-center justify-between">
              <span className={isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium"}>Évangélisation de groupe :</span>
              {badgeYesNo(discipline.monthly_group_evangelization)}
            </div>
            <div className="flex items-center justify-between">
              <span className={isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium"}>Mini veillée perso :</span>
              {badgeYesNo(discipline.monthly_prayer_vigil_done || discipline.monthly_vigil_done)}
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-slate-300/40">
              <span className={isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium"}>Chaînes de prière :</span>
              {badgeYesNo(discipline.prayer_chain_done)}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Observations & Thème d'encadrement */}
      {(discipline.mentoring_theme || discipline.other_observations) && (
        <div className={`p-4 rounded-xl border ${isDark ? "bg-white/5 border-white/10 text-indigo-200" : "bg-indigo-50/50 border-indigo-200/80 text-slate-800"}`}>
          <div className={`text-[11px] font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 ${isDark ? "text-[#fea619]" : "text-indigo-900"}`}>
            <span>📝 5. Observations & Thème d'encadrement</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {discipline.mentoring_theme && (
              <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-white border border-slate-200"}`}>
                <span className="font-bold block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Thème d'encadrement :</span>
                <span className="font-medium text-sm block">{discipline.mentoring_theme}</span>
              </div>
            )}
            {discipline.other_observations && (
              <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-white border border-slate-200"}`}>
                <span className="font-bold block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Autres observations :</span>
                <span className="font-medium text-sm block">{discipline.other_observations}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Group filter for Pastor
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [groupsList, setGroupsList] = useState<{ id: string; name: string }[]>([]);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const toggleReport = (id: string) => {
    setExpandedReportId((prev) => (prev === id ? null : id));
  };

  // Shepherd live preview calculation state
  const [previewData, setPreviewData] = useState<WeeklyReport["content"] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

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

        const { data: prof } = await supabase
          .from("profiles")
          .select("*, groups!profiles_group_id_fkey(name)")
          .eq("id", user.id)
          .single();

        if (!prof) {
          router.push("/profile");
          return;
        }
        setProfile(prof as Profile);

        if (prof.role === "pastor") {
          const { data: grps } = await supabase.from("groups").select("*");
          if (grps) setGroupsList(grps);
        }

        // Fetch reports based on role
        let query = supabase
          .from("weekly_reports")
          .select("*, profiles(first_name, last_name), groups(name)")
          .order("report_date", { ascending: false });

        if (prof.role === "shepherd") {
          query = query.eq("shepherd_id", user.id);
        } else if (prof.role === "leader") {
          query = query.eq("group_id", prof.group_id);
        }

        const { data: repData } = await query;
        if (repData) setReports(repData as WeeklyReport[]);

        // If Shepherd, calculate live preview for selectedDate
        if (prof.role === "shepherd") {
          await computeShepherdPreview(prof.id, selectedDate);
        }
      } catch (err) {
        console.error("Erreur de chargement des rapports:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, supabase]);

  const computeShepherdPreview = async (shepherdId: string, dateStr: string) => {
    const mondayStr = getMondayDateStr(dateStr);
    const sundayStr = getSundayDateStr(dateStr);

    // 1. Get members
    const { data: mems } = await supabase.from("members").select("*").eq("shepherd_id", shepherdId).is("archived_at", null);
    const totalMembers = mems?.length || 0;
    const memIds = mems?.map((m) => m.id) || [];

    // 2. Get all attendance records across the week interval (Monday to Sunday)
    const { data: attData } = memIds.length > 0 ? await supabase
      .from("attendance")
      .select("*")
      .in("member_id", memIds)
      .gte("date", mondayStr)
      .lte("date", sundayStr) : { data: [] };

    // Compute KPIs for every program of the week using our centralized helper
    const programsSummary: ProgramSummaryItem[] = computeProgramsSummary(mems || [], attData || []);

    const sundayProg = programsSummary.find((p) => p.program_type === "sunday_service");
    const presentCount = sundayProg?.present_count || 0;
    const ratio = sundayProg?.ratio_pct || 0;

    // 3. Get Sunday absentees and reasons
    const sundayPresentIds = new Set(
      (attData || [])
        .filter((a) => a.program_type === "sunday_service" && a.is_present)
        .map((a) => a.member_id)
    );

    const { data: absReasons } = memIds.length > 0 ? await supabase
      .from("sunday_absences")
      .select("*")
      .in("member_id", memIds)
      .gte("date", mondayStr)
      .lte("date", sundayStr) : { data: [] };

    const absMap = new Map(absReasons?.map((r) => [r.member_id, r.reason]) || []);
    const absenteesList: { name: string; reason: string }[] = [];
    mems?.forEach((m) => {
      if (!sundayPresentIds.has(m.id)) {
        absenteesList.push({
          name: `${m.first_name} ${m.last_name}`,
          reason: absMap.get(m.id) || "Absence non justifiée",
        });
      }
    });

    const newMemsProg = mems
      ?.filter((m) => m.consecutive_sundays_present && m.consecutive_sundays_present > 0 && m.consecutive_sundays_present < 4)
      .map((m) => ({ name: `${m.first_name} ${m.last_name}`, count: m.consecutive_sundays_present })) || [];

    // 5. Shepherd discipline for the exact week or latest
    const { data: discData } = await supabase
      .from("shepherd_activities")
      .select("*")
      .eq("shepherd_id", shepherdId)
      .eq("week_start_date", mondayStr);

    const mapDisc = (d: any): any => ({
      ...d,
      daily_prayer_done: d.daily_prayer_done,
      daily_meditation_done: d.daily_meditation_done,
      meditated_book: d.meditated_book,
      evangelization_done: d.evangelization_done,
      monthly_prayer_vigil_done: d.monthly_prayer_vigil_done,
      monthly_in_person_prayer_done: d.monthly_in_person_prayer_done,
      prayer_q_done: d.prayer_q_done,
      prayer_i_done: d.prayer_i_done,
      fasting_q_done: d.fasting_q_done,
      fasting_i_done: d.fasting_i_done,
      word_listening_q_done: d.word_listening_q_done,
      word_listening_i_done: d.word_listening_i_done,
      bible_study_q_done: d.bible_study_q_done,
      bible_study_i_done: d.bible_study_i_done,
      meditation_book_name: d.meditation_book_name,
      meditation_chapter_start: d.meditation_chapter_start,
      meditation_chapter_end: d.meditation_chapter_end,
      evangelism_q_done: d.evangelism_q_done,
      evangelism_i_done: d.evangelism_i_done,
      pastoral_souls_won: d.pastoral_souls_won,
      pastoral_new_contacts: d.pastoral_new_contacts,
      pastoral_first_timers: d.pastoral_first_timers,
      pastoral_home_visits: d.pastoral_home_visits,
      pastoral_sick_visits: d.pastoral_sick_visits,
      pastoral_consolation_visits: d.pastoral_consolation_visits,
      pastoral_followup_calls: d.pastoral_followup_calls,
      church_sunday_presence: d.church_sunday_presence,
      church_sunday_reason: d.church_sunday_reason,
      church_tuesday_presence: d.church_tuesday_presence,
      church_tuesday_reason: d.church_tuesday_reason,
      church_wednesday_presence: d.church_wednesday_presence,
      church_wednesday_reason: d.church_wednesday_reason,
      church_thursday_presence: d.church_thursday_presence,
      church_thursday_reason: d.church_thursday_reason,
      church_friday_presence: d.church_friday_presence,
      church_friday_reason: d.church_friday_reason,
      monthly_vigil_done: d.monthly_vigil_done,
      monthly_in_person_done: d.monthly_in_person_done,
      monthly_department_done: d.monthly_department_done,
      monthly_offering_done: d.monthly_offering_done,
    });

    let disc = null;
    if (discData && discData.length > 0) {
      disc = mapDisc(discData[0]);
    } else {
      const { data: latestDisc } = await supabase
        .from("shepherd_activities")
        .select("*")
        .eq("shepherd_id", shepherdId)
        .order("week_start_date", { ascending: false })
        .limit(1);
      if (latestDisc && latestDisc.length > 0) {
        disc = mapDisc(latestDisc[0]);
      }
    }

    setPreviewData({
      total_members: totalMembers,
      sunday_present_count: presentCount,
      attendance_ratio_pct: ratio,
      absentees_with_reasons: absenteesList,
      new_members_progression: newMemsProg,
      discipline: disc,
      programs_summary: programsSummary,
    });
  };

  const handleSubmitReport = async () => {
    if (!profile || !previewData) return;
    setSaving(true);
    setMessage(null);

    const mondayStr = getMondayDateStr(selectedDate);

    try {
      const payload = {
        shepherd_id: profile.id,
        group_id: profile.group_id || "00000000-0000-0000-0000-000000000000",
        report_date: mondayStr,
        week_end_date: mondayStr,
        content: previewData,
        report_data: previewData,
        status: "submitted" as const,
      };

      const { data, error } = await supabase
        .from("weekly_reports")
        .upsert([payload], { onConflict: "shepherd_id,report_date" })
        .select("*, profiles(first_name, last_name), groups(name)")
        .single();

      if (error) throw error;
      if (data) {
        setReports((prev) => {
          const filtered = prev.filter((r) => !(r.shepherd_id === profile.id && (r.report_date === mondayStr || r.week_end_date === mondayStr)));
          return [data as WeeklyReport, ...filtered];
        });
        setMessage("Rapport hebdomadaire consolidé et soumis au responsable de groupe avec succès !");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erreur lors de la soumission du rapport : ${err?.message || err?.details || JSON.stringify(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("weekly_reports")
        .update({ status: newStatus })
        .eq("id", reportId);

      if (error) throw error;
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors du changement de statut.");
    }
  };

  const filteredReports = reports.filter((r) => {
    if (profile?.role === "pastor" && groupFilter !== "all") {
      return r.group_id === groupFilter;
    }
    return true;
  });

  // Calculate executive KPI stats if Pastor or Leader
  const totalReportsCount = filteredReports.length;
  const approvedReportsCount = filteredReports.filter((r) => r.status === "approved").length;
  const avgAttendancePct = totalReportsCount > 0
    ? Math.round(filteredReports.reduce((acc, r) => acc + (r.content?.attendance_ratio_pct || 0), 0) / totalReportsCount)
    : 0;
  const dailyPrayerRatePct = totalReportsCount > 0
    ? Math.round((filteredReports.filter((r) => r.content?.discipline?.daily_prayer_done).length / totalReportsCount) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-md border border-slate-200 font-semibold text-sm">
          <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Chargement des rapports & analyses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      <Navbar
        role={profile?.role || "shepherd"}
        groupName={profile?.groups?.name}
        userName={profile ? `${profile.first_name} ${profile.last_name}` : undefined}
      />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header Section */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1b4b] text-[#e3dfff] mb-2 border border-[#fea619]/30 shadow-2xs">
                <span className="material-symbols-outlined text-[15px] text-[#fea619]">assignment</span>
                <span className="font-label-caps font-bold text-[11px] uppercase tracking-wider">
                  {profile?.role === "pastor"
                    ? "Analyses & Synthèse Exécutive Pastorale"
                    : profile?.role === "leader"
                    ? `Validation de Groupe • ${profile?.groups?.name}`
                    : "Consolidation & Soumission Hebdomadaire"}
                </span>
              </div>
              <h1 className="font-headline-md font-extrabold text-2xl sm:text-3xl text-[#1e1b4b] tracking-tight">
                {profile?.role === "pastor" ? "Rapports & Vision Globale" : "Rapports Dominiceaux"}
              </h1>
              <p className="text-[#47464f] text-xs sm:text-sm mt-1 font-medium">
                {profile?.role === "shepherd"
                  ? "Consultez l'aperçu consolidé de votre travail dominical et soumettez votre rapport au responsable."
                  : "Examinez, validez et suivez l'évolution des groupes et la fidélité des âmes."}
              </p>
            </div>

            {profile?.role === "shepherd" && (
              <WeekSelector
                selectedDate={selectedDate}
                onChangeDate={(newDateStr) => {
                  setSelectedDate(newDateStr);
                  if (profile?.id) computeShepherdPreview(profile.id, newDateStr);
                }}
              />
            )}
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-2xs">
            <span>✓ {message}</span>
            <button onClick={() => setMessage(null)} className="text-emerald-700 font-black ml-4 hover:opacity-75">✕</button>
          </div>
        )}

        {/* If Pastor or Leader: Executive KPI Overview Bar */}
        {profile?.role !== "shepherd" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xl shadow-slate-200/40 hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
                <span>Rapports Soumis</span>
                <span className="text-base">📋</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-[#1e1b4b] mt-2">{totalReportsCount}</div>
            </div>
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xl shadow-slate-200/40 hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
                <span>Présence Moyenne</span>
                <span className="text-base">⛪</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 mt-2">{avgAttendancePct}%</div>
            </div>
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xl shadow-slate-200/40 hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
                <span>Prière Quotidienne</span>
                <span className="text-base">🙏</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-purple-700 mt-2">{dailyPrayerRatePct}%</div>
            </div>
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xl shadow-slate-200/40 hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
                <span>Rapports Approuvés</span>
                <span className="text-base">✓</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-indigo-600 mt-2 flex items-baseline gap-1.5">
                <span>{approvedReportsCount}</span>
                <span className="text-sm text-slate-400 font-bold">/ {totalReportsCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* If Pastor: Group Filter */}
        {profile?.role === "pastor" && (
          <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#fea619]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#1e1b4b]">Filtrer par Groupe :</span>
            </div>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-black text-[#1e1b4b] focus:outline-none focus:ring-2 focus:ring-[#fea619]/50 focus:border-[#1e1b4b] shadow-2xs cursor-pointer hover:bg-slate-100 transition-all"
            >
              <option value="all">🌐 Tous les groupes (Puissance, Gloire, Sagesse)</option>
              {groupsList.map((g) => (
                <option key={g.id} value={g.id}>
                  🏷️ Groupe {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* If Shepherd: Consolidation Preview Card (Task 6.2 & 6.3) */}
        {profile?.role === "shepherd" && previewData && (
          <div className="bg-gradient-to-br from-[#1e1b4b] via-[#2d2a6e] to-[#1e1b4b] text-white border border-[#fea619]/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 space-y-7 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#fea619]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-white/10 pb-6 relative z-10">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                    <span>📊 Consolidation du Rapport Dominical</span>
                  </h2>
                  <span className="text-[11px] font-black px-3 py-1 rounded-full bg-[#fea619] text-[#1e1b4b] shadow-md shadow-[#fea619]/20 uppercase tracking-wider">
                    Aperçu en direct • {formatWeekInterval(selectedDate)}
                  </span>
                </div>
                <p className="text-xs font-medium text-indigo-200 mt-1.5 leading-relaxed max-w-2xl">
                  Vérifiez ces statistiques automatiquement agrégées de votre groupe avant de soumettre au responsable. Tout est synchronisé depuis vos présences et vos activités spirituelles.
                </p>
              </div>

              <button
                onClick={handleSubmitReport}
                disabled={saving}
                className="px-6 py-4 rounded-2xl font-black text-xs text-[#1e1b4b] bg-gradient-to-r from-[#fea619] via-[#ffb947] to-[#fea619] hover:from-white hover:to-white shadow-xl shadow-[#fea619]/30 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="text-base">🚀</span>
                <span>{saving ? "Soumission en cours..." : "Soumettre ce rapport hebdomadaire"}</span>
              </button>
            </div>

            {/* Preview Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 hover:border-[#fea619]/50 transition-all">
                <div className="text-[11px] text-[#fea619] font-black uppercase tracking-wider flex items-center justify-between">
                  <span>Taux de Présence Culte</span>
                  <span>⛪</span>
                </div>
                <div className="text-2xl font-black text-white mt-2 flex items-baseline gap-2">
                  <span>{previewData.sunday_present_count} <span className="text-sm text-indigo-200 font-bold">/ {previewData.total_members}</span></span>
                  <span className="text-[#fea619] text-lg font-extrabold">({previewData.attendance_ratio_pct}%)</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 hover:border-rose-400/50 transition-all">
                <div className="text-[11px] text-rose-300 font-black uppercase tracking-wider flex items-center justify-between">
                  <span>Absents au Culte</span>
                  <span>⚠️</span>
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {previewData.absentees_with_reasons.length} <span className="text-sm font-bold text-rose-200">fidèle(s) absent(s)</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 hover:border-indigo-300/50 transition-all md:col-span-2">
                <div className="text-xs text-indigo-200 font-black uppercase tracking-wider flex items-center justify-between mb-1">
                  <span>Discipline Spirituelle & Consécration Pastorale</span>
                  <span>🙏</span>
                </div>
                <DisciplineReportDetails discipline={previewData.discipline} programsSummary={previewData.programs_summary} isDark={true} />
              </div>
            </div>

            {/* Weekly Programs Breakdown (KPIs) */}
            {previewData.programs_summary && previewData.programs_summary.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 space-y-4 relative z-10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#fea619] flex items-center gap-2">
                    <span>📈 Indicateurs de Présence aux Programmes de la Semaine</span>
                  </h3>
                  <span className="text-xs font-black text-white bg-white/15 px-3 py-1 rounded-xl border border-white/10">
                    {formatWeekInterval(selectedDate)}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {previewData.programs_summary.map((prog, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between hover:border-[#fea619]/40 transition-all">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span className="text-base">{prog.icon}</span>
                        <span className="line-clamp-1">{prog.label}</span>
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-xl font-black text-white">
                          {prog.present_count} <span className="text-xs font-semibold text-indigo-200">/ {prog.eligible_count}</span>
                        </span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                          prog.ratio_pct >= 75 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                          prog.ratio_pct >= 50 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                          "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}>
                          {prog.ratio_pct}%
                        </span>
                      </div>
                      <div className="w-full bg-white/15 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            prog.ratio_pct >= 75 ? "bg-emerald-400" :
                            prog.ratio_pct >= 50 ? "bg-[#fea619]" :
                            "bg-rose-400"
                          }`}
                          style={{ width: `${Math.min(prog.ratio_pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Absentees Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 relative z-10">
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                  <span>⚠️ Liste des Absents et Motifs ({previewData.absentees_with_reasons.length})</span>
                </h3>
                {previewData.absentees_with_reasons.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-bold text-emerald-300">
                    ✨ Aucun absent au culte ce dimanche dans votre groupe !
                  </div>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {previewData.absentees_with_reasons.map((abs, idx) => (
                      <li key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <span className="font-black text-white">{abs.name}</span>
                        <span className="text-rose-200 italic font-medium">{abs.reason}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
                  <span>🌱 Progression Nouveaux Membres ({previewData.new_members_progression.length})</span>
                </h3>
                {previewData.new_members_progression.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-medium text-indigo-200">
                    Aucun nouveau membre en cours d'intégration (4 dimanches).
                  </div>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {previewData.new_members_progression.map((newM, idx) => (
                      <li key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <span className="font-black text-white">{newM.name}</span>
                        <span className="px-3 py-1 rounded-lg bg-[#fea619]/20 text-[#fea619] font-black border border-[#fea619]/30 shadow-2xs">
                          {newM.count} / 4 Dimanches
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* NB Block & Legal Attestation */}
            <div className="space-y-3 pt-2 relative z-10">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-xs text-indigo-200 space-y-1">
                <div className="font-black text-[#fea619] uppercase tracking-wider text-[11px] mb-1">📌 Rappels Importants (Règles d'intégration) :</div>
                <div className="flex items-center gap-2"><span>•</span><span>La liste des membres est actualisée chaque trimestre.</span></div>
                <div className="flex items-center gap-2"><span>•</span><span>Après 3 cultes de présence consécutive, présenter l’âme au pasteur.</span></div>
                <div className="flex items-center gap-2"><span>•</span><span>Après 4 cultes, l’âme n’est plus considérée comme revenue (entièrement intégrée).</span></div>
              </div>

              <div className="p-4 rounded-2xl bg-[#fea619]/10 border border-[#fea619]/30 backdrop-blur-md flex items-start gap-3 text-xs text-indigo-100 italic">
                <span className="text-base not-italic">📜</span>
                <div>
                  <span className="font-bold not-italic block text-[#fea619] mb-0.5 uppercase text-[11px]">Attestation sur l'honneur :</span>
                  "Je soussigné, berger <span className="font-black text-white not-italic">{profile?.first_name} {profile?.last_name}</span>, atteste en toute conscience et devant le Seigneur que l'ensemble des informations mentionnées ci-dessus sont exactes, sincères et conformes à la vérité."
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Archive / Validation List */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-5">
            <h2 className="text-xl sm:text-2xl font-headline-md font-extrabold text-[#1e1b4b] flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#1e1b4b] to-[#fea619] shadow-sm shadow-[#1e1b4b]/30" />
              <span>{profile?.role === "shepherd" ? "Vos Rapports Soumis" : "Rapports Hebdomadaires Reçus"}</span>
            </h2>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-label-caps font-extrabold uppercase tracking-wider bg-[#1e1b4b] text-white border border-[#fea619]/40 shadow-2xs">
              {filteredReports.length} rapport(s) affiché(s)
            </span>
          </div>

          {filteredReports.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center font-bold text-[#47464f] text-sm border border-white/80 shadow-md">
              Aucun rapport dans cette vue.
            </div>
          ) : (
            <div className="space-y-5">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="glass-panel-interactive rounded-3xl p-6 sm:p-8 border border-white/80 shadow-md space-y-6 relative overflow-hidden transition-all"
                >
                  <div 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-5 cursor-pointer"
                    onClick={() => toggleReport(report.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${expandedReportId === report.id ? 'rotate-90' : ''}`}>
                        chevron_right
                      </span>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-headline-md font-extrabold text-[#1e1b4b]">
                          {report.profiles ? `${report.profiles.first_name} ${report.profiles.last_name}` : "Berger"}
                        </h3>
                        {report.groups && (
                          <span className="px-3 py-1 rounded-xl bg-[#1e1b4b]/10 text-[#1e1b4b] font-bold text-xs border border-[#1e1b4b]/20 shadow-2xs">
                            ⚡ Groupe {report.groups.name}
                          </span>
                        )}
                        <span className="text-xs font-bold text-[#1e1b4b] bg-white/80 px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                          {formatWeekInterval(report.report_date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {report.status === "submitted" && (
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-900 border border-amber-500/30 shadow-2xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          <span>En attente de validation</span>
                        </span>
                      )}
                      {report.status === "approved" && (
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 shadow-2xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          <span>Approuvé par le responsable ✓</span>
                        </span>
                      )}
                      {report.status === "rejected" && (
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-900 border border-rose-500/30 shadow-2xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-600" />
                          <span>À réviser ✕</span>
                        </span>
                      )}

                      {/* Approval controls for Leader / Pastor */}
                      {profile?.role !== "shepherd" && report.status === "submitted" && (
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleUpdateStatus(report.id, "approved")}
                            className="px-5 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-md shadow-emerald-600/20 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                          >
                            Valider ✓
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(report.id, "rejected")}
                            className="px-5 py-2.5 rounded-2xl text-xs font-black bg-rose-50/90 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                          >
                            Rejeter ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Report Content Details */}
                  {report.content && (
                    <div className={`transition-all duration-300 overflow-hidden ${
                      expandedReportId === report.id ? 'max-h-[3000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="space-y-5">
                      {report.content.programs_summary && report.content.programs_summary.length > 0 && (
                        <div className="bg-white/50 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-white/80 shadow-2xs">
                          <div className="text-xs font-label-caps font-extrabold text-[#1e1b4b] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span>📊</span>
                            <span>Présence aux programmes de la semaine • <span className="text-[#fea619]">{formatWeekInterval(report.report_date)}</span></span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
                            {report.content.programs_summary.map((prog, idx) => (
                              <div key={idx} className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-col justify-between text-xs shadow-2xs hover:border-[#1e1b4b]/40 transition-all">
                                <div className="flex items-center gap-2 font-bold text-[#1e1b4b]">
                                  <span className="text-base">{prog.icon}</span>
                                  <span className="line-clamp-1">{prog.label}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between font-black">
                                  <span className="text-[#1e1b4b] text-sm">{prog.present_count} <span className="text-xs font-bold text-slate-500">/ {prog.eligible_count}</span></span>
                                  <span className={`px-2 py-0.5 rounded-md text-xs font-extrabold ${
                                    prog.ratio_pct >= 75 ? "bg-emerald-100 text-emerald-900" : prog.ratio_pct >= 50 ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-900"
                                  }`}>
                                    {prog.ratio_pct}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200/80 h-1.5 rounded-full mt-2.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${prog.ratio_pct >= 75 ? "bg-emerald-500" : prog.ratio_pct >= 50 ? "bg-[#fea619]" : "bg-rose-500"}`}
                                    style={{ width: `${Math.min(prog.ratio_pct, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/80 shadow-2xs">
                          <span className="text-slate-500 font-label-caps font-extrabold uppercase tracking-wider text-[11px]">Présence Dominicale :</span>
                          <span className="text-xl font-headline-md font-extrabold text-[#1e1b4b] mt-1.5 block">
                            {report.content.sunday_present_count} / {report.content.total_members} <span className="text-emerald-600 font-extrabold text-base">({report.content.attendance_ratio_pct}%)</span>
                          </span>
                        </div>
                        <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/80 shadow-2xs">
                          <span className="text-slate-500 font-label-caps font-extrabold uppercase tracking-wider text-[11px]">Absents et Suivi :</span>
                          <span className="text-xl font-headline-md font-extrabold text-rose-600 mt-1.5 block">
                            {report.content.absentees_with_reasons?.length || 0} fidèle(s) absent(s)
                          </span>
                        </div>
                        <div className="bg-white/60 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-white/80 shadow-2xs md:col-span-2">
                          <div className="text-slate-500 font-label-caps font-extrabold uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between">
                            <span>Discipline & Consécration Pastorale (Détail Complet) :</span>
                            <span>🙏</span>
                          </div>
                          <DisciplineReportDetails discipline={report.content.discipline} programsSummary={report.content.programs_summary || report.summary_data} isDark={false} />
                        </div>

                        {/* Absentees and New Members in Saved Report */}
                        <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/80 shadow-2xs space-y-3">
                          <h4 className="text-xs font-label-caps font-extrabold uppercase tracking-wider text-rose-600 flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                            <span>⚠️ Liste détaillée des Absents</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[11px]">{report.content.absentees_with_reasons?.length || 0}</span>
                          </h4>
                          {!report.content.absentees_with_reasons || report.content.absentees_with_reasons.length === 0 ? (
                            <div className="text-xs text-emerald-700 font-bold italic py-1">✨ Aucun absent au culte</div>
                          ) : (
                            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {report.content.absentees_with_reasons.map((abs, idx) => (
                                <li key={idx} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
                                  <span className="font-bold text-[#1e1b4b]">{abs.name}</span>
                                  <span className="text-rose-600 font-medium italic">{abs.reason}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/80 shadow-2xs space-y-3">
                          <h4 className="text-xs font-label-caps font-extrabold uppercase tracking-wider text-[#1e1b4b] flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                            <span>🌱 Progression Nouveaux Membres</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#1e1b4b]/10 text-[#1e1b4b] font-extrabold text-[11px]">{report.content.new_members_progression?.length || 0}</span>
                          </h4>
                          {!report.content.new_members_progression || report.content.new_members_progression.length === 0 ? (
                            <div className="text-xs text-slate-500 italic py-1">Aucun nouveau membre (4 dimanches)</div>
                          ) : (
                            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {report.content.new_members_progression.map((newM, idx) => (
                                <li key={idx} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
                                  <span className="font-bold text-[#1e1b4b]">{newM.name}</span>
                                  <span className="px-2.5 py-0.5 rounded-lg bg-[#fea619]/20 text-[#1e1b4b] font-extrabold text-[11px] border border-[#fea619]/30">{newM.count} / 4 Dim.</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Attestation in Saved Report */}
                        <div className="bg-gradient-to-br from-[#fea619]/10 to-[#1e1b4b]/5 p-5 rounded-2xl border border-[#fea619]/30 md:col-span-2 flex items-start gap-3.5 text-xs text-[#1e1b4b] italic shadow-2xs">
                          <span className="text-base not-italic">📜</span>
                          <div>
                            <span className="font-label-caps font-extrabold not-italic block text-[#1e1b4b] mb-1 uppercase text-[11px] tracking-wider">Attestation sur l'honneur du berger :</span>
                            "Je soussigné, berger <span className="font-extrabold text-[#1e1b4b] not-italic">{report.profiles?.first_name} {report.profiles?.last_name}</span>, atteste en toute conscience et devant le Seigneur que l'ensemble des informations mentionnées dans ce rapport hebdomadaire sont exactes, sincères et conformes à la vérité."
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
