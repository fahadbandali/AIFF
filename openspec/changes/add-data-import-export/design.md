# Data Import/Export Design

## Context
Users store all financial data locally in a JSON file via LowDB. Without backup and portability features, users risk losing data if their machine fails or they want to migrate to a different device. The application needs robust import/export capabilities that preserve data integrity while being user-friendly.

### Constraints
- Data must remain compatible with LowDB's JSON format
- Plaid access tokens are encrypted and must remain secure
- Large transaction datasets (10,000+ records) must export/import efficiently
- Import operations must be atomic (all or nothing) to prevent corruption
- Users may have multiple concurrent application instances

### Stakeholders
- End users: Need simple backup/restore workflow
- Developers: Need maintainable validation and migration logic
- Future contributors: Need clear data format documentation

## Goals / Non-Goals

### Goals
- Enable full database backup and restore
- Support data migration between application instances
- Preserve all data relationships and integrity constraints
- Provide clear error messages for import failures
- Refresh dashboard automatically after import
- Support different merge strategies for power users

### Non-Goals
- Cloud-based backup storage (remains local-only)
- Automatic scheduled backups (user-initiated only)
- Data compression or encryption of export files (beyond existing access token encryption)
- Import/export of individual entities (always full database)
- Version migration tools (MVP assumes same schema version)
- Conflict resolution UI for merge strategies (simple overwrite/append only)

## Decisions

### Decision 1: Export Format - Raw LowDB JSON
**Rationale**: Use the exact same JSON structure as `data/db.json` for exports.

**Why**:
- Zero transformation overhead - export is essentially a file copy
- Users can directly replace `db.json` if needed (advanced usage)
- Future-proof - any new collections are automatically included
- Developers can inspect/edit exports easily for debugging
- No need for version numbers or migration logic in MVP

**Alternatives considered**:
- Custom format with versioning: Too complex for MVP, adds transformation overhead
- CSV per collection: Doesn't preserve nested relationships, harder to import
- SQL dump: Requires SQLite migration, not compatible with current LowDB setup

### Decision 2: Import Strategy - Validate Then Replace
**Rationale**: Validate entire import file first, then replace database atomically.

**Why**:
- Prevents partial imports that corrupt data
- Simple to implement with LowDB (`db.data = importedData; await db.write()`)
- Easy to rollback (keep backup of old `db.data` before assignment)
- Clear success/failure states for users

**Implementation**:
```typescript
const backup = { ...db.data }; // Shallow copy
try {
  validateDatabase(importedData);
  db.data = importedData;
  await db.write();
  return { success: true };
} catch (error) {
  db.data = backup;
  return { success: false, error };
}
```

**Alternatives considered**:
- Merge records one-by-one: Complex conflict resolution, partial failure states
- Database transactions: LowDB doesn't support ACID transactions (file-based)
- Append-only imports: Doesn't handle updates or deletions, limited use case

### Decision 3: Merge Strategies
**Rationale**: Offer three import modes: Replace All (default), Merge, and Append Only.

**Behaviors**:
1. **Replace All**: Overwrites entire `db.data` (simplest, safest for full restore)
2. **Merge**: Iterates each collection, updates existing IDs, adds new IDs
3. **Append Only**: Only adds records with new IDs, skips existing IDs

**Why Replace All as default**:
- Most common use case is full backup/restore
- Avoids ID conflicts and orphaned relationships
- Clearest outcome for non-technical users

**Why offer Merge/Append**:
- Power users may want to combine data from multiple sources
- Useful for selective imports (e.g., only new transactions)
- Enables collaborative use cases (share budgets/categories)

### Decision 4: Validation Strategy - Schema + Relationships
**Rationale**: Use Zod for schema validation, plus custom checks for referential integrity.

**Validation layers**:
1. **Structure**: JSON has all required collections (accounts, transactions, etc.)
2. **Schema**: Each record matches Zod schema (types, required fields)
3. **Relationships**: Foreign keys exist (transaction.account_id → accounts[])
4. **Business rules**: No negative budgets, valid date formats, etc.

**Why Zod**:
- Already used in project for API validation
- Type inference ensures validation matches TypeScript types
- Good error messages out of the box
- Can extend with custom refinements for business rules

**Example**:
```typescript
const DatabaseSchema = z.object({
  accounts: z.array(AccountSchema),
  transactions: z.array(TransactionSchema),
  // ... other collections
});

function validateRelationships(data: Database) {
  const accountIds = new Set(data.accounts.map(a => a.id));
  for (const txn of data.transactions) {
    if (!accountIds.has(txn.account_id)) {
      throw new Error(`Transaction ${txn.id} references missing account ${txn.account_id}`);
    }
  }
  // ... validate other foreign keys
}
```

### Decision 5: Frontend File Handling - Browser File API
**Rationale**: Use standard `<input type="file">` with File API, no multipart form upload.

