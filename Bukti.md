# Bukti Final Bacaan dan Kuis
File ini dipakai untuk mengumpulkan bukti teknis final modul Bacaan dan Kuis.

## 1. Before-After Evidence
Repository:
- Frontend: `https://github.com/advprog-2026-B14-project/yomu-frontend`
- Backend Bacaan dan Kuis: `https://github.com/advprog-2026-B14-project/yomu-bacaan-dan-kuis`

Bukti:
| Area | Before | After | Alasan |
| --- | --- | --- | --- |
| Backend observability/performance | `6669d50 feat: add spring security with JWT and dev auth support` | `57bb72e Add observability metrics for Bacaan Kuis service` | Bukti Actuator/Prometheus ada. |
| Backend deploy Fly.io | `57bb72e Add observability metrics for Bacaan Kuis service` | `ebbec80 Add Fly.io deployment setup` | Bukti perubahan dari service lokal menjadi deployable service. |
| Backend quiz review/statistik | `1ed50ae Keep Fly backend warm for stable API proxy` | `7651dac feat: secure quiz review flow` | Bukti before-after flow quiz review, response submit, dan statistik. |
| Backend quality gate | `d5fc996 fix: align backend quality and deployment workflows` | `ef27225 fix: align security converter nullability contract` | Bukti CI/Sonar/Scorecard sampai quality gate aman. |
| Frontend performance/instrumentation | `8cc5008 feat: improve reading module UI and add forum discussion feature` | `593cfba Add final performance monitoring evidence setup` | Bukti Clarity, APDEX/Lighthouse tooling, dan monitoring evidence setup. |
| Frontend quiz review + Liga | `1c12c74 Fix backend proxy CORS headers for quiz flow` | `14dfb7e feat: integrate bacaan kuis review with league stats` | Bukti quiz review-only dan statistik Liga. |

- Untuk **Progress Final/performance**: before `8cc5008`, after `593cfba` atau after terbaru `18508e5`.
- Untuk **Milestone 100 quiz/statistik**: frontend before `1c12c74`, frontend after `14dfb7e`; backend before `1ed50ae`, backend after `7651dac`.
- Untuk **CI/CD dan quality gate backend**: before `d5fc996`, after `ef27225`.

Link commit:
- Frontend before performance: `https://github.com/advprog-2026-B14-project/yomu-frontend/commit/8cc5008`
- Frontend after performance setup: `https://github.com/advprog-2026-B14-project/yomu-frontend/commit/593cfba`
- Frontend after terbaru: `https://github.com/advprog-2026-B14-project/yomu-frontend/commit/18508e5`
- Frontend before quiz review/Liga: `https://github.com/advprog-2026-B14-project/yomu-frontend/commit/1c12c74`
- Frontend after quiz review/Liga: `https://github.com/advprog-2026-B14-project/yomu-frontend/commit/14dfb7e`
- Backend before quiz review/statistik: `https://github.com/advprog-2026-B14-project/yomu-bacaan-dan-kuis/commit/1ed50ae`
- Backend after quiz review/statistik: `https://github.com/advprog-2026-B14-project/yomu-bacaan-dan-kuis/commit/7651dac`
- Backend before quality gate: `https://github.com/advprog-2026-B14-project/yomu-bacaan-dan-kuis/commit/d5fc996`
- Backend after quality gate: `https://github.com/advprog-2026-B14-project/yomu-bacaan-dan-kuis/commit/ef27225`

| Metrik | Before commit | After commit | Before | After | Dampak |
| --- | --- | --- | --- | --- | --- |
| APDEX | before: `8cc5008` | `593cfba`/after terbaru | 0.620 | 0.933 | Backend stabil, failed request 0 |
| p95 latency | before: `8cc5008` | `593cfba`/after terbaru | 1600 ms | 762.53 ms | Masih dalam tolerating threshold 2000 ms |
| Lighthouse Performance | before: `8cc5008` | report after | 42 | 58 | Perlu rerun di deployment publik agar tidak redirect ke Vercel login |
| Clarity | sebelum aktif | after Clarity aktif | tidak ada session | session/click terekam | Usability bisa diamati |
| Retake prevention | before review flow final | `7651dac`/after terbaru | rentan submit ulang di UI | backend menolak `409`, UI review-only | Integritas attempt lebih kuat |

