import { getMembersAction } from '@/app/admin/actions/members';
import MembersManager from '@/components/admin/MembersManager';

export default async function AdminMembersPage() {
  const result = await getMembersAction();
  const members = result.success ? result.members || [] : [];
  const shepherds = result.success ? result.shepherds || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#1e1b4b] tracking-tight">
          Annuaire des Fidèles
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Créer, modifier, archiver ou supprimer les fidèles et gérer leur affectation à un berger.
        </p>
      </div>

      {result.error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
          ⚠️ {result.error}
        </div>
      )}

      <MembersManager initialMembers={members} shepherds={shepherds} />
    </div>
  );
}
