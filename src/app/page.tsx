"use client";

import { useEffect, useState } from "react";
import { getUser, getToken, AuthUser, logout } from "@/lib/auth";
import Link from "next/link";

const shell = "min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,#ffffff_30%,#f8fafc_72%)] text-slate-900";
const panel = "rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur";
const primary =
  "rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300";
const secondary =
  "rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:text-slate-400";
const danger =
  "rounded-xl border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-bold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100 hover:border-rose-300";

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

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
    
    // Clear cookies manually
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    // Clear local storage
    logout();
    
    window.location.href = "/login";
  };

  return (
    <div className={shell}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className={`${panel} w-full max-w-lg p-8 text-center`}>
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-700 text-3xl font-black text-white shadow-lg shadow-emerald-700/20">
            Y
          </div>
          
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Learning OS</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Halo, {user ? user.username : "Learner"}!
          </h1>
          <p className="mt-3 text-slate-500 text-sm leading-relaxed mb-8">
            Selamat datang di Yomu. Platform pembelajaran interaktif dengan bacaan, kuis, dan forum diskusi.
          </p>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {user ? (
              <>
                <Link href={`/profile/${user.username}`} className={`${primary} text-center`}>
                  Lihat Profil
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" className={`${secondary} text-center`}>
                    Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className={danger}>
                  Logout
                </button>
              </>
            ) : (
              <a href="/login" className={`${primary} text-center`}>
                Login ke Akun
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
