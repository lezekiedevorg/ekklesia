'use client';

import { useState } from 'react';
import { updateSettingAction } from '@/app/admin/actions/settings';

interface SettingItem {
  key: string;
  value: any;
  category: string;
  description: string;
  updated_at: string;
}

export default function SettingsManager({ initialSettings }: { initialSettings: SettingItem[] }) {
  const [settings, setSettings] = useState<SettingItem[]>(initialSettings);
  const [activeTab, setActiveTab] = useState<'discipline' | 'attendance' | 'general'>('discipline');
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper to get specific setting or fallback
  const getSettingValue = (key: string, fallback: any) => {
    const found = settings.find((s) => s.key === key);
    return found ? found.value : fallback;
  };

  // Local state for disciplines
  const [dailyList, setDailyList] = useState<string[]>(() => getSettingValue('disciplines:daily', [
    'Prière personnelle (1h)',
    'Méditation biblique',
    'Lecture spirituelle',
    'Parler en langues',
    'Prière en famille'
  ]));
  const [newDailyItem, setNewDailyItem] = useState('');

  const [intermittentList, setIntermittentList] = useState<string[]>(() => getSettingValue('disciplines:intermittent', [
    'Jeûne & Prière',
    'Évélisation / Gagner des âmes',
    'Dîme & Offrandes',
    'Visite pastorale / Suivi'
  ]));
  const [newIntermittentItem, setNewIntermittentItem] = useState('');

  // Local state for thresholds
  const [consecutiveAbsenceAlert, setConsecutiveAbsenceAlert] = useState<number>(() => getSettingValue('attendance:consecutive_absence_alert', 2));
  const [warningThresholdPct, setWarningThresholdPct] = useState<number>(() => getSettingValue('attendance:warning_threshold_pct', 70));
  const [criticalThresholdPct, setCriticalThresholdPct] = useState<number>(() => getSettingValue('attendance:critical_threshold_pct', 50));

  // Local state for church info
  const [churchName, setChurchName] = useState<string>(() => getSettingValue('church:name', 'Sanctuaire Principal'));
  const [churchAddress, setChurchAddress] = useState<string>(() => getSettingValue('church:address', 'Abidjan, Côte d\'Ivoire'));
  const [churchContact, setChurchContact] = useState<string>(() => getSettingValue('church:contact', '+225 00 00 00 00'));

  const handleSaveSetting = async (key: string, value: any, category: string, description: string) => {
    setLoadingKey(key);
    setMessage(null);
    setError(null);

    const result = await updateSettingAction(key, value, category, description);
    setLoadingKey(null);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage(result.message || 'Paramètre sauvegardé avec succès.');
      // Update local settings array
      setSettings((prev) => {
        const idx = prev.findIndex((s) => s.key === key);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], value, updated_at: new Date().toISOString() };
          return updated;
        }
        return [...prev, { key, value, category, description, updated_at: new Date().toISOString() }];
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('discipline')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'discipline'
              ? 'bg-[#1e1b4b] text-white shadow-md shadow-[#1e1b4b]/20 scale-105'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>📜</span>
          <span>Disciplines Spirituelles</span>
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'attendance'
              ? 'bg-[#1e1b4b] text-white shadow-md shadow-[#1e1b4b]/20 scale-105'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>📊</span>
          <span>Seuils de Présence & Alertes</span>
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'general'
              ? 'bg-[#1e1b4b] text-white shadow-md shadow-[#1e1b4b]/20 scale-105'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>⛪</span>
          <span>Informations Générales</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
          <span>✅</span>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Discipline Config */}
      {activeTab === 'discipline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Disciplines */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#1e1b4b]">Disciplines Quotidiennes</h3>
                <p className="text-xs text-slate-500 font-medium">Activités requises chaque jour dans les rapports</p>
              </div>
              <button
                onClick={() => handleSaveSetting('disciplines:daily', dailyList, 'discipline', 'Liste des disciplines spirituelles quotidiennes')}
                disabled={loadingKey === 'disciplines:daily'}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1e1b4b] to-indigo-900 text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 disabled:opacity-50 transition-all"
              >
                {loadingKey === 'disciplines:daily' ? '...' : 'Enregistrer'}
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {dailyList.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-800">
                  <span>✨ {item}</span>
                  <button
                    onClick={() => setDailyList(dailyList.filter((_, i) => i !== index))}
                    className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold flex items-center justify-center text-xs"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Nouvelle discipline quotidienne..."
                value={newDailyItem}
                onChange={(e) => setNewDailyItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newDailyItem.trim()) {
                    setDailyList([...dailyList, newDailyItem.trim()]);
                    setNewDailyItem('');
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                onClick={() => {
                  if (newDailyItem.trim()) {
                    setDailyList([...dailyList, newDailyItem.trim()]);
                    setNewDailyItem('');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#1e1b4b] font-black text-xs uppercase tracking-wider"
              >
                Ajouter
              </button>
            </div>
          </div>

          {/* Intermittent Disciplines */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#1e1b4b]">Disciplines Intermittentes / Hebdo</h3>
                <p className="text-xs text-slate-500 font-medium">Activités et engagements sur la période</p>
              </div>
              <button
                onClick={() => handleSaveSetting('disciplines:intermittent', intermittentList, 'discipline', 'Liste des disciplines spirituelles intermittentes')}
                disabled={loadingKey === 'disciplines:intermittent'}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1e1b4b] to-indigo-900 text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 disabled:opacity-50 transition-all"
              >
                {loadingKey === 'disciplines:intermittent' ? '...' : 'Enregistrer'}
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {intermittentList.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-800">
                  <span>⚡ {item}</span>
                  <button
                    onClick={() => setIntermittentList(intermittentList.filter((_, i) => i !== index))}
                    className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold flex items-center justify-center text-xs"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Nouvelle discipline intermittente..."
                value={newIntermittentItem}
                onChange={(e) => setNewIntermittentItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newIntermittentItem.trim()) {
                    setIntermittentList([...intermittentList, newIntermittentItem.trim()]);
                    setNewIntermittentItem('');
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                onClick={() => {
                  if (newIntermittentItem.trim()) {
                    setIntermittentList([...intermittentList, newIntermittentItem.trim()]);
                    setNewIntermittentItem('');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#1e1b4b] font-black text-xs uppercase tracking-wider"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Thresholds */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-3xl space-y-6">
          <div>
            <h3 className="text-lg font-black text-[#1e1b4b]">Paramètres des Alertes & Seuils de Santé</h3>
            <p className="text-xs text-slate-500 font-medium">Définissez les règles qui déclenchent automatiquement les alertes dans le tableau de bord des bergers</p>
          </div>

          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between gap-4">
              <div>
                <label className="block text-sm font-black text-amber-900">Seuil d&apos;absences consécutives (Alertes)</label>
                <p className="text-xs text-amber-700 mt-0.5">Nombre d&apos;absences aux cultes/réunions pour déclencher une alerte pastorale</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={consecutiveAbsenceAlert}
                  onChange={(e) => setConsecutiveAbsenceAlert(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-xl bg-white border border-amber-300 font-black text-center text-amber-900 shadow-2xs"
                />
                <button
                  onClick={() => handleSaveSetting('attendance:consecutive_absence_alert', consecutiveAbsenceAlert, 'attendance', 'Nombre d absences consécutives déclenchant alerte')}
                  disabled={loadingKey === 'attendance:consecutive_absence_alert'}
                  className="px-4 py-2 rounded-xl bg-[#1e1b4b] text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 disabled:opacity-50 transition-all shrink-0"
                >
                  Sauvegarder
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/60 flex items-center justify-between gap-4">
              <div>
                <label className="block text-sm font-black text-indigo-900">Seuil d&apos;attention (%)</label>
                <p className="text-xs text-indigo-700 mt-0.5">Taux de présence en dessous duquel un fidèle passe en statut &quot;Attention&quot;</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={warningThresholdPct}
                    onChange={(e) => setWarningThresholdPct(Number(e.target.value))}
                    className="w-24 pl-3 pr-7 py-2 rounded-xl bg-white border border-indigo-300 font-black text-center text-indigo-900 shadow-2xs"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-500">%</span>
                </div>
                <button
                  onClick={() => handleSaveSetting('attendance:warning_threshold_pct', warningThresholdPct, 'attendance', 'Seuil pourcentage attention')}
                  disabled={loadingKey === 'attendance:warning_threshold_pct'}
                  className="px-4 py-2 rounded-xl bg-[#1e1b4b] text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 disabled:opacity-50 transition-all shrink-0"
                >
                  Sauvegarder
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/60 flex items-center justify-between gap-4">
              <div>
                <label className="block text-sm font-black text-rose-900">Seuil critique (%)</label>
                <p className="text-xs text-rose-700 mt-0.5">Taux de présence en dessous duquel un fidèle passe en statut &quot;Critique / Risque&quot;</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={criticalThresholdPct}
                    onChange={(e) => setCriticalThresholdPct(Number(e.target.value))}
                    className="w-24 pl-3 pr-7 py-2 rounded-xl bg-white border border-rose-300 font-black text-center text-rose-900 shadow-2xs"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-500">%</span>
                </div>
                <button
                  onClick={() => handleSaveSetting('attendance:critical_threshold_pct', criticalThresholdPct, 'attendance', 'Seuil pourcentage critique')}
                  disabled={loadingKey === 'attendance:critical_threshold_pct'}
                  className="px-4 py-2 rounded-xl bg-[#1e1b4b] text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 disabled:opacity-50 transition-all shrink-0"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: General Church Info */}
      {activeTab === 'general' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-3xl space-y-6">
          <div>
            <h3 className="text-lg font-black text-[#1e1b4b]">Informations de l&apos;Église & Organisation</h3>
            <p className="text-xs text-slate-500 font-medium">Informations affichées sur les rapports, les en-têtes et les exports officiels</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Nom officiel de l&apos;église</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  onClick={() => handleSaveSetting('church:name', churchName, 'church', 'Nom officiel église')}
                  disabled={loadingKey === 'church:name'}
                  className="px-5 py-2.5 rounded-2xl bg-[#1e1b4b] text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 disabled:opacity-50 transition-all shrink-0"
                >
                  Sauvegarder
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Adresse / Localisation</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={churchAddress}
                  onChange={(e) => setChurchAddress(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  onClick={() => handleSaveSetting('church:address', churchAddress, 'church', 'Adresse physique église')}
                  disabled={loadingKey === 'church:address'}
                  className="px-5 py-2.5 rounded-2xl bg-[#1e1b4b] text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 disabled:opacity-50 transition-all shrink-0"
                >
                  Sauvegarder
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Contact / Téléphone</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={churchContact}
                  onChange={(e) => setChurchContact(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  onClick={() => handleSaveSetting('church:contact', churchContact, 'church', 'Numéro de contact église')}
                  disabled={loadingKey === 'church:contact'}
                  className="px-5 py-2.5 rounded-2xl bg-[#1e1b4b] text-white font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 disabled:opacity-50 transition-all shrink-0"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
