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

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Memproses Login...</h2>
        <p className="text-gray-500">Mohon tunggu sebentar.</p>
      </div>
    </div>
  );
}
