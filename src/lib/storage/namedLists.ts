/**
 * Named Lists — persistance localStorage des listes de membres créées par les bergers.
 *
 * Pas de table Supabase pour ce besoin : chaque berger gère ses propres listes
 * depuis son navigateur. Si le besoin évolue (partage inter-bergers, sync serveur),
 * on basculera vers une table dédiée.
 *
 * Clé de stockage : ekklesia:named_lists:v1
 * Format : { lists: NamedList[], activeId: string | null }
 *
 * Robustesse SSR : toutes les fonctions sont no-op si `window` n'existe pas.
 */

export interface NamedList {
  id: string;
  name: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface StorageShape {
  lists: NamedList[];
  activeId: string | null;
}

const STORAGE_KEY = "ekklesia:named_lists:v1";

const empty: StorageShape = { lists: [], activeId: null };

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // Navigateur en mode privé / quota dépassé / storage désactivé
    return null;
  }
}

function read(): StorageShape {
  const s = safeStorage();
  if (!s) return { ...empty };
  const raw = s.getItem(STORAGE_KEY);
  if (!raw) return { ...empty };
  try {
    const parsed = JSON.parse(raw) as Partial<StorageShape>;
    return {
      lists: Array.isArray(parsed.lists) ? parsed.lists : [],
      activeId: typeof parsed.activeId === "string" ? parsed.activeId : null,
    };
  } catch {
    return { ...empty };
  }
}

function write(shape: StorageShape): void {
  const s = safeStorage();
  if (!s) return;
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(shape));
  } catch {
    // Quota dépassé — silencieux. L'utilisateur perdra la liste au refresh suivant.
  }
}

/**
 * Génère un id unique. crypto.randomUUID() est dispo dans tous les navigateurs
 * modernes + Node 19+. Fallback en cas d'absence.
 */
function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `list_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Lectures ──────────────────────────────────────────────────────────────

export function getAllLists(): NamedList[] {
  return read().lists;
}

export function getList(id: string): NamedList | null {
  return read().lists.find((l) => l.id === id) ?? null;
}

export function getActiveListId(): string | null {
  return read().activeId;
}

export function getActiveList(): NamedList | null {
  const { lists, activeId } = read();
  if (!activeId) return null;
  return lists.find((l) => l.id === activeId) ?? null;
}

// ─── Mutations ─────────────────────────────────────────────────────────────

export function createList(name: string): NamedList {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Le nom de la liste ne peut pas être vide");
  const now = new Date().toISOString();
  const list: NamedList = {
    id: genId(),
    name: trimmed,
    memberIds: [],
    createdAt: now,
    updatedAt: now,
  };
  const shape = read();
  shape.lists.push(list);
  // La nouvelle liste devient automatiquement active
  shape.activeId = list.id;
  write(shape);
  return list;
}

export function renameList(id: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Le nom de la liste ne peut pas être vide");
  const shape = read();
  const list = shape.lists.find((l) => l.id === id);
  if (!list) return;
  list.name = trimmed;
  list.updatedAt = new Date().toISOString();
  write(shape);
}

export function deleteList(id: string): void {
  const shape = read();
  shape.lists = shape.lists.filter((l) => l.id !== id);
  if (shape.activeId === id) shape.activeId = null;
  write(shape);
}

export function setActiveListId(id: string | null): void {
  const shape = read();
  if (id !== null && !shape.lists.some((l) => l.id === id)) return;
  shape.activeId = id;
  write(shape);
}

// ─── Membres d'une liste ───────────────────────────────────────────────────

export function isMemberInActiveList(memberId: string): boolean {
  const list = getActiveList();
  return list ? list.memberIds.includes(memberId) : false;
}

export function toggleMemberInActiveList(memberId: string): boolean {
  const shape = read();
  if (!shape.activeId) return false;
  const list = shape.lists.find((l) => l.id === shape.activeId);
  if (!list) return false;
  const idx = list.memberIds.indexOf(memberId);
  if (idx >= 0) {
    list.memberIds.splice(idx, 1);
  } else {
    list.memberIds.push(memberId);
  }
  list.updatedAt = new Date().toISOString();
  write(shape);
  return idx < 0; // true si ajouté, false si retiré
}

export function addMemberToList(listId: string, memberId: string): void {
  const shape = read();
  const list = shape.lists.find((l) => l.id === listId);
  if (!list || list.memberIds.includes(memberId)) return;
  list.memberIds.push(memberId);
  list.updatedAt = new Date().toISOString();
  write(shape);
}

export function removeMemberFromList(listId: string, memberId: string): void {
  const shape = read();
  const list = shape.lists.find((l) => l.id === listId);
  if (!list) return;
  list.memberIds = list.memberIds.filter((id) => id !== memberId);
  list.updatedAt = new Date().toISOString();
  write(shape);
}

/**
 * À utiliser au montage de composants qui observent les listes.
 * Permet de re-render quand localStorage change dans un autre onglet.
 */
export function subscribeToChanges(callback: () => void): () => void {
  const s = safeStorage();
  if (!s || typeof window === "undefined") return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
