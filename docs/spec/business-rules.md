# URL Shortener — Business Rules

This document defines the business rules that govern the URL shortener. Rules are normative: the system must enforce them.

## 1. Original URL

### BR-URL-001 — Required input
A short link creation request must include an original URL. Empty or missing values are rejected.

### BR-URL-002 — Format validation
The original URL must be a well-formed absolute URL with an allowed scheme (at minimum `http` and `https`). Invalid formats are rejected.

### BR-URL-003 — Normalization
Before persistence, the original URL may be normalized (e.g. trimming whitespace). Normalization must not change the destination intent in a way that breaks the user's submitted link.

### BR-URL-004 — Edit validation
When an authenticated user updates the original URL of an existing short link, the same validation rules as creation apply (BR-URL-001, BR-URL-002).

## 2. Short Code — Anonymous Users

### BR-CODE-001 — Automatic generation
Anonymous (unauthenticated) users cannot choose a short code. The system always generates one automatically.

### BR-CODE-002 — Length
Anonymous short codes must be exactly **6 characters**.

### BR-CODE-003 — Allowed alphabet
Anonymous short codes may contain only:
- lowercase letters `a`–`z`
- digits `0`–`9`

Uppercase letters, symbols, and whitespace are not allowed.

### BR-CODE-004 — Randomness
The short code must be randomly generated from the allowed alphabet.

### BR-CODE-005 — Uniqueness
Every short code must be unique across the entire system, regardless of who created it (anonymous or authenticated).

### BR-CODE-006 — Collision handling
If a generated code already exists, the system must generate a new one and retry until a unique code is obtained (or fail safely after a defined retry limit).

## 3. Short Code — Authenticated Users

### BR-CODE-007 — Custom short codes
Authenticated and authorized users may define a custom short code instead of using a randomly generated one.

### BR-CODE-008 — Custom code uniqueness
A custom short code must be unique system-wide. If the chosen code already exists, the request is rejected with a conflict error.

### BR-CODE-009 — Reserved paths
A custom short code must not collide with reserved system path segments, including at least:
- `v` (preview route prefix)
- authentication routes
- management / API routes
- any other reserved application paths

### BR-CODE-010 — Custom code character rules
Custom short codes must follow application-defined character and length constraints. At minimum they must:
- be non-empty
- not contain path separators (`/`)
- not contain whitespace
- be suitable for use in a URL path segment

Exact allowed length and character set are defined at implementation time and must be enforced consistently on create and edit.

### BR-CODE-011 — Optional random generation for authenticated users
If an authenticated user does not provide a custom short code, the system may generate a random 6-character code under the same rules as anonymous creation (BR-CODE-002 through BR-CODE-006).

### BR-CODE-012 — Short code immutability for anonymous links
Anonymous short links cannot be renamed after creation. Only authenticated owners may change a short code they own (see BR-OWN-*).

## 4. QR Code

### BR-QR-001 — Mandatory generation
Every successfully created short link must have an associated QR code.

### BR-QR-002 — Encoded content
The QR code must encode the **short URL** (not the original URL).

### BR-QR-003 — Regeneration on short code change
If an authenticated user changes the short code of an existing link, the QR code must be regenerated to encode the new short URL.

### BR-QR-004 — Availability on preview
The preview page must display the QR code corresponding to the current short URL for that short code.

## 5. Redirect

### BR-RED-001 — Lookup by short code
When a short URL is accessed, the system resolves the short code and retrieves the mapped original URL.

### BR-RED-002 — Successful redirect
If the short code exists, the system must redirect the client to the original URL.

### BR-RED-003 — Unknown short code
If the short code does not exist (never created or deleted), the system must return a not-found response.

### BR-RED-004 — QR scan equivalence
Scanning the QR code must produce the same redirect behavior as opening the short URL directly, because the QR encodes the short URL.

### BR-RED-005 — No authentication required
Redirects are public. Authentication is not required to follow a short URL.

## 6. Preview Page

### BR-PREV-001 — Route
The preview page is available at `/v/{short_code}`.

