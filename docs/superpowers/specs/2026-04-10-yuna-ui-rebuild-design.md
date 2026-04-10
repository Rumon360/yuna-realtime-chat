# Yuna UI Rebuild — Linear Design System

**Date:** 2026-04-10  
**Scope:** Rebuild all UI using the Linear-inspired design system defined in `DESIGN.md`, Tailwind CSS only, dark-mode permanently (no toggle).

---

## 1. Decisions

- **Dark-only:** No light mode. The Linear design system is dark-native. Remove `ThemeProvider` light/dark toggle and the "press d" hint. Hardcode `dark` class on `<html>` or strip theme switching entirely.
- **Token strategy:** Tailwind v4 `@theme` CSS custom properties in `globals.css`. All Linear colors become named tokens (`--color-linear-*`) consumed as Tailwind utility classes (`bg-linear-bg`, `text-linear-text`, etc.).
- **Styling:** All inline `style={{}}` replaced with Tailwind classes. No new component abstractions — edit existing files only.
- **Font:** Switch from Sora + DM Sans to Inter (variable weight) loaded via `next/font/google`. Apply `font-feature-settings: "cv01" "ss03"` globally in `@layer base`.

---

## 2. Token Setup (`globals.css`)

Replace all Coinbase `:root`/`.dark` variables. Strip Coinbase component classes (`cb-btn-primary`, etc.).

### `@theme` additions

```css
/* Backgrounds */
--color-linear-bg:           #08090a;
--color-linear-panel:        #0f1011;
--color-linear-surface:      #191a1b;
--color-linear-hover:        #28282c;

/* Text */
--color-linear-text:         #f7f8f8;
--color-linear-body:         #d0d6e0;
--color-linear-muted:        #8a8f98;
--color-linear-subtle:       #62666d;

/* Brand / Accent */
--color-linear-brand:        #5e6ad2;
--color-linear-accent:       #7170ff;
--color-linear-accent-hover: #828fff;

/* Status */
--color-linear-success:      #10b981;
--color-linear-danger:       #dc3545;

/* Borders */
--color-linear-border:       rgba(255, 255, 255, 0.08);
--color-linear-border-subtle: rgba(255, 255, 255, 0.05);
```

### `@layer base`

```css
body {
  @apply bg-linear-bg text-linear-body;
  font-feature-settings: "cv01" "ss03";
}
```

---

## 3. Layout: `layout.tsx`

- Replace `Sora` + `DM_Sans` imports with `Inter` (variable, subsets `["latin"]`).
- Apply Inter variable to `--font-sans`.
- Remove `ThemeProvider` from `providers.tsx` entirely — dark is permanent, no toggle needed.
- Add `class="dark"` permanently to the `<html>` tag in `layout.tsx`.

---

## 4. Lobby Page (`src/app/page.tsx`)

**Layout:** `min-h-svh bg-linear-bg flex flex-col items-center justify-center px-6 py-14`

**Error banners** (room destroyed / not found / full):
- Container: `w-full max-w-[420px] mb-6 border border-linear-danger/20 rounded-xl px-[18px] py-[14px] bg-linear-danger/5 text-center`
- Title: `text-[11px] font-[510] tracking-[0.12em] uppercase text-linear-danger mb-1`
- Message: `text-sm text-linear-muted leading-relaxed`

**Identity card:**
- Container: `w-full max-w-[420px] border border-linear-border rounded-2xl p-8`  
- Label: `text-[11px] font-[510] tracking-[0.12em] uppercase text-linear-subtle mb-2.5`
- Username pill: `bg-linear-hover border border-linear-border rounded-xl px-4 py-3 text-base font-[510] text-linear-text tracking-tight mb-5`
- CTA button: `w-full h-14 rounded-full bg-linear-brand text-white text-base font-[510] tracking-wide hover:bg-linear-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed`
- Footnote: `text-center mt-4 text-[13px] text-linear-muted leading-relaxed`

---

## 5. Chat Room Page (`src/app/room/[roomId]/page.tsx`)

**Root:** `flex flex-col h-svh overflow-hidden bg-linear-bg`

### Header

`flex items-center justify-between px-5 py-3 bg-linear-panel border-b border-linear-border-subtle flex-shrink-0`

- **Logo:** `text-[22px] font-[400] tracking-[-0.02em] text-linear-text`
- **Dividers:** `w-px h-7 bg-linear-border-subtle flex-shrink-0`
- **Room section label:** `text-[10px] font-[510] tracking-[0.1em] uppercase text-linear-muted mb-0.5`
- **Room ID:** `text-[13px] font-[510] text-linear-text tracking-tight`
- **Copy button:** `border border-linear-border-subtle rounded px-2 py-0.5 text-[10px] font-[510] tracking-[0.08em] uppercase text-linear-muted bg-transparent hover:text-linear-accent hover:border-linear-accent transition-colors`
- **Timer:** tabular-nums, `text-sm font-[510] text-linear-text` → `text-linear-danger` when < 60s
- **Destroy button:** `flex items-center gap-1.5 h-9 px-4 rounded-full border border-linear-border-subtle bg-[rgba(255,255,255,0.02)] text-linear-muted text-[13px] font-[510] hover:bg-linear-danger/10 hover:border-linear-danger/40 hover:text-linear-danger transition-colors disabled:opacity-55 disabled:cursor-not-allowed`

### Messages Area

`flex-1 overflow-y-auto px-6 py-7`

- **Empty state:** `flex items-center justify-center h-full text-sm text-linear-muted`
- **Message list:** `flex flex-col gap-[22px]`
- **Sender row:** `flex items-baseline gap-2.5 mb-1.5`
  - Own sender: `text-[11px] font-[510] tracking-[0.06em] uppercase text-linear-accent`
  - Other sender: `text-[11px] font-[510] tracking-[0.06em] uppercase text-linear-body`
  - Timestamp: `text-[11px] text-linear-subtle tabular-nums`
- **Message text:** `text-[15px] leading-[1.56] text-linear-body break-words max-w-[600px]`

### Input Bar

`px-5 py-3.5 border-t border-linear-border-subtle bg-linear-panel flex-shrink-0`

- **Row:** `flex gap-2.5 items-center`
- **Input:** `flex-1 h-12 px-5 rounded-full border border-linear-border bg-linear-surface text-[15px] text-linear-text placeholder:text-linear-muted font-[400] focus:outline-none focus:border-linear-accent transition-colors`
- **Send button:** `w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors` — active: `bg-linear-brand text-white cursor-pointer`, disabled: `bg-linear-hover text-linear-muted cursor-not-allowed`

---

## 6. Out of Scope

- No new components or abstractions
- No changes to API routes, realtime logic, or hooks
- No animation additions beyond existing `transition-colors`
- `ThemeProvider` component removal and theme-switching logic — dark is hardcoded via `class="dark"` on `<html>`
