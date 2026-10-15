# Research: Kartarados Championship Manager

**Date**: 2026-01-26  
**Purpose**: Resolve technical decisions for backend services, authentication, and storage

## Backend Service Selection

### Decision: Supabase

**Rationale**:
- **Free Tier**: Generous free tier (500MB database, 1GB file storage, 2GB bandwidth/month)
- **PostgreSQL Database**: Full SQL database with relationships, better for complex queries (points calculations, rankings)
- **Built-in Auth**: Email/password authentication included, easy admin management
- **Storage**: Built-in file storage for driver pictures
- **Real-time**: Optional real-time subscriptions for live ranking updates
- **REST API**: Auto-generated REST API from database schema
- **Serverless Functions**: Edge Functions for custom logic (points calculations)
- **Simple Setup**: Quick to set up, good documentation

**Alternatives Considered**:
- **Firebase**: Excellent but Firestore (NoSQL) less ideal for complex relational queries. Pricing can scale quickly.
- **Netlify/Vercel + Database**: Requires separate database service, more complex setup.
- **Custom Backend**: Too complex for "super simple and fast" requirement.

**Implementation Notes**:
- Use Supabase PostgreSQL for all data storage
- Use Supabase Auth for email/password authentication
- Use Supabase Storage for driver profile pictures
- Use Supabase Edge Functions for complex points calculations (optional, can also do client-side)

## Authentication Implementation

### Decision: Supabase Auth with Custom Admin Management

**Rationale**:
- Supabase Auth provides email/password authentication out of the box
- First admin account: Create manually in Supabase dashboard with random password, document in README
- Admin creation: Use Supabase Admin API or custom function to create additional admin accounts
- Password changes: Use Supabase Auth password reset/change functionality
- Role-based access: Use Supabase Row Level Security (RLS) policies to restrict admin-only endpoints

**Implementation Approach**:
1. First admin: Manually created in Supabase Auth dashboard, password documented in README
2. Admin creation: Custom Edge Function or admin panel to create new admin users
3. Password management: Leverage Supabase Auth's built-in password change flows
4. Session management: Use Supabase client-side session management

**Alternatives Considered**:
- **Custom Auth**: Too complex, reinventing the wheel
- **Firebase Auth**: Similar capabilities but Supabase chosen for database
- **Third-party OAuth**: Unnecessary complexity for admin-only access

## Image Storage

### Decision: Supabase Storage

**Rationale**:
- Included in Supabase free tier (1GB storage)
- Simple API for upload/download
- CDN delivery for fast image loading
- Direct integration with Supabase client
- Supports image optimization/resizing if needed

**Implementation Approach**:
- Store driver pictures in `driver-pictures` bucket
- Use Supabase Storage API for uploads from admin interface
- Generate public URLs for display in rankings
- Optimize images client-side before upload (compress, resize)

**Alternatives Considered**:
- **Firebase Storage**: Similar but already chosen Supabase
- **Cloudinary/Imgix**: Overkill, adds external dependency
- **Base64 in database**: Not scalable, increases database size

## Placeholder Images

### Decision: DiceBear (avataaars/adventurer-neutral)

**Rationale**:
- Free image service with URL parameters for seeded randomness
- Headshot-style SVG avatars at fixed sizes (e.g., `size=200`)
- Supports predictable output per seed (driver id/email), avoids layout shifts
- CORS-friendly responses for direct `<img>` usage

**Candidate Services Checked**:
- DiceBear API (SVG): `https://api.dicebear.com/7.x/avataaars/svg?seed=driver&size=200` → OK
- DiceBear API (SVG): `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=driver&size=200` → OK
- UI Avatars (PNG): `https://ui-avatars.com/api/?name=Driver&size=200` → OK (initials-only, not headshot)
- Placehold.co (SVG): `https://placehold.co/200x200` → OK (generic placeholder)
- Unsplash source: `https://source.unsplash.com/200x200/?portrait` → 503 during check (unreliable)
- Picsum: `https://picsum.photos/200` / `https://picsum.photos/200/200` → 404/405 during check

**Implementation Notes**:
- Use DiceBear as the primary placeholder generator
- Seed parameter should use stable driver identifier (id or email) for consistency
- Keep size around 200px; SVG works well at smaller display sizes

## Points Calculation Strategy

