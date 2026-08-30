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
 * Pattern identique à ShepherdReportPrint : toujours présent dans le DOM,
 * caché visuellement à l'écran via `position: absolute; left: -9999px`,
 * puis `window.print()` après que React ait peint.
 *
 * ⚠️ NE PAS utiliser `display: none` à l'écran : certains navigateurs
 * excluent le contenu display:none du snapshot d'impression, résultant
 * en PDF vide.
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
    // 200ms : laisse React peindre 2 frames + styles print appliqués
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
    <div className="members-list-print">
      <style>{`
        @media screen {
          .members-list-print {
            position: absolute !important;
            left: -9999px !important;
            top: 0 !important;
            width: 210mm;
            pointer-events: none;
          }
        }
        @media print {
          .members-list-print {
            position: static !important;
            left: 0 !important;
            display: block !important;
            padding: 0;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            background: #fff;
          }
          @page { size: A4 portrait; margin: 15mm; }
          .mlp-header { border-bottom: 2px solid #1e1b4b; padding-bottom: 8mm; margin-bottom: 6mm; }
          .mlp-title { font-size: 18pt; font-weight: 800; color: #1e1b4b; margin: 0; letter-spacing: -0.01em; }
          .mlp-subtitle { font-size: 10pt; color: #64748b; margin-top: 2mm; font-weight: 600; }
          .mlp-table { width: 100%; border-collapse: collapse; font-size: 11pt; }
          .mlp-table thead th {
            background: #1e1b4b; color: #fff;
            padding: 3mm 3mm; text-align: left; font-weight: 700;
            font-size: 10pt; text-transform: uppercase; letter-spacing: 0.05em;
          }
          .mlp-table thead th:first-child { width: 12mm; text-align: center; }
          .mlp-table thead th:last-child { width: 35mm; }
          .mlp-table tbody td {
            padding: 2.8mm 3mm; border-bottom: 1px solid #e2e8f0;
          }
          .mlp-table tbody td:first-child { text-align: center; font-weight: 700; color: #64748b; }
          .mlp-table tbody tr:nth-child(even) { background: #f8fafc; }
          .mlp-table tbody td.empty {
            text-align: center; padding: 10mm; color: #94a3b8; font-style: italic;
          }
          .mlp-footer { margin-top: 6mm; font-size: 9pt; color: #94a3b8; text-align: center; }
        }
      `}</style>

      <div className="mlp-header">
        <h1 className="mlp-title">{title}</h1>
        <div className="mlp-subtitle">
          {subtitle ? `${subtitle} — ` : ""}Généré le {dateStr}
        </div>
      </div>

      <table className="mlp-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nom &amp; Prénom</th>
            <th>Téléphone</th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan={3} className="empty">
                Aucun membre dans cette liste
              </td>
            </tr>
          ) : (
            members.map((m, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{m.fullName || "—"}</td>
                <td>{m.phone || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mlp-footer">
        Ekklesia — {members.length} membre{members.length > 1 ? "s" : ""}
      </div>
    </div>
  );
}
