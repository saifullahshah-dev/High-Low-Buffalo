# Backend Development Plan — High-Low-Buffalo

## 1️⃣ Executive Summary
- **Goal:** Build a robust FastAPI backend to support the "High-Low-Buffalo" reflection app.
- **Current State:** Basic Auth & User structure exists; Core "Reflection" logic is missing.
- **Constraints:**
  - FastAPI (Python 3.13)
  - MongoDB Atlas (Motor, Pydantic v2)
  - No Docker
  - Single branch `main`
  - Manual verification after every task
- **Strategy:** 3 Sprints (Setup/Fixes → Reflections CRUD → Social/Settings).

---

## 2️⃣ In-Scope & Success Criteria
- **In-Scope Features:**
  - User Authentication (Signup, Login, Logout)
  - Reflections (Create, Read History, Update, Delete)
  - Reflection Attributes: High, Low, Buffalo, SharedWith
  - User Settings (Managing Friends/Herds for sharing context)
- **Success Criteria:**
  - Frontend `api.ts` connects successfully to all endpoints
  - User can complete the daily reflection flow end-to-end
  - History page loads real data from MongoDB

---

## 3️⃣ API Design
**Base Path:** `/api/v1`

### Authentication (Existing/Verify)
- `POST /auth/signup` — Register user
- `POST /auth/login` — Get JWT
- `POST /auth/logout` — Clear session (client-side focus)
- `GET /users/me` — Get current user details

### Reflections (New)
- `POST /reflections` — Create new entry
- `GET /reflections` — List user's reflections
- `PUT /reflections/{id}` — Update content or "flag for follow-up"
- `DELETE /reflections/{id}` — Remove entry

### User Settings (New)
- `PUT /users/me/settings` — Update friends/herds lists

---

## 4️⃣ Data Model (MongoDB Atlas)

### `users` Collection
```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "hashed_password": "...",
  "full_name": "Jane Doe",
  "settings": {
    "friends": ["Friend Name"],
    "herds": [{"id": "1", "name": "Family", "members": []}]
  }
}
```

### `reflections` Collection
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "high": "Got a promotion",
  "low": "Stuck in traffic",
  "buffalo": "Saw a neon car",
  "shared_with": ["self", "Family"],
  "curiosity_reactions": {},
  "is_flagged": false,
  "created_at": "2025-12-12T10:00:00Z"
}
```

---

## 5️⃣ Frontend Audit & Feature Map

| Component | Backend Need | Status |
|-----------|--------------|--------|
| `ReflectionForm.tsx` | `POST /reflections` | 🔴 Missing |
| `History.tsx` | `GET /reflections` | 🔴 Missing |
| `EditReflectionDialog.tsx` | `PUT /reflections/{id}` | 🔴 Missing |
| `Layout.tsx` (Logout) | `POST /auth/logout` | 🟡 Partially Implemented |
| `ReflectionForm.tsx` (Select) | `GET /users/me` (for settings) | 🟡 Needs update |

---

## 6️⃣ Configuration & ENV Vars
- `APP_ENV`: development
- `PORT`: 8000
- `MONGODB_URI`: *[User Provided]*
- `JWT_SECRET`: *[User Provided]*
- `JWT_EXPIRES_IN`: 604800 (7 days)
- `CORS_ORIGINS`: `http://localhost:5173,http://localhost:8080`

---

## 7️⃣ Testing Strategy
- **Manual UI Testing:** All validations performed via the React frontend.
- **Process:**
  1. Implement Backend Task.
  2. Perform "Manual Test Step" (e.g., Submit Form).
  3. Verify Data in MongoDB (optional) or UI Reflection.
  4. Commit & Push.

---

## 🔟 Dynamic Sprint Plan

### 🧱 S0 – Health & Environment Fixes
**Objectives:** Ensure robust foundation before adding features.
- [ ] **Add Health Check:** Create `GET /healthz` that explicitly PINGS MongoDB.
  - *Test:* Visit `/healthz` -> Expect `{"status": "ok", "db": "connected"}`.
- [ ] **Verify Auth:** Ensure `POST /auth/login` returns correct shape for frontend.
  - *Test:* Login via UI -> Check Network tab for 200 OK.

### 🧩 S1 – Reflections CRUD (Core Feature)
**Objectives:** Enable the main "High Low Buffalo" workflow.
- [ ] **Create Reflection Model:** Add `Reflection` class in `models.py` and `schemas.py`.
- [ ] **Implement CREATE:** `POST /reflections`
  - *Test:* Submit form on Dashboard -> Success Toast appears.
- [ ] **Implement LIST:** `GET /reflections`
  - *Test:* Go to History page -> See the reflection just created.
- [ ] **Implement DELETE:** `DELETE /reflections/{id}`
  - *Test:* Click Delete icon in History -> Item disappears.
- [ ] **Implement UPDATE:** `PUT /reflections/{id}`
  - *Test:* Edit a reflection -> Change "High" text -> Save -> Verify change in History.

### 👥 S2 – User Settings & Metadata
**Objectives:** Support "Share With" dropdown and Follow-up flags.
- [ ] **Update User Model:** Add `settings` field (friends/herds) to User schema.
- [ ] **Update User Endpoint:** Ensure `GET /users/me` returns `settings`.
  - *Test:* Check React DevTools/Network -> User object includes `settings`.
- [ ] **Implement Settings Update:** `PUT /users/me/settings` (Optional, if UI exists).
- [ ] **Flag for Follow-up:** Ensure `is_flagged` is toggleable via Update endpoint.
  - *Test:* Click flag icon -> Icon changes state (filled/unfilled).