export default function StatsSection() {
  return (
    <div className="mx-auto mt-20 max-w-7xl px-6 lg:px-8">
      <div className="rounded-3xl bg-white/80 border border-red-100 shadow-xl p-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-center">
            <h3 className="text-3xl font-bold text-red-700">500+</h3>
            <p className="mt-2 text-sm text-slate-600">Restaurants Expected</p>
          </div>
        </div>
      </div>
    </div>
  );
}