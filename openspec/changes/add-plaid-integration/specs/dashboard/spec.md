# Dashboard Specification

## ADDED Requirements

### Requirement: Dashboard Page
The system SHALL provide a dashboard page that displays a welcome message and account summary after successful bank connection.

#### Scenario: First-time user dashboard
- **WHEN** a user navigates to `/dashboard` after connecting their first bank account
- **THEN** the system displays "Welcome" as the main heading
- **AND** shows a summary of connected accounts
- **AND** displays the total number of connected accounts

#### Scenario: Returning user dashboard
- **WHEN** a user with existing connected accounts navigates to `/dashboard`
- **THEN** the system displays "Welcome back" as the main heading
- **AND** shows an updated summary of all connected accounts
- **AND** displays current balances for each account

#### Scenario: Dashboard loading state
- **WHEN** the dashboard is loading account data
- **THEN** the system displays a skeleton loading state
- **AND** shows a loading spinner or placeholder content
- **AND** prevents interaction until data is loaded

### Requirement: Account Summary Display
The dashboard SHALL display a summary of all connected bank accounts.

#### Scenario: Multiple accounts connected
- **WHEN** a user has multiple accounts connected
- **THEN** the system lists each account with its name, type, and mask
- **AND** displays the current balance for each account
- **AND** shows the institution name for each account

#### Scenario: Single account connected
- **WHEN** a user has only one account connected
- **THEN** the system displays that account's details prominently
- **AND** shows the account name, type, mask, and balance
- **AND** includes a call-to-action to connect more accounts

### Requirement: Dashboard Navigation
The dashboard SHALL provide navigation to key application features.

#### Scenario: Navigate to account details
- **WHEN** a user clicks on an account in the summary
- **THEN** the system navigates to a detailed view of that account
- **AND** displays full account information and recent transactions

#### Scenario: Navigate to connect more accounts
- **WHEN** a user clicks "Connect Another Account" button
- **THEN** the system navigates to the Connect page
- **AND** initiates a new Plaid Link flow

### Requirement: Route Protection
The system SHALL protect the dashboard route to ensure users have at least one connected account.

#### Scenario: Access dashboard without connected accounts
- **WHEN** a user navigates to `/dashboard` without any connected accounts
- **THEN** the system redirects to the Connect page at `/connect`
- **AND** displays a message indicating they need to connect a bank account first

#### Scenario: Access dashboard with connected accounts
- **WHEN** a user navigates to `/dashboard` with at least one connected account
- **THEN** the system displays the dashboard content
- **AND** does not redirect

### Requirement: Error Handling
The dashboard SHALL handle errors gracefully when account data cannot be loaded.

#### Scenario: Account data fetch failure
- **WHEN** the system cannot fetch account data due to a network error
- **THEN** it displays an error message on the dashboard
- **AND** provides a "Retry" button to attempt loading again
- **AND** maintains the user on the dashboard page

#### Scenario: Plaid item error
- **WHEN** an account's Plaid item has an error status (e.g., requires re-authentication)
- **THEN** the system displays a warning banner on the dashboard
- **AND** shows which account needs attention
- **AND** provides a link to reconnect the account

