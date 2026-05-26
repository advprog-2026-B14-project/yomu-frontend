"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getToken, getUser } from "@/lib/auth";

const API_BASE_PATH =
  process.env.NEXT_PUBLIC_DISKUSI_FORUM_API_BASE_URL || "/api/diskusi-forum";
const COMMENTS_API_BASE_URL = `${API_BASE_PATH}/comments`;

type Reaction = {
  id: string;
  commentId: string;
  userId: string;
  reactionType: string;
};

type CommentItem = {
  id: string;
  content: string;
  userId?: string;
  authorName?: string;
  readingId?: string;
  readingTitle?: string;
  parentCommentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  reactions?: Reaction[];
  reactionCount?: number;
};

type CommentResponse = {
  content?: CommentItem[];
  data?: CommentItem[];
  items?: CommentItem[];
};

const shell = "w-full font-sans";
const panel =
  "mx-auto w-full max-w-6xl rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8";
const input =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

const secondary =
  "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-slate-400";
const danger =
  "rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-300";

const normalizeComments = (payload: unknown): CommentItem[] => {
  if (Array.isArray(payload)) return payload as CommentItem[];
  if (payload && typeof payload === "object") {
    const response = payload as CommentResponse;
    if (Array.isArray(response.content)) return response.content;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.items)) return response.items;
  }
  return [];
};

const formatDate = (value?: string) => {
  if (!value) return "Tidak diketahui";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const DiskusiForumAdminModule = ({
  className = "",
}: {
  className?: string;
}) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const session = getUser();
  const token = getToken();

  const fetchHeaders = useCallback(() => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (session?.id) headers["X-User-Id"] = session.id;
    headers["X-User-Role"] = "ADMIN";
    return headers;
  }, [token, session]);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const endpoints = [
      COMMENTS_API_BASE_URL,
      `${COMMENTS_API_BASE_URL}/all`,
      `${API_BASE_PATH}/admin/comments`,
    ];

    let lastError = "Gagal mengambil semua komentar";

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: fetchHeaders(),
          cache: "no-store",
        });

        if (!response.ok) {
          const errorBody = await response.text();
          lastError = `Gagal mengambil komentar (${response.status} ${response.statusText})${errorBody ? `: ${errorBody}` : ""}`;
          continue;
        }

        const payload = await response.json();
        const items = normalizeComments(payload).sort((left, right) => {
          const leftTime = new Date(right.createdAt ?? 0).getTime();
          const rightTime = new Date(left.createdAt ?? 0).getTime();
          return leftTime - rightTime;
        });

        setComments(items);
        setErrorMsg(null);
        setLoading(false);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : lastError;
      }
    }

    setErrorMsg(lastError);
    setComments([]);
    setLoading(false);
  }, [fetchHeaders]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  const filteredComments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return comments;

    return comments.filter((comment) => {
      const haystack = [
        comment.content,
        comment.authorName,
        comment.userId,
        comment.readingTitle,
        comment.readingId,
        comment.parentCommentId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [comments, searchQuery]);

  const stats = useMemo(() => {
    const rootComments = comments.filter((comment) => !comment.parentCommentId);
    const replies = comments.length - rootComments.length;
    const readings = new Set(
      comments.map(
        (comment) => comment.readingTitle ?? comment.readingId ?? "",
      ),
    ).size;

    return {
      total: comments.length,
      rootComments: rootComments.length,
      replies,
      readings,
    };
  }, [comments]);

  const removeCommentTree = (items: CommentItem[], targetId: string) => {
    const descendantIds = new Set<string>([targetId]);
    let updated = true;

    while (updated) {
      updated = false;
      for (const item of items) {
        if (
          item.parentCommentId &&
          descendantIds.has(item.parentCommentId) &&
          !descendantIds.has(item.id)
        ) {
          descendantIds.add(item.id);
          updated = true;
        }
      }
    }

    return items.filter((item) => !descendantIds.has(item.id));
  };

  const handleDelete = async (comment: CommentItem) => {
    if (
      !confirm(
        "Hapus komentar ini? Komentar turunan juga akan hilang dari daftar admin.",
      )
    ) {
      return;
    }

    if (!session?.id) {
      setErrorMsg("Silakan login ulang sebelum menghapus komentar.");
      return;
    }

    setDeletingId(comment.id);
    setErrorMsg(null);

    try {
      const response = await fetch(`${COMMENTS_API_BASE_URL}/${comment.id}`, {
        method: "DELETE",
        headers: fetchHeaders(),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Gagal menghapus komentar (${response.status} ${response.statusText})${errorBody ? `: ${errorBody}` : ""}`,
        );
      }

      setComments((previous) => removeCommentTree(previous, comment.id));
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "Gagal menghapus komentar",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className={`${shell} ${className}`.trim()}>
      <div className={panel}>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Moderasi komentar
              </p>
              <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
                Semua komentar forum
              </h1>
              <p className="max-w-2xl text-sm text-slate-600">
                Admin bisa meninjau semua komentar lintas bacaan dan menghapus
                yang tidak pantas.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                Total {stats.total}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">
                Thread {stats.rootComments}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">
                Balasan {stats.replies}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">
                Bacaan {stats.readings}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <input
                className={input}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari isi komentar, nama penulis, atau bacaan..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRefreshing(true);
                  void fetchComments().finally(() => setRefreshing(false));
                }}
                className={secondary}
                disabled={refreshing}>
                {refreshing ? "Menyegarkan..." : "Refresh"}
              </button>
            </div>
          </div>

          {errorMsg ? (
            <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
              <span className="text-sm">{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-sm font-bold">
                ×
              </button>
            </div>
          ) : null}

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
                Memuat komentar...
              </div>
            ) : filteredComments.length > 0 ? (
              filteredComments.map((comment) => {
                const isReply = Boolean(comment.parentCommentId);
                return (
                  <article
                    key={comment.id}
                    className={`rounded-2xl border p-5 shadow-sm transition ${isReply ? "border-amber-200 bg-amber-50/50" : "border-slate-200 bg-white"}`}>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                            {comment.readingTitle ??
                              comment.readingId ??
                              "Bacaan tidak diketahui"}
                          </span>
                          {comment.parentCommentId ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
                              Balasan
                            </span>
                          ) : null}
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-900">
                            {comment.authorName ??
                              comment.userId ??
                              "Pengguna anonim"}
                          </p>
                          <p className="text-xs text-slate-500 break-all">
                            ID: {comment.userId ?? "-"}
                          </p>
                        </div>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {comment.content}
                        </p>

                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            Comment ID: {comment.id}
                          </span>
                          {comment.parentCommentId ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              Parent: {comment.parentCommentId}
                            </span>
                          ) : null}
                          {(comment.reactionCount ??
                            comment.reactions?.length ??
                            0) > 0 ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              Reaksi:{" "}
                              {comment.reactionCount ??
                                comment.reactions?.length ??
                                0}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 xl:min-w-36 xl:items-end">
                        <button
                          type="button"
                          onClick={() => handleDelete(comment)}
                          disabled={deletingId === comment.id}
                          className={danger}>
                          {deletingId === comment.id ? "Menghapus..." : "Hapus"}
                        </button>
                        <span className="text-xs text-slate-400">
                          {comment.createdAt
                            ? `Dibuat ${formatDate(comment.createdAt)}`
                            : "Waktu tidak tersedia"}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
                Tidak ada komentar yang cocok dengan pencarian ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
