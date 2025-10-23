# Account Management Specification

## ADDED Requirements

### Requirement: Account Deletion API
The system SHALL provide an API endpoint to delete a connected bank account.

#### Scenario: Delete account successfully
- **WHEN** a client sends a DELETE request to `/api/accounts/:id`
- **THEN** the system removes the account from the database
- **AND** returns 200 OK status
- **AND** includes a success message in the response
- **AND** optionally removes associated transactions if requested

#### Scenario: Delete non-existent account
- **WHEN** a client attempts to delete an account that does not exist
- **THEN** the system returns 404 Not Found status
- **AND** includes an error message indicating the account was not found

#### Scenario: Delete with cascade option
- **WHEN** a client deletes an account with `cascade=true` parameter
- **THEN** the system deletes the account
- **AND** removes all associated transactions
- **AND** updates budget tracking to exclude deleted transactions
- **AND** returns confirmation of deletion with count of removed transactions

#### Scenario: Delete without cascade
- **WHEN** a client deletes an account without cascade parameter
- **THEN** the system deletes the account
- **AND** keeps associated transactions in the database
- **AND** marks transactions as orphaned or links them to a "Deleted Account" placeholder

#### Scenario: Database error during deletion
- **WHEN** a database error occurs during account deletion
- **THEN** the system returns 500 Internal Server Error
- **AND** includes an error message
- **AND** does not delete the account or transactions (atomic operation)

### Requirement: Account Deletion UI
The frontend SHALL provide a user interface for deleting connected accounts.

#### Scenario: Display delete button
- **WHEN** a user views an account in the account list
- **THEN** the system displays a delete button or action menu for that account
- **AND** positions the delete action clearly but not prominently (avoid accidental clicks)
- **AND** uses appropriate styling (e.g., danger/error color)

#### Scenario: Confirm account deletion
- **WHEN** a user clicks the delete button for an account
- **THEN** the system displays a confirmation dialog
- **AND** shows the account name and institution
- **AND** warns about the consequences of deletion
- **AND** provides options to cancel or confirm
- **AND** optionally includes a checkbox for cascade deletion of transactions

#### Scenario: Execute account deletion
- **WHEN** a user confirms account deletion in the dialog
- **THEN** the system sends a DELETE request to the API
- **AND** displays a loading state during the operation
- **AND** shows a success message upon completion
- **AND** removes the account from the UI
- **AND** invalidates relevant query cache (accounts, transactions)

#### Scenario: Cancel account deletion
- **WHEN** a user clicks cancel in the confirmation dialog
- **THEN** the system closes the dialog
- **AND** does not delete the account
- **AND** returns focus to the account list

#### Scenario: Handle deletion error
- **WHEN** account deletion fails due to an API error
- **THEN** the system displays an error message
- **AND** keeps the account in the UI
- **AND** provides an option to retry
- **AND** logs the error for debugging

### Requirement: Account Deletion Safety
The system SHALL implement safeguards to prevent accidental or problematic account deletions.

#### Scenario: Prevent last account deletion
- **WHEN** a user attempts to delete their only remaining account
- **THEN** the system displays a warning in the confirmation dialog
- **AND** informs the user they will be redirected to connect page
- **AND** proceeds with deletion only after explicit confirmation

#### Scenario: Bulk deletion protection
- **WHEN** multiple accounts exist from the same institution
- **THEN** the system allows deletion of individual accounts
- **AND** does not automatically delete other accounts from the same institution
- **AND** updates the institution grouping in the UI after deletion

#### Scenario: Plaid item cleanup
- **WHEN** all accounts associated with a Plaid item are deleted
- **THEN** the system optionally marks the Plaid item as inactive
- **AND** maintains the item record for audit purposes
- **AND** does not delete the Plaid access token (for potential reconnection)

## MODIFIED Requirements

### Requirement: Account Display
The frontend SHALL display a list of all connected bank accounts with their details and management options.

#### Scenario: Display account list
- **WHEN** a user views the account list
- **THEN** the system displays each account with its name, institution, type, and mask
- **AND** shows the current balance formatted as currency
- **AND** groups accounts by institution
- **AND** uses appropriate icons for account types (checking, savings, credit card)
- **AND** provides a delete action for each account

#### Scenario: Empty account list
- **WHEN** no accounts are connected
- **THEN** the system displays an empty state message
- **AND** shows a "Connect Your First Account" button
- **AND** links to the Connect page

