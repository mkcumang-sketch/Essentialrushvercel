export default function RootLoading() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] text-[#050505]"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="mb-6 h-10 w-10 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-500">
        Essential
      </p>
    </div>
  );
}
