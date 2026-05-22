"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthUser, getUser, logout, getToken } from "@/lib/auth";

export const NavbarModule = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(getUser());
  }, [pathname]); // Re-check when route changes

  // Hide navbar on admin, auth, and callback routes
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/auth")
  ) {
    return null;
  }

  const navItems = [
    { name: "Beranda", path: "/" },
    { name: "Bacaan & Kuis", path: "/bacaan-kuis" },
    { name: "Achievement", path: "/achievement" },
    { name: "Liga", path: "/interaksi-sosial-liga" },
  ];

  const handleLogout = async () => {
    const token = getToken();
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    logout();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-100 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-lg font-black text-white">
              Y
            </div>
            <span className="text-xl font-black tracking-tight text-emerald-900">
              Yomu
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = item.path === "/" ? pathname === "/" : pathname?.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`text-sm font-bold transition-colors ${
                    isActive
                      ? "text-emerald-700"
                      : "text-slate-500 hover:text-emerald-600"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/profile/${user.username}`}
                className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-emerald-700 transition"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <span>{user.username}</span>
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
