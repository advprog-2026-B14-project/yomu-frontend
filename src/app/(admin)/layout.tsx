"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { logout, isTokenValid, getUser } from "@/lib/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!isTokenValid()) {
            router.replace("/login");
            return;
        }

        const user = getUser();
        if (user?.role !== "ADMIN") {
            router.replace("/");
            return;
        }

        setIsAuthorized(true);
    }, [router]);

    const navItems = [
        { name: "Dashboard", path: "/admin", icon: "📊", exact: true },
        { name: "Users", path: "/admin/users", icon: "👥", exact: false },
        { name: "Achievements", path: "/admin/achievement", icon: "🏆", exact: false },
        { name: "Bacaan & Kuis", path: "/admin/bacaan-kuis", icon: "📖", exact: false },
        { name: "Diskusi Forum", path: "/admin/diskusi-forum", icon: "💬", exact: false },
    ];

    const handleLogout = async () => {
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            if (token) {
                await fetch("/api/auth/logout", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
        } catch (error) {
            console.error("Logout failed:", error);
        }
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        logout();
        window.location.href = "/login";
    };

    if (!isAuthorized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-emerald-700 animate-pulse font-bold">Verifying authorization...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,#ffffff_30%,#f8fafc_72%)]">
            {/* Top Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-emerald-100 bg-white/80 backdrop-blur-md shadow-sm">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link href="/admin" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-lg font-black text-white">
                                ⚙️
                            </div>
                            <span className="text-xl font-black tracking-tight text-emerald-900 hidden sm:inline-block">
                                Admin
                            </span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-6">
                            {navItems.map((item) => {
                                const isActive = item.exact 
                                    ? pathname === item.path 
                                    : pathname?.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${
                                            isActive
                                                ? "text-emerald-700"
                                                : "text-slate-500 hover:text-emerald-600"
                                        }`}
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition hidden sm:inline-block"
                        >
                            Ke Mode User
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                        >
                            Logout
                        </button>
                    </div>
                </div>
                
                {/* Mobile Navigation Scrollable */}
                <div className="md:hidden border-t border-emerald-50 bg-white/95 px-4 py-2 overflow-x-auto">
                    <nav className="flex items-center gap-4 min-w-max">
                        {navItems.map((item) => {
                            const isActive = item.exact 
                                ? pathname === item.path 
                                : pathname?.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                                        isActive
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600"
                                    }`}
                                >
                                    <span>{item.icon}</span>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col pt-6">
                {children}
            </main>
        </div>
    );
}
