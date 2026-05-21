"use client";

import { useEffect, useState } from "react";
import { getUser, getToken, AuthUser, logout } from "@/lib/auth";
import Link from "next/link";

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
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Halo, {user ? user.username : "Tamu"}</h1>
      {user && (
        <div className="flex gap-4">
          <Link 
            href={`/profile/${user.username}`}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors shadow-md text-center"
          >
            Lihat Profil
          </Link>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow-md"
          >
            Logout
          </button>
        </div>
      )}
      {!user && (
        <a 
          href="/login" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Login
        </a>
      )}
    </div>
  );
}
