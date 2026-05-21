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
        // You have the Supabase session here.
        // You might want to send this token to your Spring Boot backend 
        // to sync the user or obtain your own app's JWT, 
        // or just redirect the user to the dashboard.
        
        // For now, simply redirecting to home:
        router.push("/");
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
