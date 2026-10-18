import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-[#18A818] flex items-center justify-center mb-5 shadow-sm border border-emerald-100/60">
        <Compass className="w-10 h-10 animate-pulse" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
        The grocery shelf you are looking for doesn’t exist or has moved. Explore thousands of fresh items on our homepage.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button className="bg-[#18A818] hover:bg-[#159015] text-white font-medium text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all hover:shadow-md">
            <Home className="w-4 h-4" />
            Go to Homepage
          </Button>
        </Link>
        <Link href="/search">
          <Button
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm px-6 py-2.5 rounded-xl flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search Products
          </Button>
        </Link>
      </div>
    </div>
  );
}
