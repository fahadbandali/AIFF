# Financial Analytics Specification

## MODIFIED Requirements

### Requirement: Untagged Transactions Widget
The system SHALL display a list of untagged transactions with category assignment interface side-by-side with the full transaction list.

#### Scenario: Display untagged transactions list
- **WHEN** a user views the untagged transactions widget
- **THEN** the system displays all transactions with is_tagged: false
- **AND** shows transaction date, name, amount, and current category
- **AND** sorts by date descending (newest first)
- **AND** limits display to 10 transactions per page with pagination

#### Scenario: Category dropdown for transaction
- **WHEN** a user clicks on a transaction's category
- **THEN** the system displays a dropdown with all available categories
- **AND** groups categories by parent category
- **AND** highlights the currently selected category
- **AND** allows searching/filtering categories by name

#### Scenario: Confirm transaction category
- **WHEN** a user clicks "Confirm" button for a transaction
- **THEN** the system updates the transaction to is_tagged: true
- **AND** uses optimistic update (removes from list immediately)
- **AND** shows success toast notification
- **AND** reverts on error with error message
- **AND** the transaction appears in the full transaction list immediately

#### Scenario: Change and confirm category
- **WHEN** a user changes category and clicks "Confirm"
- **THEN** the system updates both category_id and is_tagged
- **AND** removes transaction from untagged list
- **AND** shows "Categorized as [Category Name]" toast
- **AND** the transaction appears in the full transaction list with the new category

#### Scenario: Bulk categorization
- **WHEN** a user selects multiple transactions (checkboxes)
- **THEN** the system enables bulk actions toolbar
- **AND** shows "Confirm All" button
- **AND** shows "Categorize All As..." dropdown
- **AND** allows confirming all selected transactions at once

#### Scenario: All transactions tagged
- **WHEN** all transactions are tagged (none remaining)
- **THEN** the system displays "All caught up! No untagged transactions" message
- **AND** shows celebration icon
- **AND** displays last reviewed timestamp

#### Scenario: Untagged transaction pagination
- **WHEN** more than 10 untagged transactions exist
- **THEN** the system displays pagination controls
- **AND** shows "Showing 1-10 of X transactions"
- **AND** allows navigating to next/previous page

## ADDED Requirements

### Requirement: Side-by-Side Transaction Layout
The system SHALL display untagged transactions and the full transaction list side-by-side on the analytics dashboard.

#### Scenario: Desktop side-by-side layout
- **WHEN** a user views the analytics dashboard on desktop (>= 1024px width)
- **THEN** the system displays the untagged transactions list in the left column
- **AND** displays the full transaction list in the right column
- **AND** allocates equal or proportional width to both columns
- **AND** aligns the tops of both components
- **AND** allows independent scrolling within each list

#### Scenario: Tablet side-by-side layout
- **WHEN** a user views the analytics dashboard on tablet (768px - 1023px width)
- **THEN** the system displays the untagged transactions list in the left column
- **AND** displays the full transaction list in the right column
- **AND** adjusts column widths to fit the screen
- **AND** maintains usability of all interactive elements

#### Scenario: Mobile stacked layout
- **WHEN** a user views the analytics dashboard on mobile (< 768px width)
- **THEN** the system stacks the untagged transactions list on top
- **AND** displays the full transaction list below
- **AND** maintains full functionality of both components
- **AND** uses full screen width for each component

#### Scenario: Real-time transaction movement
- **WHEN** a user tags a transaction in the untagged list
- **THEN** the transaction immediately disappears from the untagged list
- **AND** the transaction appears in the full transaction list within 1 second
- **AND** the full transaction list automatically refreshes to show the newly tagged transaction
- **AND** the newly tagged transaction is highlighted or indicated visually (optional)

#### Scenario: Empty untagged list behavior
- **WHEN** there are no untagged transactions
- **THEN** the left column displays the "All caught up!" message
- **AND** the right column continues to show the full transaction list
- **AND** the layout maintains the side-by-side structure

#### Scenario: Empty full transaction list behavior
- **WHEN** there are untagged transactions but no tagged transactions yet
- **THEN** the left column displays untagged transactions normally
- **AND** the right column displays "No transactions found" message
- **AND** as transactions are tagged, they immediately appear in the right column

#### Scenario: Visual separation between lists
- **WHEN** both lists are displayed side-by-side
- **THEN** the system provides clear visual separation (border, divider, or spacing)
- **AND** each list has a clear heading identifying its purpose
- **AND** the visual design makes it obvious which transactions are untagged vs tagged

### Requirement: Transaction List Auto-Refresh on Tagging
The transaction list SHALL automatically update when a transaction is tagged to show the newly tagged transaction.

#### Scenario: Query invalidation on tag
- **WHEN** a transaction is successfully tagged
- **THEN** the system invalidates the React Query cache for the "transactions" query
- **AND** triggers an automatic refetch of the full transaction list
- **AND** the full transaction list updates to include the newly tagged transaction
- **AND** the transaction appears in the correct position based on date sorting

#### Scenario: Filter preservation during auto-refresh
- **WHEN** the full transaction list has an active category filter
- **AND** a transaction is tagged with a category matching the filter
- **THEN** the system updates the full transaction list
- **AND** shows the newly tagged transaction if it matches the filter
- **AND** maintains the current filter selection

#### Scenario: Filter mismatch during auto-refresh
- **WHEN** the full transaction list has an active category filter
- **AND** a transaction is tagged with a category NOT matching the filter
- **THEN** the system updates the full transaction list
- **AND** does not show the newly tagged transaction (because it doesn't match the filter)
- **AND** the transaction is still successfully tagged and will appear when filter is cleared

#### Scenario: Pagination handling during auto-refresh
- **WHEN** the full transaction list is paginated
- **AND** a transaction is tagged
- **THEN** the system refreshes the current page
- **AND** the newly tagged transaction appears if it belongs on the current page based on date
- **AND** pagination controls update if the total count changed