### Decision: Client-Side Calculation with Caching

**Rationale**:
- Points calculation logic is deterministic and can run client-side
- Reduces backend load and API calls
- Faster user experience (no server round-trip)
- Can cache calculated rankings in browser storage
- Complex tie-breaker logic easier to implement in JavaScript

**Implementation Approach**:
1. Fetch race results from Supabase
2. Calculate points client-side using `points.js` service
3. Cache calculated rankings in localStorage/sessionStorage
4. Recalculate when new race results are added
5. Optional: Edge Function for server-side calculation if needed for validation

**Alternatives Considered**:
- **Server-side only**: Adds latency, more API calls
- **Hybrid**: More complex, unnecessary for this use case

## Formula 1 Design Theme

### Decision: Bootstrap CSS with Custom Overrides

**Rationale**:
- Bootstrap provides comprehensive component library and responsive grid system
- Reduces development time with pre-built components (tables, modals, forms, buttons)
- Mobile-first responsive design built-in
- Easy to override with custom CSS for Formula 1 theming
- Loaded from CDN (no build step, fast delivery)
- Well-documented and widely used

**Implementation Approach**:
1. Load Bootstrap CSS from CDN (jsDelivr or Bootstrap CDN)
2. Use Bootstrap components (tables, cards, modals, forms, buttons, navigation)
3. Override Bootstrap CSS variables and component styles for F1 theme
4. Apply season accent colors via CSS custom properties
5. Custom CSS file for F1-specific styling (dark theme, F1 colors)
6. Override specific Bootstrap component classes when needed

**Design Elements**:
- Base: Bootstrap 5.x components and grid system
- Theme: Dark backgrounds (#000, #1a1a1a), accent black (#000000) as base accent
- Season Colors: CSS custom properties for dynamic accent color per season
- Typography: Bootstrap typography with F1-inspired font weights
- Components: Bootstrap components with custom overrides for F1 aesthetic
- Layout: Bootstrap grid system for responsive layouts

**CDN Libraries**:
- Bootstrap CSS: `https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css`
- Bootstrap Icons (optional): `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css`
- Supabase JS: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm`
- Other libraries as needed (loaded from CDN)

## Performance Optimization Strategy

### Decision: Code Splitting, Lazy Loading, Image Optimization

**Rationale**:
- Vanilla JS enables fine-grained control over loading
- Code splitting by route/page reduces initial bundle
- Lazy load images and non-critical components
- Optimize images before upload (WebP format, appropriate sizing)

**Implementation Approach**:
1. Split code by page (login, admin, public rankings)
2. Lazy load race detail pages and modals
3. Optimize driver pictures (max 200KB, WebP format)
4. Use CSS for styling (no CSS-in-JS overhead)
5. Minimize API calls with caching and batching
6. Use browser caching for static assets

## Mobile-First Implementation

### Decision: Responsive CSS with Touch-Optimized Interactions

**Rationale**:
- Mobile devices are primary target
- Touch targets minimum 44x44px
- Responsive tables (scroll or card view on mobile)
- Bottom navigation for mobile, top for desktop
- Gesture support where appropriate

**Implementation Approach**:
1. Mobile-first CSS (min-width media queries)
2. Touch-friendly button sizes and spacing
3. Responsive table design (horizontal scroll or card layout on mobile)
4. Mobile navigation pattern (hamburger menu or bottom nav)
5. Test on actual mobile devices and emulators

## Summary of Technical Decisions

| Decision Area | Choice | Rationale |
|--------------|--------|-----------|
| Backend Service | Supabase | Free tier, PostgreSQL, built-in auth/storage |
| Authentication | Supabase Auth | Email/password, admin management, RLS policies |
| Image Storage | Supabase Storage | 1GB free, simple API, CDN delivery |
| Points Calculation | Client-side | Faster, reduces API calls, deterministic logic |
| Design Theme | Bootstrap CSS + Custom Overrides | Component library, responsive, F1 theming via overrides |
| Library Loading | CDN-based | No build step, fast delivery, easy updates |
| Performance | Code splitting + lazy loading | Meets bundle size targets, fast load times |
| Mobile Strategy | Bootstrap responsive + touch optimization | Mobile-first grid, 44px touch targets |

All technical decisions align with constitution principles and project constraints (free hosting, simplicity, performance).
