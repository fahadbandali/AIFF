# Transaction Management Specification

## ADDED Requirements

### Requirement: Full Transaction Re-Sync
The system SHALL provide capability to perform a complete transaction re-sync without requiring account reconnection.

#### Scenario: Trigger full re-sync
- **WHEN** a user triggers full transaction re-sync for a connected Plaid item
- **THEN** the system resets the transactions cursor to null
- **AND** fetches all available historical transactions from Plaid
- **AND** merges new data with existing transactions intelligently
- **AND** preserves user-assigned categories and tags (is_tagged: true)
- **AND** updates Plaid-provided fields (amount, date, is_pending, merchant_name) for matching transactions
- **AND** adds new transactions not previously synced
- **AND** saves the new cursor for subsequent incremental syncs
- **AND** logs the operation with timestamp and user context

#### Scenario: Preserve user modifications during full re-sync
- **WHEN** a full re-sync encounters a transaction that exists with is_tagged: true
- **THEN** the system preserves the user-assigned category_id
- **AND** updates only non-category Plaid fields (amount, date, is_pending, merchant_name)
- **AND** keeps is_tagged as true
- **AND** updates the updated_at timestamp
- **AND** tracks the transaction as "preserved" in sync statistics

#### Scenario: Full re-sync with date range filter
- **WHEN** a user triggers full re-sync with start_date and end_date parameters
- **THEN** the system fetches transactions only within the specified date range
- **AND** preserves transactions outside the date range
- **AND** applies the same merge logic (preserve user tags)
- **AND** returns statistics for the specified date range only

#### Scenario: Full re-sync rate limiting
- **WHEN** a user attempts to trigger full re-sync within 1 hour of the last full re-sync for the same Plaid item
- **THEN** the system returns 429 Too Many Requests status
- **AND** includes Retry-After header with seconds until next allowed re-sync
- **AND** returns the timestamp of the last full re-sync
- **AND** suggests using incremental sync instead

#### Scenario: Full re-sync statistics reporting
- **WHEN** a full re-sync completes successfully
- **THEN** the system returns detailed statistics including:
  - transactions_added: count of new transactions
  - transactions_modified: count of updated transactions
  - transactions_preserved: count of user-tagged transactions kept unchanged
  - transactions_removed: count of deleted transactions
  - date_range: the date range of synced transactions
  - sync_duration_ms: time taken for the operation
- **AND** displays a success message to the user
- **AND** invalidates cached transaction queries

#### Scenario: Full re-sync error handling
- **WHEN** full re-sync fails due to Plaid API error or network issue
- **THEN** the system rolls back any partial changes (all-or-nothing transaction)
- **AND** preserves the previous transactions cursor
- **AND** logs the error with full context
- **AND** returns 500 status with error details
- **AND** allows the user to retry the operation
- **AND** does not delete existing transaction data

#### Scenario: Full re-sync UI confirmation
- **WHEN** a user clicks the "Full Re-Sync" button in the UI
- **THEN** the system displays a confirmation modal explaining:
  - What full re-sync does
  - That it may take longer than incremental sync
  - That user-tagged transactions will be preserved
  - Estimated time based on transaction volume
- **AND** requires explicit confirmation before proceeding
- **AND** shows a loading indicator during the operation

#### Scenario: Full re-sync for multiple institutions
- **WHEN** a user has multiple connected Plaid items (institutions)
- **THEN** the system displays a list of all institutions with last sync times
- **AND** allows triggering full re-sync per institution individually
- **AND** does not provide a "Re-Sync All" button to prevent accidental bulk operations
- **AND** tracks sync status per institution separately

### Requirement: Full Re-Sync Audit Logging
The system SHALL maintain an audit log of all full re-sync operations for troubleshooting and compliance.

#### Scenario: Log full re-sync operation
- **WHEN** a full re-sync is triggered
- **THEN** the system creates an audit log entry with:
  - timestamp: when the operation started
  - plaid_item_id: which institution was synced
  - operation_type: "full_resync"
  - status: "started", "completed", or "failed"
  - statistics: sync results (added, modified, preserved, removed counts)
  - error_details: if failed, the error message and stack trace
- **AND** stores the log in a dedicated audit collection or file
- **AND** allows querying logs by date range or Plaid item

#### Scenario: View full re-sync history
- **WHEN** a user or admin views the sync history for a Plaid item
- **THEN** the system displays all sync operations (incremental and full)
- **AND** shows timestamp, type, status, and statistics for each operation
- **AND** highlights full re-sync operations distinctly
- **AND** allows filtering by operation type and date range

