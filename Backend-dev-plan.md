# Backend Development Plan: High-Low-Buffalo

## 1️⃣ Executive Summary
- **Goal:** Build a scalable FastAPI backend with MongoDB Atlas to replace the current `localStorage` implementation for the High-Low-Buffalo app.
- **Core Value:** Enable real user accounts, persistent data across devices, and actual sharing functionality between users.
- **Constraints:**
  - **Framework:** FastAPI (Python 3.13, Async).
  - **Database:** MongoDB Atlas (Motor, Pydantic v2).
  - **Deployment:** No Docker, run locally.
  - **Workflow:** Single branch `main`, manual testing after every task.

## 2️⃣ In-Scope & Success Criteria
- **Features:**
  - User Authentication (Signup/Login/Logout).
  - Create/Read/Update/Delete Reflections (High, Low, Buffalo).
  - User Settings (Notification cadence).
  - Social Management (Manage Friends & Herds).
  - Interactions (Curiosity Taps, Flag for Follow-up).
- **Success Criteria:**
  - Frontend functionality remains identical but persists to cloud DB.
  - Users can log in and see their own data.
  - "Shared" reflections are visible to the target audience (by username matching).
  - All manual UI tests pass.

## 3️⃣ API Design
- **Base Path:** `/api/v1`
- **Auth Strategy:** OAuth2 with Password Flow (JWT in HTTP-only cookie or Bearer header). *Plan uses Bearer token for simplicity with frontend axios interceptors.*

