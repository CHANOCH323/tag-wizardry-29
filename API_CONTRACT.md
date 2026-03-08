# API Server Contract

This document describes the API endpoints that the frontend expects from the server.

## Base URL
Configure `VITE_API_URL` environment variable (default: `http://localhost:3000/api`)

## Authentication

All endpoints except `/auth/login` and `/auth/register` require a Bearer token in the Authorization header.

### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  },
  "profile": {
    "id": "profile-uuid",
    "user_id": "user-uuid",
    "username": "johndoe",
    "display_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "font_size": "medium",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "johndoe",
  "display_name": "John Doe"
}
```

**Response:** Same as login.

### POST /auth/logout
Logout current user.

**Response:**
```json
{ "success": true }
```

### PUT /auth/password
Change password.

**Request:**
```json
{
  "password": "newpassword123"
}
```

**Response:**
```json
{ "success": true }
```

---

## Profile

### GET /profile
Get current user's profile.

**Response:**
```json
{
  "id": "profile-uuid",
  "user_id": "user-uuid",
  "username": "johndoe",
  "display_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "font_size": "medium",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### PATCH /profile
Update current user's profile.

**Request:**
```json
{
  "display_name": "John Updated",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "font_size": "large"
}
```

**Response:** Updated profile object.

### GET /profiles
Get list of all profiles (for filters/dropdowns).

**Response:**
```json
[
  {
    "user_id": "user-uuid",
    "display_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg"
  }
]
```

---

## Tags

### GET /tags
Get all tags with latest version data.

**Response:**
```json
[
  {
    "id": "tag-uuid",
    "question": "What is the meaning of life?",
    "answer_type": "cubes",
    "cubes": [
      { "cube_id": "cube-1", "cube_name": "Philosophy", "weight": 50 },
      { "cube_id": "cube-2", "cube_name": "Science", "weight": 50 }
    ],
    "free_text_content": null,
    "is_draft": false,
    "last_editor": "John Doe",
    "updated_at": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "version_count": 3
  }
]
```

### POST /tags
Create or update a tag (creates new version).

**Request:**
```json
{
  "tag_id": "existing-tag-uuid-or-null",
  "question": "What is the meaning of life?",
  "answer_type": "cubes",
  "free_text_content": "",
  "cubes": [
    { "cube_id": "cube-1", "cube_name": "Philosophy", "weight": 50 },
    { "cube_id": "cube-2", "cube_name": "Science", "weight": 50 }
  ],
  "top_x": 5,
  "total_weight_threshold": 80,
  "is_draft": false
}
```

**Response:**
```json
{
  "success": true,
  "tag_id": "tag-uuid"
}
```

### DELETE /tags/:id
Soft-delete a tag.

**Response:**
```json
{ "success": true }
```

---

## Tag Versions

### GET /tags/:id/versions
Get version history for a tag.

**Response:**
```json
[
  {
    "id": "version-uuid",
    "question": "What is the meaning of life?",
    "answer_type": "cubes",
    "cubes": [...],
    "free_text_content": null,
    "top_x": 5,
    "total_weight_threshold": 80,
    "is_draft": false,
    "changed_fields": ["question", "cubes"],
    "created_at": "2024-01-01T00:00:00Z",
    "created_by": "user-uuid",
    "editor_name": "John Doe"
  }
]
```

### GET /tags/:id/latest
Get latest version for editing.

**Response:** Single version object.

---

## Cubes

### GET /cubes
Get all available cubes.

**Response:**
```json
[
  { "id": "uuid", "cube_id": "cube-1", "name": "Philosophy" },
  { "id": "uuid", "cube_id": "cube-2", "name": "Science" }
]
```

---

## File Upload

### POST /upload
Upload a file.

**Request:** `multipart/form-data`
- `file`: The file to upload
- `bucket`: Storage bucket name (e.g., "avatars")
- `path`: File path within bucket

**Response:**
```json
{
  "url": "https://your-storage.com/avatars/user-id/filename.jpg"
}
```

---

## Error Responses

All errors return:
```json
{
  "error": "Error message here"
}
```

HTTP Status Codes:
- 400: Bad Request
- 401: Unauthorized (token missing/invalid)
- 403: Forbidden (no permission)
- 404: Not Found
- 500: Internal Server Error
