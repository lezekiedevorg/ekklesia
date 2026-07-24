export interface ProgramDefinition {
  id: string;
  label: string;
  icon: string;
  // Si défini, seuls les membres dont current_class === cette valeur sont éligibles
  // (classes d'affermissement/fondements). Généralise l'ancienne logique en dur.
  eligibility_class?: string | null;
}

// Liste statique de secours (fallback). La source de vérité est la table `programs`
// (voir src/lib/utils/programs-data.ts). Garder synchronisé avec le seed SQL.
export const PROGRAM_DEFINITIONS: ProgramDefinition[] = [
  { id: "sunday_service", label: "Dimanche (Culte Dominical)", icon: "🌞" },
  { id: "tuesday_class", label: "Mardi (Classe d'affermissement)", icon: "📘", eligibility_class: "tuesday_class" },
  { id: "wednesday_class", label: "Mercredi (Classe de fondements)", icon: "📗", eligibility_class: "wednesday_class" },
  { id: "thursday_online", label: "Jeudi (Prière en ligne)", icon: "🌐" },
  { id: "friday_service", label: "Vendredi (Veillée / Culte)", icon: "🔥" },
];

// ---------------------------------------------------------------------------
// Rapport du berger (PDF officiel "rapport_du_berger_2026")
// Les clés sont les colonnes réelles de `shepherd_activities` — ne pas inventer
// de nom ici : l'upsert échoue silencieusement côté page si la colonne manque.
// ---------------------------------------------------------------------------

export interface QIDiscipline {
  q: string;
  i: string;
  label: string;
  icon: string;
  hint: string;
}

// 1a. Vie personnelle — Q (Quotidien) / I (Intermittent) mutuellement exclusifs
export const QI_DISCIPLINES: QIDiscipline[] = [
  { q: "daily_prayer_done", i: "prayer_i_done", label: "Prière", icon: "🙏", hint: "Prière personnelle et en langues" },
  { q: "daily_meditation_done", i: "meditation_i_done", label: "Méditation", icon: "🧠", hint: "Méditation approfondie de la Parole" },
];

// 1b. Vie personnelle — simple OUI / NON (colonne _q_done = fait, _i_done inutilisée)
export const YESNO_DISCIPLINES = [
  { key: "fasting_q_done", label: "Jeûne", icon: "🍽️", hint: "Jeûne et consécration" },
  { key: "word_listening_q_done", label: "Écoute de la parole", icon: "🎧", hint: "Prédications, enseignements, audio" },
];

export const MUTUALLY_EXCLUSIVE_QI_KEYS = QI_DISCIPLINES.flatMap((d) => [d.q, d.i]);

// 2. Travail du berger
export const SHEPHERD_WORK_ITEMS = [
  { key: "evangelization_done", label: "Évangélisation", icon: "📣" },
  { key: "mentoring_done", label: "Encadrement", icon: "🤝" },
  { key: "visits_done", label: "Visite", icon: "🏡" },
  { key: "phone_calls_done", label: "Entretien téléphonique", icon: "📞" },
];

// 3. Programme d'église — présence personnelle du berger
export const SHEPHERD_ATTENDANCE_ITEMS = [
  { key: "shepherd_attendance_tuesday", label: "Mardi", icon: "📘" },
  { key: "shepherd_attendance_wednesday", label: "Mercredi", icon: "📗" },
  { key: "shepherd_attendance_thursday", label: "Jeudi en ligne", icon: "🌐" },
  { key: "shepherd_attendance_friday", label: "Vendredi", icon: "🔥" },
  { key: "shepherd_attendance_sunday", label: "Dimanche", icon: "🌞" },
];

// 4. Activités mensuelles & chaînes de prière
export const MONTHLY_ITEMS = [
  { key: "monthly_prayer_vigil_done", label: "Mini veillée personnelle" },
  { key: "monthly_pre_service_intercession", label: "Intercession avant le culte" },
  { key: "monthly_anagkazo", label: "Anagkazo" },
  { key: "monthly_in_person_prayer_done", label: "Prière en présentiel" },
  { key: "monthly_group_evangelization", label: "Évangélisation de groupe" },
  { key: "prayer_chain_done", label: "Chaînes de prière" },
];

// 5. Bilan des âmes (bas de la grille du rapport)
export const SOULS_COUNTERS = [
  { key: "personal_invites_count", label: "Invité personnel", icon: "✋" },
  { key: "group_invites_count", label: "Invités par groupe", icon: "👥" },
  { key: "recovered_souls_count", label: "Âmes revenues", icon: "🔄" },
  { key: "message_listeners_count", label: "Ont écouté le message", icon: "🎙️" },
];

export const CLASS_LABELS: Record<string, string> = {
  none: "Aucune",
  tuesday_class: "Affermissement (Mardi)",
  wednesday_class: "Fondements (Mercredi)",
  completed: "Formation Terminée",
};

export const STATUS_LABELS: Record<string, string> = {
  new_convert: "Nouveau Converti",
  in_integration: "En Intégration",
  active: "Membre Actif",
  member: "Membre Confirmé",
  archived: "Archivé",
};
