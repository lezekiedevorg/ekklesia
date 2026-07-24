export interface DepartmentDefinition {
  name: string;
  description: string;
  icon: string;
}

export const DEFAULT_DEPARTMENTS: DepartmentDefinition[] = [
  { name: "Jeunesse", description: "Ministère de la jeunesse", icon: "🧑‍🤝‍🧑" },
  { name: "Musique", description: "Louange et worship", icon: "🎵" },
  { name: "Ordre", description: "Service d'ordre et accueil", icon: "🛡️" },
  { name: "Amis des Nouveaux", description: "Accueil et intégration des nouveaux venus", icon: "🤝" },
  { name: "Prière", description: "Intercession et prière", icon: "🙏" },
  { name: "Évangélisation", description: "Mission et évangélisation", icon: "📣" },
];

export const DEPARTMENT_ROLES = [
  { value: "member", label: "Membre" },
  { value: "leader", label: "Responsable" },
  { value: "responsible", label: "Chargé de projet" },
] as const;
