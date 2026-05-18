# Yomu Learning Platform

Yomu adalah frontend Next.js untuk platform pembelajaran berbasis microservices. Fokus implementasi saat ini ada pada modul **Bacaan dan Kuis**, dengan integrasi ke backend Spring Boot `yomu-bacaan-dan-kuis` dan kontrak integrasi lintas service di [API_CONTRACT.md](API_CONTRACT.md).

Dokumentasi VPIC yang lebih lengkap, termasuk component diagram, code diagram, design pattern, status gRPC/RabbitMQ, integrasi, dan profiling, tersedia di [docs/VPIC_ARCHITECTURE.md](docs/VPIC_ARCHITECTURE.md).

## Struktur Repo

```text
group/
├─ src/                              # Frontend Next.js App Router
│  ├─ app/                           # Route pages
│  └─ components/modules/            # Modul UI per domain
├─ yomu-bacaan-dan-kuis/             # Backend Spring Boot modul Bacaan dan Kuis
├─ API_CONTRACT.md                   # Kontrak REST antar modul/service
├─ docs/                             # Dokumentasi VPIC dan arsitektur
├─ package.json                      # Script frontend
└─ README.md
```

## Modul Utama

- **Frontend Next.js**: halaman `/bacaan-kuis` memakai `src/components/modules/BacaanKuisModule/index.tsx`.
- **Backend Bacaan dan Kuis**: Spring Boot, Java 21, JPA, PostgreSQL/Supabase, H2 untuk test.
- **Diskusi Forum Service**: dikonsumsi frontend melalui REST endpoint komentar dan reaksi.
- **Internal statistik/liga**: backend Bacaan dan Kuis menyediakan endpoint statistik `GET /api/internal/league/statistics/students/{studentId}` untuk kebutuhan modul lain.

## Tech Stack Ringkas

| Area | Stack |
| --- | --- |
| Frontend | Next.js, Tailwind CSS |
| Backend | Spring Boot |
| Database | PostgreSQL di Supabase |
| Code Analysis | SonarCloud, JaCoCo coverage, ESLint Next.js |
| Performance | k6/APDEX, Lighthouse, Java Flight Recorder |
| Monitoring | Spring Boot Actuator, Prometheus, Grafana, Supabase dashboard |
| Deployment | Fly.io backend, Vercel frontend |

Catatan: backend disiapkan ke Fly.io agar Vercel dapat mengakses API melalui HTTPS.

## Menjalankan Frontend

```powershell
cd C:\adpro\IdeaProjects\group
npm install
npm run dev
```

Frontend berjalan di:

```text
http://localhost:3000
```

Halaman Bacaan dan Kuis:

```text
http://localhost:3000/bacaan-kuis
```

Environment frontend:

```properties
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Jika tidak diset, modul Bacaan dan Kuis memakai fallback `http://localhost:8080`.

## Menjalankan Backend Bacaan dan Kuis

```powershell
cd C:\adpro\IdeaProjects\group\yomu-bacaan-dan-kuis
.\gradlew.bat bootRun
```

Backend berjalan di:

```text
http://localhost:8080
```

Contoh `.env` backend:

