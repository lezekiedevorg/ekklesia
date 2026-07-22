import { getSettingsAction } from '@/app/admin/actions/settings';
import SettingsManager from '@/components/admin/SettingsManager';

export default async function AdminSettingsPage() {
  const result = await getSettingsAction();
  const settings = result.success ? result.settings || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#1e1b4b] tracking-tight">
          Règles & Paramètres de l&apos;Application (JSONB)
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Toutes les listes de disciplines, seuils d&apos;assiduité et informations administratives sont entièrement configurables et stockées dynamiquement.
        </p>
      </div>

      {result.error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
          ⚠️ {result.error}
        </div>
      )}

      <SettingsManager initialSettings={settings} />
    </div>
  );
}
