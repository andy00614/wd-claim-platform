"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/claims/new")) return "Create Claim";
  if (pathname.startsWith("/claims")) return "My Claims";
  if (pathname.startsWith("/admin")) return "Approval Requests";
  return "Expense Platform";
}

export default function DynamicTitle() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const router = useRouter();

  return (
    <h1 className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg font-semibold min-w-0">
      <button
        type="button"
        className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:opacity-75 flex-shrink-0"
        onClick={() => router.push("/claims")}
        aria-label="Go to My Claims"
      >
        <Image
          src="/icon.png"
          width={20}
          height={20}
          alt="WD Logo"
          className="sm:w-6 sm:h-6 flex-shrink-0"
          unoptimized
          priority
        />
        <span className="text-gray-900 hidden sm:inline">Wild Dynasty</span>
        <span className="text-gray-900 sm:hidden text-sm font-bold">WD</span>
      </button>
      <span className="text-gray-500 font-normal hidden sm:inline">•</span>
      <span className="text-gray-600 font-normal text-xs sm:text-sm font-semibold truncate">
        {title}
      </span>
    </h1>
  );
}
