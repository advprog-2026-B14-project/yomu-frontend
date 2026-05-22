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
        <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,#ffffff_30%,#f8fafc_72%)]">
            {/* Sidebar */}
            <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-emerald-100 flex flex-col fixed inset-y-0 z-20 shadow-[4px_0_24px_rgba(15,23,42,0.02)]">
                <div className="p-6 border-b border-emerald-50">
                    <h2 className="text-2xl font-black text-emerald-800 tracking-tight flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-700 p-2 rounded-xl text-lg">⚙️</span>
                        Yomu Admin
                    </h2>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = item.exact 
                            ? pathname === item.path 
                            : pathname?.startsWith(item.path);
                            
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                                    isActive
                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 translate-x-1"
                                        : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                                }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-emerald-50">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors border border-transparent hover:border-rose-100"
                    >
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 min-h-screen flex flex-col">
                {children}
            </main>
        </div>
    );
}
