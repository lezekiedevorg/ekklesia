import { getProgramsAction } from '@/app/admin/actions/programs';
import ProgramsManager from '@/components/admin/ProgramsManager';

export default async function AdminProgramsPage() {
  const result = await getProgramsAction();
  const programs = result.success ? result.programs || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#1e1b4b] tracking-tight">
          Programmes & Cultes
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Créer, modifier, activer/désactiver et ordonner les programmes de l&apos;église. Le pointage et les statistiques s&apos;y adaptent automatiquement.
        </p>
      </div>

      {result.error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
          ⚠️ {result.error}
        </div>
      )}

      <ProgramsManager initialPrograms={programs as any} />
    </div>
  );
}
