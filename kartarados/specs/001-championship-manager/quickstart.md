# Quick Start Guide: Kartarados Championship Manager

**Date**: 2026-01-26

## Prerequisites

- Node.js 18+ (for local development)
- Supabase account (free tier)
- Modern web browser
- Git

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Note your project URL and anon key (found in Settings > API)

### 2. Database Setup

Run the following SQL in Supabase SQL Editor to create tables:

```sql
-- Create admins table (extends Supabase Auth users)
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_first_admin BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES admins(id)
);

-- Create seasons table
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  accent_color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Create cups table
CREATE TABLE cups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Create drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  birth_date DATE,
  sex TEXT,
  blood_type TEXT,
  picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create races table
CREATE TABLE races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE RESTRICT,
  cup_id UUID REFERENCES cups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  race_datetime TIMESTAMP NOT NULL,
  affects_championship BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create race_results table
CREATE TABLE race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  finish_position INTEGER NOT NULL,
  best_lap_time TEXT,
  grid_start_position INTEGER,
  is_disqualified BOOLEAN DEFAULT FALSE,
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (finish_position > 0),
  UNIQUE(race_id, driver_id)
);

-- Create penalties table
CREATE TABLE penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_result_id UUID NOT NULL REFERENCES race_results(id) ON DELETE CASCADE,
  penalty_type TEXT NOT NULL,
  penalty_name TEXT NOT NULL,
  point_deduction INTEGER NOT NULL,
  count INTEGER DEFAULT 1,
  CHECK (point_deduction <= 0),
  CHECK (count > 0)
);

-- Create indexes
CREATE INDEX idx_cups_season_id ON cups(season_id);
CREATE INDEX idx_races_season_id ON races(season_id);
CREATE INDEX idx_races_cup_id ON races(cup_id);
CREATE INDEX idx_races_datetime ON races(race_datetime);
CREATE INDEX idx_race_results_race_id ON race_results(race_id);
CREATE INDEX idx_race_results_driver_id ON race_results(driver_id);
CREATE INDEX idx_race_results_position ON race_results(finish_position);
CREATE INDEX idx_penalties_race_result_id ON penalties(race_result_id);
CREATE INDEX idx_seasons_dates ON seasons(start_date, end_date);
```

### 3. Row Level Security (RLS) Setup

Enable RLS and create policies:

```sql
-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE cups ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

-- Public read access for seasons, cups, drivers, races, race_results, penalties
CREATE POLICY "Public read access" ON seasons FOR SELECT USING (true);
CREATE POLICY "Public read access" ON cups FOR SELECT USING (true);
CREATE POLICY "Public read access" ON drivers FOR SELECT USING (true);
CREATE POLICY "Public read access" ON races FOR SELECT USING (true);
CREATE POLICY "Public read access" ON race_results FOR SELECT USING (true);
CREATE POLICY "Public read access" ON penalties FOR SELECT USING (true);

-- Admin full access (check if user is admin)
CREATE POLICY "Admin full access" ON seasons FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);
CREATE POLICY "Admin full access" ON cups FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);
CREATE POLICY "Admin full access" ON drivers FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);
CREATE POLICY "Admin full access" ON races FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);
CREATE POLICY "Admin full access" ON race_results FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);
CREATE POLICY "Admin full access" ON penalties FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);

-- Admin management (only first admin or admins can create admins)
CREATE POLICY "Admin management" ON admins FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() 
    AND (is_first_admin = TRUE OR created_by IS NOT NULL)
  )
);
```

### 4. Storage Bucket Setup

1. Go to Storage in Supabase dashboard
2. Create bucket: `driver-pictures`
3. Set to public
4. Add policy for admin uploads:

```sql
CREATE POLICY "Admin upload" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'driver-pictures' AND
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
);
```

5. Add policy for public image reads:

```sql
CREATE POLICY "Public driver image read" ON storage.objects FOR SELECT
USING (bucket_id = 'driver-pictures');
```

