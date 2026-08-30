"use client";

import React, { useState } from "react";
import Modal from "@/components/common/Modal";
import {
  createList,
  deleteList,
  renameList,
  setActiveListId,
  type NamedList,
} from "@/lib/storage/namedLists";

interface MembersListManagerProps {
  lists: NamedList[];
  activeListId: string | null;
  /** Demande au parent de déclencher l'impression d'une liste */
  onExport: (listId: string) => void;
  /** Demande au parent de recharger les listes depuis localStorage */
  onListsChanged: () => void;
}

export function MembersListManager({
  lists,
  activeListId,
  onExport,
  onListsChanged,
}: MembersListManagerProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      createList(trimmed);
      setNewName("");
      setCreating(false);
      onListsChanged();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleRename = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    try {
      renameList(id, trimmed);
      setEditingId(null);
      setEditingName("");
      onListsChanged();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDelete = (id: string) => {
    deleteList(id);
    setConfirmDelete(null);
    onListsChanged();
  };

  const handleActivate = (id: string) => {
    setActiveListId(activeListId === id ? null : id);
    onListsChanged();
  };

  return (
    <div className="glass-panel rounded-3xl p-5 shadow-sm border border-indigo-100">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="font-headline-md font-extrabold text-[#1e1b4b] text-base sm:text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fea619]">lists</span>
            Mes listes
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Crée des listes nommées pour exporter les membres que tu choisis.
          </p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-br from-[#1e1b4b] to-[#312e81] text-[#fea619] font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all border border-[#fea619]/40"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Nouvelle liste
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-4 flex items-center gap-2 bg-indigo-50/50 border border-indigo-200 rounded-2xl p-3">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setCreating(false);
                setNewName("");
              }
            }}
            placeholder="Nom de la liste (ex: Chorale 2026)"
            className="flex-1 px-3 py-2 rounded-xl bg-white border border-indigo-200 text-sm font-semibold focus:outline-none focus:border-[#1e1b4b]"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="px-3 py-2 rounded-xl bg-[#1e1b4b] text-white text-xs font-bold disabled:opacity-50"
          >
            Créer
          </button>
          <button
            onClick={() => {
              setCreating(false);
              setNewName("");
            }}
            className="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
          >
            Annuler
          </button>
        </div>
      )}

      {lists.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-500 italic">
          Aucune liste. Clique sur « Nouvelle liste » pour commencer.
        </div>
      ) : (
        <ul className="space-y-2">
          {lists.map((list) => {
            const isActive = list.id === activeListId;
            const isEditing = editingId === list.id;
            return (
              <li
                key={list.id}
                className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${
                  isActive
                    ? "bg-[#1e1b4b]/5 border-[#1e1b4b]/30 ring-1 ring-[#fea619]/40"
                    : "bg-white/80 border-slate-200 hover:border-indigo-200"
                }`}
              >
                {isEditing ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(list.id);
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditingName("");
                      }
                    }}
                    onBlur={() => handleRename(list.id)}
                    className="flex-1 px-2 py-1 rounded-lg border border-indigo-300 text-sm font-bold bg-white"
                  />
                ) : (
                  <button
                    onClick={() => handleActivate(list.id)}
                    className="flex-1 text-left min-w-0"
                    title={isActive ? "Désactiver cette liste" : "Activer cette liste"}
                  >
                    <div className="font-bold text-sm text-slate-900 truncate flex items-center gap-2">
                      {list.name}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fea619]/20 text-[#1e1b4b] text-[10px] font-extrabold border border-[#fea619]/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#fea619] animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold">
                      {list.memberIds.length} membre{list.memberIds.length > 1 ? "s" : ""}
                    </div>
                  </button>
                )}

                {!isEditing && (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(list.id);
                        setEditingName(list.name);
                      }}
                      title="Renommer"
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={() => onExport(list.id)}
                      disabled={list.memberIds.length === 0}
                      title={
                        list.memberIds.length === 0
                          ? "Aucun membre dans la liste"
                          : "Exporter en PDF"
                      }
                      className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        picture_as_pdf
                      </span>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(list.id)}
                      title="Supprimer"
                      className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {confirmDelete && (
        <Modal
          open
          onClose={() => setConfirmDelete(null)}
        >
          <h3 className="font-headline-md font-extrabold text-base text-slate-900 mb-3">
            Supprimer cette liste ?
          </h3>
          <p className="text-sm text-slate-700 mb-4">
            Cette action est définitive. Les membres ne seront pas modifiés,
            seule la liste sera supprimée.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold"
            >
              Annuler
            </button>
            <button
              onClick={() => handleDelete(confirmDelete)}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold"
            >
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
