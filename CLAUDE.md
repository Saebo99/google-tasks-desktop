# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a native macOS desktop application for Google Tasks built with Electron, React, TypeScript, and Tailwind CSS. The app provides a menu bar presence with quick access, keyboard-first navigation, and offline support with sync to the Google Tasks API.

## Architecture & Technical Stack

### Core Technologies
- **Electron**: Desktop application framework
- **React**: UI framework (TypeScript)
- **Tailwind CSS**: Styling
- **Google Tasks API**: Backend integration via OAuth 2.0

### Key Architectural Components

**Main Process (Electron)**
- Menu bar integration and system tray
- OAuth authentication flow
- Background sync service
- Native notifications
- Global keyboard shortcuts

**Renderer Process (React)**
- Task list views (Today, Upcoming, All, Completed)
- Task CRUD operations UI
- Quick add window
- Search and filter interface

**Data Layer**
- Local SQLite/IndexedDB for offline caching
- Google Tasks API client
- Sync engine with conflict resolution
- Multi-account support

### Authentication Flow
OAuth 2.0 with Google using Electron's `BrowserWindow` for the auth flow. Store refresh tokens securely using electron-store or keytar for macOS Keychain integration.

### Performance Targets
- Launch time: < 2 seconds
- Memory footprint: < 150MB
- Sync latency: < 1 second for typical operations

## Development Commands

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build for macOS
npm run build:mac

# Run tests
npm test

# Run specific test file
npm test -- path/to/test.spec.ts

# Lint
npm run lint

# Type check
npm run type-check
```

## Project Structure (Planned)

```
src/
├── main/           # Electron main process
│   ├── auth/      # OAuth flow
│   ├── sync/      # Background sync service
│   └── tray/      # Menu bar integration
├── renderer/       # React application
│   ├── components/ # UI components
│   ├── hooks/     # React hooks
│   ├── services/  # API clients
│   └── store/     # State management
└── shared/         # Shared types and utilities
```

## Google Tasks API Integration

- Use `@googleapis/tasks` npm package for API access
- API Documentation: https://developers.google.com/tasks/reference/rest
- Required OAuth scopes: `https://www.googleapis.com/auth/tasks`
- Rate limits: Be mindful of quota limits, implement exponential backoff

### Key API Endpoints
- `tasks.tasklists.list`: Get all task lists
- `tasks.tasks.list`: Get tasks in a list
- `tasks.tasks.insert`: Create a new task
- `tasks.tasks.update`: Update an existing task
- `tasks.tasks.delete`: Delete a task

## Offline Support & Sync Strategy

1. All operations work offline-first against local cache
2. Queue mutations while offline
3. Sync on reconnection with conflict resolution:
   - Server timestamp wins for conflicts
   - Preserve local changes not yet synced
4. Use task `etag` for optimistic concurrency control

## Native macOS Integration

- **Menu Bar**: Use `electron.Tray` for persistent menu bar presence
- **Notifications**: Use `electron.Notification` for due date reminders
- **Global Shortcuts**: Register with `globalShortcut.register()`
- **Theme**: Listen to `nativeTheme.on('updated')` for light/dark mode
- **App Icon**: Provide icon.icns for macOS

## Security Considerations

- Never commit OAuth credentials or API keys
- Use environment variables for development credentials
- Store tokens in macOS Keychain via keytar
- Implement PKCE flow for OAuth
- Validate all API responses
- Sanitize user input to prevent XSS

## State Management

Consider using Zustand or Jotai for lightweight state management that fits the small app scope. Avoid Redux overhead unless complexity grows significantly.

## Testing Strategy

- Unit tests for business logic and API clients (Jest)
- Integration tests for sync engine
- E2E tests for critical user flows (Playwright)
- Test offline scenarios and conflict resolution

## Common Patterns

**Natural Language Date Parsing**: Use `chrono-node` for parsing dates from user input (e.g., "tomorrow", "next Friday").

**Debounced Sync**: Debounce rapid changes before syncing to avoid API rate limits.

**Error Handling**: Show user-friendly error messages for network failures, API errors, and auth issues. Maintain a persistent error log for debugging.
