export default function FloatingInput({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="relative">
      <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
      />
    </div>
  );
}