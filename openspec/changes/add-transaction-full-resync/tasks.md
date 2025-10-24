# Implementation Tasks

## 1. Backend Implementation
- [ ] 1.1 Add `fullResyncTransactions(plaidItemId: string, options?: { startDate?: string, endDate?: string })` function to `backend/src/services/plaid.ts`
  - [ ] 1.1.1 Reset the `transactions_cursor` to null for the Plaid item
  - [ ] 1.1.2 Call Plaid Transactions Sync API without cursor to get full history
  - [ ] 1.1.3 Implement smart merge logic: preserve user-tagged categories while updating transaction data
  - [ ] 1.1.4 Track conflicts (transactions that exist with user modifications)
  - [ ] 1.1.5 Return statistics: added, modified, skipped (preserved user data), removed
- [ ] 1.2 Add `POST /api/plaid/full-resync-transactions` endpoint to `backend/src/routes/plaid.ts`
  - [ ] 1.2.1 Accept `plaid_item_id` in request body (required)
  - [ ] 1.2.2 Accept optional `start_date` and `end_date` parameters for date range filtering
  - [ ] 1.2.3 Add validation with Zod schema
  - [ ] 1.2.4 Check rate limiting (prevent frequent full re-syncs - max once per hour per item)
  - [ ] 1.2.5 Add detailed logging for audit trail
  - [ ] 1.2.6 Return sync statistics and success/error status
- [ ] 1.3 Add unit tests for full re-sync logic (future)

## 2. Frontend Implementation
- [ ] 2.1 Add `fullResyncTransactions` API method to `frontend/src/lib/api.ts`
- [ ] 2.2 Update settings page or add to analytics dashboard
  - [ ] 2.2.1 Add "Full Transaction Re-Sync" section with warning message
  - [ ] 2.2.2 Display list of connected institutions with last sync time
  - [ ] 2.2.3 Add "Full Re-Sync" button per institution with confirmation modal
  - [ ] 2.2.4 Show loading indicator during re-sync operation
  - [ ] 2.2.5 Display success message with statistics (added, modified, preserved)
  - [ ] 2.2.6 Handle errors gracefully with retry option
- [ ] 2.3 Update transaction query invalidation after full re-sync

## 3. Documentation
- [ ] 3.1 Update API documentation with new endpoint details
- [ ] 3.2 Add user guide section explaining when to use full re-sync vs incremental sync
- [ ] 3.3 Document conflict resolution behavior (user tags/categories preserved)

## 4. Validation
- [ ] 4.1 Test full re-sync with existing transactions
- [ ] 4.2 Verify user-tagged transactions remain tagged after full re-sync
- [ ] 4.3 Test with empty transaction database
- [ ] 4.4 Verify rate limiting works (prevent abuse)
- [ ] 4.5 Test error scenarios (invalid token, network errors, Plaid API errors)

