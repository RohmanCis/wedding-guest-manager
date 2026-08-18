# Product Requirements Document
## Wedding Guest Manager

**Status:** Draft for Implementation
**Product Type:** Standalone internal web application
**Primary User:** Single administrator (wedding organizer / owner)
**Current Scope:** Guest list management only

---

## 1. Product Overview

Wedding Guest Manager is a simple standalone web application for manually collecting, organizing, filtering, and exporting a wedding guest list gathered from multiple parties.

The application is intentionally limited in scope. The only person entering data is the administrator. Guest profile data currently consists of only **Name** and **Address**. Guests are organized using two dimensions:

1. **Party**: who the guest belongs to.
2. **Group**: what type of relationship/category the guest belongs to.

The product must prioritize fast manual entry, clear categorization, reliable duplicate prevention, simple filtering, and CSV export.

The application is not an invitation system, attendance system, RSVP system, QR check-in system, or multi-user collaboration platform.

---

## 2. Problem Statement

The guest list is collected from multiple sources and parties. Without a centralized structure, the administrator must manually reconcile names, ownership, and categories across scattered lists.

The product must provide one source of truth where the administrator can:

- enter guests manually;
- assign each guest to exactly one Party;
- assign each guest to exactly one Group;
- store the guest's name and address;
- prevent duplicate guests based on name;
- search and filter the guest list;
- maintain Party and Group values through a simple UI;
- export either all guests or the currently filtered guests as CSV.

---

## 3. Product Goal

Create a lightweight, reliable guest registry that makes it immediately obvious:

- who each guest is;
- which party they belong to;
- which category/group they belong to;
- where they live;
- how many guests exist under each party/group;
- and which subset of guests is being viewed or exported.

### Success Criteria

The MVP is successful when the administrator can manually build and maintain the guest list without relying on a spreadsheet for the source of truth, while retaining fast search/filter workflows and deterministic CSV export.

---

## 4. Scope

### 4.1 In Scope

- Single administrator authentication.
- Guest CRUD.
- Guest fields:
  - Name
  - Address
  - Party
  - Group
- Exactly one Party per guest.
- Exactly one Group per guest.
- Party management from UI.
- Group management from UI.
- Search guests.
- Filter guests by Party.
- Filter guests by Group.
- Combined filtering/search.
- Duplicate blocking by normalized guest name.
- Dashboard/list summary counts.
- CSV export of all guests.
- CSV export of the current filtered result set.
- Empty states, validation, error states, and confirmation for destructive actions.

### 4.2 Explicitly Out of Scope

Do not implement any of the following in MVP:

- Multi-user/contributor accounts.
- Guest invitation status.
- RSVP.
- Attendance/check-in.
- Pax/household management.
- QR code.
- WhatsApp integration.
- Email/SMS integration.
- Import from CSV/Excel.
- Advanced reporting.
- Guest relationship/free-text relationship field.
- Audit log UI.
- Notification system.
- Payment or budgeting features.
- Wedding invitation website functionality.

Any future feature must not be added solely because it appears generally useful.

---

## 5. Domain Model

### 5.1 Guest

Represents one unique guest record.

Required fields:

| Field | Type | Required | Rules |
|---|---|---:|---|
| id | UUID or equivalent | Yes | System generated |
| name | string | Yes | Non-empty after trimming |
| address | string | Yes | One free-text field; non-empty after trimming |
| party_id | foreign key | Yes | Exactly one Party |
| group_id | foreign key | Yes | Exactly one Group |
| created_at | timestamp | Yes | System generated |
| updated_at | timestamp | Yes | System generated |

No other Guest profile fields are required in MVP.

### 5.2 Party

Represents ownership/source side of a guest.

Initial values:

- Groom
- Bride
- Groom Family
- Bride Family

Party values are manageable through the UI.

A Party must not be deleted if doing so would orphan guest records. The implementation should prefer either:

- blocking deletion while referenced; or
- requiring reassignment before deletion.

Do not silently delete or reassign guests.

### 5.3 Group

Represents the guest category.

Suggested initial values:

- Rekan Kerja
- Sekolah
- Kuliah
- Tetangga
- Saudara
- Teman
- Komunitas
- Lainnya

These are starting values, not immutable system enums. They must be manageable through the UI without introducing an unnecessarily complex taxonomy builder.

A Group must not be deleted while referenced by guests unless the user explicitly reassigns affected guests first.

---

## 6. Business Rules

### BR-001 Guest Ownership

Each guest must belong to exactly one Party.

A guest cannot simultaneously belong to multiple Parties in MVP.

### BR-002 Guest Group

Each guest must belong to exactly one Group.

A guest cannot have multiple Groups in MVP.

### BR-003 No Relationship Field

Do not add a Relationship/Relation field. Group is sufficient for the current product scope.

### BR-004 Address

Address is stored as a single free-text field.

