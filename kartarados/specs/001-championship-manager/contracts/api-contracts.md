# API Contracts: Kartarados Championship Manager

**Date**: 2026-01-26  
**Base URL**: `https://[project-ref].supabase.co/rest/v1`  
**Authentication**: Bearer token (Supabase JWT)

## Authentication Endpoints

### POST /auth/v1/token?grant_type=password

**Description**: Admin login

**Request**:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "admin@example.com"
  }
}
```

---

### POST /auth/v1/user

**Description**: Create new admin account (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Request**:
```json
{
  "email": "newadmin@example.com",
  "password": "securepassword"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "email": "newadmin@example.com",
  "created_at": "2026-01-26T10:00:00Z"
}
```

---

### PUT /auth/v1/user

**Description**: Change own password

**Headers**: `Authorization: Bearer [user_token]`

**Request**:
```json
{
  "password": "newpassword123"
}
```

**Response** (200):
```json
{
  "message": "Password updated"
}
```

---

## Season Endpoints

### GET /seasons

**Description**: List all seasons

**Query Parameters**:
- `select`: Fields to return (default: `*`)
- `order`: Sort order (e.g., `end_date.desc`)
- `limit`: Number of results
- `offset`: Pagination offset

**Response** (200):
```json
[
  {
    "id": "uuid",
    "name": "2026 Championship",
    "start_date": "2026-01-01",
    "end_date": "2026-12-31",
    "accent_color": "#000000",
    "created_at": "2026-01-26T10:00:00Z",
    "updated_at": "2026-01-26T10:00:00Z"
  }
]
```

---

### GET /seasons?end_date=gte.2026-01-26

**Description**: Get current active season (end_date >= today)

**Response** (200): Same as GET /seasons

---

### POST /seasons

**Description**: Create new season (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Request**:
```json
{
  "name": "2026 Championship",
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "accent_color": "#000000"
}
```

**Response** (201): Created season object

---

### PATCH /seasons?id=eq.{id}

**Description**: Update season (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Request**:
```json
{
  "name": "Updated Name",
  "accent_color": "#00FF00"
}
```

**Response** (200): Updated season object

---

### DELETE /seasons?id=eq.{id}

**Description**: Delete season (admin only, with safeguards)

**Headers**: `Authorization: Bearer [admin_token]`

**Response** (204): No content

---

## Driver Endpoints

### GET /drivers

**Description**: List all drivers

**Response** (200):
```json
[
  {
    "id": "uuid",
    "email": "driver@example.com",
    "name": "John Doe",
    "nickname": "JD",
    "birth_date": "1990-05-15",
    "sex": "Male",
    "blood_type": "O+",
    "picture_url": "https://...",
    "created_at": "2026-01-26T10:00:00Z",
    "updated_at": "2026-01-26T10:00:00Z"
  }
]
```

---

### POST /drivers

**Description**: Create new driver (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Request**:
```json
{
  "email": "driver@example.com",
  "name": "John Doe",
  "nickname": "JD",
  "birth_date": "1990-05-15",
  "sex": "Male",
  "blood_type": "O+",
  "picture_url": "https://..."
}
```

**Response** (201): Created driver object

**Error** (400): Email already exists

---

### PATCH /drivers?id=eq.{id}

**Description**: Update driver (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Request**: Partial driver object

**Response** (200): Updated driver object

---

### DELETE /drivers?id=eq.{id}

**Description**: Delete driver (admin only, with safeguards)

**Headers**: `Authorization: Bearer [admin_token]`

**Response** (204): No content

---

## Cup Endpoints

### GET /cups?season_id=eq.{season_id}

**Description**: List cups for a season

**Response** (200):
```json
[
  {
    "id": "uuid",
    "season_id": "uuid",
    "name": "Summer Cup",
    "start_date": "2026-06-01",
    "end_date": "2026-08-31",
    "created_at": "2026-01-26T10:00:00Z",
    "updated_at": "2026-01-26T10:00:00Z"
  }
]
```

---

### POST /cups

**Description**: Create new cup (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Request**:
```json
{
  "season_id": "uuid",
  "name": "Summer Cup",
  "start_date": "2026-06-01",
  "end_date": "2026-08-31"
}
```

**Response** (201): Created cup object

---

### PATCH /cups?id=eq.{id}

**Description**: Update cup (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Response** (200): Updated cup object

---

### DELETE /cups?id=eq.{id}

**Description**: Delete cup (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Response** (204): No content

---

## Race Endpoints

### GET /races?season_id=eq.{season_id}

**Description**: List races for a season

**Query Parameters**:
- `season_id`: Filter by season
- `cup_id`: Filter by cup (optional)
- `select`: Include related data (e.g., `*,cups(*)`)

**Response** (200):
```json
[
  {
    "id": "uuid",
    "season_id": "uuid",
    "cup_id": "uuid",
    "name": "Race 1",
    "location": "São Paulo Circuit",
    "race_datetime": "2026-03-15T14:00:00Z",
    "affects_championship": true,
    "created_at": "2026-01-26T10:00:00Z",
    "updated_at": "2026-01-26T10:00:00Z"
  }
]
```

---

### POST /races

**Description**: Create new race (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Request**:
```json
{
  "season_id": "uuid",
  "cup_id": "uuid",
  "name": "Race 1",
  "location": "São Paulo Circuit",
  "race_datetime": "2026-03-15T14:00:00Z",
  "affects_championship": true
}
```

**Response** (201): Created race object

---

### PATCH /races?id=eq.{id}

**Description**: Update race (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Response** (200): Updated race object

---

### DELETE /races?id=eq.{id}

**Description**: Delete race (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Response** (204): No content

---

## Race Result Endpoints

### GET /race_results?race_id=eq.{race_id}

**Description**: Get all results for a race

**Query Parameters**:
- `select`: Include related data (e.g., `*,drivers(*),penalties(*)`)
- `order`: Sort order (e.g., `finish_position.asc`)

**Response** (200):
```json
[
  {
    "id": "uuid",
    "race_id": "uuid",
    "driver_id": "uuid",
    "finish_position": 1,
    "best_lap_time": "01:23.456",
    "grid_start_position": 1,
    "is_disqualified": false,
    "comments": "Great race",
    "drivers": {
      "name": "John Doe",
      "picture_url": "https://..."
    },
    "penalties": [
      {
        "penalty_type": "race_direction_warning",
        "penalty_name": "Race Direction Warning",
        "point_deduction": -4,
        "count": 1
      }
    ],
    "created_at": "2026-01-26T10:00:00Z",
    "updated_at": "2026-01-26T10:00:00Z"
  }
]
```

---

### POST /race_results

**Description**: Create race result (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Request**:
```json
{
  "race_id": "uuid",
  "driver_id": "uuid",
  "finish_position": 1,
  "best_lap_time": "01:23.456",
  "grid_start_position": 1,
  "is_disqualified": false,
  "comments": "Great race"
}
```

**Response** (201): Created race result object

**Error** (400): Duplicate driver result for race

---

### POST /penalties

**Description**: Add penalties to race result (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Request**:
```json
{
  "race_result_id": "uuid",
  "penalty_type": "custom",
  "penalty_name": "Custom Penalty",
  "point_deduction": -5,
  "count": 2
}
```

**Response** (201): Created penalty object

---

### PATCH /race_results?id=eq.{id}

**Description**: Update race result (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Response** (200): Updated race result object

---

### DELETE /race_results?id=eq.{id}

**Description**: Delete race result (admin only)

**Headers**: `Authorization: Bearer [admin_token]`

**Response** (204): No content

---

## Rankings Endpoints

### GET /rankings?season_id=eq.{season_id}&cup_id=eq.{cup_id}

**Description**: Get driver rankings (calculated client-side, but can be cached)

**Query Parameters**:
- `season_id`: Required
- `cup_id`: Optional (for cup-specific rankings)
- `affects_championship`: Filter races (for overall championship)

**Response** (200):
```json
[
  {
    "driver_id": "uuid",
    "driver_name": "John Doe",
    "driver_picture": "https://...",
    "total_points": 150,
    "best_position": 1,
    "race_wins": 3,
    "poles": 2,
    "fastest_laps": 1,
    "total_penalties": -8,
    "tie_breaker_values": {
      "first_places": 3,
      "second_places": 2,
      "third_places": 1,
      "poles": 2,
      "fastest_laps": 1,
      "penalty_points": -8
    }
  }
]
```

**Note**: Rankings are calculated client-side from race results. This endpoint is optional and can be implemented as an Edge Function for server-side calculation if needed.

---

## Storage Endpoints

### POST /storage/v1/object/driver-pictures/{filename}

**Description**: Upload driver picture (admin only)

**Headers**: 
- `Authorization: Bearer [admin_token]`
- `Content-Type: image/jpeg` or `image/png` or `image/webp`

**Request**: Binary image data

**Response** (200):
```json
{
  "path": "driver-pictures/filename.jpg",
  "publicUrl": "https://[project-ref].supabase.co/storage/v1/object/public/driver-pictures/filename.jpg"
}
```

---

## Error Responses

All endpoints may return:

**400 Bad Request**:
```json
{
  "message": "Validation error",
  "errors": ["Field 'email' is required"]
}
```

**401 Unauthorized**:
```json
{
  "message": "Authentication required"
}
```

**403 Forbidden**:
```json
{
  "message": "Admin access required"
}
```

**404 Not Found**:
```json
{
  "message": "Resource not found"
}
```

**409 Conflict**:
```json
{
  "message": "Email already exists"
}
```

**500 Internal Server Error**:
```json
{
  "message": "Internal server error"
}
```

---

## Rate Limiting

Supabase free tier includes:
- 500 requests per second
- 2GB bandwidth per month

For production, implement client-side request throttling and caching.
