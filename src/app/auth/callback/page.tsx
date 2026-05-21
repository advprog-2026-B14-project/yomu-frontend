"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Supabase-js automatically parses the URL hash and sets the session
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error during auth callback:", error.message);
        router.push("/login?error=auth_failed");
        return;
      }

      if (data?.session) {
        const token = data.session.access_token;
        
        try {
          const res = await fetch("/api/auth/oauth", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (res.ok) {
            const result = await res.json();
            const userData = result.user;
            
            const authUser = {
              id: userData.id,
              email: userData.email,
              role: userData.role,
              fullName: userData.fullName,
              username: userData.username,
            };

            // Import saveAuth di atas file
            const { saveAuth } = await import("@/lib/auth");
            saveAuth(token, authUser);

            document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
            document.cookie = `user=${JSON.stringify(authUser)}; path=/; max-age=${60 * 60 * 24 * 7}`;
            
            router.push("/");
          } else {
            console.error("Gagal sinkronisasi dengan backend");
            router.push("/login?error=sync_failed");
          }
        } catch (err) {
          console.error("Network error saat sinkronisasi:", err);
          router.push("/login?error=network_error");
        }
      } else {
        router.push("/login");
      }
    };

    handleAuthCallback();
  }, [router]);

  const shell = "min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,#ffffff_30%,#f8fafc_72%)] text-slate-900 flex flex-col items-center justify-center p-4";
  const panel = "w-full max-w-sm rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur p-8 text-center";

  return (
    <div className={shell}>
      <div className={panel}>
        <div className="animate-spin mx-auto mb-6 rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        <h2 className="text-xl font-black text-slate-950 mb-2 tracking-tight">Memproses Login...</h2>
        <p className="text-sm font-medium text-slate-500">Mohon tunggu sebentar, sedang menyinkronkan data.</p>
      </div>
    </div>
  );
}