Do not split address into RT, RW, Kelurahan, Kecamatan, City, Province, Postal Code, or other structured sub-fields.

### BR-005 Duplicate Definition

A guest is considered a duplicate **based on Name only**.

Address, Party, and Group do not affect duplicate detection.

Therefore these records are considered duplicates:

```text
Budi Santoso | Jl. Mawar | Groom | Rekan Kerja
Budi Santoso | Jl. Melati | Bride Family | Tetangga
```

The second record must be rejected rather than stored as a separate guest.

### BR-006 Name Normalization for Duplicate Detection

Duplicate comparison must not be a naive raw-string equality check.

Before comparison, the application must at minimum:

1. trim leading/trailing whitespace;
2. collapse repeated internal whitespace;
3. compare case-insensitively.

Example:

```text
" Budi  Santoso "
"budi santoso"
"BUDI SANTOSO"
```

are treated as the same normalized name.

Do not implement fuzzy matching, phonetic matching, typo correction, or similarity scoring in MVP.

### BR-007 Duplicate Behavior

When a normalized name already exists, guest creation must be blocked with a clear user-facing message.

The application must not silently merge records.

The user should be able to navigate to or inspect the existing matching guest from the duplicate error state if the UI makes that practical.

### BR-008 Guest Edit and Duplicate Check

When editing a guest name, duplicate validation must apply again.

A guest is allowed to retain its own current name during edit, but cannot change its name to another existing guest's normalized name.

### BR-009 Delete

Guest deletion is allowed for the sole administrator.

Destructive deletion must require an explicit confirmation.

Deletion must not cascade unexpectedly into Party or Group records.

### BR-010 Category Management

Party and Group values can be created, renamed, and deleted from the UI with simple controls.

The UI must prevent destructive operations that would leave guest records invalid.

### BR-011 Manual Entry Only

All guest creation in MVP is manual through the application UI.

No import workflow is required.

### BR-012 Export Scope

The administrator can export:

1. **All Guests**.
2. **Filtered Guests**, meaning the current result set after applying search and/or filters.

CSV export must reflect the visible filtering criteria at the moment export is initiated.

### BR-013 Export Fields

CSV export should include at minimum:

```text
Name,Address,Party,Group
```

The exported CSV must contain one guest per row.

---

## 7. Functional Requirements

### FR-001 Authentication

The application must provide authentication for the single administrator.

Multi-role authorization is not required in MVP.

### FR-002 Guest List

The main guest management screen must display a structured guest table/list containing at minimum:

- Name
- Address
- Party
- Group
- Actions

The list must support pagination or another bounded rendering strategy when the dataset grows.

### FR-003 Add Guest

The administrator can create a guest with:

- Name
- Address
- Party
- Group

All four values are required.

### FR-004 Edit Guest

The administrator can edit all guest fields.

Duplicate validation must run when the Name changes.

### FR-005 Delete Guest

The administrator can delete a guest with confirmation.

### FR-006 Search

The guest list must support searching by Name.

Search should be case-insensitive.

### FR-007 Filter by Party

The guest list must support filtering by Party.

### FR-008 Filter by Group

The guest list must support filtering by Group.

### FR-009 Combined Search and Filter

Search, Party, and Group filters must work together.

Example:

```text
Search: Budi
Party: Groom
Group: Rekan Kerja
```

The result must satisfy all active constraints.

### FR-010 Reset Filters

A clear/reset action must return the list to the unfiltered state.

### FR-011 Guest Count

The UI should display useful counts such as:

- Total guests.
- Current result count.
- Optional Party/Group breakdowns where useful.

Do not turn this into a BI dashboard.

### FR-012 Category Management

The administrator can:

- view Parties;
- add a Party;
- rename a Party;
- delete a Party when safe;
- view Groups;
- add a Group;
- rename a Group;
- delete a Group when safe.

The UI should keep these operations compact and simple.

### FR-013 CSV Export

The administrator can export all guests as CSV.

The administrator can export the current filtered result as CSV.

Export must preserve the active query/filter semantics.

### FR-014 Empty States

Provide clear empty states for:

- no guests yet;
- no search results;
- no filtered results;
- no available Groups/Parties where relevant.

### FR-015 Validation

Validation errors must be clear, local to the relevant field when practical, and must not expose raw database errors.

---

## 8. UX Requirements

### 8.1 Design Principle

The product is an operational tool, not a showcase website.

Optimize for:

- fast entry;
- minimal clicks;
- clear hierarchy;
- obvious filtering;
- low cognitive load;
- predictable destructive actions.

### 8.2 Main Navigation

Keep navigation minimal:

```text
Dashboard / Guests
Categories
```

No navigation section should exist for out-of-scope features.

### 8.3 Guest Form

The guest form should expose only the required fields:

```text
Name       [.........................]
Address    [.........................]
Party      [ Select Party ▼ ]
Group      [ Select Group ▼ ]

[ Save ]
```

Avoid unnecessary multi-step forms.