6. Ensure Storage CORS allows your app origins (Settings → Storage → CORS):
   - Add `http://localhost:8000` and your deployed domain(s)
   - Allow methods: `GET`, `HEAD`

### 5. Create First Admin

1. Go to Authentication in Supabase dashboard
2. Create a new user with email/password
3. Note the user ID
4. Run in SQL Editor:

```sql
INSERT INTO admins (id, email, is_first_admin)
VALUES ('[user-id-from-auth]', 'admin@example.com', TRUE);
```

5. Generate a random password and document it in README.md

### 6. Frontend Setup

```bash
# Clone repository
git clone [repo-url]
cd kartarados

# Create frontend directory structure
mkdir -p frontend/src/{components,pages,services,utils,styles,assets/images}
mkdir -p frontend/tests

# Create config file
cat > frontend/src/config.js << EOF
export const SUPABASE_URL = 'https://[your-project-ref].supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key';

// CDN URLs for libraries
export const CDN_URLS = {
  bootstrap: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  bootstrapIcons: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
  supabase: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
};
EOF
```

### 7. Initialize Frontend

Create `frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kartarados - Championship Manager</title>
  
  <!-- Bootstrap CSS from CDN -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
  
  <!-- Bootstrap Icons (optional) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
  
  <!-- Custom CSS -->
  <link rel="stylesheet" href="src/styles/main.css">
  <link rel="stylesheet" href="src/styles/bootstrap-overrides.css">
  <link rel="stylesheet" href="src/styles/theme.css">
  <link rel="stylesheet" href="src/styles/custom.css">
</head>
<body>
  <div id="app"></div>
  
  <!-- Supabase JS from CDN -->
  <script type="module">
    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
    // Supabase client initialization
    window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  </script>
  
  <!-- Main application script -->
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

### 8. Create Custom CSS Files

Create the custom CSS files for Bootstrap overrides and F1 theming:

```bash
# Bootstrap overrides
cat > frontend/src/styles/bootstrap-overrides.css << 'EOF'
/* Bootstrap component overrides for F1 theme */
:root {
  --bs-body-bg: #000;
  --bs-body-color: #fff;
  --bs-primary: #000000; /* Accent black */
  --bs-border-color: #333;
}

/* Override Bootstrap table styles */
.table {
  --bs-table-bg: #1a1a1a;
  --bs-table-color: #fff;
  --bs-table-border-color: #333;
}

