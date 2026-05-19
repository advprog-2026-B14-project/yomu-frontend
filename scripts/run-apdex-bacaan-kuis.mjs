import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const baseUrl = process.env.BACAAN_KUIS_BASE_URL || "https://yomu-bacaan-dan-kuis-b14-hanif.fly.dev";
const readingId = Number(process.env.READING_ID || "16");
const targetMs = Number(process.env.APDEX_TARGET_MS || "500");
const vus = Number(process.env.APDEX_VUS || "10");
const iterations = Number(process.env.APDEX_ITERATIONS || "5");
const toleratingMs = targetMs * 4;

const results = [];

const request = async (label, path, options = {}) => {
  const started = performance.now();
  let status = 0;
  let ok = false;
  let error = "";

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Student-Id": options.studentId || "student-apdex",
        ...(options.headers || {}),
      },
    });
    status = response.status;
    ok = response.ok || status === 409;
    await response.arrayBuffer();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }

  const durationMs = performance.now() - started;
  results.push({ label, path, status, ok, durationMs, error });
};

const runUserFlow = async (vu) => {
  const studentId = `student-apdex-${vu}-${Date.now()}`;
  for (let index = 0; index < iterations; index += 1) {
    await request("get reading", `/api/learner/readings/${readingId}`, { studentId });
    await request("start quiz", `/api/learner/readings/${readingId}/quiz/start`, {
      method: "POST",
      studentId,
    });
    await request("get quiz", `/api/learner/readings/${readingId}/quiz`, { studentId });
  }
};

await Promise.all(Array.from({ length: vus }, (_, index) => runUserFlow(index + 1)));

const satisfied = results.filter((result) => result.ok && result.durationMs <= targetMs).length;
const tolerating = results.filter((result) => result.ok && result.durationMs > targetMs && result.durationMs <= toleratingMs).length;
const frustrated = results.length - satisfied - tolerating;
const apdex = results.length ? (satisfied + tolerating / 2) / results.length : 0;
const failures = results.filter((result) => !result.ok);
const durations = results.map((result) => result.durationMs).sort((a, b) => a - b);
const percentile = (p) => {
  if (!durations.length) return 0;
  const index = Math.min(durations.length - 1, Math.ceil((p / 100) * durations.length) - 1);
  return durations[index];
};

const summary = [
  "# Bacaan dan Kuis APDEX Summary",
  "",
  `- Base URL: ${baseUrl}`,
  `- Reading ID: ${readingId}`,
  `- Virtual users: ${vus}`,
  `- Iterations per user: ${iterations}`,
  `- Total requests: ${results.length}`,
  `- Target latency: ${targetMs} ms`,
  `- Tolerating latency: ${toleratingMs} ms`,
  `- APDEX approximation: ${apdex.toFixed(3)}`,
  `- Satisfied requests: ${satisfied}`,
  `- Tolerating requests: ${tolerating}`,
  `- Frustrated/failed requests: ${frustrated}`,
  `- p50 latency: ${percentile(50).toFixed(2)} ms`,
  `- p95 latency: ${percentile(95).toFixed(2)} ms`,
  `- Failed requests: ${failures.length}`,
  "",
  "## Failed Requests",
  "",
  failures.length
    ? failures.map((failure) => `- ${failure.label} ${failure.path}: status ${failure.status || "n/a"} ${failure.error}`).join("\n")
    : "- None",
  "",
].join("\n");

await mkdir("docs/reports", { recursive: true });
await writeFile("docs/reports/apdex-summary.md", summary);
await writeFile(
  "docs/reports/apdex-summary.json",
  JSON.stringify(
    {
      baseUrl,
      readingId,
      targetMs,
      toleratingMs,
      vus,
      iterations,
      apdex,
      satisfied,
      tolerating,
      frustrated,
      p50: percentile(50),
      p95: percentile(95),
      failures,
      results,
    },
    null,
    2,
  ),
);

console.log(summary);