## 2. Profiling dan Improvement Minimal 50%

Flow critical:
- `GET /api/learner/readings/{readingId}`
- `POST /api/learner/readings/{readingId}/quiz/start`
- `GET /api/learner/readings/{readingId}/quiz`
- `POST /api/learner/readings/{readingId}/quiz/submit`

Alasan:
- Ini flow utama user di modul Bacaan dan Kuis.
- User langsung merasakan latency saat membuka bacaan, mulai kuis, mengambil soal, dan submit.
- Submit kuis juga menjadi sumber statistik akurasi/frekuensi untuk Modul Liga.

Angka after:
- APDEX: 0.933.
- Total requests: 45.
- Target latency: 500 ms.
- Tolerating latency: 2000 ms.
- Satisfied requests: 39.
- Tolerating requests: 6.
- Frustrated/failed requests: 0.
- p50 latency: 301.22 ms.
- p95 latency: 762.53 ms.
- Failed requests: 0.
- Report: `docs/reports/apdex-summary.md` dan `docs/reports/apdex-summary.json`.

File report lokal:
| File | Isi | Status |
| --- | --- | --- |
| `docs/reports/apdex-summary.md` | Ringkasan APDEX after ke Fly.io | Updated |
| `docs/reports/apdex-summary.json` | Data mentah APDEX after | Updated |
| `docs/reports/lighthouse-bacaan-kuis-vercel-after.report.html` | Report Lighthouse after | Ada, tapi hati-hati karena redirect Vercel login |
| `docs/reports/lighthouse-bacaan-kuis-vercel-after.report.json` | Raw Data Lighthouse after | Ada, tapi hati-hati karena redirect Vercel login |

Lighthouse after:
- Report: `docs/reports/lighthouse-bacaan-kuis-vercel-after.report.html`.
- Performance: 58.
- Accessibility: 87.
- Best Practices: 92.
- SEO: 91.
- FCP: 1.6 s.
- LCP: 5.6 s.
- TBT: 790 ms.
- CLS: 0.

Profiling before dengan JFR/APDEX: APDEX 0.620, p50 650 ms, p95 1600 ms, frustrated/failed requests 2.

Profiling after dengan JFR/APDEX: ![alt text](profilingAfterAPDEX.png)

Screenshot/file report profiling: before ada di tabel; after di `docs/reports/apdex-summary.md`.

## 3. Monitoring Aplikasi dan Database

Bukti:
- Backend mengekspor `/actuator/health` dan `/actuator/prometheus`.
- Prometheus dan Grafana lokal sudah disiapkan di folder `monitoring/`.
- Dashboard Grafana `Yomu Bacaan dan Kuis Observability` sudah disiapkan.
- Database memakai PostgreSQL Supabase.

Endpoint monitoring:
- Backend health Fly.io: `https://yomu-bacaan-dan-kuis-b14-hanif.fly.dev/actuator/health`
- Backend Prometheus Fly.io: `https://yomu-bacaan-dan-kuis-b14-hanif.fly.dev/actuator/prometheus`
- Local Grafana: `http://localhost:3001`
- Local Prometheus: `http://localhost:9090`

Metrik aplikasi:
- HTTP throughput.
- HTTP latency p95.
- HTTP 5xx error rate.
- JVM memory.

Metrik database:
- HikariCP active/idle/pending connection dari backend.
- Supabase database health/connection/usage dari dashboard Supabase.

Screenshot Grafana dashboard aplikasi: TO BE CONTINUE.
Screenshot Supabase dashboard database: ![alt text](dashboardSupabase.png)

## 4. Deployment Lanjutan