/* Override Bootstrap button styles */
.btn-primary {
  background-color: var(--season-accent, #000000);
  border-color: var(--season-accent, #000000);
}
EOF

# Theme file for season accent colors
cat > frontend/src/styles/theme.css << 'EOF'
/* Season accent color theming */
:root {
  --season-accent: #000000; /* Default accent */
}

/* Apply season accent to themable elements */
.table thead th {
  background-color: var(--season-accent);
  color: #fff;
}

.navbar {
  background-color: var(--season-accent) !important;
}

.btn-primary {
  background-color: var(--season-accent);
  border-color: var(--season-accent);
}
EOF

# Custom styles
cat > frontend/src/styles/custom.css << 'EOF'
/* Custom F1-inspired styles */
body {
  background-color: #000;
  color: #fff;
  font-family: 'Arial', sans-serif;
}

/* F1-inspired card styles */
.card {
  background-color: #1a1a1a;
  border: 1px solid #333;
}

/* Additional custom styles */
EOF
```

### 9. Install Dependencies (Optional)

**Note**: All libraries are loaded from CDN, so no npm install is required. However, if you want to use a build tool:

```bash
cd frontend
npm init -y
# No dependencies needed - all loaded from CDN
```

### 10. Local Development Setup

**Yes, you can run the app locally and connect to Supabase!** The frontend runs on your local machine and connects to your remote Supabase project.

#### Development Server

Use a simple HTTP server to serve the frontend locally:

```bash
# Option 1: Python (if installed)
cd frontend
python -m http.server 8000

# Option 2: Node.js (if installed)
cd frontend
npx serve

# Option 3: VS Code Live Server extension
# Right-click on index.html → "Open with Live Server"

# Option 4: PHP (if installed)
cd frontend
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

#### Supabase Connection

The app connects to your remote Supabase project:

1. **Get your Supabase credentials**:
   - Go to your Supabase project dashboard
   - Settings → API
   - Copy "Project URL" (e.g., `https://xxxxx.supabase.co`)
   - Copy "anon public" key

2. **Configure connection**:
   - Update `frontend/src/config.js` with your Supabase URL and anon key
   - The Supabase client (loaded from CDN) will connect from your browser to your remote Supabase instance

3. **CORS Configuration**:
   - Supabase API requests are allowed by default
   - Storage object fetches require Storage CORS entries for your app origins (see Storage Bucket Setup)

#### Local Development Workflow

1. Start local HTTP server (port 8000)
2. Open `http://localhost:8000` in browser
3. App connects to remote Supabase for:
   - Authentication (login/logout)
   - Database queries (seasons, drivers, races, etc.)
   - File storage (driver pictures)
4. All data persists in your Supabase project
5. Changes are immediately visible (no build step needed)

#### Benefits of This Setup

- ✅ Fast development (no build step, instant refresh)
- ✅ Real Supabase connection (test with actual database)
- ✅ Free tier sufficient for development
- ✅ Easy to share (others can connect to same Supabase project)
- ✅ Production-ready (same code works when deployed)

### 11. First Steps

1. Open `http://localhost:8000` in your browser
2. The app will connect to your remote Supabase project automatically
3. Log in with first admin credentials (from T012)
4. Create a season (with accent color)
5. Create driver profiles (upload pictures to Supabase Storage)
6. Create cups and races
7. Enter race results
8. View public rankings (unauthenticated view)

**Note**: All data is stored in your remote Supabase project. You can access it from:
- Your local development environment
- Any other device/browser (if you share the Supabase project)
- The Supabase dashboard (to view/edit data directly)

## Configuration

### Supabase Connection

The app connects to your remote Supabase project. Configure in `frontend/src/config.js`:

```javascript
export const SUPABASE_URL = 'https://[your-project-ref].supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key';
```

**Where to find these**:
- Supabase Dashboard → Settings → API
- Project URL: Use the "Project URL" field
- Anon Key: Use the "anon public" key (safe to expose in frontend code)

**Security Note**: The anon key is safe to use in frontend code. Supabase Row Level Security (RLS) policies protect your data. Only authenticated admins can write data.

### First Admin Password

The first admin password is documented in `README.md`. Change it after first login.

## Next Steps

- See [plan.md](./plan.md) for implementation details
- See [data-model.md](./data-model.md) for database schema
- See [contracts/api-contracts.md](./contracts/api-contracts.md) for API documentation

## Troubleshooting

**RLS Policy Errors**: Ensure policies are created and user is authenticated as admin
- Check `quickstart.md` → "Row Level Security (RLS) Setup" section
- Verify policies are enabled: `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;`

**CORS Issues**: If driver images fail with `ERR_BLOCKED_BY_ORB` or 400 errors
- Ensure `driver-pictures` bucket is public
- Ensure public read policy exists (see Storage Bucket Setup)
- Add Storage CORS entries for your app origins with `GET`/`HEAD`
- If issues persist, check Supabase project settings

**Storage Upload Fails**: Check bucket exists and policy allows uploads
- Verify `driver-pictures` bucket exists in Supabase Storage
- Check storage policy allows admin uploads (see quickstart.md → "Storage Bucket Setup")

**Authentication Fails**: Verify user exists in `auth.users` and `admins` table
- User must exist in both Supabase Auth (`auth.users`) and `admins` table
- Check `is_first_admin` flag is set correctly

**Local Development Connection Issues**:
- Verify `config.js` has correct SUPABASE_URL and SUPABASE_ANON_KEY
- Check browser console for connection errors
- Ensure Supabase project is active (not paused)
- Verify network connectivity to Supabase servers
