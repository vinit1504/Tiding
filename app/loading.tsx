export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="relative w-16 h-16">
        <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-[#18A818] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-[#18A818]" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">
        Loading fast groceries...
      </p>
    </div>
  );
}
