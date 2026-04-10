# Username Change on Home Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users click their username on the home page to edit it inline, persisting the new value to `localStorage`.

**Architecture:** `useUsername` hook gains a `setUsername` function that validates and persists. `Lobby` adds `isEditing` + `draft` state — clicking the display box enables edit mode, Enter/blur saves, Escape cancels.

**Tech Stack:** Next.js 14, React, TypeScript — changes confined to two files.

---

### Task 1: Expose `setUsername` from `useUsername` hook

**Files:**
- Modify: `src/hooks/use-username.tsx`

- [ ] **Step 1: Add `updateUsername` and return it as `setUsername`**

  Replace the entire file content:

  ```tsx
  import { nanoid } from "nanoid"
  import { useEffect, useState } from "react"

  const ANIMALS = [
    "wolf",
    "fox",
    "cat",
    "dog",
    "bear",
    "lion",
    "tiger",
    "rabbit",
    "deer",
  ]

  const STORAGE_KEY = "chat_username"

  const generateUsername = () => {
    const word = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
    return `anonymouse-${word}-${nanoid(5)}`
  }

  function useUsername() {
    const [username, setUsername] = useState("")

    useEffect(() => {
      const main = () => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          setUsername(stored)
          return
        }

        const generated = generateUsername()
        localStorage.setItem(STORAGE_KEY, generated)
        setUsername(generated)
      }
      main()
    }, [])

    const updateUsername = (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      localStorage.setItem(STORAGE_KEY, trimmed)
      setUsername(trimmed)
    }

    return { username, setUsername: updateUsername }
  }

  export default useUsername
  ```

- [ ] **Step 2: Verify build**

  Run: `npm run build`  
  Expected: No TypeScript errors. The existing consumers of `useUsername` destructure only `{ username }` so the new `setUsername` field is additive and causes no breakage.

- [ ] **Step 3: Commit**

  ```bash
  git add src/hooks/use-username.tsx
  git commit -m "feat: expose setUsername from useUsername hook"
  ```

---

### Task 2: Inline edit UI in `Lobby`

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add `isEditing` and `draft` state, wire up `setUsername`**

  In `src/app/page.tsx`, update the `Lobby` function. Replace:

  ```tsx
  const { username } = useUsername()
  ```

  With:

  ```tsx
  const { username, setUsername } = useUsername()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState("")
  ```

  Make sure `useState` is already imported — it is via `import { Suspense } from "react"`. Update that import to:

  ```tsx
  import { Suspense, useState } from "react"
  ```

- [ ] **Step 2: Add save and cancel handlers**

  Add these two functions inside `Lobby`, after the state declarations:

  ```tsx
  const commitEdit = () => {
    const trimmed = draft.trim()
    if (trimmed) setUsername(trimmed)
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setIsEditing(false)
  }
  ```

- [ ] **Step 3: Replace the static username display with the toggle UI**

  Find and replace this block in the JSX:

  ```tsx
  <div className="bg-linear-hover border border-linear-border rounded-xl px-4 py-3 text-base font-[510] text-linear-text tracking-tight mb-5">
    {username}
  </div>
  ```

  With:

  ```tsx
  {isEditing ? (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commitEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commitEdit()
        if (e.key === "Escape") cancelEdit()
      }}
      className="w-full bg-linear-hover border border-linear-accent rounded-xl px-4 py-3 text-base font-[510] text-linear-text tracking-tight mb-5 outline-none"
    />
  ) : (
    <div
      onClick={() => {
        setDraft(username)
        setIsEditing(true)
      }}
      className="bg-linear-hover border border-linear-border rounded-xl px-4 py-3 text-base font-[510] text-linear-text tracking-tight mb-5 cursor-pointer hover:border-linear-accent transition-colors"
    >
      {username}
    </div>
  )}
  ```

- [ ] **Step 4: Verify build**

  Run: `npm run build`  
  Expected: Clean build, no TypeScript errors.

- [ ] **Step 5: Manual smoke test**

  1. Run `npm run dev`
  2. Open the home page
  3. Click the username box — it should become an input pre-filled with the current username
  4. Type a new name and press Enter — the display should update to the new name
  5. Click again, change the name, press Escape — the old name should be restored
  6. Click again, clear the input completely, press Enter — the old name should be preserved (empty string rejected)
  7. Refresh the page — the saved username should persist (stored in `localStorage`)

- [ ] **Step 6: Commit**

  ```bash
  git add src/app/page.tsx
  git commit -m "feat: inline username editing on home page"
  ```
