# Transaction Management Specification

## ADDED Requirements

### Requirement: Transaction Synchronization
The system SHALL synchronize transactions from Plaid using the Transactions Sync API endpoint.

#### Scenario: Initial transaction sync
- **WHEN** a user triggers transaction sync for a newly connected account
- **THEN** the system fetches all historical transactions from Plaid
- **AND** stores them encrypted in the transactions collection
- **AND** assigns default categories based on Plaid category hints
- **AND** marks all transactions as untagged (is_tagged: false)
- **AND** saves the sync cursor for incremental updates

#### Scenario: Incremental transaction sync
- **WHEN** a user triggers transaction sync for an existing account
- **THEN** the system uses the stored cursor to fetch only new/modified transactions
- **AND** adds new transactions to the database
- **AND** updates modified transactions (e.g., pending → posted)
- **AND** removes deleted transactions from the database
- **AND** updates the sync cursor

#### Scenario: Sync error handling
- **WHEN** transaction sync fails due to Plaid API error
- **THEN** the system logs the error with details
- **AND** displays an error message to the user
- **AND** preserves existing transaction data
- **AND** allows the user to retry the sync operation

#### Scenario: Sync with invalid access token
- **WHEN** transaction sync fails due to invalid or expired Plaid access token
- **THEN** the system detects the ITEM_LOGIN_REQUIRED error
- **AND** displays a notification that re-authentication is needed
- **AND** provides a link to reconnect the account via Plaid Link
- **AND** does not delete existing transaction data

### Requirement: Transaction Storage
The system SHALL store transaction data encrypted in LowDB with comprehensive metadata.

#### Scenario: Store new transaction
- **WHEN** a transaction is received from Plaid
- **THEN** the system creates a transaction record with id, plaid_transaction_id, account_id, date, amount, name, merchant_name, category_id, is_tagged, is_pending
- **AND** encrypts the entire transaction object before storing
- **AND** sets created_at and updated_at timestamps
- **AND** links the transaction to the appropriate account

#### Scenario: Update existing transaction
- **WHEN** a transaction is modified in Plaid (e.g., pending → posted)
- **THEN** the system updates the transaction record
- **AND** preserves user-assigned category if is_tagged is true
- **AND** updates only Plaid-provided fields (amount, date, is_pending)
- **AND** updates the updated_at timestamp

#### Scenario: Delete transaction
- **WHEN** Plaid indicates a transaction should be removed
- **THEN** the system deletes the transaction from the database
- **AND** logs the deletion for audit purposes
- **AND** does not affect other transactions

### Requirement: Transaction Retrieval
The system SHALL provide an API endpoint to retrieve transactions with filtering options.

#### Scenario: Fetch all transactions
- **WHEN** a client requests transactions via GET /api/transactions
- **THEN** the system returns all transactions decrypted and sorted by date descending
- **AND** includes pagination parameters (page, limit)
- **AND** returns 200 status with transaction array

#### Scenario: Filter transactions by account
- **WHEN** a client requests transactions with account_id query parameter
- **THEN** the system returns only transactions for that account
- **AND** maintains date descending sort order
- **AND** applies pagination

#### Scenario: Filter transactions by date range
- **WHEN** a client requests transactions with start_date and end_date parameters
- **THEN** the system returns only transactions within that date range (inclusive)
- **AND** handles date parsing errors gracefully
- **AND** returns 400 if date format is invalid

#### Scenario: Filter untagged transactions
- **WHEN** a client requests transactions with is_tagged=false parameter
- **THEN** the system returns only transactions that have not been user-confirmed
- **AND** sorts by date descending
- **AND** applies pagination

#### Scenario: No transactions found
- **WHEN** no transactions match the filter criteria
- **THEN** the system returns an empty array with 200 status
- **AND** includes pagination metadata showing 0 total

### Requirement: Category Management
The system SHALL provide a category system with default categories and support for custom categories.

#### Scenario: Seed default categories
- **WHEN** the system initializes for the first time
- **THEN** it creates default categories: Income, Housing, Transportation, Food, Shopping, Entertainment, Healthcare, Financial, Uncategorized
- **AND** marks them as system categories (is_system: true)
- **AND** assigns colors and icons to each category
- **AND** supports parent-child relationships (subcategories)

#### Scenario: Retrieve all categories
- **WHEN** a client requests categories via GET /api/categories
- **THEN** the system returns all categories (system and custom)
- **AND** includes id, name, parent_id, color, icon for each category
- **AND** returns categories in hierarchical order (parents first, then children)
- **AND** returns 200 status

