# Performance, APDEX, Lighthouse, Clarity, dan Monitoring Final

Panduan ini dibuat untuk memenuhi target skala 4 pada `Penilaian.md`, khususnya untuk bagian **Bacaan dan Kuis**.

## Scope Individu

Scope bukti individu:

- Service backend `yomu-bacaan-dan-kuis`.
- Halaman frontend `/bacaan-kuis`.
- Flow learner: membuka bacaan, mulai kuis, mengambil soal, dan submit jawaban.
- Database PostgreSQL/Supabase yang dipakai service Bacaan dan Kuis.

## Tech Stack dan Deployment Context

| Area | Stack Saat Ini | Catatan Bukti Final |
| --- | --- | --- |
| Frontend | Next.js, Tailwind CSS | Deploy di Vercel; Lighthouse dan Clarity diarahkan ke halaman `/bacaan-kuis`. |
| Backend | Spring Boot | Backend Bacaan dan Kuis disiapkan untuk Fly.io agar tersedia HTTPS endpoint yang bisa dipakai Vercel. |
| Database | PostgreSQL di Supabase | Monitoring database bisa memakai Supabase dashboard dan metrics HikariCP dari backend. |
| Code Analysis | SonarCloud, JaCoCo, ESLint | SonarCloud/JaCoCo untuk backend, ESLint untuk frontend. |
| Performance | k6 APDEX, Lighthouse, Java Flight Recorder | Bukti berupa report markdown/json/html dan hasil before-after commit. |
| Monitoring | Spring Boot Actuator, Prometheus, Grafana, Supabase dashboard | Bukti berupa dashboard Grafana backend dan dashboard Supabase database. |
| Deployment | Fly.io backend, Vercel frontend | Untuk skala 4 deployment, bukti perlu menunjukkan deploy otomatis dan prosedur lanjutan seperti rollback release. |

## 1. Before-After Commit

Gunakan dua titik ukur:

- **Before commit**: commit sebelum optimasi.
- **After commit**: commit setelah optimasi/instrumentasi.

Format bukti yang disarankan di `Presentasi.md`:

| Metrik | Before | After | Improvement | Bukti |
| --- | --- | --- | --- | --- |
| APDEX |  |  |  | `docs/reports/apdex-summary.md` |
| Lighthouse Performance |  |  |  | `docs/reports/lighthouse-bacaan-kuis-after.report.html` |
| Profiling critical flow |  |  |  | JFR/k6/Grafana |
| Clarity usability |  |  |  | Dashboard Clarity |

## 2. Backend Monitoring

Backend sudah mengekspor Prometheus metrics melalui Spring Boot Actuator.

Endpoint:

```text
http://localhost:8080/actuator/health
http://localhost:8080/actuator/prometheus
```

Jalankan backend:

```powershell
cd C:\adpro\IdeaProjects\group\yomu-bacaan-dan-kuis
$env:SECURITY_DEV_AUTH_ENABLED="true"
$env:INTERNAL_SERVICE_TOKEN="local-internal-token"
.\gradlew.bat bootRun
```

Jalankan Prometheus dan Grafana:

```powershell
cd C:\adpro\IdeaProjects\group
docker compose -f monitoring/docker-compose.yml up
```

Buka:

```text
Prometheus: http://localhost:9090
Grafana: http://localhost:3001
User/pass: admin/admin
Dashboard: Yomu / Yomu Bacaan dan Kuis Observability
```

Metrik yang perlu ditunjukkan:

- HTTP throughput Bacaan/Kuis.
- HTTP latency p95.
- HTTP 5xx error rate.
- JVM memory.
- Database connection pool active/idle/pending.
- Database connection timeout/error.

Jika backend sudah deploy di Fly.io, Prometheus lokal bisa diarahkan ke HTTPS Fly.io dengan mengganti target scrape atau memakai endpoint langsung:

```text
https://yomu-bacaan-dan-kuis.fly.dev/actuator/prometheus
```

Untuk Vercel frontend, set env:

```text
BACKEND_API_URL=https://yomu-bacaan-dan-kuis.fly.dev
NEXT_PUBLIC_API_BASE_URL=/api/backend
```

## 3. APDEX dengan k6

APDEX dihitung dari latency request:

- Satisfied: `duration <= APDEX_TARGET_MS`.
- Tolerating: `APDEX_TARGET_MS < duration <= 4 * APDEX_TARGET_MS`.
- Frustrated: `duration > 4 * APDEX_TARGET_MS` atau status `5xx`.

Jalankan:

```powershell
cd C:\adpro\IdeaProjects\group
$env:BACAAN_KUIS_BASE_URL="http://localhost:8080"
$env:READING_ID="1"
$env:APDEX_TARGET_MS="500"
$env:K6_VUS="10"
$env:K6_DURATION="1m"
k6 run docs/k6-bacaan-kuis-apdex.js
```

Output bukti:

```text
docs/reports/apdex-summary.md
docs/reports/apdex-summary.json
```

Jika `k6` tidak tersedia di Windows, gunakan runner Node.js cadangan:

```powershell
cd C:\adpro\IdeaProjects\group
$env:BACAAN_KUIS_BASE_URL="https://yomu-bacaan-dan-kuis-b14-hanif.fly.dev"
$env:READING_ID="16"
$env:APDEX_TARGET_MS="500"
$env:APDEX_VUS="10"
$env:APDEX_ITERATIONS="5"
node scripts/run-apdex-bacaan-kuis.mjs
```

Runner ini menghasilkan file bukti yang sama:

```text
docs/reports/apdex-summary.md
docs/reports/apdex-summary.json
```

## 4. Lighthouse

Jalankan frontend:

```powershell
cd C:\adpro\IdeaProjects\group
npm run dev
```

Jalankan Lighthouse:

```powershell
cd C:\adpro\IdeaProjects\group
.\scripts\run-lighthouse-bacaan-kuis.ps1 -Url "http://localhost:3000/bacaan-kuis" -Name "after"
```

Output bukti:

```text
docs/reports/lighthouse-bacaan-kuis-after.report.html
docs/reports/lighthouse-bacaan-kuis-after.report.json
```

Untuk before-after, jalankan command yang sama pada commit before dan after dengan nama berbeda:

```powershell
.\scripts\run-lighthouse-bacaan-kuis.ps1 -Name "before"
.\scripts\run-lighthouse-bacaan-kuis.ps1 -Name "after"
```

## 5. Clarity Usability Testing

Frontend sudah mendukung Microsoft Clarity melalui environment variable:

```properties
NEXT_PUBLIC_CLARITY_PROJECT_ID=<clarity-project-id>
```

Langkah bukti:

1. Buat project di Microsoft Clarity.
2. Isi `NEXT_PUBLIC_CLARITY_PROJECT_ID`.
3. Deploy frontend atau jalankan environment yang bisa diakses browser.
4. Buka `/bacaan-kuis`.
5. Lakukan flow user: buka bacaan, mulai kuis, jawab soal, submit.
6. Ambil bukti dari dashboard Clarity:
   - session recording,
   - rage/dead click jika ada,
   - scroll/click heatmap,
   - insight usability.

Catatan: Clarity paling meyakinkan jika memakai URL deploy, bukan hanya localhost.

## 6. Profiling Critical Flow

Flow critical untuk bagian Bacaan dan Kuis:

- `GET /api/learner/readings/{readingId}`
- `POST /api/learner/readings/{readingId}/quiz/start`
- `GET /api/learner/readings/{readingId}/quiz`
- `POST /api/learner/readings/{readingId}/quiz/submit`

Profiling backend dengan Java Flight Recorder:

```powershell
cd C:\adpro\IdeaProjects\group\yomu-bacaan-dan-kuis
$env:JAVA_TOOL_OPTIONS="-XX:StartFlightRecording=filename=build/profile/yomu-bacaan-kuis-after.jfr,duration=120s,settings=profile"
$env:SECURITY_DEV_AUTH_ENABLED="true"
$env:INTERNAL_SERVICE_TOKEN="local-internal-token"
.\gradlew.bat bootRun
```

Saat backend berjalan, jalankan k6/APDEX atau lakukan flow manual dari frontend.

Bukti yang perlu dicatat:

- hot method,
- latency endpoint,
- query/database wait time,
- memory allocation,
- perubahan kode optimasi,
- improvement minimal 50% jika ada optimasi performa.

## 7. Catatan untuk Presentasi

Narasi yang aman:

> Untuk kontribusi individu, saya fokus pada observability dan performance evidence modul Bacaan dan Kuis. Backend mengekspor Prometheus metrics lewat Actuator, Grafana menampilkan latency endpoint, throughput, error rate, JVM memory, dan koneksi database. APDEX dihitung menggunakan k6 dari flow learner. Lighthouse mengukur performa halaman `/bacaan-kuis`. Clarity dipakai untuk usability testing setelah frontend diberi `NEXT_PUBLIC_CLARITY_PROJECT_ID`.
