# Yomu Learning Platform

Yomu adalah platform pembelajaran berbasis web untuk membaca materi, mengerjakan kuis, berdiskusi, melihat pencapaian, dan berinteraksi dengan sistem liga. Repository ini berisi frontend Next.js dan backend Spring Boot untuk modul Bacaan dan Kuis.

Fokus kontribusi modul Bacaan dan Kuis ada pada pengelolaan bacaan, quiz attempt learner, review hasil kuis, statistik akurasi, dan data yang dapat dikonsumsi modul lain.

## Struktur Repo

```text
group/
├─ src/
│  ├─ app/                    route Next.js
│  └─ components/modules/     UI per modul
├─ yomu-bacaan-dan-kuis/      backend Spring Boot Bacaan dan Kuis
├─ docs/                      catatan arsitektur dan performance evidence
├─ monitoring/                Prometheus dan Grafana lokal
├─ public/                    asset frontend
└─ README.md
```

## Modul Utama

- **Bacaan dan Kuis**  
  Mengelola kategori, bacaan, soal kuis, pengerjaan kuis learner, mode review setelah submit, dan statistik akurasi.

- **Diskusi Forum**  
  Menggunakan service forum melalui REST API untuk komentar dan reaksi.

- **Achievement dan Liga**  
  Berperan sebagai modul pendukung pembelajaran. Bacaan dan Kuis menyediakan statistik yang dapat digunakan untuk kebutuhan liga.

- **Authentication**  
  Frontend memiliki halaman login/register. Backend Bacaan dan Kuis sendiri sudah menyiapkan proteksi role `ADMIN`, `LEARNER`, dan endpoint internal service-to-service.

## Tech Stack

| Area | Stack |
| --- | --- |
| Frontend | Next.js, Tailwind CSS |
| Backend Bacaan dan Kuis | Spring Boot, Java 21 |
| Database | PostgreSQL/Supabase |
| Quality | ESLint, JaCoCo, SonarCloud |
| Observability | Actuator, Prometheus, Grafana |
| Performance Evidence | APDEX, Lighthouse, Java Flight Recorder, Clarity |
| Deployment | Vercel untuk frontend, Fly.io untuk backend |

## Design dan Implementasi

Frontend dibagi per modul agar UI dan logic tiap domain tidak bercampur. Modul Bacaan dan Kuis menggunakan data backend melalui proxy API Next.js, sehingga konfigurasi backend tetap berada di sisi server.

Backend Bacaan dan Kuis memakai layered architecture:

- Controller untuk boundary HTTP.
- Service untuk business logic.
- Repository untuk akses database.
- DTO untuk request dan response.
- Entity untuk representasi persistence.

Struktur ini menjaga prinsip SOLID secara praktis: controller tidak memegang query database, service tidak terikat detail HTTP, dan repository tetap fokus pada persistence. Dependency injection dipakai lewat constructor agar dependency eksplisit dan mudah diuji.

## Integrasi REST API

Audit kode menunjukkan integrasi antar modul saat ini memakai REST API. Pilihan ini sesuai dengan kebutuhan project karena alur utamanya masih request-response: mengambil daftar bacaan, memulai kuis, mengambil soal, submit jawaban, membaca statistik, serta mengambil komentar forum.

Contoh integrasi Bacaan dan Kuis:

```text
GET  /api/learner/readings/{readingId}
POST /api/learner/readings/{readingId}/quiz/start
GET  /api/learner/readings/{readingId}/quiz
POST /api/learner/readings/{readingId}/quiz/submit
GET  /api/internal/league/statistics/students/{studentId}
```

Forum Diskusi dikonsumsi melalui proxy frontend:

```text
/api/diskusi-forum/comments
/api/diskusi-forum/reactions
```

## Security

Backend Bacaan dan Kuis menggunakan Spring Security Resource Server.

- Endpoint admin membutuhkan role `ADMIN`.
- Endpoint learner membutuhkan role `LEARNER`.
- Student identity dibaca dari claim JWT.
- Endpoint internal dilindungi token service-to-service.
- CORS dikontrol dari environment.
- Credential database dan token deployment tidak disimpan di repository.

Untuk development lokal, backend menyediakan mode dev auth, tetapi mode ini bukan untuk production.

## Performance dan Monitoring

Modul Bacaan dan Kuis sudah disiapkan untuk observability dan performance evidence:

- Actuator health check untuk deploy dan monitoring.
- Prometheus metrics untuk latency, throughput, JVM, dan koneksi database.
- Grafana dashboard lokal untuk membaca metrik aplikasi.
- APDEX untuk mengukur respons flow learner.
- Lighthouse untuk halaman frontend.
- Clarity untuk usability evidence.

Catatan lengkap performance evidence ada di `docs/PERFORMANCE_FINAL_GUIDE.md`.

## Deployment

Frontend dideploy ke Vercel. Backend Bacaan dan Kuis dideploy ke Fly.io:

```text
https://yomu-bacaan-dan-kuis-b14-hanif.fly.dev
```

Backend CD memakai GitHub Actions dan Fly.io. Workflow deployment melakukan deploy, health check, dan menyediakan jalur rollback manual sebagai bukti prosedur deployment lanjutan.

## Dokumentasi Tambahan

- `docs/VPIC_ARCHITECTURE.md` untuk catatan arsitektur.
- `docs/PERFORMANCE_FINAL_GUIDE.md` untuk bukti final performance, monitoring, APDEX, Lighthouse, dan Clarity.
- `yomu-bacaan-dan-kuis/README.md` untuk ringkasan backend Bacaan dan Kuis.