```properties
DB_URL=jdbc:postgresql://localhost:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_SCHEMA=learning_mod
PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Jika diarahkan ke Supabase PostgreSQL, data bacaan, kategori, kuis, dan attempt berasal dari Supabase melalui backend.

## Testing dan Coverage

Frontend:

```powershell
npm run lint
npm run build
```

Backend:

```powershell
cd C:\adpro\IdeaProjects\group\yomu-bacaan-dan-kuis
.\gradlew.bat test
```

Backend test memakai H2 in-memory dari `src/test/resources/application.properties`, sehingga tidak membutuhkan koneksi Supabase.

Konfigurasi JaCoCo ada di `yomu-bacaan-dan-kuis/build.gradle.kts`:

- global coverage minimum: `0.80`
- class line coverage minimum: `0.70`
- class branch coverage minimum: `0.70`
- package `config`, `dto`, dan `model` dikecualikan dari rule class-level.

## Integrasi

Frontend Bacaan dan Kuis memakai REST endpoint backend:

- `GET /api/admin/categories`
- `GET /api/admin/readings`
- `GET /api/admin/quizzes`
- `GET /api/learner/readings/{readingId}`
- `POST /api/learner/readings/{readingId}/quiz/start`
- `GET /api/learner/readings/{readingId}/quiz`
- `POST /api/learner/readings/{readingId}/quiz/submit`

Endpoint learner membutuhkan header:

```text
X-Student-Id: <student-id>
```

Diskusi Forum Service saat ini dikonsumsi langsung dari:

```text
http://18.207.58.155:8085/api/comments
http://18.207.58.155:8085/api/reactions
```

Kontrak lengkap ada di [API_CONTRACT.md](API_CONTRACT.md).

## Design Pattern

Pattern yang benar-benar ada di kode:

- **Layered Architecture / MVC**: Controller menerima request, Service memegang business logic, Repository mengakses database.
- **Repository Pattern**: Spring Data JPA repository seperti `CategoryRepository`, `ReadingRepository`, `QuizRepository`, dan `QuizAttemptRepository`.
- **DTO Pattern**: request/response dipisahkan dari entity JPA, misalnya `ReadingRequest`, `ReadingResponse`, `LearnerQuizQuestionResponse`.
- **Dependency Injection**: constructor injection pada controller dan service.
- **Centralized Exception Handling**: `RestExceptionHandler` menangani validation error dan `ResponseStatusException`.

Detail kelas dan diagram ada di [docs/VPIC_ARCHITECTURE.md](docs/VPIC_ARCHITECTURE.md).

## Status gRPC/RabbitMQ

Audit kode menunjukkan belum ada dependency atau implementasi gRPC/RabbitMQ. Integrasi saat ini memakai REST API. Keputusan ini aman untuk scope sekarang karena frontend dan service lain membutuhkan operasi request-response sinkron seperti mengambil bacaan, mengambil soal, submit kuis, dan membaca statistik.

Jika tugas mewajibkan message broker, kandidat paling realistis adalah RabbitMQ event `quiz.completed` yang dipublish setelah submit kuis berhasil. Rekomendasi desainnya ada di [docs/VPIC_ARCHITECTURE.md](docs/VPIC_ARCHITECTURE.md).

## Security

Status security modul Bacaan dan Kuis sudah memakai Spring Security OAuth2 Resource Server JWT:

- `/api/admin/**` membutuhkan Bearer JWT role `ADMIN`.
- `/api/learner/**` membutuhkan Bearer JWT role `LEARNER`; student ID dibaca dari claim JWT.
- `/api/internal/**` membutuhkan `X-Internal-Service-Token`.
- endpoint lain ditutup dengan `denyAll`.
- credential database memakai environment variable dan `.env` sudah di-ignore.
- CORS dibatasi melalui `CORS_ALLOWED_ORIGINS`.
- audit log sederhana tersedia untuk operasi admin dan submit quiz.

Untuk development lokal tanpa auth service, backend menyediakan `SECURITY_DEV_AUTH_ENABLED=true`; mode ini tidak boleh dipakai di production. Rate limiting, TLS termination, WAF, dan mTLS/gateway policy tetap menjadi tanggung jawab API Gateway/deployment layer. Detail lengkap ada di [docs/VPIC_ARCHITECTURE.md](docs/VPIC_ARCHITECTURE.md#9-security).

## Profiling

Profiling performa belum memakai tool eksternal permanen di repo. Dokumentasi VPIC menyediakan cara reproducible menggunakan Java Flight Recorder dan opsi Spring Boot Actuator/JMeter/k6 jika dependency atau tool tersedia.

Bedakan:

- **coverage testing**: dijalankan oleh Gradle + JaCoCo untuk mengukur cakupan test.
- **performance profiling**: mengukur latency, throughput, CPU, memory, dan bottleneck runtime.

## Performance dan Monitoring Final

Panduan bukti final untuk APDEX, Lighthouse, Clarity, profiling, dan monitoring modul Bacaan dan Kuis ada di [docs/PERFORMANCE_FINAL_GUIDE.md](docs/PERFORMANCE_FINAL_GUIDE.md).

Yang sudah disiapkan:

- Spring Boot Actuator + Prometheus metrics di backend Bacaan dan Kuis.
- Docker Compose Prometheus/Grafana di `monitoring/`.
- Dashboard Grafana `Yomu Bacaan dan Kuis Observability`.
- Script k6 APDEX di `docs/k6-bacaan-kuis-apdex.js`.
- Runner Lighthouse di `scripts/run-lighthouse-bacaan-kuis.ps1`.
- Hook Microsoft Clarity via `NEXT_PUBLIC_CLARITY_PROJECT_ID`.

## Catatan Implementasi Frontend

`BacaanKuisModule` sudah menggunakan data backend, bukan dummy data hardcoded. Yang masih hardcoded hanya teks UI dan gamification preview seperti XP/level. Data kategori, bacaan, kuis, dan submit attempt berasal dari backend.
