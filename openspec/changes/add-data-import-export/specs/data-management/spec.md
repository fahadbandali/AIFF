## ADDED Requirements

### Requirement: Database Export
The system SHALL provide an endpoint to export the entire database in JSON format.

#### Scenario: Export all data
- **GIVEN** user has financial data stored in the database
- **WHEN** user requests export via API endpoint `/api/data/export`
- **THEN** system returns complete database JSON matching LowDB format
- **AND** response includes all collections: accounts, transactions, categories, budgets, goals, plaid_items
- **AND** Plaid access tokens remain encrypted in export
- **AND** response has Content-Type `application/json`
- **AND** response has Content-Disposition header suggesting filename with current date (e.g., `finance-backup-2025-10-23.json`)

#### Scenario: Export with no data
- **GIVEN** user has empty database (only default categories)
- **WHEN** user requests export
- **THEN** system returns valid JSON with empty arrays for accounts, transactions, budgets, goals, plaid_items
- **AND** categories array contains default system categories

#### Scenario: Export with large dataset
- **GIVEN** database contains 10,000+ transactions
- **WHEN** user requests export
- **THEN** system completes export within 5 seconds
- **AND** returned JSON is valid and complete

### Requirement: Database Import
The system SHALL provide an endpoint to import database JSON and replace or merge with existing data.

#### Scenario: Import with replace strategy
- **GIVEN** user has existing financial data
- **WHEN** user uploads valid database JSON with strategy "replace"
- **THEN** system validates JSON structure and content
- **AND** system replaces entire database with imported data
- **AND** system returns success status
- **AND** previous data is completely replaced

#### Scenario: Import with merge strategy
- **GIVEN** user has existing transactions with IDs [1, 2, 3]
- **WHEN** user uploads JSON with transactions [2, 3, 4] (IDs 2 and 3 have different values)
- **AND** import strategy is "merge"
- **THEN** system updates transactions 2 and 3 with new values
- **AND** system adds transaction 4
- **AND** system keeps transaction 1 unchanged

#### Scenario: Import with append-only strategy
- **GIVEN** user has existing transactions with IDs [1, 2, 3]
- **WHEN** user uploads JSON with transactions [2, 3, 4]
- **AND** import strategy is "append"
- **THEN** system only adds transaction 4
- **AND** transactions 1, 2, and 3 remain unchanged

#### Scenario: Import with invalid JSON structure
- **GIVEN** user uploads malformed JSON file
- **WHEN** system attempts to parse import
- **THEN** system returns 400 Bad Request
- **AND** response includes error message describing JSON parsing failure
- **AND** database remains unchanged

#### Scenario: Import with missing required collections
- **GIVEN** user uploads JSON missing "transactions" collection
- **WHEN** system validates import
- **THEN** system returns 400 Bad Request
- **AND** response includes error message listing missing collections
- **AND** database remains unchanged

#### Scenario: Import with invalid data types
- **GIVEN** user uploads JSON with transaction amount as string instead of number
- **WHEN** system validates import
- **THEN** system returns 400 Bad Request
- **AND** response includes error message describing type mismatch
- **AND** database remains unchanged

#### Scenario: Import with broken foreign key references
- **GIVEN** user uploads JSON with transaction referencing non-existent account_id
- **WHEN** system validates relationships
- **THEN** system returns 400 Bad Request
- **AND** response includes error message identifying orphaned reference
- **AND** database remains unchanged

#### Scenario: Import file too large
- **GIVEN** user uploads JSON file larger than 50MB
- **WHEN** system receives request
- **THEN** system returns 413 Payload Too Large
- **AND** response includes message about file size limit
- **AND** database remains unchanged

### Requirement: Data Validation
The system SHALL validate imported data for structure, schema compliance, and referential integrity before applying changes.

#### Scenario: Validate database structure
- **GIVEN** imported JSON data
- **WHEN** system validates structure
- **THEN** system verifies all required collections are present: accounts, transactions, categories, budgets, goals, plaid_items
- **AND** system verifies each collection is an array

#### Scenario: Validate record schemas
- **GIVEN** imported transaction records
- **WHEN** system validates schemas
- **THEN** system verifies each transaction has required fields: id, account_id, date, amount, name, category_id
- **AND** system verifies field types match schema (numbers, strings, dates)
- **AND** system returns first validation error if any field is invalid

#### Scenario: Validate referential integrity
- **GIVEN** imported database with transactions and accounts
- **WHEN** system validates relationships
- **THEN** system verifies every transaction.account_id references existing account
- **AND** system verifies every transaction.category_id references existing category
- **AND** system verifies every budget.category_id references existing category (if not null)
- **AND** system verifies every account.plaid_item_id references existing plaid_item

