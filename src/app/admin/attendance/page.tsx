import AttendanceManager from '@/components/admin/AttendanceManager';

export default function AdminAttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#1e1b4b] tracking-tight">
          Pointages de Présence
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Consulter, corriger, ajouter ou supprimer les pointages par programme et par date.
        </p>
      </div>
      <AttendanceManager />
    </div>
  );
}
