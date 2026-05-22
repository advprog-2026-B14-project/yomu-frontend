"use client";

import { useEffect, useState } from "react";
import { getUser, AuthUser } from "@/lib/auth";
import Link from "next/link";

const shell = "min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,#ffffff_30%,#f8fafc_72%)] text-slate-900 pb-20";
const panel = "rounded-3xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur";

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const features = [
    {
      title: "Bacaan & Kuis",
      desc: "Pelajari materi baru dan uji pemahamanmu dengan kuis interaktif.",
      icon: "📖",
      path: "/bacaan-kuis",
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },

    {
      title: "Achievement",
      desc: "Kumpulkan poin dan pamerkan lencanamu kepada yang lain.",
      icon: "🏆",
      path: "/achievement",
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
    {
      title: "Liga Yomu",
      desc: "Bersaing dengan learner lain di papan klasemen global Yomu.",
      icon: "⚔️",
      path: "/interaksi-sosial-liga",
      color: "text-rose-600 bg-rose-50 border-rose-100",
    },
  ];

  return (
    <div className={shell}>
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className={`${panel} overflow-hidden p-8 sm:p-12 text-center relative mb-12`}>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-100 blur-3xl opacity-50 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-teal-100 blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
              Halo, {user ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">{user.username}</span> : "Learner"}!
            </h1>
            <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
              Selamat datang di Yomu. Mulai perjalanan belajarmu, taklukkan tantangan, dan jadilah yang terbaik di Liga Yomu.
            </p>
            
            {!user && (
              <Link
                href="/login"
                className="inline-block rounded-xl bg-emerald-700 px-8 py-4 text-base font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-1 hover:bg-emerald-800"
              >
                Mulai Belajar Sekarang
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, i) => (
            <Link
              key={i}
              href={item.path}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 hover:-translate-y-2 flex flex-col h-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-emerald-50/0 group-hover:from-emerald-50/50 group-hover:to-transparent transition-colors duration-500"></div>
              
              <div className="relative z-10 flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 border ${item.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  {item.icon}
                </div>
                <h3 className="font-black text-xl text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
              
              <div className="relative z-10 mt-6 flex items-center text-sm font-bold text-emerald-600 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                Jelajahi <span className="ml-2 text-lg">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