#### Scenario: Default category assignment
- **WHEN** a transaction is synced from Plaid with category hint
- **THEN** the system maps the Plaid category to the closest system category
- **AND** assigns that category_id to the transaction
- **AND** marks the transaction as untagged for user review
- **AND** defaults to "Uncategorized" if no good match found

### Requirement: Transaction Tagging Workflow
The system SHALL allow users to review and confirm transaction categories through a tagging workflow.

#### Scenario: Display untagged transactions
- **WHEN** a user views the untagged transactions widget
- **THEN** the system displays all transactions with is_tagged: false
- **AND** shows transaction name, date, amount, and current category
- **AND** provides a dropdown to change the category
- **AND** includes a "Confirm" button for each transaction

#### Scenario: Confirm transaction category
- **WHEN** a user confirms a transaction category (without changing it)
- **THEN** the system updates is_tagged to true via PATCH /api/transactions/:id/tag
- **AND** preserves the existing category_id
- **AND** updates the updated_at timestamp
- **AND** removes the transaction from the untagged list
- **AND** returns 200 status

#### Scenario: Change and confirm transaction category
- **WHEN** a user changes a transaction's category and clicks confirm
- **THEN** the system updates both category_id and is_tagged to true
- **AND** updates the updated_at timestamp
- **AND** removes the transaction from the untagged list
- **AND** returns 200 status

#### Scenario: Bulk tag transactions
- **WHEN** a user selects multiple untagged transactions and confirms categories
- **THEN** the system updates all selected transactions in a batch operation
- **AND** maintains data consistency (all or nothing)
- **AND** returns 200 status with count of updated transactions
- **AND** returns 400 if any transaction ID is invalid

### Requirement: Transaction Encryption
All transaction data SHALL be encrypted at rest using the existing encryption service.

#### Scenario: Encrypt transaction on storage
- **WHEN** a transaction is saved to the database
- **THEN** the system encrypts the entire transaction object
- **AND** uses the encryption key from environment variables
- **AND** stores the encrypted string in LowDB
- **AND** preserves the ability to query by id and account_id (indexed fields)

#### Scenario: Decrypt transaction on retrieval
- **WHEN** a transaction is read from the database
- **THEN** the system decrypts the encrypted string
- **AND** returns the full transaction object to the caller
- **AND** handles decryption errors gracefully (logs and returns null)

### Requirement: Pending Transaction Handling
The system SHALL handle pending vs posted transaction states correctly.

#### Scenario: Sync pending transaction
- **WHEN** a transaction is received from Plaid with pending status
- **THEN** the system stores it with is_pending: true
- **AND** displays it with a "Pending" badge in the UI
- **AND** includes it in cash flow calculations

#### Scenario: Pending transaction becomes posted
- **WHEN** a pending transaction is updated to posted status in Plaid
- **THEN** the system updates is_pending to false
- **AND** updates the final amount and date
- **AND** preserves user-assigned category if already tagged
- **AND** maintains the same transaction ID

#### Scenario: Pending transaction is cancelled
- **WHEN** a pending transaction is removed by Plaid (cancelled authorization)
- **THEN** the system deletes the transaction
- **AND** recalculates affected budget and cash flow data
- **AND** logs the deletion

### Requirement: Transaction API Rate Limiting
All transaction API endpoints SHALL be rate limited to prevent abuse.

#### Scenario: Rate limit compliance
- **WHEN** a client makes requests within rate limits (e.g., 100 requests per minute)
- **THEN** all requests are processed normally
- **AND** return expected 200/201 status codes

#### Scenario: Rate limit exceeded
- **WHEN** a client exceeds the rate limit
- **THEN** the system returns 429 Too Many Requests status
- **AND** includes Retry-After header with seconds to wait
- **AND** logs the rate limit violation

### Requirement: Transaction Sync Status Display
The system SHALL display the last transaction sync timestamp and provide manual refresh capability.

#### Scenario: Display last sync time
- **WHEN** a user views the analytics dashboard
- **THEN** the system displays "Last synced: X minutes ago"
- **AND** uses relative time formatting (e.g., "2 hours ago", "3 days ago")
- **AND** shows the timestamp from the last successful sync

#### Scenario: Manual transaction refresh
- **WHEN** a user clicks the "Refresh Transactions" button
- **THEN** the system triggers an immediate transaction sync
- **AND** displays a loading indicator during sync
- **AND** updates the last sync timestamp on completion
- **AND** shows any sync errors to the user

#### Scenario: Outdated transaction data
- **WHEN** transactions haven't been synced in over 24 hours
- **THEN** the system displays a warning indicator
- **AND** prompts the user to refresh transactions
- **AND** still displays the stale data

