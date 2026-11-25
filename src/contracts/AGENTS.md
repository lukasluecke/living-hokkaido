# src/contracts: shared contracts

The single source of truth for data shapes, ids, units, events and part props.
Every part, the shell, content packs and labs import from `@/contracts`.

- Framework-free: no React, no three, no DOM. Only zod and plain TypeScript.
  (`parts.ts` is types only.)
- Read docs/CONTRACTS.md § Changing contracts before any edit.
  Additive changes need a default value and a test in
  `tests/contracts.test.ts`. Breaking changes need Lukas's OK and a
  `CONTRACT_VERSION` bump with migrated content and parts in the same PR.
- Keep the provenance rules: every visible fact is a claim with a citation;
  withdrawn content and assets fail validation; scans need rights and consent.
- Run `npm run typecheck && npm test` after every change.
