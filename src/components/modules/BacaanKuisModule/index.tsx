"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Category = {
  id: number;
  name: string;
};

type Reading = {
  id: number;
  title: string;
  content: string;
  categoryId: number;
};

type Quiz = {
  id: number;
  readingId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
};

type LearnerReadingResponse = {
  id: number;
  title: string;
  content: string;
  categoryId: number;
  isLocked: boolean;
};

type LearnerQuestion = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

type ReadingForm = {
  title: string;
  content: string;
  categoryId: string;
};

type QuizForm = {
  readingId: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export const BacaanKuisModule = () => {
  const [activeTab, setActiveTab] = useState<"learner" | "admin">("learner");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const [studentId, setStudentId] = useState("");
  const [selectedReadingId, setSelectedReadingId] = useState("");
  const [readingView, setReadingView] = useState<LearnerReadingResponse | null>(null);
  const [learnerQuestions, setLearnerQuestions] = useState<LearnerQuestion[]>([]);
  const [learnerQuizIds, setLearnerQuizIds] = useState<number[]>([]);
  const [learnerAnswers, setLearnerAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const [editingReadingId, setEditingReadingId] = useState<number | null>(null);
  const [readingForm, setReadingForm] = useState<ReadingForm>({
    title: "",
    content: "",
    categoryId: "",
  });

  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [quizForm, setQuizForm] = useState<QuizForm>({
    readingId: "",
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
  });

  const readingMap = useMemo(() => {
    return new Map(readings.map((reading) => [reading.id, reading.title]));
  }, [readings]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => {
      setToast((previous) => (previous?.message === message ? null : previous));
    }, 2500);
  };

  const toUrl = (path: string) => `${API_BASE_URL.replace(/\/$/, "")}${path}`;

  const api = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const headers = new Headers(options.headers ?? {});
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(toUrl(path), {
      ...options,
      headers,
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const payload = await response.json();
        if (payload.message) {
          message = payload.message;
        }
      } catch {
        const bodyText = await response.text();
        if (bodyText) {
          message = bodyText;
        }
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json() as Promise<T>;
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
    const timer = window.setTimeout(() => {
      bootstrapData().catch((error: Error) => {
        showToast(`Gagal memuat data awal: ${error.message}`, "error");
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requireStudentId = () => {
    const value = studentId.trim();
    if (!value) {
      throw new Error("Student ID wajib diisi.");
    }
    return value;
  };

  const getSelectedReadingNumber = () => {
    const readingId = Number(selectedReadingId);
    if (Number.isNaN(readingId)) {
      throw new Error("Pilih bacaan terlebih dahulu.");
    }
    return readingId;
  };

  const loadLearnerReading = async () => {
    const sid = requireStudentId();
    const readingId = getSelectedReadingNumber();
    const reading = await api<LearnerReadingResponse>(`/api/learner/readings/${readingId}`, {
      headers: {
        "X-Student-Id": sid,
      },
    });

    setReadingView(reading);
    showToast("Bacaan berhasil dimuat");
  };

  const startQuiz = async () => {
    const sid = requireStudentId();
    const readingId = getSelectedReadingNumber();
    await api<null>(`/api/learner/readings/${readingId}/quiz/start`, {
      method: "POST",
      headers: {
        "X-Student-Id": sid,
      },
    });

    showToast("Kuis dimulai");
  };

  const loadQuestions = async () => {
    const sid = requireStudentId();
    const readingId = getSelectedReadingNumber();
    const [questions, quizData] = await Promise.all([
      api<LearnerQuestion[]>(`/api/learner/readings/${readingId}/quiz`, {
        headers: {
          "X-Student-Id": sid,
        },
      }),
      api<Quiz[]>("/api/admin/quizzes"),
    ]);

    const ids = quizData.filter((quiz) => quiz.readingId === readingId).map((quiz) => quiz.id);
    setLearnerQuestions(questions);
    setLearnerQuizIds(ids);
    setLearnerAnswers({});

    if (ids.length !== questions.length) {
      showToast("Peringatan: ID kuis tidak sinkron dengan data soal", "error");
      return;
    }

    showToast("Soal kuis berhasil dimuat");
  };

  const submitLearnerQuiz = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sid = requireStudentId();
    const readingId = getSelectedReadingNumber();

    const answers: Record<number, string> = {};
    learnerQuizIds.forEach((id, index) => {
      const selected = learnerAnswers[index];
      if (selected) {
        answers[id] = selected;
      }
    });

    const result = await api<{ score: number }>(`/api/learner/readings/${readingId}/quiz/submit`, {
      method: "POST",
      headers: {
        "X-Student-Id": sid,
      },
      body: JSON.stringify({ answers }),
    });

    setScore(result.score);
    showToast("Jawaban terkirim");
  };

  const saveCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryName.trim()) {
      showToast("Nama kategori wajib diisi", "error");
      return;
    }

    if (editingCategoryId) {
      await api(`/api/admin/categories/${editingCategoryId}`, {
        method: "PUT",
        body: JSON.stringify({ name: categoryName.trim() }),
      });
      showToast("Kategori diperbarui");
    } else {
      await api("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name: categoryName.trim() }),
      });
      showToast("Kategori dibuat");
    }

    setCategoryName("");
    setEditingCategoryId(null);
    await bootstrapData();
  };

  const saveReading = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      title: readingForm.title.trim(),
      content: readingForm.content.trim(),
      categoryId: Number(readingForm.categoryId),
    };

    if (!payload.title || !payload.content || Number.isNaN(payload.categoryId)) {
      showToast("Lengkapi form bacaan", "error");
      return;
    }

    if (editingReadingId) {
      await api(`/api/admin/readings/${editingReadingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Bacaan diperbarui");
    } else {
      await api("/api/admin/readings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
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

    if (
      Number.isNaN(payload.readingId) ||
      !payload.question ||
      !payload.optionA ||
      !payload.optionB ||
      !payload.optionC ||
      !payload.optionD ||
      !payload.correctAnswer
    ) {
      showToast("Lengkapi form kuis", "error");
      return;
    }

    if (editingQuizId) {
      await api(`/api/admin/quizzes/${editingQuizId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Kuis diperbarui");
    } else {
      await api("/api/admin/quizzes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Kuis dibuat");
    }

    setEditingQuizId(null);
    setQuizForm({
      readingId: "",
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
    });
    await bootstrapData();
  };

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-6xl px-4 pb-8 pt-10 md:px-6">
      <div className="pointer-events-none fixed -left-24 top-32 h-64 w-64 rounded-full bg-orange-300/35 blur-xl" />
      <div className="pointer-events-none fixed -bottom-8 -right-20 h-56 w-56 rounded-full bg-teal-300/30 blur-xl" />

      <header className="fade-in-up pb-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-600">Learning Platform</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight text-slate-800 md:text-5xl">Yomu Bacaan dan Kuis</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Frontend Next.js + Tailwind untuk mode learner dan admin dalam satu dashboard.
        </p>
      </header>

      <section className="soft-panel sticky top-2 z-20 rounded-2xl p-3 backdrop-blur-md">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("learner")}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              activeTab === "learner" ? "brand-btn text-white" : "bg-white text-slate-700"
            }`}
          >
            Mode Learner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("admin")}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              activeTab === "admin" ? "brand-btn text-white" : "bg-white text-slate-700"
            }`}
          >
            Mode Admin
          </button>
        </div>
      </section>

      {activeTab === "learner" ? (
        <section className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="soft-panel fade-in-up rounded-3xl p-4">
              <h2 className="mb-3 text-xl font-extrabold text-slate-800">Persiapan Learner</h2>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Student ID</label>
              <input
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                placeholder="contoh: 2206012345"
                className="mb-3 w-full rounded-xl border border-[#d7d0c3] bg-white px-3 py-2"
              />

              <label className="mb-1 block text-sm font-semibold text-slate-700">Pilih Bacaan</label>
              <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  value={selectedReadingId}
                  onChange={(event) => setSelectedReadingId(event.target.value)}
                  className="w-full rounded-xl border border-[#d7d0c3] bg-white px-3 py-2"
                >
                  <option value="">Pilih bacaan</option>
                  {readings.map((reading) => (
                    <option key={reading.id} value={reading.id}>
                      {reading.id} - {reading.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    bootstrapData()
                      .then(() => showToast("Data diperbarui"))
                      .catch((error: Error) => showToast(error.message, "error"))
                  }
                  className="accent-btn rounded-xl px-4 py-2 font-bold text-white"
                >
                  Refresh
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="brand-btn rounded-xl px-4 py-2 font-bold text-white"
                  onClick={() => loadLearnerReading().catch((error: Error) => showToast(error.message, "error"))}
                >
                  Muat Bacaan
                </button>
                <button
                  type="button"
                  className="brand-btn rounded-xl px-4 py-2 font-bold text-white"
                  onClick={() => startQuiz().catch((error: Error) => showToast(error.message, "error"))}
                >
                  Mulai Kuis
                </button>
                <button
                  type="button"
                  className="accent-btn rounded-xl px-4 py-2 font-bold text-white"
                  onClick={() => loadQuestions().catch((error: Error) => showToast(error.message, "error"))}
                >
                  Muat Soal
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-600">Tips: baca materi dulu, baru klik Mulai Kuis.</p>
            </article>

            <article className="soft-panel fade-in-up rounded-3xl p-4">
              <h2 className="mb-3 text-xl font-extrabold text-slate-800">Materi Bacaan</h2>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-extrabold text-slate-800">{readingView?.title ?? "Belum ada bacaan dipilih"}</p>
                <span
                  className={`rounded-full border px-3 py-1 font-mono text-xs ${
                    readingView?.isLocked ? "border-red-600 text-red-700" : "border-emerald-600 text-emerald-700"
                  }`}
                >
                  Status: {readingView ? (readingView.isLocked ? "Terkunci" : "Terbuka") : "-"}
                </span>
              </div>
              <div className="min-h-40 whitespace-pre-wrap rounded-xl border border-dashed border-[#d7d0c3] bg-white p-3 leading-relaxed text-slate-700">
                {readingView?.content || "Pilih bacaan lalu klik Muat Bacaan."}
              </div>
            </article>
          </div>

          <article className="soft-panel fade-in-up rounded-3xl p-4">
            <h2 className="mb-3 text-xl font-extrabold text-slate-800">Kuis</h2>
            <form onSubmit={(event) => submitLearnerQuiz(event).catch((error: Error) => showToast(error.message, "error"))}>
              <div className="space-y-3">
                {!learnerQuestions.length ? (
                  <div className="rounded-xl border border-[#d7d0c3] bg-white p-3 text-slate-600">Belum ada soal. Klik Muat Soal.</div>
                ) : (
                  learnerQuestions.map((quiz, index) => (
                    <article key={`${quiz.question}-${index}`} className="rounded-xl border border-[#d7d0c3] bg-white p-3">
                      <h3 className="mb-2 text-base font-bold text-slate-800">
                        {index + 1}. {quiz.question}
                      </h3>
                      {(["A", "B", "C", "D"] as const).map((key) => (
                        <label key={key} className="mb-1 flex items-center gap-2 text-slate-700">
                          <input
                            type="radio"
                            name={`answer-${index}`}
                            value={key}
                            checked={learnerAnswers[index] === key}
                            onChange={(event) =>
                              setLearnerAnswers((previous) => ({
                                ...previous,
                                [index]: event.target.value,
                              }))
                            }
                          />
                          <span>
                            {key}. {quiz[`option${key}`]}
                          </span>
                        </label>
                      ))}
                    </article>
                  ))
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="submit" className="brand-btn rounded-xl px-4 py-2 font-bold text-white">
                  Submit Jawaban
                </button>
                <span className="rounded-full border border-[#d7d0c3] bg-white px-3 py-1 font-mono text-sm text-slate-700">
                  Skor: {score ?? "-"}
                </span>
              </div>
            </form>
          </article>
        </section>
      ) : (
        <section className="mt-4 grid gap-4 xl:grid-cols-3">
          <article className="soft-panel fade-in-up rounded-3xl p-4">
            <h2 className="mb-3 text-xl font-extrabold text-slate-800">Kategori</h2>
            <form onSubmit={(event) => saveCategory(event).catch((error: Error) => showToast(error.message, "error"))}>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Nama Kategori</label>
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                className="mb-3 w-full rounded-xl border border-[#d7d0c3] bg-white px-3 py-2"
              />
              <div className="mb-3 flex gap-2">
                <button type="submit" className="brand-btn rounded-xl px-4 py-2 font-bold text-white">
                  Simpan
                </button>
                <button
                  type="button"
                  className="accent-btn rounded-xl px-4 py-2 font-bold text-white"
                  onClick={() => {
                    setEditingCategoryId(null);
                    setCategoryName("");
                  }}
                >
                  Reset
                </button>
              </div>
            </form>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="rounded-xl border border-[#d7d0c3] bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-800">{category.name}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="accent-btn rounded-lg px-2 py-1 text-xs font-bold text-white"
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setCategoryName(category.name);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-btn rounded-lg px-2 py-1 text-xs font-bold text-white"
                        onClick={() =>
                          api(`/api/admin/categories/${category.id}`, { method: "DELETE" })
                            .then(() => {
                              showToast("Kategori dihapus");
                              return bootstrapData();
                            })
                            .catch((error: Error) => showToast(error.message, "error"))
                        }
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">ID {category.id}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="soft-panel fade-in-up rounded-3xl p-4">
            <h2 className="mb-3 text-xl font-extrabold text-slate-800">Bacaan</h2>
            <form onSubmit={(event) => saveReading(event).catch((error: Error) => showToast(error.message, "error"))}>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Judul</label>
              <input
                value={readingForm.title}
                onChange={(event) => setReadingForm((previous) => ({ ...previous, title: event.target.value }))}
                className="mb-2 w-full rounded-xl border border-[#d7d0c3] bg-white px-3 py-2"
              />
              <label className="mb-1 block text-sm font-semibold text-slate-700">Kategori</label>
              <select
                value={readingForm.categoryId}
                onChange={(event) => setReadingForm((previous) => ({ ...previous, categoryId: event.target.value }))}
                className="mb-2 w-full rounded-xl border border-[#d7d0c3] bg-white px-3 py-2"
              >
                <option value="">Pilih kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.id} - {category.name}
                  </option>
                ))}
              </select>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Konten</label>
              <textarea
                rows={4}
                value={readingForm.content}
                onChange={(event) => setReadingForm((previous) => ({ ...previous, content: event.target.value }))}
                className="mb-3 w-full rounded-xl border border-[#d7d0c3] bg-white px-3 py-2"
              />
              <div className="mb-3 flex gap-2">
                <button type="submit" className="brand-btn rounded-xl px-4 py-2 font-bold text-white">
                  Simpan
                </button>
                <button
                  type="button"
                  className="accent-btn rounded-xl px-4 py-2 font-bold text-white"
                  onClick={() => {
                    setEditingReadingId(null);
                    setReadingForm({ title: "", content: "", categoryId: "" });
                  }}
                >
                  Reset
                </button>
              </div>
            </form>
            <div className="space-y-2">
              {readings.map((reading) => (
                <div key={reading.id} className="rounded-xl border border-[#d7d0c3] bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-800">{reading.title}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="accent-btn rounded-lg px-2 py-1 text-xs font-bold text-white"
                        onClick={() => {
                          setEditingReadingId(reading.id);
                          setReadingForm({
                            title: reading.title,
                            content: reading.content,
                            categoryId: String(reading.categoryId),
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-btn rounded-lg px-2 py-1 text-xs font-bold text-white"
                        onClick={() =>
                          api(`/api/admin/readings/${reading.id}`, { method: "DELETE" })
                            .then(() => {
                              showToast("Bacaan dihapus");
                              return bootstrapData();
                            })
                            .catch((error: Error) => showToast(error.message, "error"))
                        }
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    ID {reading.id} | Kategori: {categoryMap.get(reading.categoryId) ?? "-"}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="soft-panel fade-in-up rounded-3xl p-4">
            <h2 className="mb-3 text-xl font-extrabold text-slate-800">Kuis</h2>
            <form onSubmit={(event) => saveQuiz(event).catch((error: Error) => showToast(error.message, "error"))}>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Bacaan</label>
              <select
                value={quizForm.readingId}
                onChange={(event) => setQuizForm((previous) => ({ ...previous, readingId: event.target.value }))}
                className="mb-2 w-full rounded-xl border border-[#d7d0c3] bg-white px-3 py-2"
              >
                <option value="">Pilih bacaan</option>
                {readings.map((reading) => (
                  <option key={reading.id} value={reading.id}>
                    {reading.id} - {reading.title}
                  </option>
                ))}
              </select>

              <label className="mb-1 block text-sm font-semibold text-slate-700">Pertanyaan</label>
              <textarea
                rows={2}
                value={quizForm.question}
                onChange={(event) => setQuizForm((previous) => ({ ...previous, question: event.target.value }))}
                className="mb-2 w-full rounded-xl border border-[#d7d0c3] bg-white px-3 py-2"
              />

              {(["A", "B", "C", "D"] as const).map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Opsi {key}</label>
                  <input
                    value={quizForm[`option${key}`]}
                    onChange={(event) =>
                      setQuizForm((previous) => ({
                        ...previous,
                        [`option${key}`]: event.target.value,
                      }))
                    }
                    className="mb-2 w-full rounded-xl border border-[#d7d0c3] bg-white px-3 py-2"
                  />
                </div>
              ))}

              <label className="mb-1 block text-sm font-semibold text-slate-700">Jawaban Benar</label>
              <select
                value={quizForm.correctAnswer}
                onChange={(event) => setQuizForm((previous) => ({ ...previous, correctAnswer: event.target.value }))}
                className="mb-3 w-full rounded-xl border border-[#d7d0c3] bg-white px-3 py-2"
              >
                <option value="">Pilih</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>

              <div className="mb-3 flex gap-2">
                <button type="submit" className="brand-btn rounded-xl px-4 py-2 font-bold text-white">
                  Simpan
                </button>
                <button
                  type="button"
                  className="accent-btn rounded-xl px-4 py-2 font-bold text-white"
                  onClick={() => {
                    setEditingQuizId(null);
                    setQuizForm({
                      readingId: "",
                      question: "",
                      optionA: "",
                      optionB: "",
                      optionC: "",
                      optionD: "",
                      correctAnswer: "",
                    });
                  }}
                >
                  Reset
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="rounded-xl border border-[#d7d0c3] bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-800">{quiz.question}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="accent-btn rounded-lg px-2 py-1 text-xs font-bold text-white"
                        onClick={() => {
                          setEditingQuizId(quiz.id);
                          setQuizForm({
                            readingId: String(quiz.readingId),
                            question: quiz.question,
                            optionA: quiz.optionA,
                            optionB: quiz.optionB,
                            optionC: quiz.optionC,
                            optionD: quiz.optionD,
                            correctAnswer: quiz.correctAnswer,
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-btn rounded-lg px-2 py-1 text-xs font-bold text-white"
                        onClick={() =>
                          api(`/api/admin/quizzes/${quiz.id}`, { method: "DELETE" })
                            .then(() => {
                              showToast("Kuis dihapus");
                              return bootstrapData();
                            })
                            .catch((error: Error) => showToast(error.message, "error"))
                        }
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    ID {quiz.id} | {readingMap.get(quiz.readingId) ?? `Reading ${quiz.readingId}`} | Benar: {quiz.correctAnswer}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-xl px-4 py-3 text-white shadow-xl ${
            toast.type === "error" ? "bg-red-700" : "bg-emerald-700"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};