### BR-PREV-002 — Content
For an existing short code, the preview page must display at least:
- the short URL
- the QR code for that short URL

### BR-PREV-003 — Unknown short code
If `{short_code}` does not exist, the preview page must return a not-found response.

### BR-PREV-004 — Public access
The preview page is public. Authentication is not required to view it.

### BR-PREV-005 — No automatic redirect
Accessing `/v/{short_code}` must **not** automatically redirect to the original URL. It only displays preview information.

## 7. Authentication and Authorization

### BR-AUTH-001 — Pre-provisioned accounts
User accounts are created and authorized in advance. Public self-registration is not available.

### BR-AUTH-002 — Login credentials
A user authenticates with a username and password previously provisioned for their account.

### BR-AUTH-003 — Authorization required
Only accounts marked as authorized may access management features and create custom short codes.

### BR-AUTH-004 — Unauthorized account
An authenticated but unauthorized account must be denied management actions.

### BR-AUTH-005 — Unauthenticated access
Unauthenticated requests to management endpoints must be denied and require login.

### BR-AUTH-006 — Credential storage
Passwords must never be stored in plain text. Only a secure password hash may be persisted.

## 8. Ownership and Management

### BR-OWN-001 — Ownership assignment
When an authenticated authorized user creates a short link, that user becomes the owner (`owner_id`).

### BR-OWN-002 — Anonymous ownership
Short links created anonymously have no owner.

### BR-OWN-003 — List scope
An authenticated user may list only the short links they own.

### BR-OWN-004 — Edit permission
A user may edit only short links they own.

### BR-OWN-005 — Delete permission
A user may delete only short links they own.

### BR-OWN-006 — Editable fields
An owner may update:
- the original URL (subject to BR-URL-*)
- the short code (subject to BR-CODE-007 through BR-CODE-010)

### BR-OWN-007 — Edit uniqueness check
When changing a short code, the new code must pass uniqueness and reserved-path rules. If it conflicts, the edit is rejected and the previous code remains unchanged.

### BR-OWN-008 — Delete effect
Deleting a short link permanently removes the mapping. After deletion:
- redirect for that short code returns not found
- preview for that short code returns not found
- the short code becomes available for future use

### BR-OWN-009 — No management of anonymous links by default
Anonymous short links cannot be listed, edited, or deleted through the management menu unless later ownership transfer is explicitly introduced (out of scope).

## 9. Routing Precedence

### BR-ROUTE-001 — Preview takes precedence for `/v/...`
Requests under `/v/{short_code}` always resolve to the preview page behavior, never to a short-code redirect named `v`.

### BR-ROUTE-002 — Reserved routes before short codes
System routes (auth, management, API, static assets) take precedence over short-code resolution.

### BR-ROUTE-003 — Short code resolution
After reserved routes are excluded, a path segment matching an existing short code must redirect according to BR-RED-*.

## 10. Error Handling Summary

| Rule reference | Condition | Business outcome |
| --- | --- | --- |
| BR-URL-001 / BR-URL-002 | Invalid or missing original URL | Reject with validation error |
| BR-CODE-005 / BR-CODE-008 | Short code already in use | Reject with conflict error |
| BR-CODE-009 | Short code is reserved | Reject with validation error |
| BR-RED-003 / BR-PREV-003 | Unknown short code | Not found |
| BR-AUTH-005 | Management without login | Deny / require authentication |
| BR-AUTH-003 / BR-AUTH-004 | Unauthorized account | Deny management actions |
| BR-OWN-004 / BR-OWN-005 | Access to another user's link | Deny / not found |

## 11. Rule Priority

When rules conflict, apply in this order:

1. Security and authorization (BR-AUTH-*, BR-OWN-*)
2. Routing precedence (BR-ROUTE-*)
3. Data integrity and uniqueness (BR-CODE-005, BR-CODE-008, BR-OWN-007)
4. Feature behavior (redirect, preview, QR)
5. Convenience / normalization (BR-URL-003)
