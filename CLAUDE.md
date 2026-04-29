# CLAUDE.md — Atrium

## Project Overview

**Atrium** is a self-hosted homelab portal platform distributed as a Docker container under the GPL-3.0 licence. It is a modern, modular replacement for Organizr, designed to serve as the single authenticated front door to a homelab media stack.

Atrium serves two audiences:
- **Admins** — manage tabs, users, settings, and remotely access all homelab services via iFrame through a reverse proxy
- **Users** — personalised media dashboard with subscriptions, stats, calendar, and messaging

The core philosophy is **modular by design** — every feature beyond the tab manager and auth is an optional module. If a module's required API is not configured, that module is hidden entirely. No silent errors, no broken widgets.

Intended to be released publicly on GitHub (LFFPicard) under GPL-3.0, with the goal of becoming an active alternative in the homelab community.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server components, route handlers, middleware |
| Language | TypeScript | Strict mode |
| Database | SQLite via Drizzle ORM | Single file, zero companion containers |
| Auth | NextAuth.js v5 (Auth.js) | Credentials + Plex/Jellyfin/Emby OAuth/token |
| Styling | Tailwind CSS | Dark-first design |
| Container | Docker + docker-compose | Single container, one volume mount |
| Email | Nodemailer | SMTP — configured in settings, optional |
| Package manager | npm | |

**No external hosted services.** Atrium must run entirely self-contained. No Supabase, no Vercel, no cloud dependencies.

---

## Folder Structure

```
atrium/
├── CLAUDE.md
├── README.md
├── LICENSE                         # GPL-3.0
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
│
├── data/                           # Docker volume mount — SQLite DB lives here
│   └── atrium.db
│
├── public/
│   ├── logo.png
│   └── icons/                      # Default tab icons
│
└── src/
    ├── app/
    │   ├── layout.tsx              # Root layout
    │   ├── page.tsx                # Redirects to /dashboard or /login
    │   │
    │   ├── (auth)/
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   └── layout.tsx
    │   │
    │   ├── (portal)/               # Authenticated user-facing routes
    │   │   ├── layout.tsx          # Sidebar + topbar shell
    │   │   ├── dashboard/
    │   │   │   └── page.tsx        # Home — enabled module widgets
    │   │   ├── calendar/
    │   │   │   └── page.tsx        # Sonarr/Radarr subscription calendar
    │   │   ├── stats/
    │   │   │   └── page.tsx        # Tautulli/Jellyfin stats
    │   │   ├── wrapped/
    │   │   │   └── page.tsx        # Annual Wrapped summary
    │   │   ├── messages/
    │   │   │   └── page.tsx        # Internal messaging
    │   │   ├── requests/
    │   │   │   └── page.tsx        # Overseerr bridge (pending requests)
    │   │   └── tab/
    │   │       └── [slug]/
    │   │           └── page.tsx    # iFrame loader for service tabs
    │   │
    │   ├── (admin)/                # Admin-only routes
    │   │   ├── layout.tsx
    │   │   ├── admin/
    │   │   │   ├── page.tsx        # Admin overview
    │   │   │   ├── tabs/
    │   │   │   │   └── page.tsx    # Tab manager
    │   │   │   ├── users/
    │   │   │   │   └── page.tsx    # User management
    │   │   │   ├── modules/
    │   │   │   │   └── page.tsx    # Enable/disable + configure modules
    │   │   │   └── settings/
    │   │   │       └── page.tsx    # Global settings (branding, SMTP, donation)
    │   │
    │   └── api/
    │       ├── auth/
    │       │   ├── [...nextauth]/
    │       │   │   └── route.ts    # NextAuth handler
    │       │   └── check/
    │       │       └── route.ts    # nginx auth_request endpoint
    │       ├── modules/
    │       │   ├── tautulli/
    │       │   │   └── route.ts    # Proxy + cache Tautulli API calls
    │       │   ├── sonarr/
    │       │   │   └── route.ts
    │       │   ├── radarr/
    │       │   │   └── route.ts
    │       │   ├── jellyfin/
    │       │   │   └── route.ts
    │       │   └── overseerr/
    │       │       └── route.ts
    │       ├── webhooks/
    │       │   └── route.ts        # Inbound webhook receiver
    │       ├── messages/
    │       │   └── route.ts
    │       └── subscriptions/
    │           └── route.ts
    │
    ├── components/
    │   ├── ui/                     # Base components (button, card, modal, badge etc.)
    │   ├── layout/
    │   │   ├── Sidebar.tsx
    │   │   ├── Topbar.tsx
    │   │   └── ModuleGate.tsx      # Renders children only if module is enabled
    │   ├── modules/
    │   │   ├── CalendarRolodex.tsx # Poster-based subscription calendar
    │   │   ├── NowPlaying.tsx      # Live Tautulli session widget
    │   │   ├── StatsWidget.tsx     # Summary stats card
    │   │   ├── WrappedView.tsx     # Annual summary full page
    │   │   ├── OverseerrInbox.tsx  # Request approval widget
    │   │   └── DonationButton.tsx  # Ko-fi / PayPal / BMaC
    │   └── admin/
    │       ├── TabEditor.tsx
    │       ├── UserTable.tsx
    │       └── ModuleToggle.tsx
    │
    ├── lib/
    │   ├── db/
    │   │   ├── index.ts            # Drizzle client (SQLite)
    │   │   └── schema.ts           # All table definitions
    │   ├── auth/
    │   │   └── config.ts           # NextAuth config
    │   ├── modules/
    │   │   ├── tautulli.ts         # Tautulli API client
    │   │   ├── sonarr.ts           # Sonarr API client
    │   │   ├── radarr.ts           # Radarr API client
    │   │   ├── jellyfin.ts         # Jellyfin API client
    │   │   └── overseerr.ts        # Overseerr API client
    │   ├── cache.ts                # In-memory TTL cache (24hr default)
    │   ├── webhooks.ts             # Webhook event router
    │   └── notifications.ts        # Email notification dispatch
    │
    ├── hooks/
    │   ├── useModules.ts           # Returns enabled modules for current user
    │   └── useSubscriptions.ts
    │
    └── types/
        ├── modules.ts
        ├── user.ts
        └── tabs.ts
```

