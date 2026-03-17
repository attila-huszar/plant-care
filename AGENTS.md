<INSTRUCTIONS>
# Plant Care repo rules (keep it simple)

## No backward compatibility

- Do **not** add compatibility layers for legacy payloads, DB rows, JSON shapes, or UI state.
- Do **not** accept/emit multiple shapes for the same concept (e.g. no `typeId` + `type` dual support).
- Prefer a clean breaking change + typecheck fixes across the codebase.

## Keep contracts in sync

- Treat `shared/` as the source of truth for domain types and request/response contracts.
- When renaming a field or changing a contract, update **shared + backend + frontend** in the same change.
- Keep naming consistent across layers (same field name in API, store, and UI).

## Simplicity

- Avoid “normalize/legacy/migrate” helper code unless explicitly requested.
- Prefer straightforward types and direct mappings; minimize indirection.

## Pragmatism

- Do not write overly defensive code; handle realistic scenarios, not every hypothetical edge case.
- Run linting and type checks after **meaningful/bigger changes**, not after every small edit.
  </INSTRUCTIONS>
