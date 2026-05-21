import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const BASE_URL = __ENV.BACAAN_KUIS_BASE_URL || "http://localhost:8080";
const STUDENT_ID = __ENV.STUDENT_ID || "student-perf";
const READING_ID = Number(__ENV.READING_ID || "1");
const TARGET_MS = Number(__ENV.APDEX_TARGET_MS || "500");
const TOLERATING_MS = TARGET_MS * 4;

export const apdexSatisfied = new Rate("apdex_satisfied");
export const apdexTolerating = new Rate("apdex_tolerating");
export const apdexFrustrated = new Rate("apdex_frustrated");

export const options = {
  vus: Number(__ENV.K6_VUS || "10"),
  duration: __ENV.K6_DURATION || "1m",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: [`p(95)<${TOLERATING_MS}`],
    apdex_satisfied: ["rate>0.75"],
    apdex_frustrated: ["rate<0.05"],
  },
};

function recordApdex(response) {
  const duration = response.timings.duration;
  apdexSatisfied.add(duration <= TARGET_MS);
  apdexTolerating.add(duration > TARGET_MS && duration <= TOLERATING_MS);
  apdexFrustrated.add(duration > TOLERATING_MS || response.status >= 500);
}

function headers() {
  return {
    headers: {
      "Content-Type": "application/json",
      "X-Student-Id": `${STUDENT_ID}-${__VU}`,
    },
  };
}

export default function bacaanKuisApdexScenario() {
  const reading = http.get(`${BASE_URL}/api/learner/readings/${READING_ID}`, headers());
  recordApdex(reading);
  check(reading, {
    "reading endpoint is available": (response) => response.status === 200,
  });

  const start = http.post(`${BASE_URL}/api/learner/readings/${READING_ID}/quiz/start`, null, headers());
  recordApdex(start);
  check(start, {
    "start quiz is accepted or already started": (response) => [200, 204, 409].includes(response.status),
  });

  const questions = http.get(`${BASE_URL}/api/learner/readings/${READING_ID}/quiz`, headers());
  recordApdex(questions);
  check(questions, {
    "quiz questions endpoint is available": (response) => response.status === 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  const satisfied = data.metrics.apdex_satisfied?.values?.rate || 0;
  const tolerating = data.metrics.apdex_tolerating?.values?.rate || 0;
  const apdex = satisfied + tolerating / 2;
  const summary = [
    "# Bacaan dan Kuis APDEX Summary",
    "",
    `- Base URL: ${BASE_URL}`,
    `- Reading ID: ${READING_ID}`,
    `- Target latency: ${TARGET_MS} ms`,
    `- Tolerating latency: ${TOLERATING_MS} ms`,
    `- APDEX approximation: ${apdex.toFixed(3)}`,
    `- Satisfied ratio: ${satisfied.toFixed(3)}`,
    `- Tolerating ratio: ${tolerating.toFixed(3)}`,
    `- Frustrated ratio: ${(data.metrics.apdex_frustrated?.values?.rate || 0).toFixed(3)}`,
    `- HTTP p95: ${(data.metrics.http_req_duration?.values?.["p(95)"] || 0).toFixed(2)} ms`,
    "",
  ].join("\n");

  return {
    stdout: summary,
    "docs/reports/apdex-summary.md": summary,
    "docs/reports/apdex-summary.json": JSON.stringify(data, null, 2),
  };
}
