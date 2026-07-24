// Portée d'affichage sur l'APP PRINCIPALE (interface pastorale / berger).
// Seul le pasteur a une vue globale ici. admin & super_admin agissent comme
// des bergers (portée personnelle : leurs propres fidèles) — leurs super-pouvoirs
// vivent uniquement dans le backoffice /admin. La RLS (is_pastor) leur laisse
// toujours l'accès complet ; c'est l'UI qui filtre volontairement sur soi.
const GLOBAL_ROLES = ["pastor"];

export const hasGlobalScope = (role?: string | null) => !!role && GLOBAL_ROLES.includes(role);

export const hasGroupScope = (role?: string | null) => role === "leader";

// Portée personnelle (ses propres fidèles) : berger, admin, super_admin, etc.
export const hasOwnScope = (role?: string | null) => !hasGlobalScope(role) && !hasGroupScope(role);