---

## Database Schema (SQLite via Drizzle)

### `users`
| Column | Type | Notes |
|---|---|---|
| id | text (uuid) | PK |
| username | text | Unique |
| email | text | Unique |
| password_hash | text | Nullable (SSO users have no password) |
| role | text | `admin` \| `user` |
| plex_token | text | Nullable |
| jellyfin_user_id | text | Nullable |
| avatar_url | text | Nullable |
| created_at | integer | Unix timestamp |

### `tabs`
| Column | Type | Notes |
|---|---|---|
| id | text (uuid) | PK |
| label | text | Display name |
| url | text | Service URL |
| icon | text | Icon filename or URL |
| order | integer | Sort order |
| min_role | text | `admin` \| `user` |
| open_in_iframe | boolean | False = new tab |
| enabled | boolean | |

### `settings`
| Column | Type | Notes |
|---|---|---|
| key | text | PK |
| value | text | JSON-encoded |

*All module API keys, SMTP config, branding, donation links stored here as key/value.*

### `modules`
| Column | Type | Notes |
|---|---|---|
| id | text | Module slug e.g. `tautulli`, `sonarr` |
| enabled | boolean | |
| config | text | JSON-encoded per-module config |

### `subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | text (uuid) | PK |
| user_id | text | FK → users |
| media_type | text | `show` \| `movie` |
| sonarr_id | integer | Nullable |
| radarr_id | integer | Nullable |
| title | text | |
| poster_url | text | Nullable |
| notify_email | boolean | |
| created_at | integer | |

### `messages`
| Column | Type | Notes |
|---|---|---|
| id | text (uuid) | PK |
| from_user_id | text | FK → users |
| to_user_id | text | FK → users (null = broadcast to all admins) |
| subject | text | |
| body | text | |
| read | boolean | |
| created_at | integer | |

### `stats_cache`
| Column | Type | Notes |
|---|---|---|
| key | text | PK — e.g. `tautulli:wrapped:user123:2024` |
| data | text | JSON-encoded API response |
| expires_at | integer | Unix timestamp |

---

## Module System

Each module has a slug, a list of required settings keys, and a list of features it unlocks.

| Module Slug | Required Settings | Unlocks |
|---|---|---|
| `tautulli` | `tautulli_url`, `tautulli_api_key` | Stats widget, Wrapped, Now Playing |
| `sonarr` | `sonarr_url`, `sonarr_api_key` | Calendar (TV), Subscriptions (TV) |
| `radarr` | `radarr_url`, `radarr_api_key` | Calendar (Movies), Subscriptions (Movies) |
| `jellyfin` | `jellyfin_url`, `jellyfin_api_key` | SSO, Stats (Jellyfin), Now Playing |
| `overseerr` | `overseerr_url`, `overseerr_api_key` | Request inbox widget |
| `smtp` | `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_from` | Email notifications |
| `webhooks` | _(none — generates a secret key)_ | Webhook receiver, push notifications to subscribers |
| `donations` | `donation_provider`, `donation_url`, `donation_label` | Donation button in UI |
| `demo` | _(none)_ | Demo mode — populates dashboard with dummy data |

`ModuleGate` component checks module enabled status before rendering any module UI. Disabled modules are invisible — no placeholders, no errors.

---

## Auth Architecture

### Credentials (local accounts)
Username/password stored with bcrypt hash. Admin creates user accounts — no public self-registration.

