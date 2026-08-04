'use client';

import { useEffect, useState } from 'react';
import { createUserAction, updateUserRoleAction, deleteUserAction } from '@/app/admin/actions/users';
import Pagination from '@/components/common/Pagination';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  group_id: string | null;
  created_at: string;
  groups?: any;
  app_user_roles?: any;
  [key: string]: any;
}

export default function UsersManager({ initialUsers, roles, groups }: { initialUsers: Profile[]; roles: { code: string; name: string }[]; groups: { id: string; name: string }[] }) {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form states for create/edit
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Eglise2026!');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleCode, setRoleCode] = useState('shepherd');
  const [groupId, setGroupId] = useState('');

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || (u.phone && u.phone.includes(search));
    const userRole = (u.app_user_roles?.[0]?.role_code || u.role);
    const matchesRole = roleFilter === 'ALL' || userRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  useEffect(() => { setPage(1); }, [search, roleFilter]);
  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  const openCreateModal = () => {
    setEditingUser(null);
    setEmail('');
    setPassword('Eglise2026!');
    setFirstName('');
    setLastName('');
    setPhone('');
    setRoleCode('shepherd');
    setGroupId('');
    setError(null);
    setMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: Profile) => {
    setEditingUser(u);
    setRoleCode(u.app_user_roles?.[0]?.role_code || u.role || 'shepherd');
    setGroupId(u.group_id || '');
    setError(null);
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('phone', phone);
    formData.append('role_code', roleCode);
    formData.append('group_id', groupId);

    const result = await createUserAction(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage(result.message || 'Succès');
      setIsModalOpen(false);
      window.location.reload();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await updateUserRoleAction(editingUser.id, roleCode, groupId || null);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage(result.message || 'Succès');
      setIsModalOpen(false);
      window.location.reload();
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le compte de ${name} ? Cette action est irréversible.`)) {
      return;
    }
    setLoading(true);
    const result = await deleteUserAction(userId);
    setLoading(false);
    if (result.error) {
      alert(`Erreur: ${result.error}`);
    } else {
      window.location.reload();
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-700 border border-rose-500/30">Super Admin</span>;
      case 'admin':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-700 border border-purple-500/30">Admin</span>;
      case 'pastor':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-900 border border-indigo-500/30">Pasteur Principal</span>;
      case 'leader':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#fea619]/20 text-[#855300] border border-[#fea619]/40">Leader / Chef</span>;
      case 'shepherd':
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-200 text-slate-700">Berger</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="ALL">Tous les rôles</option>
            {roles.map((r) => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#1e1b4b] to-indigo-900 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#1e1b4b]/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
        >
          <span>➕</span>
          <span>Créer un utilisateur</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
          <span>✅</span>
          <span>{message}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Utilisateur</th>
                <th className="py-4 px-6">Rôle attribué</th>
                <th className="py-4 px-6">Groupe / Tribu</th>
                <th className="py-4 px-6">Téléphone</th>
                <th className="py-4 px-6">Créé le</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aucun utilisateur trouvé pour cette recherche.
                  </td>
                </tr>
              ) : (
                pagedUsers.map((u) => {
                  const currentRole = u.app_user_roles?.[0]?.role_code || u.role || 'shepherd';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-100 to-slate-100 flex items-center justify-center font-black text-[#1e1b4b] text-sm shrink-0 border border-indigo-200/50">
                            {u.first_name[0]}{u.last_name[0]}
                          </div>
                          <div>
                            <div className="font-black text-slate-900">{u.first_name} {u.last_name}</div>
                            <div className="text-xs text-slate-400 font-mono">{u.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getRoleBadge(currentRole)}
                      </td>
                      <td className="py-4 px-6">
                        {(Array.isArray(u.groups) ? u.groups[0]?.name : u.groups?.name) || u.group_id ? (
                          <span className="font-bold text-[#1e1b4b] bg-amber-50 px-3 py-1 rounded-xl border border-amber-200/50 text-xs">
                            {(Array.isArray(u.groups) ? u.groups[0]?.name : u.groups?.name) || u.group_id}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Aucun</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-xs">
                        {u.phone || 'Non renseigné'}
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors"
                            title="Modifier le rôle"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, `${u.first_name} ${u.last_name}`)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 transition-colors"
                            title="Supprimer le compte"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={filteredUsers.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6 max-h-[95vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-[#1e1b4b]">
                {editingUser ? `Modifier le rôle : ${editingUser.first_name} ${editingUser.last_name}` : 'Créer un nouvel utilisateur'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={editingUser ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
              {!editingUser && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ex: Jean"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Nom *</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Ex: Kouassi"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Adresse Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jean.kouassi@eglise.org"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Téléphone</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+33 6 00 00 00 00"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Mot de passe temporaire *</label>
                      <input
                        type="text"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Rôle attribué *</label>
                <select
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-[#1e1b4b] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {roles.map((r) => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Groupe / Tribu de rattachement</label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">— Aucun groupe —</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Optionnel. Permet d&apos;assigner directement l&apos;utilisateur à une tribu.</p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#1e1b4b] to-indigo-900 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#1e1b4b]/20 hover:opacity-95 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Enregistrement...' : editingUser ? 'Mettre à jour' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
