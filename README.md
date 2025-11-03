## Project Overview

A native macOS desktop application that provides seamless access to Google Tasks, offering a more powerful and convenient task management experience compared to the web interface or mobile app. The app will sync with your existing Google Tasks data, allowing you to manage your tasks efficiently from your Mac desktop.

## Core Objective

Create a lightweight, fast, and intuitive desktop application that makes task management on Mac as effortless as possible, with native macOS integration and enhanced productivity features.

## Key Features

### Essential Features (MVP)

- **Google Account Integration**
    
    - OAuth 2.0 authentication with Google
    - Automatic sync with Google Tasks API
    - Support for multiple Google accounts
- **Task Management**
    
    - Create, edit, and delete tasks
    - Mark tasks as complete/incomplete
    - Add task details and notes
    - Set due dates and times
    - Organize tasks into lists
- **List Management**
    
    - Create, rename, and delete task lists
    - Switch between different lists
    - Default list selection
- **Native macOS Integration**
    
    - Menu bar icon for quick access
    - Keyboard shortcuts for common actions
    - Native notifications for due tasks
    - Light and dark mode support

### Enhanced Features

- **Quick Add**
    
    - Global keyboard shortcut to add tasks from anywhere
    - Quick add window that appears over other apps
    - Natural language date parsing (e.g., "tomorrow", "next Friday")
- **Smart Views**
    
    - Today view (tasks due today)
    - Upcoming view (tasks due in the next 7 days)
    - All tasks view
    - Completed tasks view
- **Search and Filter**
    
    - Full-text search across all tasks
    - Filter by list, date, or completion status
    - Recent tasks quick access
- **Productivity Features**
    
    - Subtasks support (if using list hierarchy)
    - Drag and drop to reorder tasks
    - Bulk operations (complete/delete multiple tasks)
    - Task priority indicators
- **Offline Support**
    
    - Local caching of tasks
    - Work offline and sync when connected
    - Conflict resolution for offline changes

## Technical Stack

### Electron (Web Technologies)

- **Pros**: Cross-platform, easier development, rich ecosystem
- **Stack**: Electron, React/Vue, TypeScript, Tailwind CSS

## User Experience Highlights

- **Minimal Design**: Clean, distraction-free interface focused on tasks
- **Fast Access**: Menu bar app that's always one click away
- **Keyboard-First**: Complete task management without touching the mouse
- **Sync Indicator**: Clear visual feedback on sync status
- **Offline Ready**: Never lose access to your tasks

## Success Metrics

- Fast launch time (< 2 seconds)
- Minimal memory footprint (< 150MB)
- Sync latency (< 1 second for typical operations)
- User satisfaction with native feel
- Daily active usage

## Competitive Advantages

- **Native Experience**: Unlike the web app, provides true Mac integration
- **Always Accessible**: Menu bar presence beats opening a browser
- **Faster**: Direct API access without browser overhead
- **Privacy**: No third-party tracking, direct Google integration only
- **Free**: Open source or one-time purchase vs. subscription

## Resources Needed

- Google Cloud Console project for OAuth credentials
- Google Tasks API documentation
- Design assets (app icon, menu bar icon)
- Testing environment
- Mac for development and testing

## Getting Started

Install dependencies once:

```bash
npm install
```

Start the Electron + Vite development workspace:

```bash
npm run dev
```

Additional commands:

- `npm run lint` runs ESLint with type-aware rules.
- `npm run typecheck` validates TypeScript project references.
- `npm test` runs Vitest (passes with no tests until suites are added).
- `npm run build` bundles the main, preload, and renderer targets into `out/`.
- `npm run preview` serves the production renderer bundle with Electron in preview mode.
- `npm run clean` removes build artefacts (`out/` and `release/`).

### Environment files

The app loads credentials from the first matching file it finds (later files override earlier ones):

1. `config/.env.local`
2. `config/.env.production`
3. `config/.env`
4. `.env.local`
5. `.env`

During development copy the example file and fill in your desktop OAuth client values:

```bash
cp config/.env.example config/.env.local
```

When preparing a distributable build, create `config/.env.production` with the credentials you intend to ship. The file is excluded from Git but will be bundled into the installer.

## Configure Google OAuth

1. Copy the sample environment file and populate it with your Google Cloud OAuth credentials:

   ```bash
   cp config/.env.example .env.local
   ```

2. Update `.env.local` with the desktop client ID and secret from your Google Cloud project.

3. Ensure the OAuth consent screen includes the Google Tasks scopes used by this app (`https://www.googleapis.com/auth/tasks`) and that `http://127.0.0.1` is an allowed redirect domain.
4. If the project is still in "Testing" mode on the Google Cloud OAuth consent screen, add any Google account you plan to sign in with under **Test users**.

Tokens are stored locally under the Electron user data directory (e.g. `~/Library/Application Support/google-tasks-desktop/`) so you can iterate safely.

## Create downloadable builds

1. Ensure `config/.env.production` exists with the credentials you want to embed.
2. Build a macOS installer:

   ```bash
   npm run package:mac
   ```

   This runs the production build and produces a signed-but-not-notarised DMG under `release/<version>/`. Upload the DMG to your website for distribution.

The standard `npm run package` script produces platform-specific installers based on the host OS (e.g. DMG on macOS). If you need notarisation or additional targets, extend `electron-builder.yml` accordingly.
