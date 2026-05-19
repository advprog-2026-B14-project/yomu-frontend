# API Contract — Yomu Learning Platform

Versi: 1.0.0 | Tanggal: 2026-05-08

---

## Bacaan & Kuis Service

Base URL: http://localhost:8080
Auth:
- Admin: Bearer JWT dengan role ADMIN untuk semua endpoint /api/admin/*
- Learner: Bearer JWT dengan role LEARNER untuk semua endpoint /api/learner/*; studentId diambil dari claim JWT student_id (atau claim yang dikonfigurasi backend), fallback ke sub
- Internal: Header X-Internal-Service-Token wajib untuk semua endpoint /api/internal/*
- Development lokal: backend dapat mengaktifkan SECURITY_DEV_AUTH_ENABLED=true agar header X-Student-Id tetap didukung untuk flow learner lokal

---
Schemas

Category
- id: integer
- name: string
- createdAt: string (ISO-8601 datetime)

Reading
- id: integer
- title: string
- content: string
- categoryId: integer
- createdAt: string (ISO-8601 datetime)

Quiz
- id: integer
- readingId: integer
- question: string
- optionA: string
- optionB: string
- optionC: string
- optionD: string
- correctAnswer: string (A | B | C | D)
- createdAt: string (ISO-8601 datetime)

LearnerReading
- id: integer
- title: string
- content: string
- categoryId: integer
- isLocked: boolean

LearnerQuizQuestion
- question: string
- optionA: string
- optionB: string
- optionC: string
- optionD: string
Note: correctAnswer tidak dikembalikan ke learner

LearnerSubmitQuizResult
- score: integer (0-100)

LearningStatistics
- studentId: string
- completedQuizCount: integer
- totalCorrectAnswers: integer
- totalAnsweredQuestions: integer
- accuracyRate: number (0.0-1.0)
- accuracyPercentage: number (0.0-100.0)

CategoryRequest (request body)
- name: string (required)

ReadingRequest (request body)
- title: string (required)
- content: string (required)
- categoryId: integer (required)

QuizRequest (request body)
- readingId: integer (required)
- question: string (required)
- optionA: string (required)
- optionB: string (required)
- optionC: string (required)
- optionD: string (required)
- correctAnswer: string (A | B | C | D, required)

SubmitQuizRequest (request body)
- answers: object (required), key = quiz ID (integer), value = jawaban (A | B | C | D)

ErrorResponse
- message: string
- status: integer

ValidationErrorResponse
- message: "Validation failed"
- errors: object, key = nama field, value = pesan error

---

Endpoints

GET /api/admin/categories — Ambil semua kategori
- 200: Category[]

GET /api/admin/categories/{id} — Ambil satu kategori
- Path param: id (integer)
- 200: Category
- 404: ErrorResponse

POST /api/admin/categories — Buat kategori baru
- Request: CategoryRequest
- 200: Category
- 400: ValidationErrorResponse

PUT /api/admin/categories/{id} — Update kategori
- Path param: id (integer)
- Request: CategoryRequest
- 200: Category
- 400: ValidationErrorResponse
- 404: ErrorResponse

DELETE /api/admin/categories/{id} — Hapus kategori
- Path param: id (integer)
- 204: no content
- 404: ErrorResponse

GET /api/admin/readings — Ambil semua bacaan
- 200: Reading[]

GET /api/admin/readings/{id} — Ambil satu bacaan
- Path param: id (integer)
- 200: Reading
- 404: ErrorResponse

POST /api/admin/readings — Buat bacaan baru
- Request: ReadingRequest
- 200: Reading
- 400: ValidationErrorResponse

PUT /api/admin/readings/{id} — Update bacaan
- Path param: id (integer)
- Request: ReadingRequest
- 200: Reading
- 400: ValidationErrorResponse
- 404: ErrorResponse

DELETE /api/admin/readings/{id} — Hapus bacaan
- Path param: id (integer)
- 204: no content
- 404: ErrorResponse

GET /api/admin/quizzes — Ambil semua soal kuis
- 200: Quiz[]

GET /api/admin/quizzes/{id} — Ambil satu soal kuis
- Path param: id (integer)
- 200: Quiz
- 404: ErrorResponse

POST /api/admin/quizzes — Buat soal kuis baru
- Request: QuizRequest
- 200: Quiz
- 400: ValidationErrorResponse

PUT /api/admin/quizzes/{id} — Update soal kuis
- Path param: id (integer)
- Request: QuizRequest
- 200: Quiz
- 400: ValidationErrorResponse
- 404: ErrorResponse

DELETE /api/admin/quizzes/{id} — Hapus soal kuis
- Path param: id (integer)
- 204: no content
- 404: ErrorResponse

GET /api/learner/readings/{readingId} — Ambil konten bacaan untuk learner
- Auth: Bearer JWT role LEARNER
- Path param: readingId (integer)
- 200: LearnerReading
- 404: ErrorResponse

POST /api/learner/readings/{readingId}/quiz/start — Mulai sesi kuis
- Auth: Bearer JWT role LEARNER
- Path param: readingId (integer)
- 200: no content
- 409: ErrorResponse (kuis sudah pernah dikerjakan)

GET /api/learner/readings/{readingId}/quiz — Ambil soal kuis tanpa jawaban benar
- Auth: Bearer JWT role LEARNER
- Path param: readingId (integer)
- 200: LearnerQuizQuestion[]
- 404: ErrorResponse

POST /api/learner/readings/{readingId}/quiz/submit — Submit jawaban kuis
- Auth: Bearer JWT role LEARNER
- Path param: readingId (integer)
- Request: SubmitQuizRequest
- 200: LearnerSubmitQuizResult
- 409: ErrorResponse (kuis belum dimulai atau sudah di-submit)

GET /api/internal/league/statistics/students/{studentId} — Statistik belajar mahasiswa (antar-layanan)
- Header: X-Internal-Service-Token (string, required)
- Path param: studentId (string)
- 200: LearningStatistics
- 404: ErrorResponse

---
