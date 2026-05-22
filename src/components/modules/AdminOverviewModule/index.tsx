export const AdminOverviewModule = () => {
    return (
        <div className="p-6 md:p-10 w-full max-w-7xl mx-auto text-slate-900">
            <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white p-8 md:p-12 shadow-[0_20px_60px_rgba(15,23,42,0.05)] text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-100 blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-teal-100 blur-3xl opacity-50 pointer-events-none"></div>
                
                <div className="relative z-10 max-w-2xl mx-auto">
                    <div className="w-20 h-20 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-sm border border-emerald-50">
                        👋
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
                        Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Admin Panel</span>
                    </h1>
                    <p className="text-lg text-slate-600 font-medium leading-relaxed">
                        Pilih menu di sidebar sebelah kiri untuk mengelola fitur-fitur Yomu seperti Manajemen Pengguna, Achievements, dan Konten Bacaan & Kuis.
                    </p>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: "Manajemen User", desc: "Kelola role dan hapus pengguna.", icon: "👥", path: "/admin/users" },
                    { title: "Master Achievement", desc: "Buat dan edit data pencapaian.", icon: "🏆", path: "/admin/achievement" },
                    { title: "Bacaan & Kuis", desc: "Kelola kategori, konten bacaan, dan kuis.", icon: "📖", path: "/admin/bacaan-kuis" },
                ].map((item, i) => (
                    <div key={i} className="group p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-emerald-50 group-hover:scale-110 transition-all">
                            {item.icon}
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
