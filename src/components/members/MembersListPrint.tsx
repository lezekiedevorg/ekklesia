"use client";

import React, { useEffect } from "react";

export interface PrintMember {
  fullName: string;
  phone: string;
}

export interface ListPrintProps {
  /** Titre affiché en haut du PDF */
  title: string;
  /** Sous-titre optionnel (ex: "X membres") */
  subtitle?: string;
  /** Liste des membres à imprimer */
  members: PrintMember[];
  /** Quand ce compteur passe à true, window.print() est appelé */
  trigger: boolean;
  /** Callback après déclenchement de print (pour reset le trigger côté parent) */
  onAfterPrint?: () => void;
}

/**
 * Composant d'impression générique pour listes de membres (PDF via navigateur).
 *
 * ⚠️ Suit le pattern imposé par `src/app/globals.css` :
 *   - Le CSS global `@media print` masque TOUT le body (`visibility: hidden`)
 *     SAUF les éléments dans `.print-only`
 *   - Donc notre root DOIT avoir la classe `print-only`
 *   - Les styles d'impression sont gérés globalement par `.print-only *`
 *     + on peut surcharger via `#members-list-print` pour nos couleurs
 *
 * Pattern identique à `ShepherdReportPrint` (rapport berger).
 */
export function MembersListPrint({
  title,
  subtitle,
  members,
  trigger,
  onAfterPrint,
}: ListPrintProps) {
  useEffect(() => {
    if (!trigger) return;
    const t = setTimeout(() => {
      window.print();
      onAfterPrint?.();
    }, 200);
    return () => clearTimeout(t);
  }, [trigger, onAfterPrint]);

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      id="members-list-print"
      className="print-only bg-white text-slate-900 p-8"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <style>{`
        @media print {
          #members-list-report {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #members-list-report h1 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          #members-list-report table,
          #members-list-report tr,
          #members-list-report thead,
          #members-list-report tbody {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #members-list-report > div {
            page-break-before: avoid !important;
            break-before: avoid !important;
          }
        }
        @media screen {
          #members-list-report {
            /* Caché visuellement à l'écran (le print-only global n'est déjà
               pas affiché en screen, mais on garantit aussi qu'il n'est
               pas cliquable). */
            pointer-events: none;
          }
        }
      `}</style>

      <div id="members-list-report">
        <h1 className="text-center text-[22px] font-black uppercase tracking-wide mb-2 text-[#1e1b4b]">
          {title}
        </h1>
        <p className="text-center text-[12px] text-slate-600 mb-6 font-semibold">
          {subtitle ? `${subtitle} — ` : ""}Généré le {dateStr}
        </p>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-2 border-slate-900 bg-[#1e1b4b] text-white px-3 py-2 text-[12px] font-bold uppercase tracking-wide w-[8%] text-center">
                #
              </th>
              <th className="border-2 border-slate-900 bg-[#1e1b4b] text-white px-3 py-2 text-[12px] font-bold uppercase tracking-wide">
                Nom &amp; Prénom
              </th>
              <th className="border-2 border-slate-900 bg-[#1e1b4b] text-white px-3 py-2 text-[12px] font-bold uppercase tracking-wide w-[28%]">
                Téléphone
              </th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="border-2 border-slate-900 px-3 py-8 text-center text-slate-500 italic"
                >
                  Aucun membre dans cette liste
                </td>
              </tr>
            ) : (
              members.map((m, i) => (
                <tr key={i}>
                  <td className="border-2 border-slate-900 px-3 py-2.5 text-center font-bold text-slate-700">
                    {i + 1}
                  </td>
                  <td className="border-2 border-slate-900 px-3 py-2.5 font-bold text-slate-900">
                    {m.fullName || "—"}
                  </td>
                  <td className="border-2 border-slate-900 px-3 py-2.5 font-bold text-slate-900">
                    {m.phone || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <p className="text-center text-[10px] text-slate-500 mt-6">
          Ekklesia — {members.length} membre{members.length > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