| Method | Path | Purpose | Request | Response |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/auth/signup` | Register new user | `{ username, password }` | `{ id, username }` |
| **POST** | `/auth/token` | Login (Get Token) | `{ username, password }` | `{ access_token, token_type }` |
| **GET** | `/users/me` | Get current user info & settings | - | `UserSchema` |
| **PUT** | `/users/me/settings` | Update settings (friends/herds) | `SettingsUpdateSchema` | `UserSchema` |
| **GET** | `/reflections` | Get history (filtered) | `?shared_with=X` | `[ReflectionSchema]` |
| **POST** | `/reflections` | Create reflection | `ReflectionCreateSchema` | `ReflectionSchema` |
| **PUT** | `/reflections/{id}` | Edit/Flag/React | `ReflectionUpdateSchema` | `ReflectionSchema` |
| **DELETE** | `/reflections/{id}` | Delete reflection | - | `{ success: true }` |
| **GET** | `/healthz` | System health | - | `{ status: "ok", db: "connected" }` |

## 4️⃣ Data Model (MongoDB Atlas)

### `users` Collection
```json
{
  "_id": "ObjectId",
  "username": "alice",
  "hashed_password": "...",
  "settings": {
    "notification_cadence": "daily",
    "friends": ["bob", "charlie"],
    "herds": [
      { "id": "herd-123", "name": "Work Buddies", "members": ["dave"] }
    ]
  },
  "created_at": "ISO Date"
}
```

### `reflections` Collection
```json
{
  "_id": "ObjectId",
  "owner_id": "ObjectId(User)",
  "owner_username": "alice",
  "high": "Got coffee",
  "low": "Spilled coffee",
  "buffalo": "Saw a parrot",
  "timestamp": "ISO Date",
  "shared_with": ["self", "bob"],
  "curiosity_reactions": {
    "bob": 1
  },
  "is_flagged_for_follow_up": false
}
```

## 5️⃣ Frontend Audit & Feature Map

| Page/Component | Data Needed | Backend Endpoint | Notes |
| :--- | :--- | :--- | :--- |
| **Auth Pages** | Username/Pass | `/auth/*` | Need to create Login/Signup UI or add to existing |
| **ReflectionForm** | User friends/herds | `GET /users/me` | For "Share With" dropdown |
| **ReflectionForm** | Submit Data | `POST /reflections` | Saves new reflection |
| **History** | List of reflections | `GET /reflections` | Needs filters (self, friend name) |
| **History** | Edit/Delete | `PUT/DELETE /reflections/{id}` | |
| **History** | Flag/React | `PUT /reflections/{id}` | Update flags/counters |
| **Settings** | User Prefs | `GET/PUT /users/me/settings` | Manage friends list string arrays |
| **FollowUp** | Flagged Items | `GET /reflections?flagged=true` | Filter logic on backend |

## 6️⃣ Configuration & ENV Vars
- `APP_ENV`: `development`
- `PORT`: `8000`
- `MONGODB_URI`: `mongodb+srv://...`
- `SECRET_KEY`: `...` (for JWT)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: `10080` (7 days)
- `CORS_ORIGINS`: `http://localhost:5173`

## 7️⃣ Testing Strategy (Manual via Frontend)
- **Philosophy:** Verify every backend change by performing the user action in the browser.
- **Process:**
  1. Implement backend feature.
  2. Update frontend API client (switch from `storage.ts` to API calls).
  3. **Manual Test Step:** Perform action (e.g., Click "Save").
  4. **Verification:** Check UI update + DB entry (optional).
  5. Commit & Push.

---

## 🔟 Dynamic Sprint Plan & Backlog

## 🧱 S0 – Environment Setup & Frontend Connection

**Objectives:**
- Initialize FastAPI project structure.
- Connect to MongoDB Atlas.
- Create `/healthz` endpoint.
- Configure CORS.

**Tasks:**
- Init FastAPI w/ Motor & Pydantic.
  - *Manual Test:* Run `uvicorn`, visit `http://localhost:8000/docs`.
  - *User Test Prompt:* "Open the backend docs page to confirm the server is running."
- Implement DB connection & Health Check.
  - *Manual Test:* Visit `/api/v1/healthz`, check JSON response.
  - *User Test Prompt:* "Check the health endpoint returns 'db': 'connected'."
- Setup CORS for `localhost:5173`.
- Push to GitHub `main`.

**Definition of Done:**
- Server runs, connects to DB, responds to health check.

---

## 🧩 S1 – Basic Auth (Signup / Login)

**Objectives:**
- Secure the app.
- Enable multi-user support (required for sharing).

**Tasks:**
- Implement User Model & Auth Routes (`signup`, `token`).
  - *Manual Test:* Use Swagger UI to create a user and get a token.
  - *User Test Prompt:* "Create a user via Swagger and verify you get a JWT back."
- Create/Update Frontend Auth Context (or simple Login Page).
  - *Note:* Frontend currently has no Login page. Will need to add a simple overlay or route.
  - *Manual Test:* Enter credentials, verify token stored in localStorage/memory.
  - *User Test Prompt:* "Log in via the new UI screens and ensure you are redirected to the app."

**Definition of Done:**
- User can sign up and log in.
- Auth token is preserved.

---

## 📝 S2 – Reflections CRUD (Core Feature)

**Objectives:**
- Replace `storage.ts` logic with API calls for Reflections.
- Create, Read, Update, Delete.

**Tasks:**
- Implement `POST /reflections` & `GET /reflections`.
  - *Manual Test:* Create a reflection in UI. Refresh page. Verify it persists.
  - *User Test Prompt:* "Submit a High/Low/Buffalo. Refresh. Ensure it's still there."
- Implement `DELETE /reflections/{id}`.
  - *Manual Test:* Delete a reflection in History. Verify it disappears.
  - *User Test Prompt:* "Delete an item from History and confirm it is gone."
- Implement `PUT /reflections/{id}` (Edit content).
  - *Manual Test:* Edit a reflection's text. Save.
  - *User Test Prompt:* "Modify a 'High' entry and save. Confirm the text updates."

**Definition of Done:**
- All reflection operations persist to MongoDB.
- `storage.ts` is fully deprecated/replaced for reflections.

---

## 🤝 S3 – Settings & Social Graph

**Objectives:**
- Manage Friends and Herds.
- Persist User Settings.

**Tasks:**
- Implement `GET /users/me` & `PUT /users/me/settings`.
  - *Manual Test:* Change notification cadence in Settings. Refresh. Verify persistence.
  - *User Test Prompt:* "Change cadence to 'Weekly', refresh page, check if it saved."
- Implement Friend/Herd Management (Add/Remove strings).
  - *Manual Test:* Add "Bob" as friend. Create "Work" Herd.
  - *User Test Prompt:* "Add a friend and a herd in Settings. Verify they appear in the 'Share With' dropdown on the home page."

**Definition of Done:**
- Settings, Friends, and Herds persist to DB.

---

## ⚡ S4 – Interactions & Filtering

**Objectives:**
- Enable Curiosity Taps & Flagging.
- Enable History Filtering.

**Tasks:**
- Implement `PUT /reflections/{id}` logic for Flagging/Reactions.
  - *Manual Test:* Click "Flag" icon. Refresh. Verify filled flag icon.
  - *User Test Prompt:* "Flag a reflection. Refresh. Confirm it remains flagged."
  - *Manual Test:* Click "Curiosity Tap". Refresh. Verify count increases.
  - *User Test Prompt:* "Tap curiosity. Refresh. Count should increment."
- Implement Backend Filtering (`?shared_with=X`).
  - *Manual Test:* Filter History by "Self" vs "Friend".
  - *User Test Prompt:* "Filter history by 'Private' and ensure only self-shared items appear."

**Definition of Done:**
- All interactions work end-to-end.
- Project Complete.

---