import { NextRequest } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN ?? "";
const INTERNAL_SERVICE_TOKEN_HEADER = process.env.INTERNAL_SERVICE_TOKEN_HEADER ?? "X-Internal-Service-Token";

export const GET = async (
  _request: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) => {
  if (!INTERNAL_SERVICE_TOKEN.trim()) {
    return new Response("INTERNAL_SERVICE_TOKEN belum dikonfigurasi untuk proxy statistik Liga.", {
      status: 503,
    });
  }

  const { studentId } = await context.params;
  const target = new URL(
    `/api/internal/league/statistics/students/${encodeURIComponent(studentId)}`,
    `${BACKEND_API_URL.replace(/\/$/, "")}/`
  );

  const response = await fetch(target, {
    headers: {
      [INTERNAL_SERVICE_TOKEN_HEADER]: INTERNAL_SERVICE_TOKEN,
    },
    cache: "no-store",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};