### Plex SSO
1. User clicks "Sign in with Plex"
2. Redirected to Plex OAuth (`app.plex.tv/auth`)
3. Plex returns token — verify against `plex.tv/users/account` API
4. Match email to existing Atrium user or auto-create user account with `user` role
5. Store `plex_token` on user record for future Tautulli per-user lookups

### Jellyfin SSO
1. User provides Jellyfin username/password in Atrium login form
2. Atrium proxies to `POST /Users/AuthenticateByName` on configured Jellyfin instance
3. On success, creates/matches Atrium user, stores `jellyfin_user_id`

### nginx auth_request
`GET /api/auth/check` returns:
- `200` — valid session cookie present and user role is sufficient
- `401` — no session or insufficient role

nginx config snippet (provided in docs):
```nginx
auth_request /auth;
auth_request_set $auth_status $upstream_status;
location = /auth {
    internal;
    proxy_pass http://atrium:3000/api/auth/check;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
}
```

---

## iFrame & Reverse Proxy Notes

Services behind a reverse proxy will send `X-Frame-Options: SAMEORIGIN` by default. Users must strip this header in their nginx proxy config for each service they want to iFrame:

This is a **documented setup requirement**, not something Atrium handles. Atrium's docs will include per-service nginx snippets for common apps (Sonarr, Radarr, Overseerr, Immich etc.).

---

## Docker Setup

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
services:
  atrium:
    image: lffpicard/atrium:latest
    container_name: atrium
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NEXTAUTH_SECRET=changeme_generate_a_real_secret
      - NEXTAUTH_URL=https://yourdomain.com
      - DATABASE_URL=/app/data/atrium.db
    restart: unless-stopped
```

**The `./data` volume is the only thing users need to back up.** It contains the SQLite database — all settings, users, tabs, messages, subscriptions, and cache.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | Yes | Random string — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Full URL Atrium is served from |
| `DATABASE_URL` | Yes | Path to SQLite file — default `/app/data/atrium.db` |

All other configuration (API keys, SMTP, branding) is stored in the `settings` table and managed via the admin UI. No `.env` changes needed post-setup.

---

## Phase Plan

### Phase 1 — Core (v1.0)
- Docker container, SQLite, Drizzle ORM
- Login (credentials + Plex SSO)
- Admin tab manager with iFrame loader
- nginx `auth_request` endpoint
- User management (admin creates/deletes users, sets roles)
- Module enable/disable system
- Admin settings panel (branding, API keys, donation button)
- Tautulli stats widget
- Sonarr + Radarr poster rolodex calendar
- Per-user show/movie subscriptions (filter calendar to your content)
- Internal messaging (user → admin)
- Demo mode (dummy data for unauthenticated preview)
- Donation button (Ko-fi, PayPal, Buy Me a Coffee, Liberapay)

### Phase 2 — Personalisation (v1.5)
- Email notifications via SMTP (new episode of subscribed show etc.)
- Webhook receiver (Sonarr/Radarr/Tautulli → notify subscribed users)
- Jellyfin SSO + stats
- Overseerr request inbox widget (admin approve/deny without leaving Atrium)
- Now Playing widget (live Tautulli sessions)
- "What Should I Watch Tonight?" recommendation widget

### Phase 3 — Platform (v2.0)
- Wrapped annual stats (full Spotify-style summary pulled from Tautulli/Jellyfin)
- Leaderboard / social stats (opt-in per user)
- Multi-server support (multiple Plex/Jellyfin/Sonarr instances)
- Push notifications (web push)
- Emby support

---

## Coding Conventions

- TypeScript strict mode throughout
- Server Components by default — use `"use client"` only where interactivity requires it
- All external API calls go through `src/lib/modules/` clients — never call third-party APIs directly from components
- Module config accessed via `getModuleConfig(slug)` helper — throws if module is disabled
- `ModuleGate` wraps any module UI — never conditionally render module content inline
- Drizzle for all DB access — no raw SQL except in migrations
- All API routes validate session before responding — no unauthenticated data exposure
- Tailwind only — no CSS modules, no inline styles
- Dark theme is default — light theme optional via settings toggle

---

## Repository Info

- GitHub: `github.com/LFFPicard/atrium`
- Licence: GPL-3.0
- Docker Hub: `lffpicard/atrium`
- Ko-fi: `ko-fi.com/baggins83`

---

## Notes for Claude

- This is a self-hosted GPL project — never introduce dependencies on external hosted services
- SQLite path is always from `DATABASE_URL` env var — never hardcoded
- The `data/` directory is the only persistent volume — keep all runtime state inside it
- When adding a new module, always add: slug to module list, settings keys to settings schema, a `ModuleGate` wrapper on any UI, and a section in the docs
- nginx config snippets for new service iFrame setups should be added to `docs/nginx-snippets.md`
- Check `modules` table before any module API call — if module is disabled, return early with null rather than erroring