**Why**:
- Simple implementation, no need for multipart parsing backend
- Can read file contents in browser for validation preview
- Can show file size before upload
- Drag-and-drop support via File API
- No temporary file storage on backend

**Flow**:
1. User selects file → FileReader reads as text
2. Parse JSON in browser → basic validation (valid JSON)
3. Send parsed JSON to backend via POST with `Content-Type: application/json`
4. Backend performs full validation and import

**Why not multipart upload**:
- JSON is text, no need for binary handling
- Easier to add request size limits (body-parser.json({ limit: '50mb' }))
- Simpler backend code, no multer/busboy dependencies

### Decision 6: Dashboard Refresh - React Query Cache Invalidation
**Rationale**: Use React Query's `queryClient.invalidateQueries()` to refresh all data.

**Why**:
- Already using React Query for all data fetching
- Automatic background refetch after invalidation
- No manual state updates needed in components
- Works for all existing and future queries

**Implementation**:
```typescript
const importMutation = useMutation({
  mutationFn: (data) => api.importData(data),
  onSuccess: () => {
    queryClient.invalidateQueries(); // Invalidate ALL queries
    toast.success("Data imported successfully!");
  }
});
```

**Why invalidate all queries**:
- Import affects all collections, so all queries need refresh
- Simpler than tracking which specific queries to invalidate
- Slight over-fetching is acceptable for infrequent import operation

## Risks / Trade-offs

### Risk 1: Data Corruption on Import
**Mitigation**:
- Validate entire import before writing to database
- Keep in-memory backup during import for rollback
- Show detailed validation errors to user before import
- Recommend manual backup of `data/db.json` before import (UI warning)

### Risk 2: Large File Performance
**Issue**: 10,000+ transactions could result in 5-10MB JSON files, slow to parse/validate.

**Mitigation**:
- Streaming JSON parsing if needed (not in MVP)
- 50MB request size limit to prevent DoS
- Show loading spinner during import
- Run validation in chunks (validate 1000 records at a time)

**Acceptable trade-off**: Import is infrequent operation, 2-3 second delay is acceptable for large datasets.

### Risk 3: Concurrent Imports
**Issue**: Multiple users or tabs importing simultaneously could cause race conditions.

**Mitigation**:
- LowDB already handles file write locking
- Backend import endpoint is synchronous (blocks until complete)
- Frontend shows loading state, prevents multiple submissions

**Not solved in MVP**: Concurrent imports from different processes (e.g., desktop app + CLI tool) could still conflict. Document this limitation.

### Risk 4: Schema Evolution
**Issue**: Future schema changes could break imports from older exports.

**Mitigation for MVP**:
- Add version field to export format (start with version: "1.0.0")
- Log warnings for unknown fields but don't reject import
- Future: Add migration functions keyed by version number

**Acceptable trade-off**: MVP assumes same schema version. Production-ready version needs migration system.

### Risk 5: Encrypted Access Token Portability
**Issue**: Access tokens are encrypted with environment-specific key. Export from one machine may not import on another if keys differ.

**Mitigation**:
- Document encryption key requirement in import error message
- Add UI warning during export about encryption keys
- Consider: Option to export with tokens removed (user must reconnect Plaid)

**Future solution**: Use password-based encryption for exports (user provides password to decrypt on import).

## Migration Plan

### Rollout Steps
1. Deploy backend endpoints (no breaking changes)
2. Deploy frontend UI in Settings page
3. Add announcement/tooltip directing users to new feature
4. Monitor error rates on import endpoint

### Rollback Plan
If critical issues discovered:
1. Remove Settings page link to hide feature
2. Disable backend endpoints with 503 response
3. No data loss risk (import is optional user action)

### Data Migration
No data migration needed - this is a new feature. Existing databases continue to work without changes.

## Open Questions

### Q1: Should we support partial exports (e.g., only transactions)?
**Status**: Deferred to future. MVP only supports full database export/import.

**Rationale**: Partial exports require careful handling of relationships. Full export is simpler and covers backup use case.

### Q2: Should we add automatic backups (e.g., before each Plaid sync)?
**Status**: Deferred to future. MVP requires manual user-initiated export.

**Rationale**: Automatic backups need rotation strategy, storage management, and UI for browsing backups. Too complex for MVP.

### Q3: Should we compress exports (gzip)?
**Status**: No, not in MVP.

**Rationale**: JSON is text, compression would save bandwidth but adds complexity. Local file size is not a major concern for MVP (even 10,000 transactions is ~10MB uncompressed).

### Q4: Should we support CSV export for spreadsheet analysis?
**Status**: Deferred to future.

**Rationale**: CSV export is useful for data analysis but doesn't support import (can't preserve relationships). Add as separate feature later if users request it.

### Q5: How do we handle timezone differences in imported timestamps?
**Status**: Assume all timestamps are stored in ISO 8601 UTC format (current behavior).

**Rationale**: Application already uses ISO timestamps. Import validation ensures timestamps are valid ISO format. No special timezone handling needed.

