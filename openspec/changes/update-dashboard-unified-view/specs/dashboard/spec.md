# Dashboard Specification

## ADDED Requirements

### Requirement: View Toggle
The dashboard SHALL provide a view toggle mechanism to switch between accounts view and analytics view without navigation.

#### Scenario: Toggle to analytics view
- **WHEN** a user clicks the "Analytics" button in the Quick Actions section
- **THEN** the system switches the dashboard display to analytics view
- **AND** hides the accounts summary section
- **AND** displays all analytics widgets (cash flow, budgets, goals, transactions)
- **AND** maintains the toggle button state to show current view

#### Scenario: Toggle to accounts view
- **WHEN** a user clicks the "Accounts" button while in analytics view
- **THEN** the system switches the dashboard display back to accounts view
- **AND** hides the analytics widgets
- **AND** displays the accounts summary section
- **AND** updates the toggle button state

#### Scenario: Default view on dashboard load
- **WHEN** a user navigates to `/dashboard`
- **THEN** the system displays the accounts view by default
- **AND** shows the Quick Actions section with toggle option

### Requirement: Analytics Integration
The dashboard SHALL integrate all analytics components inline, eliminating the need for a separate analytics page.

#### Scenario: Display analytics widgets in analytics view
- **WHEN** a user toggles to analytics view
- **THEN** the system displays all analytics widgets within the dashboard
- **AND** shows CashFlowCircle and CashFlowLine visualizations
- **AND** displays BudgetWidget and GoalWidget
- **AND** shows UntaggedTransactions widget
- **AND** displays TransactionList widget
- **AND** includes the transaction sync button

#### Scenario: Sync transactions from dashboard
- **WHEN** a user clicks the "Refresh Transactions" button in analytics view
- **THEN** the system syncs transactions from Plaid
- **AND** updates all analytics widgets with fresh data
- **AND** displays sync status (success/error messages)
- **AND** maintains the user in analytics view

### Requirement: Collapseable List Widgets
List-based widgets SHALL support collapse and expand functionality to manage screen space efficiently.

#### Scenario: Collapse transaction list
- **WHEN** a user clicks the collapse button on the TransactionList widget header
- **THEN** the system collapses the transaction list
- **AND** hides the transaction items
- **AND** shows only the widget header
- **AND** updates the button icon to indicate expand action

#### Scenario: Expand transaction list
- **WHEN** a user clicks the expand button on a collapsed TransactionList widget
- **THEN** the system expands the transaction list
- **AND** displays all transaction items
- **AND** updates the button icon to indicate collapse action

#### Scenario: Collapse untagged transactions widget
- **WHEN** a user clicks the collapse button on the UntaggedTransactions widget header
- **THEN** the system collapses the widget
- **AND** hides the untagged transaction items
- **AND** shows only the widget header with count badge
- **AND** maintains collapse state during view toggles

#### Scenario: Persist collapse state
- **WHEN** a user collapses or expands a widget
- **THEN** the system stores the collapse state in localStorage
- **AND** restores the collapse state on subsequent dashboard visits
- **AND** applies the saved state when toggling between views

## MODIFIED Requirements

### Requirement: Dashboard Navigation
The dashboard SHALL provide navigation to key application features with integrated analytics access via view toggle.

#### Scenario: Navigate to account details
- **WHEN** a user clicks on an account in the summary
- **THEN** the system navigates to a detailed view of that account
- **AND** displays full account information and recent transactions

#### Scenario: Navigate to connect more accounts
- **WHEN** a user clicks "Connect Another Account" button
- **THEN** the system navigates to the Connect page
- **AND** initiates a new Plaid Link flow

#### Scenario: Access analytics via view toggle
- **WHEN** a user clicks the "Analytics" button in Quick Actions
- **THEN** the system switches to analytics view within the same page
- **AND** does not navigate to a separate route
- **AND** displays all analytics widgets inline

### Requirement: Dashboard Page
The system SHALL provide a unified dashboard page with view toggle for accounts and analytics.

#### Scenario: First-time user dashboard
- **WHEN** a user navigates to `/dashboard` after connecting their first bank account
- **THEN** the system displays "Welcome" as the main heading
- **AND** shows a summary of connected accounts
- **AND** displays the total number of connected accounts
- **AND** provides Quick Actions section with view toggle button

#### Scenario: Returning user dashboard
- **WHEN** a user with existing connected accounts navigates to `/dashboard`
- **THEN** the system displays "Welcome" as the main heading
- **AND** shows an updated summary of all connected accounts
- **AND** displays current balances for each account
- **AND** allows toggling to analytics view via Quick Actions

#### Scenario: Dashboard loading state
- **WHEN** the dashboard is loading account data
- **THEN** the system displays a skeleton loading state
- **AND** shows a loading spinner or placeholder content
- **AND** prevents interaction until data is loaded

