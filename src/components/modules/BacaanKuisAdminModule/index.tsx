"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Category = { id: number; name: string };
type Reading = { id: number; title: string; content: string; categoryId: number };
type Quiz = { id: number; readingId: number; question: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string };

type ReadingForm = { title: string; content: string; categoryId: string };
type QuizForm = { readingId: string; question: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend";

const shell = "w-full text-slate-900";
const panel = "rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur";
const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const primary = "rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300";
const secondary = "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:text-slate-400";
const danger = "rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-300";

const optionKeys = ["A", "B", "C", "D"] as const;

const estimateReadingTime = (content: string) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
};

export const BacaanKuisAdminModule = () => {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const [editingReadingId, setEditingReadingId] = useState<number | null>(null);
  const [readingForm, setReadingForm] = useState<ReadingForm>({ title: "", content: "", categoryId: "" });

  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [quizForm, setQuizForm] = useState<QuizForm>({ readingId: "", question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "" });

  const readingMap = useMemo(() => new Map(readings.map((reading) => [reading.id, reading.title])), [readings]);
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const withLoading = async (action: string, callback: () => Promise<void>) => {
    setLoadingAction(action);
    try {
      await callback();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Terjadi kesalahan.", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const toUrl = (path: string) => `${API_BASE_URL.replace(/\/$/, "")}${path}`;

  const api = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const headers = new Headers(options.headers ?? {});
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }
    const response = await fetch(toUrl(path), { ...options, headers });
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      const bodyText = await response.text();
      if (bodyText) {
        try {
          const payload = JSON.parse(bodyText) as { message?: string };
          message = payload.message ?? bodyText;
        } catch {
          message = bodyText;
        }
      }
      throw new Error(message);
    }
    if (response.status === 204) return null as T;
    const bodyText = await response.text();
    return bodyText ? (JSON.parse(bodyText) as T) : (null as T);
  };

  const bootstrapData = async () => {
    const [categoryData, readingData, quizData] = await Promise.all([
      api<Category[]>("/api/admin/categories"),
      api<Reading[]>("/api/admin/readings"),
      api<Quiz[]>("/api/admin/quizzes"),
    ]);
    setCategories(categoryData);
    setReadings(readingData);
    setQuizzes(quizData);
  };

  useEffect(() => {
    bootstrapData().catch((error: Error) => showToast(`Gagal memuat data awal: ${error.message}`, "error"));
  }, []);

  const saveCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryName.trim()) {
      showToast("Nama kategori wajib diisi", "error");
      return;
    }
    if (editingCategoryId) {
      await api(`/api/admin/categories/${editingCategoryId}`, { method: "PUT", body: JSON.stringify({ name: categoryName.trim() }) });
      showToast("Kategori diperbarui");
    } else {
      await api("/api/admin/categories", { method: "POST", body: JSON.stringify({ name: categoryName.trim() }) });
      showToast("Kategori dibuat");
    }
    setCategoryName("");
    setEditingCategoryId(null);
    await bootstrapData();
  };

  const saveReading = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = { title: readingForm.title.trim(), content: readingForm.content.trim(), categoryId: Number(readingForm.categoryId) };
    if (!payload.title || !payload.content || Number.isNaN(payload.categoryId)) {
      showToast("Lengkapi form bacaan", "error");
      return;
    }
    if (editingReadingId) {
      await api(`/api/admin/readings/${editingReadingId}`, { method: "PUT", body: JSON.stringify(payload) });
      showToast("Bacaan diperbarui");
    } else {
      await api("/api/admin/readings", { method: "POST", body: JSON.stringify(payload) });
      showToast("Bacaan dibuat");
    }
    setEditingReadingId(null);
    setReadingForm({ title: "", content: "", categoryId: "" });
    await bootstrapData();
  };

  const saveQuiz = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      readingId: Number(quizForm.readingId),
      question: quizForm.question.trim(),
      optionA: quizForm.optionA.trim(),
      optionB: quizForm.optionB.trim(),
      optionC: quizForm.optionC.trim(),
      optionD: quizForm.optionD.trim(),
      correctAnswer: quizForm.correctAnswer.trim().toUpperCase(),
    };
    if (Number.isNaN(payload.readingId) || !payload.question || !payload.optionA || !payload.optionB || !payload.optionC || !payload.optionD || !payload.correctAnswer) {
      showToast("Lengkapi form kuis", "error");
      return;
    }
    if (editingQuizId) {
      await api(`/api/admin/quizzes/${editingQuizId}`, { method: "PUT", body: JSON.stringify(payload) });
      showToast("Kuis diperbarui");
    } else {
      await api("/api/admin/quizzes", { method: "POST", body: JSON.stringify(payload) });
      showToast("Kuis dibuat");
    }
    setEditingQuizId(null);
    setQuizForm({ readingId: "", question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "" });
    await bootstrapData();
  };

  return (
    <div className={`${shell} p-6 md:p-10 max-w-7xl mx-auto`}>
      <header className={`${panel} mb-6 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Yomu Admin</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Bacaan & Kuis Management</h1>
        </div>
        <button type="button" className={secondary} onClick={() => withLoading("refresh", bootstrapData)} disabled={loadingAction === "refresh"}>
          {loadingAction === "refresh" ? "Memuat..." : "Sync Data"}
        </button>
      </header>

      <section className="grid gap-4 xl:grid-cols-3 xl:items-start">
        <AdminCategoryPanel
          categories={categories}
          categoryName={categoryName}
          editingCategoryId={editingCategoryId}
          setCategoryName={setCategoryName}
          reset={() => { setEditingCategoryId(null); setCategoryName(""); }}
          save={(event: FormEvent<HTMLFormElement>) => withLoading("save-category", async () => saveCategory(event))}
          edit={(category: Category) => { setEditingCategoryId(category.id); setCategoryName(category.name); }}
          remove={(category: Category) =>
            withLoading("delete-category", async () => {
              await api(`/api/admin/categories/${category.id}`, { method: "DELETE" });
              showToast("Kategori dihapus");
              await bootstrapData();
            })
          }
        />

        <AdminReadingPanel
          readings={readings}
          categories={categories}
          categoryMap={categoryMap}
          readingForm={readingForm}
          setReadingForm={setReadingForm}
          reset={() => { setEditingReadingId(null); setReadingForm({ title: "", content: "", categoryId: "" }); }}
          save={(event: FormEvent<HTMLFormElement>) => withLoading("save-reading", async () => saveReading(event))}
          edit={(reading: Reading) => { setEditingReadingId(reading.id); setReadingForm({ title: reading.title, content: reading.content, categoryId: String(reading.categoryId) }); }}
          remove={(reading: Reading) =>
            withLoading("delete-reading", async () => {
              await api(`/api/admin/readings/${reading.id}`, { method: "DELETE" });
              showToast("Bacaan dihapus");
              await bootstrapData();
            })
          }
        />

        <AdminQuizPanel
          quizzes={quizzes}
          readings={readings}
          readingMap={readingMap}
          quizForm={quizForm}
          setQuizForm={setQuizForm}
          reset={() => { setEditingQuizId(null); setQuizForm({ readingId: "", question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "" }); }}
          save={(event: FormEvent<HTMLFormElement>) => withLoading("save-quiz", async () => saveQuiz(event))}
          edit={(quiz: Quiz) => { setEditingQuizId(quiz.id); setQuizForm({ readingId: String(quiz.readingId), question: quiz.question, optionA: quiz.optionA, optionB: quiz.optionB, optionC: quiz.optionC, optionD: quiz.optionD, correctAnswer: quiz.correctAnswer }); }}
          remove={(quiz: Quiz) =>
            withLoading("delete-quiz", async () => {
              await api(`/api/admin/quizzes/${quiz.id}`, { method: "DELETE" });
              showToast("Kuis dihapus");
              await bootstrapData();
            })
          }
        />
      </section>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-bold shadow-lg transition-all ${toast.type === "error" ? "bg-rose-50 border border-rose-200 text-rose-800" : "bg-emerald-50 border border-emerald-200 text-emerald-800"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

type AdminCategoryPanelProps = {
  categories: Category[];
  categoryName: string;
  editingCategoryId: number | null;
  setCategoryName: (value: string) => void;
  reset: () => void;
  save: (event: FormEvent<HTMLFormElement>) => void;
  edit: (category: Category) => void;
  remove: (category: Category) => void;
};

const AdminCategoryPanel = ({ categories, categoryName, editingCategoryId, setCategoryName, reset, save, edit, remove }: AdminCategoryPanelProps) => (
  <article className={`${panel} flex flex-col xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]`}>
    <div className="shrink-0 p-5 pb-0">
      <PanelHeader eyebrow="Content Taxonomy" title="Kategori" />
      <form onSubmit={save} className="mt-4">
        <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Nama kategori" className={input} />
        <div className="mt-3 flex gap-2">
          <button type="submit" className={primary}>{editingCategoryId ? "Update" : "Tambah"}</button>
          <button type="button" className={secondary} onClick={reset}>Reset</button>
        </div>
      </form>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto p-5 pt-4">
      <div className="space-y-2">
        {categories.map((category: Category) => (
          <AdminListItem key={category.id} title={category.name} meta={`ID ${category.id}`} onEdit={() => edit(category)} onDelete={() => remove(category)} />
        ))}
        {!categories.length && <EmptyState title="Belum ada kategori" description="Tambahkan kategori untuk mengelompokkan bacaan." />}
      </div>
    </div>
  </article>
);

type AdminReadingPanelProps = {
  readings: Reading[];
  categories: Category[];
  categoryMap: Map<number, string>;
  readingForm: ReadingForm;
  setReadingForm: (updater: (previous: ReadingForm) => ReadingForm) => void;
  reset: () => void;
  save: (event: FormEvent<HTMLFormElement>) => void;
  edit: (reading: Reading) => void;
  remove: (reading: Reading) => void;
};

const AdminReadingPanel = ({ readings, categories, categoryMap, readingForm, setReadingForm, reset, save, edit, remove }: AdminReadingPanelProps) => (
  <article className={`${panel} flex flex-col xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]`}>
    <div className="shrink-0 p-5 pb-0">
      <PanelHeader eyebrow="Learning Material" title="Bacaan" />
      <form onSubmit={save} className="mt-4 space-y-3">
        <input value={readingForm.title} onChange={(event) => setReadingForm((previous: ReadingForm) => ({ ...previous, title: event.target.value }))} placeholder="Judul bacaan" className={input} />
        <select value={readingForm.categoryId} onChange={(event) => setReadingForm((previous: ReadingForm) => ({ ...previous, categoryId: event.target.value }))} className={input}>
          <option value="">Pilih kategori</option>
          {categories.map((category: Category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <textarea rows={5} value={readingForm.content} onChange={(event) => setReadingForm((previous: ReadingForm) => ({ ...previous, content: event.target.value }))} placeholder="Konten bacaan" className={input} />
        <div className="flex gap-2">
          <button type="submit" className={primary}>Simpan</button>
          <button type="button" className={secondary} onClick={reset}>Reset</button>
        </div>
      </form>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto p-5 pt-4">
      <div className="space-y-2">
        {readings.map((reading: Reading) => (
          <AdminListItem key={reading.id} title={reading.title} meta={`${categoryMap.get(reading.categoryId) ?? "-"} · ${estimateReadingTime(reading.content)} menit`} onEdit={() => edit(reading)} onDelete={() => remove(reading)} />
        ))}
        {!readings.length && <EmptyState title="Belum ada bacaan" description="Buat materi pertama agar learner bisa mulai belajar." />}
      </div>
    </div>
  </article>
);

type AdminQuizPanelProps = {
  quizzes: Quiz[];
  readings: Reading[];
  readingMap: Map<number, string>;
  quizForm: QuizForm;
  setQuizForm: (updater: (previous: QuizForm) => QuizForm) => void;
  reset: () => void;
  save: (event: FormEvent<HTMLFormElement>) => void;
  edit: (quiz: Quiz) => void;
  remove: (quiz: Quiz) => void;
};

const AdminQuizPanel = ({ quizzes, readings, readingMap, quizForm, setQuizForm, reset, save, edit, remove }: AdminQuizPanelProps) => (
  <article className={`${panel} flex flex-col xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]`}>
    <div className="shrink-0 p-5 pb-0">
      <PanelHeader eyebrow="Assessment" title="Quiz" />
      <form onSubmit={save} className="mt-4 space-y-3">
        <select value={quizForm.readingId} onChange={(event) => setQuizForm((previous: QuizForm) => ({ ...previous, readingId: event.target.value }))} className={input}>
          <option value="">Pilih bacaan</option>
          {readings.map((reading: Reading) => (
            <option key={reading.id} value={reading.id}>{reading.title}</option>
          ))}
        </select>
        <textarea rows={3} value={quizForm.question} onChange={(event) => setQuizForm((previous: QuizForm) => ({ ...previous, question: event.target.value }))} placeholder="Pertanyaan" className={input} />
        {optionKeys.map((key) => (
          <input key={key} value={quizForm[`option${key}`]} onChange={(event) => setQuizForm((previous: QuizForm) => ({ ...previous, [`option${key}`]: event.target.value }))} placeholder={`Opsi ${key}`} className={input} />
        ))}
        <select value={quizForm.correctAnswer} onChange={(event) => setQuizForm((previous: QuizForm) => ({ ...previous, correctAnswer: event.target.value }))} className={input}>
          <option value="">Jawaban benar</option>
          {optionKeys.map((key) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className={primary}>Simpan</button>
          <button type="button" className={secondary} onClick={reset}>Reset</button>
        </div>
      </form>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto p-5 pt-4">
      <div className="space-y-2">
        {quizzes.map((quiz: Quiz) => (
          <AdminListItem key={quiz.id} title={quiz.question} meta={`${readingMap.get(quiz.readingId) ?? `Reading ${quiz.readingId}`} · Jawaban ${quiz.correctAnswer}`} onEdit={() => edit(quiz)} onDelete={() => remove(quiz)} />
        ))}
        {!quizzes.length && <EmptyState title="Belum ada soal" description="Tambahkan pertanyaan untuk bacaan yang sudah tersedia." />}
      </div>
    </div>
  </article>
);

const PanelHeader = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
  </div>
);

const AdminListItem = ({ title, meta, onEdit, onDelete }: { title: string; meta: string; onEdit: () => void; onDelete: () => void }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-3">
    <p className="line-clamp-2 font-black leading-6 text-slate-900">{title}</p>
    <p className="mt-1 text-xs text-slate-500">{meta}</p>
    <div className="mt-3 flex gap-2">
      <button type="button" className={`${secondary} px-3 py-1.5 text-xs`} onClick={onEdit}>Edit</button>
      <button type="button" className={danger} onClick={onDelete}>Hapus</button>
    </div>
  </div>
);

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
    <p className="text-lg font-black text-slate-800">{title}</p>
    <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
  </div>
);
