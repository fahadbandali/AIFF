# Account Management Specification

## ADDED Requirements

### Requirement: Account List Retrieval
The system SHALL provide an API endpoint to retrieve all connected bank accounts.

#### Scenario: Fetch all accounts
- **WHEN** a client requests accounts via `GET /api/accounts`
- **THEN** the system returns all stored accounts with 200 status
- **AND** includes account id, name, type, subtype, mask, current_balance, and institution_name
- **AND** orders accounts by institution name, then by account type

#### Scenario: No accounts connected
- **WHEN** a client requests accounts but no accounts exist
- **THEN** the system returns an empty array with 200 status

#### Scenario: Account fetch error
- **WHEN** the database is unavailable during account retrieval
- **THEN** the system returns a 500 Internal Server Error
- **AND** includes an error message indicating the issue

### Requirement: Account Display
The frontend SHALL display a list of all connected bank accounts with their details.

#### Scenario: Display account list
- **WHEN** a user views the account list
- **THEN** the system displays each account with its name, institution, type, and mask
- **AND** shows the current balance formatted as currency
- **AND** groups accounts by institution
- **AND** uses appropriate icons for account types (checking, savings, credit card)

#### Scenario: Empty account list
- **WHEN** no accounts are connected
- **THEN** the system displays an empty state message
- **AND** shows a "Connect Your First Account" button
- **AND** links to the Connect page

### Requirement: Account Details
The system SHALL display detailed information for individual accounts.

#### Scenario: View account details
- **WHEN** a user clicks on an account in the list
- **THEN** the system displays the account's full details
- **AND** shows official name, current balance, and available balance
- **AND** displays the last sync timestamp
- **AND** shows the institution name and account mask

#### Scenario: Account with no available balance
- **WHEN** an account does not have an available balance (e.g., savings account)
- **THEN** the system displays only the current balance
- **AND** does not show the available balance field

### Requirement: Account Metadata Storage
The system SHALL store comprehensive metadata for each connected account.

#### Scenario: Store account on initial sync
- **WHEN** accounts are fetched from Plaid for the first time
- **THEN** the system stores account id, plaid_account_id, plaid_item_id, name, official_name, type, subtype, mask, current_balance, available_balance, and currency
- **AND** sets created_at and updated_at timestamps

#### Scenario: Update existing account
- **WHEN** accounts are synced for an existing item
- **THEN** the system updates current_balance and available_balance
- **AND** updates the updated_at timestamp
- **AND** preserves the original created_at timestamp

### Requirement: Institution Association
Accounts SHALL be associated with their source Plaid item and institution.

#### Scenario: Link account to institution
- **WHEN** an account is stored
- **THEN** the system links it to the plaid_item via plaid_item_id
- **AND** includes the institution_name from the plaid_item record
- **AND** enables filtering and grouping by institution

#### Scenario: Display institution information
- **WHEN** accounts are displayed in the UI
- **THEN** the system shows the institution name for each account
- **AND** groups accounts from the same institution together
- **AND** displays the institution logo if available (future enhancement)

### Requirement: Balance Formatting
Account balances SHALL be formatted according to the account's currency and locale.

#### Scenario: Format USD balance
- **WHEN** an account has USD currency
- **THEN** the system displays the balance as "$1,234.56"
- **AND** includes the currency symbol
- **AND** uses two decimal places

#### Scenario: Format CAD balance
- **WHEN** an account has CAD currency
- **THEN** the system displays the balance as "CA$1,234.56"
- **AND** includes the CAD currency indicator
- **AND** uses two decimal places

#### Scenario: Negative balance (credit card)
- **WHEN** an account has a negative balance (e.g., credit card debt)
- **THEN** the system displays the balance as "-$1,234.56"
- **AND** uses red text color to indicate debt
- **AND** maintains proper formatting

### Requirement: Account Sync Status
The system SHALL track and display the last synchronization time for accounts.

#### Scenario: Display last sync time
- **WHEN** an account is displayed
- **THEN** the system shows when it was last synced
- **AND** formats the time as relative (e.g., "2 hours ago", "3 days ago")
- **AND** uses the updated_at timestamp

#### Scenario: Outdated account data
- **WHEN** an account hasn't been synced in over 24 hours
- **THEN** the system displays a warning indicator
- **AND** shows a "Sync Now" option (future enhancement)
- **AND** indicates the data may be stale

