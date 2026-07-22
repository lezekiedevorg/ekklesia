export interface ProgramDefinition {
  id: string;
  label: string;
  icon: string;
}

export const PROGRAM_DEFINITIONS: ProgramDefinition[] = [
  { id: "sunday_service", label: "Dimanche (Culte Dominical)", icon: "🌞" },
  { id: "tuesday_class", label: "Mardi (Classe d'affermissement)", icon: "📘" },
  { id: "wednesday_class", label: "Mercredi (Classe de fondements)", icon: "📗" },
  { id: "thursday_online", label: "Jeudi (Prière en ligne)", icon: "🌐" },
  { id: "friday_service", label: "Vendredi (Veillée / Culte)", icon: "🔥" },
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
