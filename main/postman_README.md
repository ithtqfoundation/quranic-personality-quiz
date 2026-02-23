# Postman Collection - HTQ Backend

This folder contains a Postman collection and an environment file to help you test the backend API locally.

## What's New (v2.1)
- **Passwordless Registration**: No password required from users - system auto-generates
- **Auto-login after register**: Users get session token immediately
- **Removed anonymous flow**: All quiz submissions require authentication
- **New field**: `date_of_birth` required during registration
- **Removed**: Anonymous endpoints, merge-anonymous route

Files:
- `postman_collection.json` - Postman Collection (v2.1) with pre-built requests
- `postman_environment.json` - (optional) environment variables example for Postman

How to import into Postman
1. Open Postman
2. Click Import → File → select `main/postman_collection.json`
3. (Optional) Import environment file `main/postman_environment.json`

Variables used in the collection
- `baseUrl` - e.g. `http://localhost:3000`
- `bearerToken` - JWT token from register/login response (access_token)
- `resultId` - Quiz result ID from Layer 1 submission

Quick test flow
1. **Register** using `Auth - Register (Start Quiz)` → copy `session.access_token` to `bearerToken`
2. **Get Layer 1 questions** using `Quiz - Layer 1: Get Extraversion Questions`
3. **Submit Layer 1** using `Quiz - Submit Layer 1` → copy `result_id` to `resultId`
4. **Get Layer 2 questions** using `Quiz - Layer 2: Get Ego+Neuro Questions`
5. **Submit Layer 2** → determines branch category (EHNH/EHNL/ELNH/ELNL)
6. **Get Layer 3 questions** using `Quiz - Layer 3: Get Branch Questions`
7. **Submit Layer 3** → calculates Juz scores (may trigger tie-breaker)
8. **If tie**: Get tie-breaker question and submit Layer 4
9. **Get results** using `Quiz - Get Results`

Notes
- All quiz endpoints now require Authorization header: `Authorization: Bearer {{bearerToken}}`
- User must register before starting quiz (no anonymous flow)
- `date_of_birth` format: `YYYY-MM-DD`

---

## API Response Documentation

### Authentication Endpoints

#### POST /api/auth/register (Start Quiz)
**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "Nama Pengguna",
  "date_of_birth": "1990-01-15",
  "photo_url": "https://example.com/photo.jpg"
}
```
> **Note**: `photo_url` is optional. No password required - system generates one automatically.

**Success Response (201):**
```json
{
  "message": "Registration successful. You can now start the quiz.",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "Nama Pengguna",
    "date_of_birth": "1990-01-15",
    "photo_url": "https://example.com/photo.jpg"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 3600
  }
}
```
> **Action**: Copy `session.access_token` to Postman variable `{{bearerToken}}`

**Error Responses:**
- **400 Bad Request:**
  ```json
  { "error": "Email, name, and date of birth are required" }
  { "error": "Invalid email format" }
  { "error": "Invalid date format. Use YYYY-MM-DD" }
  ```

---

#### POST /api/auth/login
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd!"
}
```
> **Note**: Login still exists for admin/future use cases, but users don't know their password (auto-generated during register).

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "Nama Pengguna",
    "date_of_birth": "1990-01-15",
    "photo_url": "https://storage.url/photo.jpg",
    "bio": "Bio text"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 3600
  }
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  { "error": "Email and password are required" }
  ```
- **401 Unauthorized:**
  ```json
  { "error": "Invalid credentials" }
  ```

---

#### POST /api/auth/logout
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Error Response:**
- **401 Unauthorized:**
  ```json
  { "error": "Unauthorized" }
  ```

---

### User Endpoints

#### GET /api/user/profile
**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "Nama Pengguna",
    "bio": "Bio text atau null",
    "photo_url": "https://storage.url/photo.jpg",
    "created_at": "2026-01-22T10:00:00.000Z",
    "updated_at": "2026-01-22T10:00:00.000Z"
  }
}
```

**Error Response:**
- **401 Unauthorized:**
  ```json
  { "error": "Unauthorized" }
  ```

---

#### PATCH /api/user/profile
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "Nama Baru",
  "bio": "Bio singkat"
}
```

**Success Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "Nama Baru",
    "bio": "Bio singkat",
    "photo_url": "https://storage.url/photo.jpg",
    "updated_at": "2026-01-22T11:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  { "error": "At least one field (name or bio) is required" }
  ```
- **401 Unauthorized:**
  ```json
  { "error": "Unauthorized" }
  ```

---

#### POST /api/user/upload-photo
**Headers:** `Authorization: Bearer {token}`, `Content-Type: multipart/form-data`

**Request Body (FormData):**
```
file: [binary file data]
```

**Success Response (200):**
```json
{
  "message": "Photo uploaded successfully",
  "photo_url": "https://supabase-storage-url/avatars/user-id/photo.jpg"
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  { "error": "No file uploaded" }
  { "error": "File size must be less than 5MB" }
  { "error": "Only image files are allowed" }
  ```
- **401 Unauthorized:**
  ```json
  { "error": "Unauthorized" }
  ```

---

