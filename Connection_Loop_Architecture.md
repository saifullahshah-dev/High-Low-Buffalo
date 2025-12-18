# Architecture Plan: Connection Loop (Shared Feeds & Curiosity Reactions)

## 1. Overview
The goal is to transform the "High-Low-Buffalo" app from a solitary experience into a social one. This involves transitioning from string-based names ("Bob") to real database references (UserIDs), enabling a "Feed" of shared reflections, and allowing "Curiosity" reactions.

## 2. Data Model Changes

### 2.1 User Schema (`UserSettings`)
Currently, `friends` is a list of arbitrary strings. We will transition this to store `UserIDs` to create real links.

**Updated `UserSettings` Schema:**
```python
class UserSettings(BaseModel):
    notificationCadence: str = "daily"
    herds: list[Herd] = [] 
    friends: list[str] = [] # Changed: List of UserIDs (Strings acting as Foreign Keys)
```

**New `FriendRequest` (Implicit):**
For this phase, we will implement a "Follow" model (Address Book style). If I add you by email, you appear in my "Friends" list so I can share with you. There is no "Accept" step required for *sending* content, but the recipient will only see it if shared. 

*Future Consideration:* A full "Friend Request" flow for bi-directional visibility.

### 2.2 Herd Schema
Similarly, Herds will now store UserIDs instead of names.

**Updated `Herd` Schema:**
```python
class Herd(BaseModel):
    id: str
    name: str
    members: list[str] = [] # Changed: List of UserIDs
```

### 2.3 Reflection Schema
We need to track *who* reacted to ensure a user can only react once per reflection.

**Updated `ReflectionBase` Schema:**
```python
class ReflectionBase(BaseModel):
    high: str
    low: str
    buffalo: str
    sharedWith: list[str] = [] # List of UserIDs who have permission to view this
    # Changed: Dictionary mapping ReactionType -> List of UserIDs
    # e.g., { "curious": ["user_123", "user_456"] }
    curiosityReactions: dict[str, list[str]] = {} 
    isFlaggedForFollowUp: Optional[bool] = False
```

## 3. Workflow Logic

### 3.1 Adding a Friend (Real Connections)
*   **Endpoint:** `POST /users/friends`
*   **Input:** `{"email": "bob@example.com"}`
*   **Logic:**
    1.  Search `users` collection for `email`.
    2.  If not found -> Return 404 "User not found".
    3.  If found -> Extract `_id`.
    4.  Update current user's `settings.friends`: `$addToSet` (avoid duplicates).
    5.  Return Success (optionally return the Friend's public profile info: Name, ID).

### 3.2 Sharing with a Herd
*   **Context:** Frontend has a list of Herds. Each Herd contains member UserIDs (populated from the `User` object).
*   **Logic (Frontend):** 
    *   When a user selects "Share with Herd A", the frontend creates a set of all unique UserIDs from that Herd.
    *   The frontend sends this flattened list of UserIDs in the `sharedWith` field of the `POST /reflections` body.
    *   *Alternative (Backend-heavy):* Send `herdIds`, and Backend resolves them. *Decision:* Keep it simple for now, Frontend resolves. If Herds get huge, move to Backend.

### 3.3 The Feed (Reading Shared Reflections)
*   **Endpoint:** `GET /reflections/feed`
*   **Logic:**
    1.  **Query:** Find reflections where `sharedWith` contains `current_user.id`.
    2.  **Sort:** By `timestamp` (descending).
    3.  **Enrichment (Aggregation):**
        *   The reflection contains `user_id` (Author). The feed needs to show "Bob shared...".
        *   Perform a `$lookup` on the `users` collection to fetch `full_name` for the `user_id`.
        *   Project only necessary fields (exclude Author's password, settings, etc.).

### 3.4 Reactions
*   **Endpoint:** `POST /reflections/{id}/react`
*   **Input:** `{"type": "curious"}` (Default)
*   **Logic:**
    1.  Find reflection by `id`.
    2.  Check if `current_user.id` is in `sharedWith` (Security check).
    3.  **Toggle Logic:**
        *   Check if `current_user.id` is already in `curiosityReactions[type]`.
        *   **If yes:** Remove it (`$pull`). (Toggle off)
        *   **If no:** Add it (`$addToSet`). (Toggle on)
    4.  Return updated Reflection.

## 4. API Specification Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/users/friends` | Add a connection by email. |
| `GET` | `/users/friends` | Get list of friends (hydrated with names). |
| `GET` | `/reflections/feed` | Get feed of reflections shared with me. |
| `POST` | `/reflections/{id}/react` | Toggle a reaction on a reflection. |

## 5. Implementation Steps

1.  **Update Schemas:** Modify `schemas.py` to reflect the new structure for Reactions.
2.  **Friend Management:** Implement `POST /users/friends` in `routers/users.py`.
3.  **Feed Endpoint:** Implement `GET /reflections/feed` in `routers/reflections.py` using MongoDB aggregation.
4.  **Reaction Logic:** Implement `POST /reflections/{id}/react` in `routers/reflections.py`.
5.  **Refactor Existing:** Ensure `create_reflection` handles the `sharedWith` list correctly (validation).
