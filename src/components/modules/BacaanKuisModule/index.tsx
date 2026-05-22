"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { DiskusiForumModule } from "@/components/modules/DiskusiForumModule";
import { AuthUser, getUser } from "@/lib/auth";

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
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

type LearnerSubmitQuizResponse = {
  score: number;
  totalQuestions: number;
  correctAnswers: Record<number, string>;
};

type LeagueStatisticsResponse = {
  studentId: string;
  completedQuizCount: number;
  totalCorrectAnswers: number;
  totalAnsweredQuestions: number;
  accuracyRate: number;
  accuracyPercentage: number;
};

type AchievementProfileResponse = {
  userId: string;
  level: number;
  totalPoints: number;
};



const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend";

const shell = "min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,#ffffff_30%,#f8fafc_72%)] text-slate-900";
const panel = "rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur";
const subtlePanel = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const input =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const primary =
  "rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300";
const secondary =
  "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:text-slate-400";
const danger =
  "rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-300";

const optionKeys = ["A", "B", "C", "D"] as const;

const estimateReadingTime = (content: string) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
};

const toForumReadingId = (readingId: number) => {
  const suffix = readingId.toString(16).padStart(12, "0").slice(-12);
  return `00000000-0000-4000-8000-${suffix}`;
};

export const BacaanKuisModule = () => {
  const [activeView, setActiveView] = useState<"learn" | "quiz" | "forum">("learn");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const [studentId, setStudentId] = useState("");
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);
  const [selectedReadingId, setSelectedReadingId] = useState("");
  const [readingView, setReadingView] = useState<LearnerReadingResponse | null>(null);
  const [learnerQuestions, setLearnerQuestions] = useState<LearnerQuestion[]>([]);
  const [learnerQuizIds, setLearnerQuizIds] = useState<number[]>([]);
  const [learnerAnswers, setLearnerAnswers] = useState<Record<number, string>>({});
  const [reviewCorrectAnswers, setReviewCorrectAnswers] = useState<Record<number, string>>({});
  const [leagueStatistics, setLeagueStatistics] = useState<LeagueStatisticsResponse | null>(null);
  const [leagueStatsError, setLeagueStatsError] = useState<string | null>(null);
  const [leagueStatsSyncedAt, setLeagueStatsSyncedAt] = useState<string | null>(null);
  const [achievementProfile, setAchievementProfile] = useState<AchievementProfileResponse | null>(null);
  const [achievementProfileError, setAchievementProfileError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);



  const readingMap = useMemo(() => new Map(readings.map((reading) => [reading.id, reading.title])), [readings]);
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);

  const selectedReading = useMemo(() => {
    const readingId = Number(selectedReadingId);
    return readings.find((reading) => reading.id === readingId) ?? null;
  }, [readings, selectedReadingId]);
  const sessionLabel = sessionUser?.username || sessionUser?.fullName || sessionUser?.email || "Learner";

  const answeredCount = useMemo(() => Object.values(learnerAnswers).filter(Boolean).length, [learnerAnswers]);
  const quizProgress = learnerQuestions.length ? Math.round((answeredCount / learnerQuestions.length) * 100) : 0;
  const activeQuestion = learnerQuestions[currentQuestion] ?? null;
  const scoreIsPercentage = score !== null && learnerQuestions.length > 0 && score > learnerQuestions.length;
  const normalizedScorePercent =
    score === null ? 0 : scoreIsPercentage ? score : learnerQuestions.length ? Math.round((score / learnerQuestions.length) * 100) : score;
  const scoreSummary = score === null ? "-" : scoreIsPercentage ? `${score}%` : `${score}/${learnerQuestions.length}`;
  const achievementLevel = achievementProfile?.level ?? null;
  const achievementTotalPoints = achievementProfile?.totalPoints ?? 0;
  const achievementLevelProgress = achievementLevel === null ? 0 : achievementTotalPoints % 100;
  const achievementXpToNext = achievementLevel === null ? null : 100 - achievementLevelProgress;
  const totalQuestionsForSelectedReading = selectedReading
    ? quizzes.filter((quiz) => quiz.readingId === selectedReading.id).length
    : 0;
  const estimatedMinutes = readingView?.content ? estimateReadingTime(readingView.content) : 0;
  const correctAnswerCount =
    score === null || !learnerQuestions.length
      ? 0
      : scoreIsPercentage
        ? Math.round((Math.min(score, 100) / 100) * learnerQuestions.length)
        : Math.min(score, learnerQuestions.length);
  const localLeagueStats = {
    accuracy: normalizedScorePercent,
    completedQuiz: score === null ? 0 : 1,
    answeredQuestions: answeredCount,
    correctAnswers: correctAnswerCount,
    frequency: score === null ? "Belum submit" : `${learnerQuestions.length} jawaban/sesi`,
    status: score === null ? "Menunggu submit quiz" : "Siap dikirim ke Modul Liga",
  };
  const leagueStats = leagueStatistics
    ? {
        accuracy: leagueStatistics.accuracyPercentage,
        completedQuiz: leagueStatistics.completedQuizCount,
        answeredQuestions: leagueStatistics.totalAnsweredQuestions,
        correctAnswers: leagueStatistics.totalCorrectAnswers,
        frequency: `${leagueStatistics.completedQuizCount} kuis selesai`,
        status: "Sinkron real-time dari endpoint internal Modul Liga",
      }
    : localLeagueStats;

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => {
      setToast((previous) => (previous?.message === message ? null : previous));
    }, 2500);
  };

  const withLoading = async (action: string, callback: () => Promise<void>) => {
    setLoadingAction(action);
    setLastError(null);
    try {
      await callback();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
      setLastError(message);
      showToast(message, "error");
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

    if (response.status === 204) {
      return null as T;
    }

    const bodyText = await response.text();
    if (!bodyText) {
      return null as T;
    }

    return JSON.parse(bodyText) as T;
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
    setLastError(null);
  };

  useEffect(() => {
    const user = getUser();
    setSessionUser(user);
    setStudentId(user?.id ?? "");
    if (user?.id) {
      void fetchAchievementProfile(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      bootstrapData().catch((error: Error) => {
        setLastError(error.message);
        showToast(`Gagal memuat data awal: ${error.message}`, "error");
      });
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requireStudentId = () => {
    const value = studentId.trim();
    if (!value) {
      throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
    }
    return value;
  };

  const getSelectedReadingNumber = () => {
    const readingId = Number(selectedReadingId);
    if (Number.isNaN(readingId) || !readingId) {
      throw new Error("Pilih bacaan terlebih dahulu.");
    }
    return readingId;
  };

  const resetLearnerFlow = () => {
    setReadingView(null);
    setLearnerQuestions([]);
    setLearnerQuizIds([]);
    setLearnerAnswers({});
    setReviewCorrectAnswers({});
    setScore(null);
    setQuizStarted(false);
    setCurrentQuestion(0);
  };

  const fetchLeagueStatistics = async (sid = studentId.trim()) => {
    if (!sid) {
      setLeagueStatistics(null);
      setLeagueStatsError(null);
      setLeagueStatsSyncedAt(null);
      return;
    }

    try {
      const response = await fetch(`/api/league/statistics/students/${encodeURIComponent(sid)}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `HTTP ${response.status}`);
      }

      const payload = (await response.json()) as LeagueStatisticsResponse;
      setLeagueStatistics(payload);
      setLeagueStatsError(null);
      setLeagueStatsSyncedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (error) {
      setLeagueStatistics(null);
      setLeagueStatsError(error instanceof Error ? error.message : "Gagal mengambil statistik Liga.");
      setLeagueStatsSyncedAt(null);
    }
  };

  const fetchAchievementProfile = async (sid = studentId.trim()) => {
    if (!sid) {
      setAchievementProfile(null);
      setAchievementProfileError(null);
      return;
    }

    try {
      const response = await fetch(`/api/achievements/profile/${encodeURIComponent(sid)}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `HTTP ${response.status}`);
      }

      const payload = (await response.json()) as AchievementProfileResponse;
      setAchievementProfile(payload);
      setAchievementProfileError(null);
    } catch (error) {
      setAchievementProfile(null);
      setAchievementProfileError(error instanceof Error ? error.message : "Gagal mengambil profil Achievement.");
    }
  };

  const loadLearnerReading = async () => {
    const sid = requireStudentId();
    const readingId = getSelectedReadingNumber();
    const reading = await api<LearnerReadingResponse>(`/api/learner/readings/${readingId}`, {
      headers: { "X-Student-Id": sid },
    });

    setReadingView(reading);
    setQuizStarted(false);
    setLearnerQuestions([]);
    setLearnerQuizIds([]);
    setLearnerAnswers({});
    setReviewCorrectAnswers({});
    setScore(null);
    setActiveView("learn");
    await fetchLeagueStatistics(sid);
    await fetchAchievementProfile(sid);
    showToast("Bacaan berhasil dimuat");
  };

  const ensureQuizAttemptStarted = async () => {
    const sid = requireStudentId();
    const readingId = getSelectedReadingNumber();
    await api<null>(`/api/learner/readings/${readingId}/quiz/start`, {
      method: "POST",
      headers: { "X-Student-Id": sid },
    });
  };

  const fetchQuestions = async () => {
    const sid = requireStudentId();
    const readingId = getSelectedReadingNumber();
    const questions = await api<LearnerQuestion[]>(`/api/learner/readings/${readingId}/quiz`, {
      headers: { "X-Student-Id": sid },
    });

    const ids = questions.map((question) => question.id);
    setLearnerQuestions(questions);
    setLearnerQuizIds(ids);
    setLearnerAnswers({});
    setReviewCorrectAnswers({});
    setCurrentQuestion(0);

    if (ids.some((id) => typeof id !== "number")) {
      showToast("Peringatan: ID kuis tidak sinkron dengan data soal", "error");
      return;
    }

    showToast("Soal kuis berhasil dimuat");
  };

  const startQuiz = async () => {
    await ensureQuizAttemptStarted();
    await fetchQuestions();

    setQuizStarted(true);
    setReadingView(null);
    setScore(null);
    setActiveView("quiz");
    showToast("Kuis dimulai. Teks bacaan disembunyikan.");
  };

  const loadQuestions = async () => {
    await ensureQuizAttemptStarted();
    await fetchQuestions();
    setQuizStarted(true);
    setReadingView(null);
    setActiveView("quiz");
  };

  const submitLearnerQuiz = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await ensureQuizAttemptStarted();
    const sid = requireStudentId();
    const readingId = getSelectedReadingNumber();

    const answers: Record<number, string> = {};
    learnerQuizIds.forEach((id, index) => {
      const selected = learnerAnswers[index];
      if (selected) {
        answers[id] = selected;
      }
    });

    const result = await api<LearnerSubmitQuizResponse>(`/api/learner/readings/${readingId}/quiz/submit`, {
      method: "POST",
      headers: { "X-Student-Id": sid },
      body: JSON.stringify({ answers }),
    });

    const submittedScore = result.score ?? 0;
    const submittedScoreIsPercentage = learnerQuestions.length > 0 && submittedScore > learnerQuestions.length;
    const submittedSummary = submittedScoreIsPercentage ? `${submittedScore}%` : `${submittedScore}/${learnerQuestions.length}`;

    setScore(submittedScore);
    setReviewCorrectAnswers(result.correctAnswers ?? {});
    setQuizStarted(false);
    setCurrentQuestion(0);
    await fetchLeagueStatistics(sid);
    await fetchAchievementProfile(sid);
    showToast(`Quiz selesai. Nilai: ${submittedSummary}`);
  };

  const navigateView = (view: "learn" | "quiz" | "forum") => {
    setActiveView(view);
  };



  return (
    <div className={shell}>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-4 px-4 py-4 lg:px-6">
        <aside className={`${panel} sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 p-4 lg:block`}>
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-700 text-lg font-black text-white">Y</div>
            <div>
              <p className="text-lg font-black tracking-tight">Yomu</p>
              <p className="text-xs font-semibold text-slate-500">Learning OS</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              ["learn", "Bacaan", "Read"],
              ["quiz", "Quiz", "Test"],
              ["forum", "Forum Diskusi", "Forum"],
            ].map(([view, label, badge]) => (
              <button
                key={view}
                type="button"
                onClick={() => navigateView(view as "learn" | "quiz" | "forum")}
                className={`group flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-bold transition ${
                  activeView === view ? "bg-emerald-700 text-white shadow-lg shadow-emerald-900/10" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    activeView === view ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white"
                  }`}
                >
                  {badge}
                </span>
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Level Progress</p>
            {achievementLevel === null ? (
              <>
                <p className="mt-2 text-2xl font-black">Level -</p>
                <div className="mt-3 h-2 rounded-full bg-white/15" />
                <p className="mt-2 text-xs text-slate-300">
                  {achievementProfileError ? "Belum tersinkron dengan Achievement" : "Memuat progres Achievement"}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-2xl font-black">Level {achievementLevel}</p>
                <div className="mt-3 h-2 rounded-full bg-white/15">
                  <div
                    className="h-2 rounded-full bg-amber-300 transition-all duration-700"
                    style={{ width: `${achievementLevelProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-300">{achievementXpToNext} XP menuju level berikutnya</p>
              </>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className={`${panel} mb-4 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between`}>
            <div>
              <p className="text-sm font-bold text-emerald-700">Selamat belajar, {sessionLabel}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Bacaan dan Kuis</h1>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                className={secondary}
                onClick={() =>
                  withLoading("refresh", async () => {
                    await bootstrapData();
                    showToast("Data diperbarui");
                  })
                }
                disabled={loadingAction === "refresh"}
              >
                {loadingAction === "refresh" ? "Memuat..." : "Sync Data"}
              </button>
            </div>
          </header>

          {lastError && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{lastError}</div>}

          <section className="mb-4 grid gap-3 md:grid-cols-4">
            <StatCard label="Total Bacaan" value={readings.length} tone="emerald" />
            <StatCard label="Soal Aktif" value={quizzes.length} tone="amber" />
            <StatCard label="Kategori" value={categories.length} tone="teal" />
            <StatCard label="Quiz Progress" value={`${quizProgress}%`} tone="purple" />
          </section>

          <section className="mb-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <div className={`${subtlePanel} p-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Statistik Liga</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight">Akurasi dan frekuensi belajar</h2>
                </div>
                <button
                  type="button"
                  className={`${secondary} px-3 py-2 text-xs`}
                  onClick={() => withLoading("sync-league", async () => fetchLeagueStatistics())}
                  disabled={loadingAction === "sync-league" || !studentId.trim()}
                >
                  {loadingAction === "sync-league" ? "Sync..." : "Sync Liga"}
                </button>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <MiniMetric label="Accuracy" value={`${leagueStats.accuracy}%`} />
                <MiniMetric label="Correct" value={`${leagueStats.correctAnswers}/${leagueStats.answeredQuestions || 0}`} />
                <MiniMetric label="Frequency" value={leagueStats.frequency} />
                <MiniMetric label="Completed" value={leagueStats.completedQuiz} />
              </div>
              {leagueStatsSyncedAt && <p className="mt-3 text-xs font-semibold text-emerald-700">Terakhir sinkron: {leagueStatsSyncedAt}</p>}
              {leagueStatsError && <p className="mt-3 text-xs font-semibold text-amber-700">Fallback sesi aktif: {leagueStatsError}</p>}
            </div>
            <div className={`${subtlePanel} p-4`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">League Payload</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {leagueStats.status}. Data yang disiapkan: studentId, readingId, akurasi, jumlah jawaban benar, dan frekuensi sesi.
              </p>
            </div>
          </section>

          <div className="mb-4 grid gap-2 rounded-2xl bg-slate-100 p-1.5 md:hidden md:grid-cols-4">
            {[
              ["learn", "Bacaan"],
              ["quiz", "Quiz"],
              ["forum", "Forum"],
            ].map(([view, label]) => (
              <button
                key={view}
                type="button"
                onClick={() => navigateView(view as "learn" | "quiz" | "forum")}
                className={`rounded-xl px-3 py-2 text-sm font-bold ${
                  activeView === view ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeView === "learn" && (
            <section className="grid gap-4 xl:grid-cols-[360px_1fr] xl:items-start">
              {/* Learning Path Panel */}
              <div className={`${panel} flex flex-col xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]`}>
                <div className="shrink-0 p-5 pb-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Learning Path</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Pilih bacaan hari ini</h2>
                  <p className="mt-1.5 text-sm leading-6 text-slate-500">
                    Baca materi dengan fokus, lalu masuk ke mode kuis.
                  </p>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                  <div className="space-y-3">
                    {readings.map((reading, index) => {
                      const quizCount = quizzes.filter((quiz) => quiz.readingId === reading.id).length;
                      return (
                        <ReadingPathCard
                          key={reading.id}
                          reading={reading}
                          index={index}
                          category={categoryMap.get(reading.categoryId) ?? "Tanpa kategori"}
                          quizCount={quizCount}
                          selected={selectedReadingId === String(reading.id)}
                          onSelect={() => {
                            setSelectedReadingId(String(reading.id));
                            resetLearnerFlow();
                          }}
                        />
                      );
                    })}
                    {!readings.length && (
                      <EmptyState title="Belum ada bacaan" description="Sync data atau jalankan seed untuk mengisi learning path." />
                    )}
                  </div>
                </div>

                <div className="shrink-0 border-t border-slate-100 p-4">
                  <button type="button" className={`${primary} w-full`} onClick={() => withLoading("load-reading", loadLearnerReading)} disabled={loadingAction === "load-reading"}>
                    {loadingAction === "load-reading" ? "Membuka..." : "Lanjutkan Belajar"}
                  </button>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" className={secondary} onClick={() => withLoading("start-quiz", startQuiz)} disabled={!!loadingAction}>
                      {loadingAction === "start-quiz" ? "Memulai..." : "Mulai Quiz"}
                    </button>
                    <button type="button" className={secondary} onClick={() => withLoading("load-questions", loadQuestions)} disabled={!!loadingAction}>
                      {loadingAction === "load-questions" ? "Memuat..." : "Muat Soal Quiz"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Reading Mode Panel */}
              <article className={`${panel} flex flex-col overflow-hidden xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]`}>
                <div className="shrink-0">
                  <div className="h-1 bg-slate-100">
                    <div className="h-1 rounded-r-full bg-emerald-500 transition-all" style={{ width: readingView ? "60%" : "15%" }} />
                  </div>
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Reading Mode</p>
                        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                          {quizStarted ? "Quiz sedang berlangsung" : readingView?.title ?? "Belum ada bacaan dibuka"}
                        </h2>
                        {readingView && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                              {estimatedMinutes} menit baca
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                              {categoryMap.get(readingView.categoryId) ?? "Kategori"}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                              {totalQuestionsForSelectedReading} soal kuis
                            </span>
                          </div>
                        )}
                        {!readingView && (
                          <p className="mt-1.5 text-sm text-slate-400">Pilih bacaan di panel kiri, lalu klik Lanjutkan Belajar</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsBookmarked((value) => !value)}
                        className={`${secondary} shrink-0 px-3`}
                      >
                        {isBookmarked ? "Saved ★" : "Bookmark"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="mx-auto w-full max-w-3xl px-5 py-8">
                    {quizStarted ? (
                      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
                        <p className="text-sm font-bold uppercase tracking-wide text-amber-700">Focus Mode</p>
                        <h3 className="mt-2 text-2xl font-black text-amber-950">Materi disembunyikan</h3>
                        <p className="mt-3 text-sm leading-6 text-amber-900">
                          Kuis sedang berlangsung. Teks bacaan tidak ditampilkan.
                        </p>
                      </div>
                    ) : readingView ? (
                      <MarkdownContent content={readingView.content} />
                    ) : (
                      <EmptyState title="Reading mode kosong" description="Klik Lanjutkan Belajar untuk membuka materi bacaan." />
                    )}
                  </div>
                </div>
              </article>
            </section>
          )}

          {activeView === "quiz" && (
            <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
              <form
                className={`${panel} p-5`}
                onSubmit={(event) =>
                  withLoading("submit-quiz", async () => {
                    await submitLearnerQuiz(event);
                  })
                }
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Quiz Arena</p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight">Tes pemahamanmu</h2>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">Achievement Sync</span>
                </div>

                <div className="mb-6 h-3 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-emerald-600 transition-all" style={{ width: `${quizProgress}%` }} />
                </div>

                {score !== null && (
                  <div className="mb-5 overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Quiz Completed</p>
                        <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Hasil belajarmu sudah tercatat</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Mode review aktif. Jawaban yang sudah dipilih tetap terlihat, tetapi tidak bisa diubah lagi.
                        </p>
                      </div>
                      <div className="grid min-w-32 place-items-center rounded-2xl bg-slate-950 px-5 py-4 text-white">
                        <p className="text-3xl font-black">{scoreSummary}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-300">Score</p>
                      </div>
                    </div>
                    <div className="mt-4 h-3 rounded-full bg-slate-200">
                      <div className="h-3 rounded-full bg-emerald-600 transition-all" style={{ width: `${Math.min(100, normalizedScorePercent)}%` }} />
                    </div>
                    <div className="mt-4 grid gap-3 rounded-2xl border border-emerald-200 bg-white/80 p-4 sm:grid-cols-3">
                      <MiniMetric label="League Accuracy" value={`${leagueStats.accuracy}%`} />
                      <MiniMetric label="Correct Answer" value={`${leagueStats.correctAnswers}/${learnerQuestions.length}`} />
                      <MiniMetric label="Frequency" value={leagueStats.frequency} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        className={primary}
                        onClick={() => {
                          setActiveView("learn");
                          setLearnerQuestions([]);
                          setLearnerQuizIds([]);
                          setLearnerAnswers({});
                          setReviewCorrectAnswers({});
                          setScore(null);
                        }}
                      >
                        Kembali ke Bacaan
                      </button>
                      <button type="button" className={secondary} onClick={() => setCurrentQuestion(0)}>
                        Lihat Soal Lagi
                      </button>
                    </div>
                  </div>
                )}

                {activeQuestion ? (
                  <div className={`rounded-3xl border p-5 ${score !== null ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
                        Pertanyaan {currentQuestion + 1}/{learnerQuestions.length}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${score !== null ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"}`}>
                        {score !== null ? "Review" : "Medium"}
                      </span>
                    </div>
                    <h3 className="text-xl font-black leading-8 text-slate-950">{activeQuestion.question}</h3>
                    <div className="mt-5 grid gap-3">
                      {optionKeys.map((key) => {
                        const selected = learnerAnswers[currentQuestion] === key;
                        const correctAnswer = reviewCorrectAnswers[activeQuestion.id];
                        const isCorrectOption = score !== null && correctAnswer === key;
                        const isSelectedWrong = score !== null && selected && correctAnswer && correctAnswer !== key;
                        return (
                          <label
                            key={key}
                            className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                              isCorrectOption
                                ? "border-emerald-500 bg-emerald-50 shadow-sm"
                                : isSelectedWrong
                                  ? "border-rose-300 bg-rose-50 shadow-sm"
                                  : selected
                                    ? "border-emerald-500 bg-emerald-50 shadow-sm"
                                    : "border-slate-200 bg-white"
                            } ${score !== null ? "cursor-default opacity-90" : "cursor-pointer hover:-translate-y-0.5 hover:bg-white"}`}
                          >
                            <input
                              type="radio"
                              name={`answer-${currentQuestion}`}
                              value={key}
                              checked={selected}
                              disabled={score !== null}
                              onChange={(event) =>
                                setLearnerAnswers((previous) => ({
                                  ...previous,
                                  [currentQuestion]: event.target.value,
                                }))
                              }
                              className="mt-1"
                            />
                            <span>
                              <span className="font-black text-slate-900">{key}.</span>{" "}
                              <span className="text-slate-700">{activeQuestion[`option${key}`]}</span>
                              {isCorrectOption && <span className="ml-2 text-xs font-black uppercase text-emerald-700">Jawaban benar</span>}
                              {isSelectedWrong && <span className="ml-2 text-xs font-black uppercase text-rose-700">Pilihanmu</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <EmptyState title="Belum ada soal" description="Pilih bacaan, mulai quiz, lalu muat soal dari backend." />
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={secondary}
                      onClick={() => setCurrentQuestion((value) => Math.max(0, value - 1))}
                      disabled={!learnerQuestions.length || currentQuestion === 0}
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      className={secondary}
                      onClick={() => setCurrentQuestion((value) => Math.min(learnerQuestions.length - 1, value + 1))}
                      disabled={!learnerQuestions.length || currentQuestion >= learnerQuestions.length - 1}
                    >
                      Berikutnya
                    </button>
                  </div>
                  <button type="submit" className={primary} disabled={score !== null || !learnerQuestions.length || loadingAction === "submit-quiz"}>
                    {loadingAction === "submit-quiz" ? "Mengirim..." : "Submit Quiz"}
                  </button>
                </div>
              </form>

              <aside className="space-y-4">
                <div className={`${panel} p-5`}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Navigator</p>
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {learnerQuestions.length ? (
                      learnerQuestions.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentQuestion(index)}
                          className={`aspect-square rounded-xl text-sm font-black ${
                            currentQuestion === index
                              ? "bg-emerald-700 text-white"
                              : learnerAnswers[index]
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))
                    ) : (
                      <p className="col-span-5 text-sm text-slate-500">Soal belum dimuat.</p>
                    )}
                  </div>
                </div>

                <div className={`${panel} p-5`}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Result</p>
                  <div className="mt-4 grid place-items-center rounded-3xl bg-slate-950 p-6 text-white">
                    <p className="text-5xl font-black">{scoreSummary}</p>
                    <p className="mt-1 text-sm text-slate-300">Final score</p>
                  </div>
                  {score !== null && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="font-black text-amber-950">Achievement progress</p>
                      <p className="mt-1 text-sm text-amber-800">Progress kuis siap disinkronkan ke modul achievements.</p>
                    </div>
                  )}
                </div>
              </aside>
            </section>
          )}

          {activeView === "forum" && (
            <DiskusiForumModule
              readingId={selectedReading ? toForumReadingId(selectedReading.id) : undefined}
              readingTitle={selectedReading?.title}
            />
          )}

        </main>
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-2xl ${
            toast.type === "error" ? "bg-rose-700" : "bg-emerald-700"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, tone }: { label: string; value: number | string; tone: "emerald" | "amber" | "teal" | "purple" }) => {
  const toneClass = {
    emerald: "from-emerald-500 to-teal-400",
    amber: "from-amber-400 to-orange-400",
    teal: "from-teal-500 to-cyan-400",
    purple: "from-purple-500 to-fuchsia-400",
  }[tone];

  return (
    <div className={`${subtlePanel} group overflow-hidden p-4 transition hover:-translate-y-1 hover:shadow-lg`}>
      <div className={`mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r ${toneClass}`} />
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
    </div>
  );
};

const MiniMetric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-base font-black text-slate-950">{value}</p>
  </div>
);

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
    <p className="text-lg font-black text-slate-800">{title}</p>
    <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
  </div>
);

const HIGHLIGHT_COLORS = [
  "bg-emerald-100 text-emerald-900",
  "bg-amber-100 text-amber-900",
  "bg-violet-100 text-violet-900",
  "bg-sky-100 text-sky-900",
  "bg-rose-100 text-rose-900",
];

const MarkdownContent = ({ content }: { content: string }) => {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim() || "code";
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <div key={blocks.length} className="my-8 overflow-hidden rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/70" />
            <span className="h-3 w-3 rounded-full bg-amber-400/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
            <span className="ml-2 text-xs font-bold uppercase tracking-widest text-slate-400">{lang}</span>
          </div>
          <pre className="overflow-x-auto bg-slate-950 p-5 text-sm leading-7 text-emerald-100">
            <code>{codeLines.join("\n")}</code>
          </pre>
        </div>
      );
      continue;
    }

    if (isTableStart(lines, index)) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index].trim());
        index += 1;
      }
      blocks.push(<MarkdownTable key={blocks.length} lines={tableLines} />);
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h3 key={blocks.length} className="mb-3 mt-8 flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
          <span className="h-5 w-1 rounded-full bg-emerald-400" />
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push(
        <div key={blocks.length} className="mb-4 mt-12">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            {renderInline(trimmed.slice(3))}
          </h2>
          <div className="mt-2 h-0.5 w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-transparent" />
        </div>
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push(
        <div key={blocks.length} className="mb-6 mt-2">
          <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950">
            {renderInline(trimmed.slice(2))}
          </h1>
          <div className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
        </div>
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <div key={blocks.length} className="my-7 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
          <div className="flex items-center gap-2 border-b border-emerald-100 px-5 py-2.5">
            <span className="text-base">💡</span>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Insight dari Mentor</span>
          </div>
          <div className="px-5 py-4 text-base font-medium leading-7 text-emerald-950">
            {quoteLines.map((quote, quoteIndex) => (
              <p key={quoteIndex}>{renderInline(quote)}</p>
            ))}
          </div>
        </div>
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={blocks.length} className="my-5 space-y-2.5 pl-1">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex items-start gap-3 text-base leading-7 text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ol key={blocks.length} className="my-5 space-y-2.5 pl-1">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex items-start gap-3 text-base leading-7 text-slate-700">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                {itemIndex + 1}
              </span>
              <span className="pt-0.5">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isSpecialMarkdownLine(lines[index], lines, index)
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push(
      <p key={blocks.length} className="my-4 text-base leading-8 text-slate-600">
        {renderInline(paragraphLines.join(" "))}
      </p>
    );
  }

  return <div className="max-w-none">{blocks}</div>;
};

const isSpecialMarkdownLine = (line: string, lines: string[], index: number) => {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("# ") ||
    trimmed.startsWith("## ") ||
    trimmed.startsWith("### ") ||
    trimmed.startsWith("```") ||
    trimmed.startsWith(">") ||
    /^[-*]\s+/.test(trimmed) ||
    /^\d+\.\s+/.test(trimmed) ||
    isTableStart(lines, index)
  );
};

const isTableStart = (lines: string[], index: number) => {
  const current = lines[index]?.trim() ?? "";
  const next = lines[index + 1]?.trim() ?? "";
  return current.startsWith("|") && next.startsWith("|") && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(next);
};

const MarkdownTable = ({ lines }: { lines: string[] }) => {
  const [headerLine, , ...bodyLines] = lines;
  const headers = splitTableRow(headerLine);
  const rows = bodyLines.map(splitTableRow);

  return (
    <div className="my-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
      <table className="w-full min-w-[560px] border-collapse bg-white text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {headers.map((header, headerIndex) => (
              <th key={headerIndex} className="border-b border-slate-200 px-4 py-3 font-black">
                {renderInline(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="odd:bg-white even:bg-slate-50">
              {headers.map((_, cellIndex) => (
                <td key={cellIndex} className="border-b border-slate-100 px-4 py-3 leading-6 text-slate-700">
                  {renderInline(row[cellIndex] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const splitTableRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const renderInline = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  // Order matters: ==highlight== before *italic*, ** before *
  const pattern = /(\*\*[^*]+\*\*|==([^=]+)==|`[^`]+`|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      const color = HIGHLIGHT_COLORS[nodes.length % HIGHLIGHT_COLORS.length];
      nodes.push(
        <strong key={nodes.length} className={`rounded-md px-1 py-0.5 font-black ${color}`}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("==")) {
      nodes.push(
        <mark key={nodes.length} className="rounded bg-amber-200 px-0.5 py-0 font-semibold text-amber-900 not-italic">
          {match[2]}
        </mark>
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={nodes.length} className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[0.88em] font-bold text-emerald-800">
          {token.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(
        <em key={nodes.length} className="font-semibold not-italic text-violet-700">
          {match[3]}
        </em>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};



const READING_ICONS = ["📖", "📝", "🔬", "💡", "🌐", "🎯", "🧠", "📚", "⚡", "🔭"];

const ReadingPathCard = ({
  reading,
  index,
  category,
  quizCount,
  selected,
  onSelect,
}: {
  reading: Reading;
  index: number;
  category: string;
  quizCount: number;
  selected: boolean;
  onSelect: () => void;
}) => {
  const icon = READING_ICONS[index % READING_ICONS.length];
  const minutes = estimateReadingTime(reading.content);
  const chips = [`${minutes} menit baca`, `${quizCount} soal`, category];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
        selected
          ? "border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100"
          : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${selected ? "bg-emerald-100" : "bg-slate-100"}`}>
            {icon}
          </span>
          <div className="min-w-0">
            <p className="line-clamp-2 font-black leading-5 text-slate-900">{reading.title}</p>
            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
              {reading.content.slice(0, 90).replace(/[#*`>]/g, "").trim()}
              {reading.content.length > 90 ? "…" : ""}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
            selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          {selected ? "Dipilih" : `#${index + 1}`}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              selected ? "border-emerald-200 bg-white text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {chip}
          </span>
        ))}
      </div>
    </button>
  );
};
