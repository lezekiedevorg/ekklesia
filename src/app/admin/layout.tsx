import { getCurrentUserContext } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';

export const metadata = {
  title: 'Ekklesia Backoffice • Administration Centrale Sanctuaire',
  description: 'Centre de commande et de configuration du système Ekklesia Sanctuaire.',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentUserContext();

  // If user is not logged in or lacks admin access, redirect gracefully to login or home
  if (!context) {
    redirect('/login');
  }

  const isAdminOrSuperAdmin = context.roles.includes('super_admin') || context.roles.includes('admin');
  const hasAdminPermission = context.permissions.includes('admin:access');

  if (!isAdminOrSuperAdmin && !hasAdminPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1E1B4B] text-white p-6 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-3xl mx-auto border border-rose-500/30">
            🔒
          </div>
          <h1 className="text-xl font-black tracking-tight">Accès Restreint</h1>
          <p className="text-sm text-indigo-200 leading-relaxed">
            Vous ne disposez pas des permissions requises pour accéder au Backoffice d&apos;Administration. Seuls les Administrateurs ou le Super Administrateur y sont autorisés.
          </p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-gradient-to-r from-[#E8912F] to-[#D97B1E] text-white font-bold text-sm shadow-lg shadow-[#E8912F]/20 hover:opacity-95 transition-opacity"
            >
              Retour au tableau de bord pastoral
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col md:flex-row font-['Plus_Jakarta_Sans',sans-serif] text-[#1E1B4B] selection:bg-[#E8912F]/30">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        <AdminTopbar userContext={context} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
