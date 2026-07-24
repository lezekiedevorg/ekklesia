export default function PageLoader({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="flex-1 min-h-[70vh] flex items-center justify-center text-[#1e1b4b] font-sans animate-fade-in-up">
      <div className="glass-panel px-8 py-6 rounded-3xl shadow-xl flex items-center gap-4 border border-white/80 font-label-caps font-bold text-sm">
        <div className="w-6 h-6 rounded-full border-3 border-[#1e1b4b] border-t-transparent animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}
