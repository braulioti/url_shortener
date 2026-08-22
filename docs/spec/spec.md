# URL Shortener — Product Specification

## Overview

A simple URL shortener that accepts a long URL, generates a short link, and produces a QR code for that short link. Accessing the short URL or scanning the QR code redirects to the original destination. Authenticated users can choose custom short codes and manage their links.

## Goals

- Shorten any valid URL into a compact, shareable link
- Generate a QR code for every short URL
- Redirect users from the short URL (or QR scan) to the original URL
- Provide a public preview page for viewing the short URL and its QR code
- Allow authorized users to create custom short codes and manage their URLs
- Support multiple UI languages, with **pt-BR** as the default locale

## Non-Goals

- Analytics dashboards or click tracking beyond basic redirect behavior
- Public self-registration (accounts are pre-provisioned and authorized)
- Bulk import/export of URLs
- Multi-tenant organizations or team sharing

## Core Concepts

| Concept | Description |
| --- | --- |
| Original URL | The destination URL provided by the user |
| Short code | Identifier used in the short URL path (6 random alphanumeric characters, or a custom name for authenticated users) |
| Short URL | Public URL that resolves via the short code and redirects to the original URL |
| QR code | Image encoding the short URL |
| Preview page | Page at `/v/{short_code}` that displays the short URL and QR code |
| Locale | Language used for UI strings and user-facing messages (default: `pt-BR`) |

## Public Features

### 1. Create a short URL (anonymous)

1. User submits a valid original URL.
2. System generates a **6-character short code** using lowercase letters (`a–z`) and digits (`0–9`).
3. System persists the mapping between short code and original URL.
4. System generates a QR code that encodes the short URL.
5. System returns the short URL and QR code to the user.

**Short code rules (anonymous):**

- Length: exactly 6 characters
- Alphabet: `a-z` and `0-9` only
- Must be unique across the system
- Generation must retry on collision until a unique code is obtained

### 2. Redirect via short URL

- When a user opens the short URL (or scans the QR code), the system looks up the short code.
- If found, respond with an HTTP redirect to the original URL.
- If not found, return a not-found response (e.g. HTTP 404).

### 3. Preview page (`/v/{short_code}`)

- Path: `/v/{short_code}`
- Displays:
  - The short URL
  - The QR code for that short URL
- If the short code does not exist, return a not-found response.

## Authenticated Features

Accounts are **pre-registered and authorized**. There is no public sign-up flow in this specification.

### 1. Authentication

- User signs in with a previously provisioned username and password.
- Only authorized accounts may access management features and custom short codes.

### 2. Custom short codes

- Authenticated users may choose **any** short code name (not limited to 6 random characters), subject to validation rules:
  - Must be unique
  - Must not collide with reserved system paths (e.g. `v`, auth routes, API routes)
  - Allowed character set and length constraints should be enforced by the application (to be defined during implementation)
- QR code generation and redirect behavior remain the same as for anonymous short URLs.

### 3. URL management menu

Authenticated users have a management area where they can:

| Action | Description |
| --- | --- |
| List | View all URLs they own |
| Edit | Change the original URL and/or the short code (subject to uniqueness and validation) |
| Delete | Permanently remove a short URL mapping |

Deleting a short URL invalidates both the redirect and the preview page for that code.

## Internationalization (i18n)

The product must support multiple languages for user-facing text (UI labels, form messages, validation/error messages shown to users).

### Rules

- **Default locale:** `pt-BR` (Brazilian Portuguese). When no locale is selected or detected, the UI must use `pt-BR`.
- **Additional locales:** At least one other locale must be supported (e.g. `en`). Exact locale set may grow during implementation.
- **Scope:** Applies to interactive UI and user-visible messages. HTTP redirects themselves are language-agnostic.
- **Selection:** Users should be able to switch language (exact mechanism — selector, preference, or `Accept-Language` — defined at implementation time). Preference may be remembered for the session or a longer period when practical.
- **Consistency:** All screens in scope (public create, preview, sign-in, management) must use the active locale. Missing translations must fall back to `pt-BR`.

## URL Routing Summary

| Route | Behavior |
| --- | --- |
| Short URL root path with `{short_code}` | Redirect to the original URL |
| `/v/{short_code}` | Preview page (short URL + QR code) |
| Auth / management routes | Sign-in and CRUD for authenticated users |

Exact path conventions for the short URL root (e.g. `/{code}` vs `/r/{code}`) may be decided at implementation time, but redirect and `/v/{code}` preview must both be supported.

## Functional Requirements

1. Accept and validate original URLs before creating a short link.
2. Generate unique short codes for anonymous users using 6 lowercase alphanumeric characters.
3. Generate a QR code for every created short URL.
4. Redirect short URL access to the original URL.
5. Serve a preview page at `/v/{short_code}` showing the short URL and QR code.
6. Support login for pre-authorized users.
7. Allow authenticated users to create custom-named short codes.
8. Allow authenticated users to list, edit, and delete their URLs.
9. Support multiple UI languages with default locale `pt-BR` and fallback to `pt-BR` for missing translations.

## Non-Functional Requirements

- **Reliability:** Redirects must resolve quickly and consistently for valid short codes.
- **Uniqueness:** Short codes must be unique; collisions must be handled safely.
- **Security:** Credentials must be stored and verified securely; management endpoints must require authentication and authorization.
- **Usability:** Creating a short URL and obtaining its QR code should require minimal steps for anonymous users.
- **Internationalization:** UI and user-facing messages must be available in more than one language; default and fallback locale is `pt-BR`.

## Data Model (logical)

### ShortLink

| Field | Description |
| --- | --- |
| `id` | Unique identifier |
| `short_code` | Public short code (random or custom) |
| `original_url` | Destination URL |
| `owner_id` | Optional; set when created by an authenticated user |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |

### User

| Field | Description |
| --- | --- |
| `id` | Unique identifier |
| `username` | Login identifier |
| `password_hash` | Securely hashed password |
| `authorized` | Whether the account may use management features |
| `user_admin` | Whether the account is an administrator |
| `created_at` | Creation timestamp |

## Error Handling

| Scenario | Expected behavior |
| --- | --- |
| Invalid original URL | Reject creation with a validation error |
| Unknown short code (redirect or preview) | Not found |
| Short code collision (custom) | Reject with a conflict error |
| Unauthenticated access to management | Deny access / require login |
| Unauthorized account | Deny management actions |

## Out of Scope (for later)

- Click analytics and reporting
- Expiration dates for short links
- Rate limiting details and abuse prevention policies
- Public registration and password recovery flows

## Acceptance Criteria

- [ ] Anonymous user can submit a URL and receive a 6-character short code plus QR code
- [ ] Opening the short URL redirects to the original URL
- [ ] Scanning the QR code leads to the same redirect behavior
- [ ] `/v/{short_code}` shows the short URL and QR code
- [ ] Unknown codes return not found for both redirect and preview
- [ ] Authorized user can sign in
- [ ] Authorized user can create a custom-named short URL
- [ ] Authorized user can list, edit, and delete their URLs
- [ ] Deleted short codes no longer redirect or show a preview
- [ ] UI defaults to `pt-BR` when no locale is chosen
- [ ] User can switch to another supported language and see translated UI/messages
- [ ] Missing translations fall back to `pt-BR`
