# FIXES_IMPROVEMENTS.md — Atrium

This document tracks known bugs, UI fixes, and planned improvements discovered during live testing.
Work through Pass 1 fully before starting Pass 2. Each section is ordered by priority within that pass.

---

## Pass 1 — Make It Solid

### 🐛 Bug Fixes

#### 1. Image Proxy Not Working (Critical — affects posters everywhere)
**Issue:** Tautulli images are being sent as raw Tautulli URLs directly to the browser instead of being
proxied through Atrium's API. When opened in a new tab they hit Tautulli's auth wall and show a broken
login prompt. This breaks posters in Now Playing, Recently Added, Calendar, and Wrapped everywhere.

**Fix:** Audit `src/app/api/modules/tautulli/route.ts` — the `get_image` proxy handler must intercept
all image requests, fetch the image server-side using the stored API key, and pipe the raw bytes back
to the client with appropriate `Content-Type` and `Cache-Control` headers. The API key must never reach
the browser. All components using Tautulli images must reference `/api/modules/tautulli?cmd=get_image&...`
not the raw Tautulli URL.

---

#### 2. "Missing Config" False Positive on Connected Modules
**Issue:** Radarr, Sonarr, and Overseerr/Seerr connect successfully (test passes) but the module card
still shows "missing config" status. The configured status check is likely treating empty string values
or already-saved values incorrectly.

**Fix:** Review `isModuleConfigured()` in `src/lib/modules.ts` — ensure it checks that required fields
are non-empty strings after trimming whitespace. The status dot should reflect the last *saved* config
state, not the live form state.

---

#### 3. Navbar Missing on All Portal Pages
**Issue:** Every portal route loses the navbar/sidebar when navigated to. The layout shell is not
persisting across route changes — likely the portal layout is not wrapping all routes correctly or
PortalShell is unmounting on navigation.

**Fix:** Audit `src/app/(portal)/layout.tsx` and `PortalShell.tsx` — ensure the shell wraps all child
routes and is not being re-mounted on every navigation. Check that the route group structure matches
the folder structure exactly.

---

#### 4. iFrame Tabs Loading as ~20px Strip
**Issue:** Service tabs (e.g. Sonarr) added as iFrame tabs open but render as a tiny white strip
instead of filling the content area. The iFrame is not being told to fill the available viewport height.

**Fix:** In `src/app/(portal)/tab/[slug]/page.tsx` ensure the iFrame has explicit height styling:
`style={{ width: '100%', height: 'calc(100vh - 56px)', border: 'none' }}` where 56px is the topbar
height. The parent container must also be `h-full` with no implicit padding creating overflow.

---

#### 5. Wrapped Server-Side Error
**Issue:** Wrapped page throws a server-side exception. Most likely caused by the Tautulli API returning
unexpected data structure now that the API endpoint is fixed to `/api/v2`.

**Fix:** Audit `src/lib/wrapped.ts` — add defensive null checks and fallback values throughout the data
processing pipeline. No field from the Tautulli API should be assumed to exist. Wrap the full data fetch
in a try/catch that returns a partial `WrappedSummary` with available data rather than throwing.

---

#### 6. All Requests Showing Raw IDs Instead of Metadata
**Issue:** The All Requests tab shows entries like "TV #67235" instead of show titles and posters.
Overseerr/Seerr returns TVDB/TMDB IDs in its requests payload but the metadata (title, poster) needs
to be pulled from the same response object — Seerr includes it, we just aren't reading it correctly.

**Fix:** Audit the Overseerr API response shape in `src/app/(portal)/requests/RequestsClient.tsx` —
Seerr's `/api/v1/requests` endpoint returns nested `media` objects with `title`, `posterPath` etc.
Map these correctly rather than falling back to the raw media ID.

---

#### 7. Uptime Monitor Not Showing Status
**Issue:** Four services are connected and configured but the uptime widget shows no status. The
background poller may not be running, or the checks may not be auto-created when modules are enabled.

**Fix:** Verify `instrumentation.ts` is being picked up correctly in the Docker environment — check
server logs for `[atrium] poller started` message on boot. Verify `syncModuleUptimeCheck()` is being
called when modules are saved and that rows are being created in `uptime_checks`. Add explicit startup
logging to the poller so it's visible in container logs.

---

### 🔧 Rename: Overseerr → Seerr
**Issue:** The app refers to Overseerr throughout but the correct modern branding used by most homelab
users is Seerr (Jellyseerr/Overseerr are both supported under this name).

**Fix:** Global find and replace — all UI labels, module names, settings keys, and display strings
should read "Seerr" not "Overseerr". Internal code variable names (`overseerr`) can stay as-is for
consistency — this is a display/label change only.

---

### 🎨 Layout & UI Fixes

#### 8. Now Playing Widget — Full Width Cards
**Issue:** Each active stream renders as a full-width card making the widget enormous with multiple
streams.