#### Scenario: Validate business rules
- **GIVEN** imported budget records
- **WHEN** system validates business rules
- **THEN** system verifies budget amounts are positive numbers
- **AND** system verifies goal target_amounts are positive numbers
- **AND** system verifies dates are valid ISO 8601 format
- **AND** system verifies budgets with null category_id have non-null end_date

### Requirement: Frontend Export UI
The system SHALL provide a user interface for downloading database exports.

#### Scenario: Download export file
- **GIVEN** user navigates to Data Management settings page
- **WHEN** user clicks "Export Data" button
- **THEN** browser downloads JSON file with filename containing current date
- **AND** file contains complete database in LowDB format
- **AND** user sees success toast notification

#### Scenario: Export button disabled during export
- **GIVEN** user clicks "Export Data" button
- **WHEN** export request is in progress
- **THEN** button is disabled with loading spinner
- **AND** button re-enables after export completes

### Requirement: Frontend Import UI
The system SHALL provide a user interface for uploading and importing database files.

#### Scenario: Upload import file
- **GIVEN** user has valid database JSON file
- **WHEN** user selects file via file input or drag-and-drop
- **AND** user confirms import with selected strategy
- **THEN** system uploads file to backend
- **AND** system shows progress indicator during upload
- **AND** system displays success message on completion

#### Scenario: Import validation error display
- **GIVEN** user uploads invalid database JSON
- **WHEN** backend returns validation error
- **THEN** frontend displays error message in user-friendly format
- **AND** frontend highlights specific validation failures (e.g., "Transaction T123 references missing account A456")
- **AND** import modal remains open for user to try again

#### Scenario: Import confirmation modal
- **GIVEN** user selects file for import with "replace" strategy
- **WHEN** user clicks "Import" button
- **THEN** system shows confirmation modal warning about data replacement
- **AND** modal requires explicit confirmation (e.g., type "CONFIRM" or check box)
- **AND** import only proceeds after confirmation

#### Scenario: Merge strategy selection
- **GIVEN** user opens import modal
- **WHEN** user views import options
- **THEN** user sees three strategy options: Replace All, Merge, Append Only
- **AND** Replace All is selected by default
- **AND** each strategy has tooltip explaining behavior
- **AND** selected strategy is sent with import request

### Requirement: Dashboard Refresh
The system SHALL automatically refresh all dashboard views after successful data import.

#### Scenario: Refresh after import
- **GIVEN** user successfully imports data
- **WHEN** import completes
- **THEN** all React Query caches are invalidated
- **AND** dashboard components automatically refetch data
- **AND** account list displays updated accounts
- **AND** transaction list displays updated transactions
- **AND** budget widgets display updated budget data
- **AND** goal widgets display updated goal data
- **AND** analytics charts reflect imported data

#### Scenario: Partial refresh on error
- **GIVEN** import fails due to validation error
- **WHEN** error response is received
- **THEN** dashboard data remains unchanged
- **AND** no cache invalidation occurs
- **AND** user sees error message explaining failure

### Requirement: API Rate Limiting
The system SHALL apply rate limiting to import/export endpoints to prevent abuse.

#### Scenario: Rate limit on export
- **GIVEN** user has made 10 export requests in 1 minute
- **WHEN** user makes 11th export request
- **THEN** system returns 429 Too Many Requests
- **AND** response includes Retry-After header

#### Scenario: Rate limit on import
- **GIVEN** user has made 5 import requests in 1 minute
- **WHEN** user makes 6th import request
- **THEN** system returns 429 Too Many Requests
- **AND** response includes error message about rate limit

### Requirement: Error Handling
The system SHALL provide clear error messages for all import/export failures.

#### Scenario: Export endpoint error
- **GIVEN** database file is locked or inaccessible
- **WHEN** user requests export
- **THEN** system returns 500 Internal Server Error
- **AND** response includes generic error message (no sensitive details)
- **AND** detailed error is logged server-side

#### Scenario: Import rollback on failure
- **GIVEN** import validation passes initial checks
- **WHEN** database write fails mid-import
- **THEN** system rolls back to previous database state
- **AND** system returns 500 Internal Server Error
- **AND** user data remains in pre-import state

#### Scenario: Network error during upload
- **GIVEN** user uploads large import file
- **WHEN** network connection drops during upload
- **THEN** frontend displays network error message
- **AND** user can retry import
- **AND** incomplete upload does not corrupt database