#### POST /api/user/merge-anonymous
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "anonUserId": "anon_12345678-1234-1234-1234-123456789abc"
}
```

**Success Response (200):**
```json
{
  "message": "Anonymous results successfully merged",
  "mergedCount": 3
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  { "error": "Anonymous user ID is required" }
  ```
- **401 Unauthorized:**
  ```json
  { "error": "Unauthorized - must be logged in" }
  ```

---

### Quiz Endpoints

#### GET /api/quiz/questions?subtest=1
**Query Parameters:**
- `subtest` (required): `1` | `2` | `3`

**Success Response (200):**
```json
{
  "questions": [
    {
      "id": 1,
      "question_text": "Saya",
      "category": "E",
      "subtest": 1,
      "order_number": 1,
      "options": [
        {
          "id": 1,
          "option_text": "Tidak banyak bicara dalam suatu acara",
          "option_value": "I",
          "points": 1,
          "order_number": 1
        },
        {
          "id": 2,
          "option_text": "Berbicara dengan banyak orang di suatu acara",
          "option_value": "E",
          "points": 1,
          "order_number": 2
        }
      ]
    }
  ],
  "total": 11
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  { "error": "Subtest parameter is required (1, 2, or 3)" }
  ```

---

#### POST /api/quiz/questions/adaptive
**Request Body:**
```json
{
  "eDimension": "E-H",
  "ego": "EGO-H",
  "neo": "NEO-L"
}
```

**Success Response (200):**
```json
{
  "questions": [
    {
      "id": 50,
      "question_text": "Pilihlah mana yang paling sesuai dengan diri Anda",
      "category": "TRAIT",
      "subtest": 3,
      "order_number": 1,
      "adaptive_condition": "E-H",
      "trait_config": "10|19",
      "options": [
        {
          "id": 100,
          "option_text": "Realistis",
          "option_value": "TRAIT_10",
          "points": 1,
          "order_number": 1
        },
        {
          "id": 101,
          "option_text": "Idealis",
          "option_value": "TRAIT_19",
          "points": 1,
          "order_number": 2
        }
      ]
    }
  ],
  "total": 45
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  { "error": "eDimension, ego, and neo are required" }
  ```

---

#### POST /api/quiz/submit (Authenticated)
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "answers": {
    "1": "2",
    "2": "4",
    "3": "5"
  }
}
```

**Success Response (201):**
```json
{
  "message": "Quiz submitted successfully",
  "result": {
    "id": "result-uuid",
    "personality_type": "EHNL",
    "juz_result": 15,
    "title": "Al-Hijr - Penjaga Kehormatan",
    "scores": {
      "E": 8,
      "I": 3,
      "EGO-H": 4,
      "NEO-L": 3,
      "TRAIT_10": 5,
      "TRAIT_19": 3
    },
    "is_anonymous": false
  }
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  { "error": "Invalid answers format" }
  ```
- **401 Unauthorized:**
  ```json
  { "error": "Either authentication or anonymous user ID is required" }
  ```

---

#### POST /api/quiz/submit (Anonymous)
**Request Body:**
```json
{
  "answers": {
    "1": "2",
    "2": "4"
  },
  "anonUserId": "anon_12345678-1234-1234-1234-123456789abc"
}
```

**Success Response (201):**
```json
{
  "message": "Quiz submitted successfully",
  "result": {
    "id": "result-uuid",
    "personality_type": "IHSL",
    "juz_result": 10,
    "title": "Yunus - Pembawa Kebenaran",
    "scores": {
      "E": 2,
      "I": 9
    },
    "is_anonymous": true
  }
}
```

---

#### GET /api/quiz/results?resultId={uuid}
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `resultId` (required): UUID of quiz result

**Success Response (200):**
```json
{
  "result": {
    "id": "result-uuid",
    "personality_type": "EHNL",
    "juz_result": 15,
    "title": "Al-Hijr - Penjaga Kehormatan",
    "description": "Deskripsi lengkap personality type",
    "strengths": ["Empati tinggi", "Bijaksana", "Pendengar baik"],
    "challenges": ["Terlalu mengutamakan orang lain", "Sulit mengatakan tidak"],
    "advice": "Jaga keseimbangan antara memberi dan menerima",
    "completed_at": "2026-01-22T10:30:00.000Z",
    "answers": [
      {
        "question_id": 1,
        "question_text": "Saya",
        "option_id": 2,
        "option_text": "Berbicara dengan banyak orang",
        "option_value": "E"
      }
    ]
  }
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  { "error": "Result ID is required" }
  ```
- **401 Unauthorized:**
  ```json
  { "error": "Unauthorized" }
  ```
- **404 Not Found:**
  ```json
  { "error": "Result not found" }
  ```

---

#### GET /api/quiz/results/anonymous?anonUserId={id}
**Query Parameters:**
- `anonUserId` (required): Anonymous user ID

**Success Response (200):**
```json
{
  "results": [
    {
      "id": "result-uuid",
      "personality_type": "IHSL",
      "juz_result": 10,
      "title": "Yunus - Pembawa Kebenaran",
      "description": "Deskripsi lengkap",
      "strengths": ["Disiplin", "Konsisten", "Bertanggung jawab"],
      "challenges": ["Kaku", "Sulit beradaptasi"],
      "advice": "Belajar fleksibilitas tanpa kehilangan prinsip",
      "completed_at": "2026-01-22T09:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  { "error": "Anonymous user ID is required" }
  ```

---

### 🏥 Health Check

#### GET /api/health
**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-01-22T10:00:00.000Z",
  "environment": "development"
}
```

---

## Common Error Format

All error responses follow this format:

```json
{
  "error": "Error message here",
  "details": "Optional additional details"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created (for POST requests that create resources)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid auth token)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error
