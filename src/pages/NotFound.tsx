import { Link } from "react-router-dom";
import { HomeIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#b10000] shadow-xl">
        <span className="text-3xl font-black text-white">D</span>
      </div>
      <h1 className="mt-6 text-[5rem] font-black leading-none tracking-tight text-gray-900">
        404
      </h1>
      <p className="mt-2 text-xl font-bold text-gray-700">Page not found</p>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-8 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(239,68,68,0.25)] transition hover:scale-[1.02]"
      >
        <HomeIcon className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  );
}
