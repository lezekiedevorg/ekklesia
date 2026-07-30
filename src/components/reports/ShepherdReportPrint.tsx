"use client";

import React from "react";
import { ProgramSummaryItem } from "@/types/db";

export interface PrintData {
  shepherdName: string;
  weekStart: string; // lundi (YYYY-MM-DD)
  form: Record<string, any>;
  programsSummary: ProgramSummaryItem[];
  absentees: { name: string; reason: string }[];
}

const fmt = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// Cellule d'en-tête de groupe (bandeau bleu nuit)
const GroupTh = ({ children, span }: { children: React.ReactNode; span: number }) => (
  <th colSpan={span} className="border border-slate-900 bg-[#1e1b4b] text-white px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide">
    {children}
  </th>
);

const SubTh = ({ children }: { children: React.ReactNode }) => (
  <th className="border border-slate-900 bg-slate-100 px-1.5 py-1.5 text-[10px] font-semibold leading-tight align-middle">
    {children}
  </th>
);

const Val = ({ children }: { children: React.ReactNode }) => (
  <td className="border border-slate-900 px-2 py-2 text-[11px] font-bold text-center align-middle">
    {children}
  </td>
);

export function ShepherdReportPrint({ data }: { data: PrintData | null }) {
  if (!data) return null;
  const { shepherdName, weekStart, form, programsSummary, absentees } = data;
  const monday = new Date(weekStart + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const qi = (q: string, i: string) => (form[q] ? "Q" : form[i] ? "I" : "—");
  const oui = (k: string) => (form[k] ? "OUI" : "NON");
  const check = (k: string) => (form[k] ? "✓" : "✗");

  const ratioByProgram = (type: string) => {
    const p = programsSummary.find((x) => x.program_type === type);
    return p ? `${p.present_count}/${p.eligible_count}` : "—";
  };

  return (
    <div id="shepherd-report" className="print-only bg-white text-slate-900 p-5" style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Titre */}
      <h1 className="text-center text-[17px] font-black uppercase tracking-wide mb-3">
        Rapport du berger <span className="underline">{shepherdName}</span>. Semaine du{" "}
        <span className="underline">{fmt(monday)}</span> au <span className="underline">{fmt(sunday)}</span>
      </h1>

      {/* Grille principale */}
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            <GroupTh span={4}>Vie personnelle</GroupTh>
            <GroupTh span={4}>Travail du berger</GroupTh>
            <GroupTh span={5}>Programme d&apos;église</GroupTh>
            <GroupTh span={5}>Activités mensuelles</GroupTh>
            <GroupTh span={1}>Chaînes de prière</GroupTh>
          </tr>
          <tr>
            <SubTh>Prière</SubTh>
            <SubTh>Jeûne</SubTh>
            <SubTh>Méditation</SubTh>
            <SubTh>Écoute de la parole</SubTh>

            <SubTh>Évangéli-sation</SubTh>
            <SubTh>Encadre-ment</SubTh>
            <SubTh>Visite</SubTh>
            <SubTh>Entretien téléphonique</SubTh>

            <SubTh>Mardi</SubTh>
            <SubTh>Mercredi</SubTh>
            <SubTh>Jeudi en ligne</SubTh>
            <SubTh>Vendredi</SubTh>
            <SubTh>Dimanche</SubTh>

            <SubTh>Intercession avant le culte</SubTh>
            <SubTh>Anagkazo</SubTh>
            <SubTh>Prière en présentiel</SubTh>
            <SubTh>Évangéli-sation de groupe</SubTh>
            <SubTh>Mini veillée perso</SubTh>

            <SubTh>Participation</SubTh>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Val>{qi("daily_prayer_done", "prayer_i_done")}</Val>
            <Val>{oui("fasting_q_done")}</Val>
            <Val>{qi("daily_meditation_done", "meditation_i_done")}</Val>
            <Val>{oui("word_listening_q_done")}</Val>

            <Val>{oui("evangelization_done")}</Val>
            <Val>{oui("mentoring_done")}</Val>
            <Val>{oui("visits_done")}</Val>
            <Val>{form.phone_calls_done ? `OUI (${form.phone_calls_count || 0})` : "NON"}</Val>

            <Val>{ratioByProgram("tuesday_class")}</Val>
            <Val>{ratioByProgram("wednesday_class")}</Val>
            <Val>{ratioByProgram("thursday_online")}</Val>
            <Val>{ratioByProgram("friday_service")}</Val>
            <Val>{ratioByProgram("sunday_service")}</Val>

            <Val>{check("monthly_pre_service_intercession")}</Val>
            <Val>{check("monthly_anagkazo")}</Val>
            <Val>{check("monthly_in_person_prayer_done")}</Val>
            <Val>{check("monthly_group_evangelization")}</Val>
            <Val>{check("monthly_prayer_vigil_done")}</Val>

            <Val>{check("prayer_chain_done")}</Val>
          </tr>
        </tbody>
      </table>

      {/* Bilan des âmes + livre étudié */}
      <table className="w-full border-collapse table-fixed mt-2">
        <thead>
          <tr>
            <SubTh>Invité personnel</SubTh>
            <SubTh>Invités par groupe</SubTh>
            <SubTh>Âmes revenues</SubTh>
            <SubTh>Combien ont écouté le message</SubTh>
            <th className="border border-slate-900 bg-slate-100 px-1.5 py-1.5 text-[10px] font-semibold w-[40%]">
              Le livre à étudier
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Val>{form.personal_invites_count || 0}</Val>
            <Val>{form.group_invites_count || 0}</Val>
            <Val>{form.recovered_souls_count || 0}</Val>
            <Val>{form.message_listeners_count || 0}</Val>
            <td className="border border-slate-900 px-3 py-2 text-[11px] font-bold">{form.meditated_book || ""}</td>
          </tr>
        </tbody>
      </table>

      {/* Observations */}
      <table className="w-full border-collapse mt-2">
        <thead>
          <tr>
            <th className="border border-slate-900 bg-[#1e1b4b] text-white px-3 py-1.5 text-[11px] font-bold uppercase w-1/2">
              Observations
            </th>
            <th className="border border-slate-900 bg-[#1e1b4b] text-white px-3 py-1.5 text-[11px] font-bold uppercase w-1/2">
              Autres observations
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="align-top">
            <td className="border border-slate-900 px-3 py-2 text-[11px]">
              <div className="font-bold mb-1">Noms des absents et raison :</div>
              {absentees.length > 0 ? (
                <ul className="space-y-0.5">
                  {absentees.map((a) => (
                    <li key={a.name}>
                      • {a.name} : {a.reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="italic text-slate-500">Aucun absent au culte dominical.</span>
              )}
            </td>
            <td className="border border-slate-900 px-3 py-2 text-[11px] whitespace-pre-wrap">
              <div className="font-bold">Thème d&apos;encadrement :</div>
              <div className="mb-1.5">{form.mentoring_theme || ""}</div>
              {form.other_observations || ""}
            </td>
          </tr>
        </tbody>
      </table>

      {/* NB + attestation */}
      <div className="mt-2 text-[9px] leading-snug text-slate-700">
        <span className="font-bold">NB :</span> La liste des membres est actualisée chaque trimestre — Après 3 cultes,
        présenter l&apos;âme au pasteur — Après 4 cultes, l&apos;âme n&apos;est plus considérée comme revenue.
      </div>
      <p className="mt-2 text-[10px] italic leading-snug">
        Je soussigné, berger <span className="font-bold not-italic">{shepherdName}</span>, atteste en toute conscience et
        devant le Seigneur que l&apos;ensemble des informations ci-dessus mentionnées sont exactes, sincères et conformes
        à la vérité.
      </p>
      <div className="mt-8 text-[11px] flex justify-end">
        <div className="text-center">
          <div className="border-t-2 border-slate-900 w-52 pt-2 font-bold">Signature du berger</div>
        </div>
      </div>
    </div>
  );
}
