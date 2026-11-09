# BlueSPACE Fintech Academy — Design System

This document is the design source of truth for the academy client
(`client/`). It describes the visual language, tokens, layout rules and
component conventions used across the product.

The design direction is **institutional, editorial and operational**:
a calm, high-trust surface for fellows, faculty, partners and administrators.
BlueSPACE blue is the only brand accent; hierarchy comes from typography,
spacing and borders rather than decorative colour.

---

## 1. Principles

1. **The work is the focus.** Pages are full width and data-dense without
   feeling crowded. Chrome is quiet.
2. **Flat, border-led surfaces.** Badges, chips and status markers use a
   border and text colour, not filled pastel pills or gradients.
3. **One accent.** BlueSPACE blue (`#0000FF`) marks primary actions, active
   navigation and brand moments. Domain colours are reserved for domain
   labels.
4. **Plain operational data.** Dates, times, student IDs and reference codes
   are rendered as plain text, not as decorative badges.
5. **Consistent motion.** Motion is short, functional and respects
   `prefers-reduced-motion`.
6. **Accessible by default.** Every interactive element has a visible focus
   state and an accessible name.

---

## 2. Colour

Tokens live in `client/tailwind.config.js` and `client/src/index.css`.

### Brand blue

| Token | Value | Use |
|-------|-------|-----|
| `deep-600` / `brand-500` | `#0000FF` | Primary buttons, links, active navigation, focus rings |
| `deep-700` | `#0000CC` | Hover on primary actions |
| `deep-50` – `deep-200` | `#F0F0FF` – `#C2C2FF` | Subtle brand-tinted surfaces and borders |
| `deep-800` / `deep-900` | `#000099` / `#000066` | Deep text or pressed states |

### Domain accents

| Domain | Token | Value |
|--------|-------|-------|
| FaaS | `domain.faas` | `#0000FF` |
| FinCore | `domain.fincore` | `#10B981` |
| FinOps | `domain.finops` | `#F59E0B` |
| FinInfra | `domain.fininfra` | `#64748B` |

Domain colours identify a domain; they are never used for generic success,
warning or error states.

### Neutral and semantic surfaces

| Role | Class |
|------|-------|
| Page background | `bg-gray-50` |
| Card / panel surface | `bg-white` |
| Default border | `border-gray-200`, `border-gray-200/90`, `border-gray-100` |
| Primary text | `text-gray-900` |
| Secondary text | `text-gray-600` / `text-gray-500` |
| Muted metadata | `text-gray-400` |
| Success | `text-emerald-700`, `border-emerald-200`, `bg-emerald-50` |
| Warning / urgency | `text-amber-700`, `border-amber-200` |
| Error / overdue | `text-red-700`, `border-red-200`, `bg-red-50` |

**Rules**

- Do not introduce new hex values outside the token files.
- Do not use gradients as decoration. A gradient must express hierarchy or a
  specific brand moment and be documented.
- Do not use filled status pills. Use the flat `Badge` variants below.
- Do not put coloured backgrounds behind identity information (student ID,
  date, cohort).

---

## 3. Typography

The product uses **Manrope** (loaded in `client/index.html`, weights 200–800).
The certificate is the only exception: it uses a dedicated serif pairing inside
`components/certificate/ProfessionalCertificate.jsx` so the printed document
feels like a formal credential.

### Scale

| Role | Classes |
|------|---------|
| Page title | `text-2xl sm:text-3xl font-bold tracking-tight text-gray-900` |
| Section title | `text-base font-semibold leading-snug tracking-tight text-gray-900` |
| Card title | `text-sm font-semibold text-gray-900` |
| Body | `text-sm text-gray-700` |
| Secondary body | `text-sm text-gray-500` |
| Metadata | `text-xs text-gray-500` |
| Table header / eyebrow | `text-[10px] uppercase tracking-wide text-gray-500` |
| Micro-label | `text-[11px]` |

**Rules**

- Keep headings sentence case.
- Do not use more than three type sizes in one card.
- Use weight and colour for hierarchy before adding another size.
- Long identifiers and emails should wrap or truncate with `truncate`
  rather than shrinking the font.

---

## 4. Layout and app shell

The authenticated shell is `components/layout/AppLayout.jsx`:

```text
┌──────────────┬──────────────────────────────────────────────────────┐
│ Sidebar      │ Top bar: search · cohort name · notifications        │
│ 256px (lg+)  ├──────────────────────────────────────────────────────┤
│              │ Main content — full width, responsive gutters        │
└──────────────┴──────────────────────────────────────────────────────┘
```

### Shell rules

- Sidebar is fixed at `lg:pl-64`; it becomes a drawer below `lg`.
- Top bar is 56px (`h-14`), white, with a subtle bottom border and sticky
  positioning.
- The top bar contains: global search, the current cohort name (hidden below
  `sm`) and notifications.
- **Do not add a date/time string or student ID to the top bar.** Those belong
  in page content where they are relevant.
- Main content uses `w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6`.
- **Do not wrap a page in `max-w-7xl` or another page-level max width.** The
  working area should fill the shell. Use grids, columns and internal spacing
  for composition.

### Legitimate max widths

Narrow widths are allowed only where the content itself is narrow:

- Authentication and reset cards: `max-w-sm`
- Confirmation / empty states: `max-w-md`
- Short forms or quizzes: `max-w-2xl` / `max-w-3xl`
- Certificate view and print layout: `max-w-5xl` (`print:max-w-none`)
- Dialogs: `max-w-5xl` for wide certificate dialogs

---

## 5. Components

### Card

