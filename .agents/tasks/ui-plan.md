# Implementation Plan — UI Modernisation (Apex IERMS)

## Summary of Findings

The codebase has a fundamental **theme split** that is the root cause of the fragmented feel:

- `index.css` + the shared UI primitives (`Button`, `Input`, `Card`, `Badge`, `Modal`) are built on a **dark glass-morphism** theme (deep navy/black surfaces, `rgba(17,24,39,…)` backgrounds, white text).
- The admin/teacher/results **page components** already use **Tailwind class names** (`className="bg-white border border-slate-200 …"`) targeting a **light theme**.
- The result is every screen that mixes the two layers looks incoherent: glass-dark modals on light pages, inline dark inputs inside light Tailwind forms, etc.

**Resolution**: Migrate everything to the light design system specified (white cards, slate-50 bg, indigo-600 brand). The primitives are rewritten; the page-level Tailwind classes are already 70 – 80 % correct and only need structural cleanup.

Build command: `npm run build` (Vite)  
Type-check command: `npm run lint` (tsc --noEmit)  
No automated tests exist in the project.

---

## Ordered Implementation Plan

---

- [ ] 1. **Rewrite `src/index.css` — light-theme design tokens and global base styles**

  Replace the dark CSS custom properties with the specified light-theme palette. Keep the Inter font import, scrollbar overrides, and animation keyframes. Remove or replace: dark `--surface-*`, dark `--border-*`, dark `--text-*`, glass-morphism utilities (`.glass`, `.glass-card`), dark `.btn-*`, `.input-dark`, `.table-dark`, and dark `.nav-item-active`.

  **New `:root` tokens to establish:**
  ```
  --brand-50 … --brand-900  (keep existing indigo values — they are correct)
  --bg-app: #f8fafc         (slate-50)
  --surface-card: #ffffff
  --border-default: #e2e8f0 (slate-200)
  --text-heading: #0f172a   (slate-900)
  --text-body: #475569      (slate-600)
  --text-muted: #94a3b8     (slate-400)
  --success: #10b981
  --warning: #f59e0b
  --danger:  #ef4444
  ```

  Rewrite the `body` rule: `background-color: var(--bg-app); color: var(--text-heading);` — remove the radial gradient background blobs.

  Add Tailwind utility shorthands as CSS classes for patterns used repeatedly in page files (so page files don't need to change): `.page-container { display:flex; flex-direction:column; gap:1.5rem; }`, `.form-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }`, `.form-grid-3 { display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem; }`.

  Keep all `@keyframes` (slideUp, fadeIn, fadeInUp, shimmer, spin-smooth, pulse-glow) — they are referenced in components.  
  Keep `.skeleton`, `.loader-ring`, `.page-enter`, `.animate-fade-in-up`, `.stagger`.  
  Keep `.mono` class.

  Files: `src/index.css`  
  Verify: `npm run build` — no CSS parse errors; `npm run lint` — no TS errors.

---

- [ ] 2. **Rewrite `src/components/ui/Button.tsx` — light-theme variants**

  Keep the existing `ButtonProps` interface exactly (variant, size, icon, iconPosition, fullWidth, loading). Change only the inline style objects:

  - `primary`: `background: #4f46e5` (indigo-600), hover `#4338ca`, white text, `box-shadow: 0 1px 3px rgba(79,70,229,0.3)`
  - `secondary`: `background: #ffffff`, `border: 1px solid #e2e8f0`, `color: #374151` (slate-700), hover bg `#f8fafc`
  - `ghost`: `background: transparent`, `color: #6b7280`, hover bg `#f1f5f9`, no border
  - `danger`: `background: #fee2e2`, `color: #b91c1c`, `border: 1px solid #fca5a5`, hover bg `#fecaca`
  - Loading spinner: `border-color: rgba(79,70,229,0.3); border-top-color: #4f46e5`
  - `focus-visible`: `outline: 2px solid #6366f1; outline-offset: 2px`

  Sizes: sm `padding: 8px 14px`, md `padding: 10px 18px`, lg `padding: 12px 22px`.

  Files: `src/components/ui/Button.tsx`  
  Verify: `npm run lint` passes; `npm run build` succeeds.

---

- [ ] 3. **Rewrite `src/components/ui/Input.tsx` — light-theme with helper/error pattern**

  Keep existing exports: `Input`, `Select`, `Textarea`.

  **Input** changes:
  - Background `#ffffff`, border `1px solid #cbd5e1` (slate-300), `border-radius: 8px`, `padding: 10px 14px`, `color: #0f172a`
  - Focus: `border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15)`
  - Error state: `border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.12)`
  - Label: `color: #374151` (slate-700), `font-size: 13px`, `font-weight: 500`, `margin-bottom: 6px`
  - Helper text slot: add optional `helper?: string` prop rendered as `<p>` below the input in `color: #6b7280 font-size: 12px`
  - Error message: `color: #dc2626` (red-600), keep existing structure

  **Select** and **Textarea**: same border/focus colours; Select gets a chevron via `appearance: none; background-image: url("data:image/svg+xml…")` arrow or keep native select styling but update colours.

  **TypeScript gotcha**: `helper` is an optional string added to `InputProps`; don't add it to the underlying `<input>` spread — destructure it out before `...props`.

  Files: `src/components/ui/Input.tsx`  
  Verify: `npm run lint` — no new TS errors.

---

- [ ] 4. **Rewrite `src/components/ui/Card.tsx` — light-theme sub-exports**

  Keep `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` exports.

  **Card** base style: `background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06)`. Remove the `glass-card` class name from the rendered div — it applies dark glass styles. Hoverable variant adds `box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px)` on hover.

  Padding scale: sm=`16px`, md=`24px`, lg=`28px`.

  **CardTitle**: `color: #0f172a` (slate-900)  
  **CardDescription**: `color: #64748b` (slate-600)  
  **CardFooter**: border `1px solid #e2e8f0` (remove the purple rgba border)

  Remove `glow` prop effects (glow was dark-theme-only; keep the prop to avoid breaking callers but make it a no-op).

  Files: `src/components/ui/Card.tsx`  
  Verify: `npm run lint` passes.

---

- [ ] 5. **Rewrite `src/components/ui/Badge.tsx` — light-theme semantic variants**

  Keep `Badge` and `StatusBadge` exports and all existing variant names.

  Light-theme variant styles:
  - `success`: bg `#dcfce7`, color `#166534`, border `#bbf7d0`
  - `warning`: bg `#fef9c3`, color `#854d0e`, border `#fde047`
  - `danger`:  bg `#fee2e2`, color `#991b1b`, border `#fca5a5`
  - `info`:    bg `#dbeafe`, color `#1e40af`, border `#93c5fd`
  - `brand`:   bg `#ede9fe`, color `#4c1d95`, border `#c4b5fd`
  - `muted`:   bg `#f1f5f9`, color `#475569`, border `#e2e8f0`

  Keep pill shape (`border-radius: 100px`), dot prop, and size props unchanged.

  Files: `src/components/ui/Badge.tsx`  
  Verify: `npm run lint` passes.

---

- [ ] 6. **Rewrite `src/components/ui/Modal.tsx` — light-theme overlay**

  Keep `Modal` and `ModalFooter` exports. Keep all existing props.

  Modal panel: `background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.15)`. Remove `backdropFilter` from the panel (keep on the backdrop overlay).

  Header: `border-bottom: 1px solid #e2e8f0`, title `color: #0f172a`, font-size 16px font-weight 600.

  Close button: `color: #9ca3af`, hover `color: #374151; background: #f1f5f9`.

  ModalFooter: `border-top: 1px solid #e2e8f0`.

  Files: `src/components/ui/Modal.tsx`  
  Verify: `npm run lint` passes.

---

- [ ] 7. **Rewrite `src/components/ui/Layout.tsx` — light-theme layout helpers**

  `Section` title: `color: #0f172a`, description `color: #64748b`.  
  `Divider`: `background: #e2e8f0` (remove purple rgba).  
  Rest unchanged — `Container`, `Flex`, `Grid`, `Spacer` are structural-only, no colour to change.

  Files: `src/components/ui/Layout.tsx`  
  Verify: `npm run lint` passes.

---

- [ ] 8. **Rewrite `src/components/layout/Header.tsx` — light-theme top bar**

  Design intent: white/light frosted bar, indigo brand accent, clean user menu.

  Changes:
  - Background: `#ffffff` (or `rgba(255,255,255,0.95)` with frosted blur), `border-bottom: 1px solid #e2e8f0`
  - Remove `box-shadow: 0 1px 30px rgba(0,0,0,0.4)` → use `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`
  - Brand text: `Apex` in `#0f172a`, `IERMS` in `#4f46e5` (indigo-600), remove gradient-text approach
  - Nav active button: change from dark-indigo to indigo-50 bg + indigo-600 text + indigo-200 border
  - Nav inactive button: `color: #6b7280`, hover `color: #0f172a; background: #f8fafc`
  - DB status badge: uses the new light `Badge` automatically (already passes variant prop)
  - User profile button: `background: #ede9fe; border: 1px solid #c4b5fd; color: #4c1d95`
  - User dropdown: `background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 8px 30px rgba(0,0,0,0.12)`, header section bg `#f8fafc`
  - Sidebar toggle button: `background: #ede9fe; border: 1px solid #c4b5fd; color: #4f46e5`

  Files: `src/components/layout/Header.tsx`  
  Verify: `npm run build` succeeds.

---

- [ ] 9. **Rewrite `src/components/layout/Sidebar.tsx` — light-theme fixed sidebar**

  Design intent: white background, indigo active state, grouped nav with subtle labels.

  Changes:
  - Background: `#ffffff`, `border-right: 1px solid #e2e8f0`, remove `backdropFilter`
  - Active item: `background: #ede9fe; border-left: 3px solid #4f46e5; color: #4338ca; font-weight: 600`
  - Hover item: `background: #f8fafc; color: #374151`
  - Inactive item: `color: #6b7280`
  - Item icons: active `#4f46e5`, hover `#374151`, inactive `#9ca3af`
  - Badge on nav items: use light `Badge` variant `muted`, active uses `brand`
  - Toggle button: indigo-50 bg, indigo-600 icon
  - Bottom branding block: `background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b`
  - Role label text in toggle: `color: #6b7280`

  Files: `src/components/layout/Sidebar.tsx`  
  Verify: `npm run build` succeeds.

---

- [ ] 10. **Update `src/App.tsx` — light-theme shell**

  - `MainContent` outer div: change `background: 'var(--surface-0)'` → `background: '#f8fafc'`
  - `<main>` scroll area: change inline background (currently inherited from var(--surface-0)) to no explicit bg (inherits `#f8fafc` from parent)
  - `LoadingScreen`: change from pure dark to indigo-50 to slate-100 gradient, spinner border from dark brand to `border-color: #c7d2fe; border-top-color: #4f46e5`, text `color: #4f46e5`
  - `NavigationProgress` bar: keep gradient, just ensure it stays visible on light bg
  - `PageWrapper` line animation: keep indigo gradient

  Files: `src/App.tsx`  
  Verify: `npm run build` succeeds.

---

- [ ] 11. **Rewrite `src/components/auth/LoginPage.tsx` — centred card on gradient background**

  Design: white card centred on `linear-gradient(135deg, #eef2ff 0%, #f1f5f9 100%)` (indigo-50 to slate-100). Remove dark glass card, remove dark ambient grid lines.

  - Outer div: `background: linear-gradient(135deg, #eef2ff, #f1f5f9)`, `min-height: 100vh`
  - Card: `background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); padding: 40px 36px`
  - School crest: 68px, `border: 2px solid #c7d2fe; box-shadow: 0 4px 12px rgba(99,102,241,0.15)`
  - DB badge: uses new light `Badge brand` (auto-updated from step 5)
  - Heading `"Apex International Academy"`: `color: #0f172a; font-weight: 800` — remove gradient-text
  - Sub-heading: `color: #64748b`
  - Error banner: `background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b`
  - Form uses updated `Input` component (already structured label → input)
  - Password label row: fix label `color: #374151` and the default password `code` hint: bg `#ede9fe; color: #4338ca`
  - Submit button: uses updated `Button` primary (auto-updated from step 2)
  - Footer text: `color: #94a3b8`

  Files: `src/components/auth/LoginPage.tsx`  
  Verify: `npm run build` succeeds.

---

- [ ] 12. **Modernise `src/components/admin/AdminDashboard.tsx` — stat grid + page structure**

  The page structure is 95 % correct (uses `Card`, `Grid`, `Flex`, `Badge` from primitives). Changes needed after primitive updates are automatic. Plus these explicit fixes:

  - `StatCard`: remove the manual inline dark styles (bg, border) and rely on the updated `<Card>` component. Remove the `radial-gradient` blob overlay. Keep hover scale. Update icon container to use light colours matching the card's `glowColor` but as a tinted bg: e.g. `background: ${glowColor}15` with `border: 1px solid ${glowColor}25` (keep existing logic, just ensure it looks correct on white).
  - Stat value `color`: change from `#f1f5f9` → `#0f172a`; stat label from `#4b5563` → `#6b7280`; trend text keep emerald.
  - `ExamRow`: currently raw `<div>` with inline dark styles → update text colours to `#0f172a` heading, `#6b7280` meta.
  - `AuditRow`: currently `#94a3b8` action → update to `#374151`; `#374151` description → `#6b7280`.
  - Page header gradient text on h1: replace with plain `color: #0f172a`.
  - Quick action grid at bottom: `background: #f8fafc; border: 1px solid #e2e8f0` per button; hover `border-color: ${color}40`.

  Files: `src/components/admin/AdminDashboard.tsx`  
  Verify: `npm run build` succeeds.

---

- [ ] 13. **Modernise `src/components/admin/AcademicMaster.tsx` — Tailwind tab bar + structured forms**

  The page already uses Tailwind light-theme classes for its static content. Main issues:
  1. No tab bar — all sections render vertically without navigation.
  2. The "Add Subject" modal uses raw `<input className="...">` instead of `<Input>` component.
  3. The page title uses `text-slate-900` but `className="p-8 text-center text-slate-500 font-mono text-xs"` loading state is non-themed.

  Changes:
  - Add a tab bar at the top of the page with four tabs: "Academic Years & Terms", "Classes & Sections", "Subjects", "Offerings". Use a `useState<string>` for the active tab. Tab bar style: `flex gap-1 border-b border-slate-200 mb-6`; each tab: `px-4 py-2 text-sm font-medium rounded-t cursor-pointer`; active: `text-indigo-600 border-b-2 border-indigo-600 bg-white`; inactive: `text-slate-500 hover:text-slate-700`.
  - Each existing `<div className="bg-white border border-slate-200 rounded-lg p-5 …">` section renders inside the appropriate tab.
  - "Add Subject" modal: replace raw `<input>` + `<button>` elements with `<Input>`, `<Select>`, `<Button>` primitives, wrapped in `<Modal>`. Use a 2-column grid for Max/Pass score fields.
  - Loading state: center spinner with `<div className="flex items-center justify-center py-16">…</div>`.
  - Page header: use `<h1 className="text-2xl font-semibold text-slate-900">` with `<p className="text-sm text-slate-600 mt-1">`.

  Files: `src/components/admin/AcademicMaster.tsx`  
  Verify: `npm run build` and `npm run lint` pass.

---

- [ ] 14. **Modernise `src/components/admin/InstitutionSetup.tsx` — Card-grouped multi-section form**

  Current state: already uses Tailwind light classes. Issues: raw `<input>`, `<select>`, `<button>` throughout; no use of `Input`/`Select`/`Button` primitives; the save button is a bare `<button>` with custom styling.

  Changes:
  - Replace every `<input className="w-full px-3 py-2 border border-slate-300 rounded…">` with `<Input label="…" fullWidth />`.
  - Replace every `<select className="…">` with `<Select label="…" fullWidth>`.
  - The 3-column calculation grid uses `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">` — keep as-is; put each field in an `<Input>` or `<Select>`.
  - The "ranking enabled" checkbox remains a raw checkbox (Input doesn't support type=checkbox — keep native, just style the label with `text-sm text-slate-700`).
  - Save button: replace bare `<button>` with `<Button variant="primary" loading={saving} icon={<Save size={14}/>}>`.
  - "Saved" success banner: `background: #dcfce7; border: 1px solid #bbf7d0; color: #166534` via Tailwind `className` (don't use `Badge` here; it's a form feedback bar).
  - The grading scale table is read-only — keep `<table>` structure, just ensure `th` uses `text-slate-500 text-xs font-medium uppercase` and `td` uses `text-slate-700`.

  Files: `src/components/admin/InstitutionSetup.tsx`  
  Verify: `npm run build` and `npm run lint` pass.

---

- [ ] 15. **Modernise `src/components/admin/PeopleManager.tsx` — search bar + striped table + action buttons**

  Current state: mixed — uses `<Button>`, `<Input>`, `<Select>`, `<Card>` from primitives for the modal, but the main table uses raw Tailwind. The tab switcher is a custom segmented control.

  Changes:
  - Add a search `<Input>` at the top of the table with a magnifying glass icon (`import { Search } from 'lucide-react'`). Wire it to a local `searchTerm` state; filter `students`/`teachers` arrays before rendering.
  - Tab bar: upgrade the existing segmented control to match the AcademicMaster style (tab bar, not segmented pill, for consistency). Use `border-b border-slate-200` row with `border-b-2 border-indigo-600` active underline.
  - Table header buttons: the current `<button onClick={() => setShowCsvImport…}>` and register button — replace with `<Button variant="secondary">` and `<Button variant="primary">` using `<UserPlus>` and `<Upload>` icons.
  - Table rows: add `even:bg-slate-50` via `className` on `<tbody>` rows for striped effect (Tailwind v4 compatible: use `:nth-child(even)` in CSS or add `className={s.id % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`).
  - Action column: add an edit icon button `<Button variant="ghost" size="sm">` per row (placeholder, no handler yet) — renders a `<Pencil>` icon for future use.
  - The "Register Student" and "CSV Import" modals already use `<Card>`, `<Input>`, `<Button>` — they will inherit the updated primitive styles. No structural change needed beyond confirming the `<form onSubmit>` correctly links to the submit button via `type="submit"` (the current CardFooter button uses `onClick={handleCreateStudent}` directly rather than `type="submit"` — fix this to `type="submit"` on the button inside the form, and remove the duplicate `onClick`).

  Files: `src/components/admin/PeopleManager.tsx`  
  Verify: `npm run build` and `npm run lint` pass.

---

- [ ] 16. **Modernise `src/components/admin/AuditLogsViewer.tsx` — search bar + table + Modal for detail**

  Current state: raw Tailwind throughout. The JSON detail modal uses a custom `<div>` overlay, not the `<Modal>` primitive.

  Changes:
  - Page header: `<h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">`.
  - Search input: replace `<input className="pl-8 …">` with `<Input icon={<Search size={14}/>} placeholder="Filter by action…" value={actionFilter} onChange={…} />`.
  - Table wrapper: use `<div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">`. Table head: `bg-slate-50`, column labels `text-slate-500 text-xs font-semibold uppercase tracking-wide`. Table rows: `hover:bg-slate-50`.
  - Action cell: use `<Badge variant="muted">` wrapping `log.action` instead of a plain `<span className="px-1.5 py-0.5 bg-slate-100…">`.
  - Detail view: replace custom `<div className="fixed inset-0 …">` overlay with `<Modal isOpen={!!selectedLog} onClose={…} title={…} size="md">`. The JSON `<pre>` block: `className="p-3 bg-slate-900 text-emerald-400 rounded text-xs overflow-x-auto max-h-56 font-mono"`.
  - Close modal button: `<Button variant="secondary">Close</Button>` inside `<ModalFooter>`.

  Files: `src/components/admin/AuditLogsViewer.tsx`  
  Verify: `npm run build` and `npm run lint` pass.

---

- [ ] 17. **Modernise `src/components/teacher/QuestionBank.tsx` — filterable card grid + structured create form**

  Current state: raw Tailwind light theme. Modal uses custom `<div>` overlay.

  Changes:
  - Filter bar: `<div className="flex items-center gap-3 flex-wrap">` containing `<Select label="" value={selectedSubjectId} …>` (replaces raw `<select>`) and `<Button variant="primary" onClick={…}>Create Question</Button>`.
  - Question cards: Each question `<div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">` is already correct structure. Update the difficulty and type badges to use `<Badge>`:
    - difficulty: `easy` → `success`, `medium` → `warning`, `hard` → `danger`
    - type label: `<Badge variant="muted">` for the question type
  - Create modal: replace custom `<div className="fixed inset-0 …">` with `<Modal isOpen={showAddModal} onClose={…} title="Create Question Bank Item" size="xl">`. Inside the modal, use `<Input>`, `<Select>`, `<Textarea>` primitives. Form actions go in `<ModalFooter><Button variant="secondary">Cancel</Button><Button type="submit">Save</Button></ModalFooter>`.
  - **TypeScript gotcha**: `Modal` currently renders children inside `<div style={{ padding: '24px' }}>` — the `<form onSubmit={…}>` can live there. The `<ModalFooter>` must be placed inside the Modal children (after the form fields), not outside the `<Modal>` component.

  Files: `src/components/teacher/QuestionBank.tsx`  
  Verify: `npm run build` and `npm run lint` pass.

---

- [ ] 18. **Modernise `src/components/teacher/ExamBuilder.tsx` — two-panel card layout + Modal create form**

  Current state: raw Tailwind. Exam list uses manual `<div>` cards. Create modal uses custom overlay.

  Changes:
  - Exam cards: already `bg-white border border-slate-200 rounded-lg` — update corner radius to `rounded-xl`. Exam status badge: replace inline `<span className="text-[10px] font-semibold uppercase …">` with `<StatusBadge status={ex.status}>` from Badge.tsx.
  - Action buttons (Release Results, Sync to Marks): replace bare `<button className="…">` with `<Button variant="secondary" size="sm" icon={<Send/>}>Release Results</Button>` and `<Button variant="ghost" size="sm" icon={<RefreshCw/>}>Sync</Button>`.
  - Metadata grid in each card (`grid grid-cols-2 sm:grid-cols-4`): change individual cell bg from `bg-slate-50 rounded border border-slate-100` to same (already correct Tailwind light style).
  - Create modal: replace custom `<div className="fixed inset-0 …">` with `<Modal isOpen={showCreateModal} onClose={…} title="Build & Schedule Examination" size="xl">`. Inside: replace all raw `<input>`, `<select>`, `<textarea>` with `<Input>`, `<Select>`, `<Textarea>`. Keep the question selection list as-is (custom checklist UI — its styles are already Tailwind light). Form footer: `<ModalFooter>` with Cancel `<Button variant="secondary">` and Submit `<Button type="submit" variant="primary">`.
  - Page header: `<h1 className="text-2xl font-semibold text-slate-900">`.
  - Sync status banner: `className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800"`.

  Files: `src/components/teacher/ExamBuilder.tsx`  
  Verify: `npm run build` and `npm run lint` pass.

---

- [ ] 19. **Modernise `src/components/teacher/GradingQueue.tsx` — two-panel layout with sticky queue list**

  Current state: raw Tailwind light theme, mostly correct structure. Minor issues: raw `<input>` and `<button>` in grading form.

  Changes:
  - Page header: `<h1 className="text-2xl font-semibold text-slate-900">`.
  - Empty state card: `<Card>` with centered `<CheckCircle2>` icon in emerald-50 circle, `<CardTitle>` and description.
  - Queue list panel: `<Card padding="sm">` wrapping the queue items. Queue items: selected state `bg-indigo-50 border border-indigo-200 rounded-lg`, hover `bg-slate-50`.
  - Evaluation pane: `<Card>`. Question prompt block: `className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-800"`. Student response block: `className="bg-amber-50 p-3.5 rounded-lg border border-amber-200 text-sm font-mono leading-relaxed whitespace-pre-wrap text-slate-800"`.
  - Grading form: replace raw `<input type="number">` with `<Input label="Awarded Marks (0 – X)" type="number" …/>` and `<Input label="Candidate Feedback" …/>`. Replace submit `<button>` with `<Button type="submit" loading={submitting} variant="primary" icon={<Send size={14}/>}>`.

  Files: `src/components/teacher/GradingQueue.tsx`  
  Verify: `npm run build` and `npm run lint` pass.

---

- [ ] 20. **Modernise `src/components/teacher/MarkEntryGrid.tsx` — sticky-header table + Modal create form**

  Current state: raw Tailwind, mostly correct structure. Issues: raw inputs and buttons in selectors bar; raw `<input>` cells in grid; create assessment modal uses custom overlay.

  Changes:
  - Selector bar: replace raw `<select>` with `<Select label="…">` component. Replace bare `<button>` elements with `<Button>` primitive (Add Assessment: `variant="secondary"`; Save Draft: `variant="secondary"`; Submit for Review: `variant="primary"`).
  - Status badge in selector bar: use `<StatusBadge status={gridData?.publicationStatus || 'draft'}>` instead of inline conditional className string.
  - Mark grid table wrapper: `className="bg-white border border-slate-200 rounded-xl overflow-x-auto"`. Sticky header: add `className="sticky top-0 z-10 bg-slate-50"` to `<thead>`. Column header cells: `text-slate-500 text-xs font-semibold uppercase`. The `min-w-[200px]` min-width on assessment columns is correct — keep it.
  - Inline score input cell: keep raw `<input type="number">` here (it's an editable grid cell, not a form field — wrapping in `<Input>` label component would break the table layout). Apply inline style: `border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 12px; font-family: monospace; color: #0f172a`. Disabled: `background: #f1f5f9; color: #94a3b8`.
  - Create Assessment modal: replace custom overlay with `<Modal isOpen={showAddAssmt} onClose={…} title="Configure Assessment Component" size="md">`. Replace raw `<input>`, `<select>` with `<Input>`, `<Select>` primitives. Footer: `<ModalFooter>` with `<Button variant="secondary">Cancel</Button>` and `<Button type="submit" variant="primary">Save Assessment</Button>`.

  Files: `src/components/teacher/MarkEntryGrid.tsx`  
  Verify: `npm run build` and `npm run lint` pass.

---

- [ ] 21. **Modernise `src/components/student/StudentDashboard.tsx` — welcome banner + exam grid**

  Current state: raw Tailwind, already light theme. Good structural foundation.

  Changes:
  - Welcome banner: `<Card>` wrapping `<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">`. Left side `<h1 className="text-2xl font-semibold text-slate-900">` and `<p className="text-sm text-slate-600 mt-1">`. Right: `<Button variant="primary" icon={<FileText size={14}/>}>View Report Card</Button>`.
  - Section heading: `<h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">`.
  - Exam cards: `<Card>` with internal layout. Title `className="text-lg font-semibold text-slate-900"`. Meta row uses `<Badge variant="info">` for subject, `<Badge variant="muted">` for duration/marks. Start button: `<Button variant="primary" size="md" icon={<Play size={14}/>}>Start Sitting</Button>`. Attempt-limit-reached: `<Badge variant="muted">Limit Reached</Badge>`.
  - Sitting history rows: `className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-sm"`.
  - Loading state: replace `className="p-8 text-center text-slate-500 font-mono text-xs"` with a skeleton or centered spinner.

  Files: `src/components/student/StudentDashboard.tsx`  
  Verify: `npm run build` and `npm run lint` pass.

---

- [ ] 22. **Modernise `src/components/student/ExamDeliveryRoom.tsx` — full-screen delivery UI**

  Current state: raw Tailwind, already light theme. Good structure. Issues: top header is dark; answer options use ad-hoc border classes.

  Changes:
  - Exam header bar: change `className="bg-slate-900 text-white p-4 rounded-lg …"` → `className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm"`. Title: `text-slate-900 text-sm font-semibold`. Meta: `text-slate-500 text-xs font-mono`. Autosave indicator: use `<Badge variant="success">Saved</Badge>`, `<Badge variant="warning">Saving…</Badge>`, `<Badge variant="danger">Error</Badge>` instead of inline spans.
  - Timer: non-critical: `className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono font-bold text-sm bg-slate-50 border border-slate-200 text-slate-900"`. Critical (<5min): `className="… bg-red-50 border-red-300 text-red-700 animate-pulse"`.
  - Answer options (single choice / true-false / multiple select): selected `className="border-2 border-indigo-600 bg-indigo-50 text-indigo-900 font-medium"`, unselected `className="border border-slate-200 hover:bg-slate-50 text-slate-800"`.
  - Nav buttons: Previous → `<Button variant="secondary" icon={<ArrowLeft/>}>Previous</Button>`, Next → `<Button variant="primary" icon={<ArrowRight/>} iconPosition="right">Next</Button>`, Submit Final → `<Button variant="primary" icon={<Send/>}>Submit Final Exam</Button>` (use emerald override via style prop: `style={{background:'#059669'}}`).
  - Question navigator sidebar: `<Card padding="sm">`. Current question button: `bg-indigo-600 text-white`, answered: `bg-emerald-50 border-emerald-300 text-emerald-900`, unanswered: `bg-white border-slate-200 text-slate-600`.
  - Submission receipt: `<Card>` with centered CheckCircle2 in `bg-emerald-50 rounded-full p-3`. Use `<Button variant="primary">Return to Dashboard</Button>`.

  Files: `src/components/student/ExamDeliveryRoom.tsx`  
  Verify: `npm run build` and `npm run lint` pass.

---

- [ ] 23. **Modernise `src/components/student/ReportCardModal.tsx` — printable modal**

  Current state: raw Tailwind. Uses custom overlay, not `<Modal>` primitive (intentional — this needs a full-width printable layout that doesn't fit the Modal primitive's centred small-panel design). Keep custom overlay.

  Changes:
  - Overlay close/print bar: keep `bg-slate-900 text-white` header bar (it's print-hidden).
  - Report card body: ensure all text uses `text-slate-900`, `text-slate-700`, `text-slate-600` — audit every `className` and replace leftover dark-tone values.
  - Institution header: keep existing structure. Title: `text-xl font-bold text-slate-900 uppercase tracking-tight`.
  - Student metadata grid: `bg-slate-50 border border-slate-200 rounded-lg p-4`. Each label: `text-[10px] font-medium text-slate-500 uppercase tracking-wide`. Each value: `text-sm font-semibold text-slate-900`.
  - Subject table: `<thead className="bg-slate-100">`, `<th>` uses `text-slate-700 font-semibold text-xs`. Alternate row shading: `className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`.
  - Pass/Fail column: `<Badge variant="success">PASS</Badge>` / `<Badge variant="danger">FAIL</Badge>`.
  - Academic standing footer: change from `bg-slate-900 text-white` to `bg-indigo-700 text-white` (brand-coloured summary bar looks more like an official document).
  - Signature row: `className="border-t-2 border-slate-400 pt-2 text-center text-xs font-medium text-slate-600"`.

  Files: `src/components/student/ReportCardModal.tsx`  
  Verify: `npm run build` and `npm run lint` pass.

---

- [ ] 24. **Modernise `src/components/results/ResultsPublication.tsx` — filter bar + workflow actions + results table**

  Current state: raw Tailwind light theme. Issues: bare `<button>` workflow action buttons; raw `<select>` filter bar; plain inline `<span>` status badge; unlock modal uses custom overlay.

  Changes:
  - Filter bar: replace `<select className="px-2.5 py-1.5 …">` elements with `<Select label="Academic Term" …>` and `<Select label="Class Section" …>`. Use `<StatusBadge status={status}>` instead of the inline conditional `<span>`.
  - Workflow action buttons: replace all bare `<button className="px-3.5 py-1.5 bg-amber-600 …">` with `<Button>` using appropriate variants:
    - Submit for Review → `variant="secondary"` with amber icon
    - Approve Results → `variant="secondary"`
    - Publish to Students → `variant="primary"` with `<Send>` icon
    - Unpublish → `variant="ghost"`
    - Lock → `variant="danger"` with `<Lock>` icon
    - Reopen Locked → `variant="danger"` with `<Unlock>` icon
  - Export CSV: `<Button variant="secondary" icon={<Download size={14}/>}>Export CSV</Button>`.
  - Results table: `className="bg-white border border-slate-200 rounded-xl overflow-x-auto"`. Rank column: `<span className="font-mono font-bold text-indigo-600">#{s.rank}</span>`. Outcome column: `<Badge variant={s.passed ? 'success' : 'danger'}>{s.passed ? 'PASSED' : 'FAILED'}</Badge>`. Report Card link: `<Button variant="ghost" size="sm" icon={<FileText size={13}/>}>Report Card</Button>`.
  - Unlock modal: replace custom `<div className="fixed …">` with `<Modal isOpen={showUnlockModal} onClose={…} title="Reopen Locked Results" size="md">`. Textarea → `<Textarea label="Official Justification / Reason" rows={3} …/>`. Buttons in `<ModalFooter>`: `<Button variant="secondary">Cancel</Button>` and `<Button variant="danger" loading={actionLoading}>Confirm Unlock</Button>`.

  Files: `src/components/results/ResultsPublication.tsx`  
  Verify: `npm run build` and `npm run lint` pass.

---

## TypeScript Gotchas to Watch For

1. **`helper` prop on `Input`**: Must be destructured out of `InputProps` before spreading `...props` to the native `<input>` element. Native `<input>` does not accept a `helper` attribute and TypeScript will error.

2. **`glow` prop on `Card`**: Keep the prop in the interface but no-op the implementation. Existing callers pass `glow={hovered}` — removing the prop from the interface would break those call sites.

3. **`ModalFooter` inside `Modal`**: `ModalFooter` renders a flex div — it must be placed as a direct child of the Modal's children, not outside the `<Modal>` JSX tag. The padding on Modal's content wrapper (`padding: '24px'`) will wrap it, so ModalFooter's `border-top` is the visual separator from the form.

4. **`Button` with `type="submit"`**: The `Button` component extends `React.ButtonHTMLAttributes<HTMLButtonElement>` so `type` is already in `...props`. No change needed, but verify that form submit buttons inside Modal children pass `type="submit"` explicitly.

5. **Select option value coercion**: `parseInt(e.target.value, 10)` in `onChange` handlers (MarkEntryGrid, ExamBuilder etc.) — the Select component passes through `...props` unchanged, so the existing `onChange` will still receive a string value from the native select. No change needed.

6. **`ExamDeliveryRoom` — inline grid cell inputs**: These are deliberately NOT wrapped in the `<Input>` component (to avoid breaking the table layout). Keep them as raw `<input>` elements with inline styles. Do not refactor them.

7. **Tailwind v4 config**: The project uses `@tailwindcss/vite` (Tailwind v4) with `@import "tailwindcss"` in `index.css`. In v4, utility classes work via the CSS-first configuration mode — no separate `tailwind.config.js` is expected. All className-based Tailwind utilities used in JSX already work as-is. Do not add a `tailwind.config.js`.

---

## Verification Checklist

After all 24 steps complete:

- [ ] `npm run lint` exits with 0 errors
- [ ] `npm run build` exits successfully with no warnings about missing modules
- [ ] LoginPage renders as a centred white card on indigo-50/slate-100 gradient (no dark surfaces)
- [ ] Sidebar shows white background with indigo active-item highlight
- [ ] Header shows white bar with indigo brand accent
- [ ] All modal overlays use the unified `<Modal>` primitive (dark glass is gone)
- [ ] All form fields show label above, input, then helper/error below — no unlabelled inputs
- [ ] `<Button>` variants render with correct light-theme colours (primary=indigo, secondary=white+border, ghost=transparent, danger=red tint)
- [ ] `<Badge>` variants render with light pastel backgrounds (no dark translucent backgrounds)
- [ ] `<Card>` shows white background with slate-200 border (no dark glass card)
- [ ] AdminDashboard stat cards are white/light, not dark
- [ ] ExamDeliveryRoom answer options highlight in indigo-50/indigo border when selected
- [ ] ReportCardModal is printable (bg-white throughout content area)
- [ ] ResultsPublication PASSED/FAILED outcomes use semantic Badge colours (green/red)
- [ ] AcademicMaster has a functional tab bar (four tabs switching content)
- [ ] No TypeScript errors introduced (all new props have correct types)