**Fix:** Refactor `src/components/modules/NowPlayingWidget.tsx` to use a responsive grid layout —
`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. Each card should be compact: poster thumbnail on the
left, metadata and progress bar on the right. Maximum card height ~120px.

---

#### 9. Uptime Widget — Vertical List Taking 50% Width
**Issue:** The uptime status widget renders as a vertical list and takes up too much dashboard space.

**Fix:** Refactor `src/components/modules/UptimeWidget.tsx` to a horizontal fluid layout — each
service is a small pill/badge showing an icon, service name, and status dot. Use `flex flex-wrap gap-2`
so it auto-adjusts based on number of services and container width. Full width, compact height.

---

#### 10. Messages Page Causing Scrollbar
**Issue:** The messages two-panel layout overflows its container creating an unwanted scrollbar.

**Fix:** Constrain `src/app/(portal)/messages/MessagesClient.tsx` to `h-[calc(100vh-56px)]` with
`overflow-hidden` on the outer container. Each panel scrolls independently within its own bounded area.

---

#### 11. Stats Heatmap — Unreadable Text
**Issue:** Day of week and hour of day heatmap labels are grey text on a bright teal background —
nearly invisible.

**Fix:** In the stats heatmap components, ensure label text uses `var(--color-text)` not a hardcoded
colour. The heatmap cell colour intensity should use opacity variants of the accent colour rather than
the full accent colour for high-value cells, keeping text readable at all intensity levels.

---

#### 12. Admin Overview Page Empty
**Issue:** The admin overview page at `/admin` just shows "Admin Overview" with no content.

**Fix:** Build out `src/app/(admin)/admin/page.tsx` with a useful admin at-a-glance dashboard:
- System summary cards — total users, active modules, tabs configured, uptime checks
- Recent activity — last 5 logins, last 5 messages received
- Module status summary — which modules are enabled/configured/failing
- Quick links to each admin section
- Atrium version number

---

#### 13. Test Connection Before Save
**Issue:** Users can save module config without testing the connection first, leading to silent failures
showing as "missing config".

**Fix:** In `ModulesClient.tsx` — when all required fields are filled, show a "Test Connection" prompt
before the Save button becomes fully active. Save can still proceed without testing (don't block it)
but add a visible warning: "Connection untested — consider testing before saving."

---

### 🔧 Minor Fixes

#### 14. Add Footer
Add a simple footer to the portal layout containing:
- Atrium version number (read from `package.json`)
- Copyright notice
- Link to GitHub repository
- Link to GitHub Wiki (help/docs)

Footer should be subtle — small text, muted colour, not competing with content.

---

#### 15. Donations — Placement Options
**Issue:** Donation button placement is hardcoded. Should be configurable.

**Fix:** Add a `donation_placement` setting with options: `sidebar` (bottom of sidebar above user),
`footer` (in the footer), `dashboard` (widget on dashboard). Apply the placement setting when rendering
`DonationWidget.tsx`.

---

---

## Pass 2 — Make It Great

### ✨ New Features

#### 1. Seerr-Powered Subscription Search
**Overview:** When subscribing to a show or movie from the calendar, instead of browsing the raw
Sonarr/Radarr library, use Seerr's search API to find content with full TMDB/TVDB metadata and posters.

**Implementation:**
- Add a search input to the subscriptions/calendar UI
- Call `GET /api/v1/search?query={term}` on the configured Seerr instance via
  `/api/modules/overseerr?endpoint=search&query={term}`
- Display results with poster, title, year, and media type
- Subscribe button stores TMDB/TVDB ID and metadata in the `subscriptions` table
- This also enables users to subscribe to content not yet in their Sonarr/Radarr library

---

#### 2. Calendar — Theatrical vs Digital Release Filter
**Overview:** The calendar currently shows all Radarr entries. Users care most about what they can
actually watch (digital/streaming release) vs what's in cinemas.

**Implementation:**
- Add filter tabs to the calendar: **All** / **In Cinemas** / **Digital/Streaming**
- Radarr's API returns `inCinemas` and `digitalRelease` date fields — use these to categorise
- Default view should be Digital/Streaming as most homelab users care about home availability
- "My Shows" subscription filter should work across all tabs

---

#### 3. Drag and Drop Dashboard Widgets
**Overview:** Users can rearrange their dashboard widgets by dragging and dropping.

**Implementation:**
- Use `dnd-kit` (already familiar from garythwaites-hub kanban)
- Widget order stored as JSON array in `users` table under a `dashboard_layout` column
- New migration required
- Each user has their own independent layout
- Admin can set a default layout that applies to new users
- Reset to default button in user preferences

---

#### 4. Image Asset System
**Overview:** Atrium needs a way to serve images for use in tabs, donations, and branding. Organizr
ships with a built-in library of common service icons.

**Implementation:**
- Mount a `/app/data/uploads/` directory (already within the data volume)
- Build an image upload endpoint: `POST /api/uploads` (admin only, images only, max 2MB)
- Ship a bundled set of common homelab service icons (Sonarr, Radarr, Plex, Jellyfin, Immich etc.)
  stored in `public/icons/services/`
- In the tab editor and settings — show bundled icons as selectable options before the custom upload
  field

---

#### 5. Theme Import / Export
**Overview:** Allow sharing of custom themes as JSON files.

**Implementation:**
- Export: `GET /api/settings/theme/export` — returns current theme vars as a downloadable JSON file
- Import: `POST /api/settings/theme/import` — accepts a JSON file, validates all required CSS
  variable keys are present, applies as a custom theme
- In the Appearance settings — "Export Theme" and "Import Theme" buttons
- Community themes can be shared as `.json` files and dropped straight in

---

#### 6. Configurable Stats (Admin)
**Overview:** Admin controls which stats sections are shown and in what order. Users see the
admin-configured layout.

**Implementation:**
- Add a `stats_config` settings key storing an ordered array of enabled stat section IDs:
  `plays_over_time`, `heatmap_dow`, `heatmap_hod`, `top_shows`, `top_movies`, `top_users`,
  `platform_breakdown`, `summary_cards`
- Admin stats settings page — toggle and drag to reorder sections
- Add time range selector to stats page: `30 days` / `6 months` / `12 months` / `All time`
  (passed as `time_range` param to Tautulli API)
- Add niche/unique stat: **Most Abandoned** — movies/shows started but never watched past 80%
  (requires `get_history` with watch percentage filtering)

---

#### 7. Emby Module
**Overview:** Emby support alongside Plex and Jellyfin.

**Implementation:**
- Add `emby` to `MODULE_DEFINITIONS` in `src/lib/modules.ts`
- Required config: `emby_url`, `emby_api_key`
- Create `src/lib/modules/emby.ts` API client
- Create `src/app/api/modules/emby/route.ts` proxy route
- Emby's API is near-identical to Jellyfin's — the client can share most logic
- Add connection test handler in `src/lib/module-tests.ts`
- Add uptime sync for Emby in `src/lib/uptime/sync.ts`

---

#### 8. Plex SSO Login
**Overview:** Users sign in with their Plex account. If they are a member of the server, they are
automatically granted access. No manual user creation required. Users removed from Plex lose access
on next login attempt.

**Implementation:**
- Add Plex OAuth flow to NextAuth config — redirect to `app.plex.tv/auth`, receive token
- On callback: verify token against `plex.tv/users/account`, check they appear in the server's
  friend/user list via `plex.tv/api/home/users` or the Plex Media Server API
- Auto-create Atrium user on first login with role `user`
- On subsequent logins: re-verify server membership — if removed from Plex, deny access
- Admin account remains credentials-based as fallback
- Add "Sign in with Plex" button to login page alongside existing credentials form

---

#### 9. Atrium Logo, Favicon and Docker Icon
**Overview:** Atrium needs its own visual identity.

**Implementation:**
- Design a simple logo — suggested concept: a stylised Roman atrium (columns/archway) or abstract
  geometric mark that works at small sizes
- `public/favicon.ico` and `public/icon.png` (512x512 for PWA)
- Docker Hub repository icon
- Logo used in sidebar, login page, and browser tab
- Consider commissioning via Fiverr (~£30-50) or designing in Figma

---

#### 10. Lidarr + Random Song Widget (Fun Feature)
**Overview:** A lightweight music discovery widget that grabs a random track from your Plex music
library and plays it inline.

**Implementation:**
- Add `lidarr` module for library awareness (what artists/albums you have)
- Random song widget calls Plex's `/library/sections/{musicLibraryId}/all?type=10&sort=random`
  to get a random track
- Streams via Plex's `/stream` endpoint with the user's Plex token
- Simple inline player: album art, track title, artist, play/pause, skip
- "Shuffle my library" button for a new random track
- Opt-in widget — disabled by default, user enables from dashboard settings

---

### 🎨 UI/UX Improvements (Pass 2)

#### Settings Page Redesign
**Issue:** Settings is left-aligned vertical list, looks sparse.

**Fix:**
- Split Appearance into its own full page (it has enough content to warrant this)
- Remaining settings (General, Donations, SMTP, Login Page) on a single page using a
  two-column card grid layout — each section is a card filling the available space
- Settings cards use subtle borders and section headers
- Add a "Danger Zone" section at the bottom for destructive actions (reset to defaults etc.)

---

## Notes for Claude Code

When working through Pass 1, tackle fixes in this order:
1. Navbar fix (#3) — everything else is hard to test without navigation working
2. Image proxy fix (#1) — affects the most visible parts of the app
3. iFrame height fix (#4) — core functionality
4. Missing config false positive (#2) — affects all modules
5. Wrapped error (#5) — once Tautulli is confirmed working
6. All Requests metadata (#6)
7. Uptime monitor (#7)
8. Layout/UI fixes (#8-#15) — can be batched into one CC session

Do not start Pass 2 until Pass 1 is fully verified on the live Unraid instance.