```jsx
<Card>
  <CardHeader>
    <CardTitle>Student performance</CardTitle>
    <CardDescription>Current cohort</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
</Card>
```

- Surface: `rounded-xl border border-gray-200/90 bg-white shadow-sm`.
- Header padding: `p-5 sm:p-6`.
- Keep shadows subtle; the border does most of the separation.

### Button

Variants: `default` (brand blue), `secondary`, `outline`, `ghost`,
`destructive`, `link`.

- Default height `h-10`; compact actions `sm` (`h-9`).
- Icon-only buttons must include an `aria-label` or an accessible title.
- Use `asChild` when a button wraps a link.

### Badge and chip

`components/ui/badge.jsx` is intentionally flat:

| Variant | Classes | Use |
|---------|---------|-----|
| `default` | `border-deep-200 text-deep-700` | Brand / primary status |
| `secondary` | `border-gray-200 text-gray-700` | Completed / neutral status |
| `outline` | `border-gray-200 text-gray-700` | Default metadata or filter chip |
| `destructive` | `border-red-200 text-red-700` | Blocked / failed |

```jsx
<Badge variant="outline">Finsoft</Badge>
<Badge variant={status === 'graded' ? 'secondary' : 'default'}>
  {status}
</Badge>
```

- Chips are `rounded-full border px-2.5 py-0.5 text-xs font-semibold`.
- **Do not add `bg-*` fills to badges or deadline chips.** Urgency is
  expressed with text and border colour (see `lib/deadlines.js`).
- Use `capitalize` only on machine values; do not capitalise prose.

### Tables

- Wrapper: `overflow-x-auto`.
- Table: `w-full min-w-[760px] text-left text-xs`.
- Header: `border-b text-[10px] uppercase text-gray-500`.
- Rows: `border-b border-gray-50`.
- Keep numeric columns aligned consistently and use `N/A` for missing values.

### Forms

- Labels are `text-sm font-medium text-deep-600` or `text-gray-600`.
- Inputs use the shared `Input` primitive; do not hand-roll styles.
- Show validation next to the field or at the top of the form in a
  `bg-red-50 text-red-700` notice.
- Disable submit while a request is in flight and expose the loading state in
  the label.

### Icons

- Lucide React only.
- Typical sizes: 13–16 for inline metadata, 18–20 for controls, 24 for empty
  states.
- Icon-only controls need an accessible name.

---

## 6. Motion

Motion tokens live in `tailwind.config.js` and `index.css`:

| Token | Value |
|-------|-------|
| `ease-out-expo` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| `ease-in-out-expo` | `cubic-bezier(0.77, 0, 0.175, 1)` |
| `ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` |
| Durations | `150ms`, `200ms`, `250ms` |

- Use motion for state changes (open/close, hover, page entry), not for
  decoration.
- Always respect `prefers-reduced-motion`; the global stylesheet already
  reduces animation and transition duration.
- Avoid infinite or attention-seeking animations in operational screens.

---

## 7. Certificate design

The certificate is a separate editorial surface implemented in
`components/certificate/ProfessionalCertificate.jsx`.

- A3 landscape with a formal serif hierarchy and generous margins.
- Executive navy/blue palette, classical degree composition and guilloche
  security ornamentation.
- Verification token and QR-style verification metadata are part of the
  document, not the app shell.
- Print/export hides application navigation and chrome.
- The certificate must remain legible in black and white.

When changing the certificate, keep the printed document self-contained and
verify the public `/verify/:token` view as well as the in-app dialog.

---

## 8. Content and data display

- Dates: plain, readable strings (`Nov 6, 2026`), not decorative chips.
- Times: plain (`10:36 PM`) next to the relevant class or deadline.
- Student IDs and reference codes: plain monospace or plain text; no pill.
- Status labels: short nouns or past participles (`Graded`, `Submitted`,
  `Enrolled`, `Overdue`).
- Emails and long names: use `truncate` with a `title` attribute when the full
  value matters.

---

## 9. Accessibility

- Maintain visible focus rings (`focus-visible:ring-2`).
- Do not remove outlines without a replacement focus style.
- Use semantic headings and one `h1` per page.
- Provide `aria-label` for icon-only buttons and links.
- Maintain contrast for body text on `gray-50` and `white`.
- Respect reduced motion and avoid motion-only feedback.

---

## 10. Do and don't

| Do | Don't |
|----|-------|
| Let pages fill the content area | Wrap pages in `max-w-7xl` |
| Use flat badges with borders | Use filled pastel pills or gradients |
| Put cohort in the top bar | Put date/time or student ID in the top bar |
| Use `deep-600` for primary actions | Introduce a second brand accent |
| Use domain colours only for domains | Use domain colours for success/error |
| Use the shared `Badge`, `Button`, `Card`, `Input` | Re-implement primitives per page |
| Keep metadata plain and readable | Decorate IDs or dates with badges |

---

## 11. Where to change what

| Change | File |
|--------|------|
| Colour scale, fonts, motion tokens | `client/tailwind.config.js`, `client/src/index.css` |
| App shell and top bar | `client/src/components/layout/AppLayout.jsx` |
| Navigation and profile popover | `client/src/components/layout/Sidebar.jsx` |
| Badge/chip styles | `client/src/components/ui/badge.jsx` |
| Button styles | `client/src/components/ui/button.jsx` |
| Card styles | `client/src/components/ui/card.jsx` |
| Deadline chip colours | `client/src/lib/deadlines.js` |
| Certificate | `client/src/components/certificate/ProfessionalCertificate.jsx` |
| Brand source assets | `assets/brand/` |