Bukti:
- Backend Bacaan dan Kuis deploy ke Fly.io.
- Frontend Vercel terhubung ke backend melalui proxy.
- Workflow Fly.io/CD sudah diperbaiki agar bukan dummy workflow.
- Fly.io dikonfigurasi agar tidak mudah cold start: `auto_stop_machines = false`, `min_machines_running = 1`, memory 1GB.
- Screenshot chat yang sudah ada:
  - Fly deploy sempat gagal karena token missing/token validation error.
  - Setelah token diperbaiki, deploy Fly.io terlihat successful di PR checks.
  - Sonar/Scorecard sempat gagal lalu diperbaiki bertahap.

Konfigurasi Fly.io:
| Item | Nilai |
| --- | --- |
| App | `yomu-bacaan-dan-kuis-b14-hanif` |
| Region | `sin` |
| URL | `https://yomu-bacaan-dan-kuis-b14-hanif.fly.dev` |
| Dockerfile | `Dockerfile` |
| Internal port | `8080` |
| Force HTTPS | `true` |
| Auto stop machines | `false` |
| Auto start machines | `true` |
| Min machines running | `1` |
| Health check path | `/actuator/health` |
| Health check grace period | `360s` |
| VM memory | `1gb` |

Workflow deployment:
| File | Fungsi | Trigger |
| --- | --- | --- |
| `yomu-bacaan-dan-kuis/.github/workflows/fly-deploy.yml` | Deploy langsung ke Fly.io | `push` ke `main`, `staging`, `feat/milestone-100`, dan manual |
| `yomu-bacaan-dan-kuis/.github/workflows/cd.yml` | CD lanjutan dengan deploy, smoke test, dan rollback manual | `push` ke `staging/main`, dan `workflow_dispatch` |
| `yomu-bacaan-dan-kuis/.github/workflows/sonarqube.yml` | Test, coverage, SonarCloud analysis | `push` ke `main/staging/ci-cd`, PR ke `main/staging` |

Prosedur lanjutan:
- Deploy otomatis memakai `flyctl deploy --remote-only`.
- Setelah deploy, `cd.yml` menjalankan smoke test ke `/actuator/health` sampai status `UP`.
- Rollback manual tersedia lewat `workflow_dispatch` dengan input `action=rollback`.
- Rollback juga menjalankan smoke test setelah command rollback selesai.

Screenshot GitHub Actions deploy berhasil: ![alt text](deployAutoBerhasil.png)

Screenshot Fly.io latest release/deployment: ![alt text](flyioRelease.png) ![alt text](flyioDashboard.png)

Screenshot/log rollback berhasil: ![alt text](healthUp.png)

## 5. Software Architecture Testing

Architecture tambahan:

- Backend dipisah sebagai service Spring Boot sendiri dan diakses frontend melalui proxy.
- Endpoint internal statistik Liga dilindungi token service-to-service.
- Observability ditambahkan lewat Actuator, Prometheus, dan Grafana.
- Statistik Bacaan/Kuis disiapkan sebagai data integrasi untuk Modul Liga.

Simulasi/testing:

- APDEX/load ringan ke backend Fly.io.
- Endpoint internal tanpa token menghasilkan `401 Unauthorized`, sesuai desain.
- Backend test mencakup prevention retake, response soal aman, submit review payload, dan statistik internal.

Bukti test backend:

- Command terakhir yang berhasil: `.\gradlew.bat test jacocoTestReport jacocoTestCoverageVerification`.
- Status: `BUILD SUCCESSFUL`.
- Coverage lokal backend setelah update: instruction 98.63%, line 98.64%, branch 76.04%, method 99.06%, class 100.00%.
- SonarCloud new code coverage yang sempat terlihat: 90.4%.

Screenshot hasil APDEX/load test final: ![alt text](apdexLoadTestFinal.png)

Screenshot endpoint internal dengan token valid: ![alt text](endpointInternal.png)

Screenshot endpoint internal tanpa token `401`: ![alt.text](endpointInternalNoToken.png)