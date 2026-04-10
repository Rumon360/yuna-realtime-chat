# Username Change on Home Page — Design Spec

**Date:** 2026-04-11  
**Status:** Approved

## Problem

The username display on the home page is a static box. Users cannot change their anonymous identity before entering a room.

## Goal

Clicking the username box turns it into an editable input. Saving persists the new name to `localStorage` and updates the displayed value.

## Architecture

Two units, each with one responsibility:

- **`useUsername` hook** — owns username state and persistence (`localStorage`)
- **`Lobby` component** — owns the edit/view toggle UI

## `useUsername` Hook Changes (`src/hooks/use-username.tsx`)

Add a `setUsername` function alongside the existing `username` value:

```ts
function useUsername() {
  // ...existing state...
  
  const updateUsername = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem(STORAGE_KEY, trimmed)
    setUsername(trimmed)
  }

  return { username, setUsername: updateUsername }
}
```

No other changes to the hook — generation and hydration logic stay the same.

## `Lobby` Component Changes (`src/app/page.tsx`)

Add `isEditing` boolean state and a `draft` string state (the in-progress value before save).

**View mode** (default): the existing styled div renders the username. It gets `cursor-pointer` and a subtle hover style to hint it's clickable. Clicking sets `isEditing = true` and initializes `draft` to the current username.

**Edit mode**: the div is replaced with a same-sized `<input>` pre-filled with `draft`. Auto-focused. Keyboard and blur handlers:

- `Enter` — trim draft, call `setUsername` if non-empty, exit edit mode
- `Escape` — discard draft, exit edit mode without saving
- `blur` — same as Enter (save if valid, revert if empty)

**Validation:** trim and reject empty strings. On invalid input, silently revert to the previous username (no error UI needed).

## Data Flow

```
User clicks box
  → isEditing = true, draft = username
  → <input> renders with draft value

User types
  → draft updates on every keystroke (controlled input)

User presses Enter / blurs
  → trimmed draft non-empty → setUsername(draft) → localStorage updated → isEditing = false
  → trimmed draft empty → isEditing = false (no save, reverts to previous)

User presses Escape
  → isEditing = false (no save)
```

## No Changes To

- Chat room page (`src/app/room/[roomId]/page.tsx`) — already reads from `localStorage` via `useUsername` on mount
- Server, API routes, realtime schema
- Encryption logic