### 8.4 Guest List Toolbar

Recommended structure:

```text
[ Search name... ] [ Party ▼ ] [ Group ▼ ] [ Reset ] [ Export CSV ]
```

The create action should remain obvious.

### 8.5 Duplicate Error

When a duplicate name is entered, show a direct error such as:

```text
Guest with this name already exists.
```

The system should identify the existing record when possible.

### 8.6 Category UI

Party and Group management should use straightforward CRUD controls.

Do not build drag-and-drop taxonomy management, nested categories, permissions, versioning, or bulk editing.

---

## 9. Data Integrity Requirements

- Guest Name must have a database-enforced uniqueness strategy based on the same normalization semantics used by the application.
- Duplicate prevention must not rely only on client-side validation.
- Party and Group foreign keys must be valid.
- Guest creation/update must be atomic.
- CSV export must read from the same canonical guest data source used by the list.
- Destructive category deletion must not leave dangling foreign keys.

Implementation note: the exact normalization mechanism may depend on the chosen database stack, but application behavior must remain consistent with BR-006 and BR-007.

---

## 10. Reporting / Summary Requirements

The dashboard/list summary is intentionally lightweight.

Minimum useful metrics:

- Total Guests.
- Groom Guests.
- Bride Guests.
- Groom Family Guests.
- Bride Family Guests.
- Current filtered result count.

Group breakdown may be shown as a simple count table/list.

Charts are optional and must not be introduced unless they materially improve usability.

---

## 11. CSV Requirements

### Export All

Export all current guest records regardless of UI filters.

### Export Filtered

Export only guests matching the currently active search and filters.

### Encoding

Use UTF-8 CSV suitable for common spreadsheet applications.

### Column Order

```text
Name
Address
Party
Group
```

### Filename

Use deterministic human-readable names such as:

```text
wedding-guests-all-YYYY-MM-DD.csv
wedding-guests-filtered-YYYY-MM-DD.csv
```

---

## 12. Acceptance Criteria

### Guest Creation

- Admin can create a guest with Name, Address, Party, and Group.
- All required fields are validated.
- Valid guest appears in the guest list immediately after successful creation.

### Duplicate Prevention

- Creating a second guest whose normalized Name matches an existing guest is blocked.
- Duplicate detection ignores Address, Party, and Group.
- Different names can exist even when addresses are identical.
- Editing a guest cannot produce a duplicate normalized Name.
- Duplicate checks cannot be bypassed by client-side manipulation.

### Search and Filtering

- Name search works case-insensitively.
- Party filter works.
- Group filter works.
- Search + Party + Group can be combined.
- Reset clears all active filters.

### Category Management

- Admin can add Party.
- Admin can rename Party.
- Admin can safely delete unused Party.
- Admin can add Group.
- Admin can rename Group.
- Admin can safely delete unused Group.
- Referenced categories cannot be deleted in a way that invalidates existing guests.

### Export

- Export All contains every guest.
- Export Filtered contains only the active filtered result set.
- CSV columns are `Name,Address,Party,Group`.
- Exported CSV is UTF-8.

### Scope Control

The implementation must not introduce invitation status, RSVP, attendance, QR, import, multi-user collaboration, household, or relationship features without an explicit product decision.

---

## 13. Non-Functional Requirements

### Simplicity

Prefer the simplest architecture that can satisfy the requirements.

### Reliability

Guest creation, update, delete, filtering, and export must behave deterministically.

### Maintainability

Business rules must be represented in clear service/domain logic or equivalent boundaries rather than duplicated across UI components.

### Performance

The application should remain responsive for a wedding guest list in the low thousands without requiring specialized infrastructure.

### Accessibility

Forms, labels, keyboard interaction, focus states, and error messages should follow reasonable web accessibility practices.

### Security

Only the authenticated administrator can access guest data and management functions.

Do not expose guest data through unauthenticated public endpoints.

---

## 14. Recommended MVP Screens

### Screen 1: Guests

Primary workspace.

Contains:

- summary count;
- search;
- Party filter;
- Group filter;
- reset;
- export all/filtered;
- add guest;
- guest table.

### Screen 2: Guest Create/Edit

Simple form for the four guest fields.

### Screen 3: Categories

Simple management for Party and Group.

### Screen 4: Dashboard

Optional lightweight summary surface. It can be combined into the Guests screen if that produces a cleaner workflow.

---

## 15. Future Considerations, Not MVP

Potential later additions may include:

- invitation status;
- attendance;
- RSVP;
- household/family grouping;
- QR check-in;
- import;
- multi-user contributors;
- audit history;
- advanced reporting.

These are intentionally listed only as future possibilities and must not influence MVP implementation unless explicitly promoted into scope.

---

## 16. Product Principle

The product should solve one problem extremely well:

> **Maintain one clean, categorized, searchable, exportable source of truth for the wedding guest list.**

Anything that does not directly support that goal belongs outside the MVP.
