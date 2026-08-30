"use client";

import React, { useEffect, useRef } from "react";

export interface PrintMember {
  fullName: string;
  phone: string;
}

export interface ListPrintProps {
  /** Données à imprimer. `null` = composant rend `null` (mode repos). */
  data: PrintPayload | null;
}

export interface PrintPayload {
  title: string;
  subtitle?: string;
  members: PrintMember[];
}

/**
 * Composant d'impression générique pour listes de membres (PDF via navigateur).
 *
 * ⚠️ Suit le pattern de `ShepherdReportPrint` (rapport berger qui fonctionne) :
 *
 * 1. **Toujours rendu** dans le JSX parent (jamais démonté), avec `data` qui
 *    peut être `null`. Quand `data` est `null` → return null en interne.
 *    NE PAS utiliser un rendu conditionnel `{data && <Comp />}` côté parent,
 *    sinon le composant se démonte au mauvais moment et Safari ne capture
 *    rien dans son snapshot d'impression.
 *
 * 2. **Pas de `setData(null)` après print**. Une fois imprimé, le composant
 *    reste affiché (caché visuellement via `.print-only { display: none }`
 *    en mode screen) jusqu'à ce que l'utilisateur déclenche une nouvelle
 *    impression avec d'autres données. Le state reste dans le parent.
 *
 * 3. La classe `print-only` au root est **obligatoire** : `globals.css` force
 *    `visibility: hidden` sur tout le body en @media print, sauf sur
 *    `.print-only` (cf. `src/app/globals.css:161`).
 *
 * 4. Styles d'impression globaux fournis par `.print-only` :
 *    - `visibility: visible`
 *    - `-webkit-print-color-adjust: exact` (couleurs de fond conservées)
 *    - Marges @page A4 portrait via `globals.css` (override local possible)
 *
 * Utilisation côté parent (cf. `src/app/reports/page.tsx` pour le modèle) :
 * ```tsx
 * const [printData, setPrintData] = useState<PrintPayload | null>(null);
 * // Toujours rendu, jamais démonté :
 * return ( <main>...</main> <MembersListPrint data={printData} /> );
 * ```
 */
export function MembersListPrint({ data }: ListPrintProps) {
  // Ref pour ne déclencher window.print() qu'une fois par nouveau data
  const printedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!data) return;
    // Clé stable : on évite de re-imprimer si React re-render sans changement réel
    const key = `${data.title}|${data.subtitle ?? ""}|${data.members.length}`;
    if (printedRef.current === key) return;
    printedRef.current = key;
    const t = setTimeout(() => {
      window.print();
    }, 200);
    return () => clearTimeout(t);
  }, [data]);

  if (!data) return null;

  const { title, subtitle, members } = data;
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      id="members-list-report"
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
          #members-list-report > p {
            page-break-before: avoid !important;
            break-before: avoid !important;
          }
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>

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
  );
}
