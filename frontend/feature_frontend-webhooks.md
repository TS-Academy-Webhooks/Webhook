# Frontend — Webhook Management

**Branch:** `feature/frontend-webhooks`
**Scope:** Webhooks list, Create, Edit, Details, Enable/Disable, Delete (per the assigned roadmap task), plus a minimal Dashboard and layout built to make the work visible/navigable.
**Status:** All 6 webhook capabilities have frontend code written. Not yet run against a live backend — everything below was built against the confirmed API contract, not tested end-to-end.

---

## 1. Why this doc exists

Several files this feature depends on were empty scaffolds already sitting in the repo (`api.js`, `formatDate.js`, all of `components/common/`). Rather than blocking, they were filled in as part of this work since other pages will need them too. This doc flags every one of those so nobody duplicates the effort or gets surprised by unfamiliar code in a shared file.

**If you're building another page and hit a blank file that this doc says is now implemented — pull latest, it's probably already done.**

---

## 2. Confirmed API contract (webhooks)

Settled with the backend team this session. Source of truth until an OpenAPI/Postman doc replaces it.

| Endpoint                           | Notes                                                                                                                                                                                                                                                                                                                                                                   |
|------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `GET /api/webhooks`                | Query: `page`, `limit`, `search`, `active`. Returns `data: { items, pagination: { page, limit, total, totalPages } }` — an **object**, not a bare array.                                                                                                                                                                                                                |
| `POST /api/webhooks`               | Body: `{ name, url, events, isActive? }` (`isActive` defaults `true`). Response includes the **full signing secret** — the only time it's guaranteed to.                                                                                                                                                                                                                |
| `GET /api/webhooks/:id`            | No body. Per the backend team, currently returns the **full secret** (see §6 — this is disputed/pending).                                                                                                                                                                                                                                                               |
| `PUT /api/webhooks/:id`            | **Not PATCH.** Accepts a partial body — `{ isActive: false }` alone is valid for toggling.                                                                                                                                                                                                                                                                              |
| `DELETE /api/webhooks/:id`         | No body.                                                                                                                                                                                                                                                                                                                                                                |
| `GET /api/webhooks/:id/deliveries` | Returns `data: { items: [{ id, status, attemptCount, maxAttempts, lastAttemptAt, createdAt, event: { id, eventId, type } }], pagination }`. `status` is a 3-value string: `pending` / `success` / `failed` — distinct from the top-level `success: true/false` on every response envelope. Not yet consumed by any built page (Deliveries page is someone else's task). |

**Validation errors** come back as an array, not an object:
```json
{ "success": false, "message": "Validation failed", "data": null,
  "errors": [{ "field": "url", "message": "URL must be a valid https:// address" }] }
```
`utils/apiError.js` converts this into `{ field: message }` for form display — see §4.

**Localhost URLs:** accepted in dev, but production will reject anything that isn't `https://`. `utils/validateWebhook.js` enforces this client-side already.

**Admin scope:** Admin sees all webhooks, not just their own — no frontend filtering needed for that.

---

## 3. Open / unresolved

- **Secret exposure on `GET /api/webhooks/:id`.** Backend's current position: full secret returned on create, on single-GET, and on update. Emmanuel proposed narrowing this to *create only*, with single-GET masked like the list view, to properly enforce "shown once." **Not yet resolved.** `SecretField`/`WebhookDetails` currently follow the backend's stated (not proposed) behavior. If this changes, the fix is one line in `WebhookDetails.jsx` (swap which field feeds `SecretField`) — flagged in a comment there.
- **No `--success` / `--warning` design tokens** in `styles/variables.css`. `Badge.css` falls back to hardcoded oklch values via `var(--success, oklch(...))` so it'll pick up real tokens automatically once added. Suggested tokens are in §5.
- **`useAuth.js` is still blank.** Not touched this session — out of scope for webhooks, but any page needing an auth-state check (e.g. hiding actions from non-owners) is blocked on it.
- **`Button`'s `as`/`to`/`loading` API and `Badge`'s variant names were assumed**, since those files were blank when this work started — see §4, they're no longer assumptions, they're now the actual implementation. If you already had different names in mind, this is now what's live.

---

## 4. Files touched this session

Every file below opens with a `// path/to/file` (or `/* ... */` for CSS) comment stating its own location — that's now the convention for generated code in this project.

### Filled in (previously blank scaffolds, not webhook-specific)
| File                                             | What it does                                                                                                                                                                                                                                                                          |
|--------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `src/services/api.js`                            | Shared axios instance. Attaches JWT from `localStorage` under a fixed key, `AUTH_TOKEN_KEY = 'auth_token'`. Handles global 401 → clears token, redirects to `/login`. **Whoever builds auth pages must write the token to this exact key on login/register, and clear it on logout.** |
| `src/utils/formatDate.js`                        | `formatDate(input, { withTime })` and `formatDate Time(input)`. Null-safe — bad/missing input renders `—`, never `"Invalid Date"`.                                                                                                                                                    |
| `src/components/common/Badge.jsx` (+`.css`)      | `<Badge variant="neutral\|primary\|success\|warning\|destructive">`.                                                                                                                                                                                                                  |
| `src/components/common/Button.jsx` (+`.css`)     | `<Button variant as loading disabled type>`. Polymorphic via `as={Link} to="..."` for nav-styled-as-button; blocks clicks on a disabled/loading non-`<button>` element since e.g. `Link` ignores the `disabled` attribute.                                                            |
| `src/components/common/Input.jsx` (+`.css`)      | `<Input label error id ...rest>`. Auto-generates an id via `useId` if none passed; wires `aria-invalid`/`aria-describedby` to the error message.                                                                                                                                      |
| `src/components/common/Loader.jsx` (+`.css`)     | `<Loader size="sm\|md\|lg" label showLabel>`. `role="status"`, visually-hidden label by default.                                                                                                                                                                                      |
| `src/components/common/EmptyState.jsx` (+`.css`) | `<EmptyState title description action>`.                                                                                                                                                                                                                                              |
| `src/components/common/Modal.jsx` (+`.css`)      | `<Modal isOpen onClose title>`. Full focus trap, Escape-to-close, focus restored to the trigger element on close, renders via `createPortal` into `document.body`.                                                                                                                    |

### New shared utilities (not webhook-specific, but built for this work)
| File                              | What it does                                                                                                          |
|-----------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `src/utils/apiError.js`           | `parseApiError(error)` → `{ message, fieldErrors, status }`. Every webhook service call throws this shape on failure. |
| `src/hooks/useDebouncedValue.js`  | Generic debounce hook, used for the webhooks search box.                                                              |
| `src/hooks/useCopyToClipboard.js` | `[copied, copy]` — used by `SecretField` and the endpoint-URL copy button.                                            |

### Webhook feature code
| File                                                       | What it does                                                                                                                                                          |
|------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `src/constants/webhookEvents.js`                           | The 8 shipment event types (`value`/`label` pairs), kept in sync with backend event `type` strings.                                                                   |
| `src/utils/validateWebhook.js`                             | Client-side validation mirroring backend rules (name length, https-only in prod, at least one event).                                                                 |
| `src/utils/formatEventType.js`                             | `"shipment.out_for_delivery"` → `"Out for delivery"`.                                                                                                                 |
| `src/services/webhookService.js`                           | All webhook API calls: `getWebhooks`, `getWebhook`, `createWebhook`, `updateWebhook`, `toggleWebhook`, `deleteWebhook`, `getWebhookDeliveries`.                       |
| `src/hooks/useWebhooks.js`                                 | List state — params (page/limit/search/active), optimistic `toggle`, optimistic `remove` (with rollback), auto-adjusts page if you delete the last row on a page > 1. |
| `src/hooks/useWebhook.js`                                  | Single-webhook state for Details/Edit — `update`, `toggle`, `remove`, `notFound` handling for 404.                                                                    |
| `src/components/webhooks/EventBadges.jsx` (+`.css`)        | Compact chip list for the table — shows first 2 events + `+N`.                                                                                                        |
| `src/components/webhooks/WebhookStatus.jsx` (+`.css`)      | `Badge` + optional `Toggle` combo for active/inactive display and enable/disable.                                                                                     |
| `src/components/webhooks/DeleteWebhookModal.jsx` (+`.css`) | Confirm-delete dialog, wraps `Modal`.                                                                                                                                 |
| `src/components/webhooks/WebhookTable.jsx` (+`.css`)       | Desktop `<table>` / mobile stacked-card fallback below 768px.                                                                                                         |
| `src/components/webhooks/EventSelector.jsx` (+`.css`)      | Checkbox grid with "select all / clear all", used in the form.                                                                                                        |
| `src/components/webhooks/SecretField.jsx` (+`.css`)        | Displays a secret with copy button; `oneTime` prop shows a "copy it now" warning.                                                                                     |
| `src/components/webhooks/WebhookForm.jsx` (+`.css`)        | Shared Create/Edit form. Includes a "Use Demo Receiver" button that fills the URL field with `${VITE_API_BASE_URL}/demo-receiver`.                                    |
| `src/pages/webhooks/Webhooks.jsx` (+`.css`)                | List page — search (debounced 300ms), status filter, pagination, empty/no-results/error states, wired to `useWebhooks`.                                               |
| `src/pages/webhooks/CreateWebhook.jsx` (+`.css`)           | Calls `createWebhook`, redirects to Details passing the one-time secret via router `state` (never URL or `localStorage`).                                             |
| `src/pages/webhooks/WebhookDetails.jsx` (+`.css`)          | Full webhook view — status toggle, edit/delete/view-deliveries actions, endpoint URL with copy, event list, secret card, timestamps.                                  |
| `src/pages/webhooks/EditWebhook.jsx` (+`.css`)             | Thin wrapper over `WebhookForm`; diffs submitted values against the loaded webhook and sends **only changed fields** via `PUT`.                                       |

### Navigation/visibility (added to unblock actually seeing the work — not part of the 6-item task)
| File                                              | What it does                                                                                                                                                                                            |
|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `src/layouts/DashboardLayout.jsx` (+`.css`)       | **Placeholder, not final.** Minimal topbar with 2 nav links + `<Outlet />`. Whoever owns the real Navbar/Sidebar should replace this — just keep the `<Outlet />`.                                      |
| `src/components/dashboard/StatCard.jsx` (+`.css`) | Generic label/value stat card.                                                                                                                                                                          |
| `src/pages/Dashboard.jsx` (+`.css`)               | Shows live Total/Active/Inactive webhook counts via 3 lightweight (`limit: 1`) requests. Built to extend — add more stat calls as other APIs come online.                                               |
| `src/App.jsx`                                     | All routes nested under `DashboardLayout`. Added `"/" → "/dashboard"` redirect since no login page exists yet — **revert this to `<Login />` once auth pages land**, or login will be silently skipped. |

---

## 5. Suggested `variables.css` additions

Not yet applied — a snippet for the team to review, since `variables.css` is shared:

```css
/* :root */
--success: oklch(0.6 0.15 145);
--success-foreground: oklch(0.97 0.014 254.604);
--warning: oklch(0.75 0.15 80);
--warning-foreground: oklch(0.148 0.004 228.8);

/* .dark */
--success: oklch(0.65 0.15 145);
--warning: oklch(0.7 0.15 80);
```

## 6. Environment variable

`VITE_API_BASE_URL` — used by both `services/api.js` (axios `baseURL`) and `WebhookForm`'s Demo Receiver helper. Falls back to `http://localhost:5000/api` if unset. Confirm this matches the actual backend port/prefix.

## 7. Not yet done

- End-to-end QA against a live backend (search/filter/pagination edge cases, optimistic-toggle rollback, delete from both list and details, 401 handling, responsive layout, light/dark theme) — blocked on the backend being reachable.
- Delivery Logs page (consumes `GET /api/webhooks/:id/deliveries`, contract already confirmed above) — not part of this task's scope.
- Real Navbar/Sidebar to replace the placeholder `DashboardLayout`.
- `--success`/`--warning` tokens (§5), and the secret-exposure resolution (§3).