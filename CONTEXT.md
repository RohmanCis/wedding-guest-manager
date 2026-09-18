# CONTEXT.md — Domain Glossary

Domain vocabulary for the Wedding Guest Manager. Naming source for modules, docs, and conversation; update in place when a term sharpens.

- **Guest** — one invitation entry: name, address, exactly one Party, one Group, pax (1–4). Identity = normalized name only (BR-006).
- **Party** — side of the wedding hosting the guest (Groom, Bride, Groom Family, Bride Family). Category kind `"party"`.
- **Group** — social circle of the guest (Rekan Kerja, Sekolah, …). Category kind `"group"`.
- **pax** — integer 1–4, people covered by one guest entry. One number per entry; not household member tracking.
- **duplicate name** — a second guest whose normalized name (trim → collapse whitespace → lowercase) equals an existing one. Blocked server-side and by DB UNIQUE; the 409 carries `existingId` for the jump below (BR-007).
- **duplicate jump** — BR-007: from a duplicate-name error, reset filters, search by the existing name, and reveal that row (scroll + gold highlight; page-jump if paginated off-screen). Decision core is pure: `rowReveal()` in `src/lib/duplicate-jump.ts`.
- **error payload** — the shared API error wire contract: `errorPayload()` in `src/lib/normalize.ts` maps a domain error to `{ status, body }`; `errorResponse()` wraps it in `NextResponse`, `ApiError` in `src/lib/client.ts` consumes it. Field names (`error`, `existingId`, `field`) are owned here.
- **Guest filter** — the `search` / `partyId` / `groupId` triple that scopes the guest list, CSV export, and analytics. Encoded to and decoded from query params at one seam: `src/lib/guest-filter.ts`.
- **distribution** — read-only count of guest entries per Party or Group (not pax-weighted), shown on `/analytics`. Data shape: `DistributionDatum` (label, value, color), owned by the analytics data module; category hex resolves through the single `hexFor(kind, name)` rule.
