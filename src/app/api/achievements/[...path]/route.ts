import { NextRequest } from "next/server";

const ACHIEVEMENT_API_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "https://yomu-gateway-prod.fly.dev/";

const hopByHopHeaders = new Set([
  "access-control-request-headers",
  "access-control-request-method",
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const proxy = async (
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) => {
  if (!ACHIEVEMENT_API_URL) {
    return new Response("ACHIEVEMENT_API_URL belum dikonfigurasi.", { status: 503 });
  }

  const { path = [] } = await context.params;
  const target = new URL(
    `/api/achievements/${path.join("/")}`,
    `${ACHIEVEMENT_API_URL.replace(/\/$/, "")}/`
  );
  target.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  hopByHopHeaders.forEach((header) => headers.delete(header));
  headers.delete("accept-encoding");
  headers.delete("origin");

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const response = await fetch(target, init);
  const responseHeaders = new Headers(response.headers);
  hopByHopHeaders.forEach((header) => responseHeaders.delete(header));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
