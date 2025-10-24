# Add Full Transaction Re-Sync Capability

## Why
Currently, when a user connects their bank account, transaction sync is cursor-based and incremental only. If sync drift occurs, data corruption happens, or a user needs to re-pull all historical transactions, the only option is to disconnect and reconnect the entire bank account connection. This is disruptive and loses user-assigned transaction categories and tags.

## What Changes
- Add a "Full Re-Sync" API endpoint that resets the sync cursor and fetches all available historical transactions
- Add a "Full Re-Sync" button in the UI (settings or analytics dashboard) with appropriate warnings
- Implement conflict resolution strategy for transactions that already exist (preserve user tags/categories)
- Add logging and audit trail for full re-sync operations
- Optionally allow users to specify a date range for the re-sync

## Impact
- Affected specs: transaction-management
- Affected code:
  - `backend/src/services/plaid.ts` - Add new `fullResyncTransactions()` function
  - `backend/src/routes/plaid.ts` - Add new `POST /api/plaid/full-resync-transactions` endpoint
  - `frontend/src/lib/api.ts` - Add API client method
  - `frontend/src/components/Settings/DataManagement.tsx` or analytics dashboard - Add UI button
- No breaking changes
- Provides recovery path without reconnecting accounts

