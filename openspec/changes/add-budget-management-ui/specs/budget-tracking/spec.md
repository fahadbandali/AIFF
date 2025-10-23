# Budget Tracking Specification - Enhancements

## ADDED Requirements

### Requirement: Daily Budget Period Support
The system SHALL support daily budget periods for granular spending control.

#### Scenario: Create daily budget
- **WHEN** a user creates a budget with period "daily"
- **THEN** the system sets start_date and end_date to the same date
- **AND** calculates spending for that specific day only
- **AND** displays as "Daily" in the UI

#### Scenario: Calculate daily budget progress
- **WHEN** calculating progress for a daily budget
- **THEN** the system sums all transactions with matching date in the budget's category
- **AND** compares against the daily budget amount
- **AND** resets tracking for the next day

### Requirement: Weekly Budget Period Support
The system SHALL support weekly budget periods for week-based spending control.

#### Scenario: Create weekly budget
- **WHEN** a user creates a budget with period "weekly"
- **THEN** the system calculates a 7-day period from start_date
- **AND** sets end_date to 6 days after start_date
- **AND** displays as "Weekly" in the UI

#### Scenario: Calculate weekly budget progress
- **WHEN** calculating progress for a weekly budget
- **THEN** the system sums all transactions within the 7-day window in the budget's category
- **AND** compares against the weekly budget amount
- **AND** includes all transactions from start_date to end_date inclusive

#### Scenario: Weekly period spanning month boundary
- **WHEN** a weekly budget period spans across two months
- **THEN** the system includes all transactions in the date range regardless of month
- **AND** calculates progress correctly across the boundary

### Requirement: All-Categories Budget Support
The system SHALL support budgets that apply to all transactions regardless of category, with mandatory date ranges.

#### Scenario: Create all-categories budget
- **WHEN** a user creates a budget with category_id as null and provides both start_date and end_date
- **THEN** the system creates an all-categories budget
- **AND** stores it with category_id = null
- **AND** displays "All Categories" label in the UI

#### Scenario: Prevent all-categories budget without end date
- **WHEN** a user attempts to create a budget with category_id = null and end_date = null
- **THEN** the system returns 400 Bad Request
- **AND** displays error "All-categories budgets must have a specific end date"
- **AND** does not create the budget

#### Scenario: Calculate all-categories budget progress
- **WHEN** calculating progress for an all-categories budget
- **THEN** the system sums ALL transactions within the date range across all categories
- **AND** compares total spending against the budget amount
- **AND** includes transactions from all categories (including uncategorized)

#### Scenario: All-categories budget coexists with category budgets
- **WHEN** an all-categories budget exists for dates Oct 1-15
- **THEN** the system allows creating category-specific budgets for the same period
- **AND** tracks both budget types independently
- **AND** displays both in the dashboard and widget

#### Scenario: Prevent overlapping all-categories budgets
- **WHEN** an all-categories budget exists for dates Oct 1-15
- **AND** a user attempts to create another all-categories budget for Oct 10-20
- **THEN** the system returns 409 Conflict
- **AND** displays error "An all-categories budget already exists for overlapping dates (Oct 1 to Oct 15)"
- **AND** does not create the overlapping budget

#### Scenario: Allow adjacent all-categories budgets
- **WHEN** an all-categories budget exists for dates Oct 1-15
- **AND** a user creates another all-categories budget for Oct 16-31
- **THEN** the system creates the budget successfully
- **AND** both budgets are tracked independently without conflict

### Requirement: Budget Creation UI
The system SHALL provide a user interface for creating new budgets.

#### Scenario: Open budget creation form
- **WHEN** a user clicks "Create Budget" button in widget or dashboard
- **THEN** the system opens a modal with empty budget creation form
- **AND** displays fields for category, amount, period, and date range
- **AND** provides clear labels and placeholders

#### Scenario: Select category for new budget
- **WHEN** a user opens the category dropdown in creation form
- **THEN** the system displays "All Categories" option at the top
- **AND** displays all categories that don't have a budget for the selected period
- **AND** filters out categories that already have a budget for the selected period
- **AND** shows category name with optional icon/color

#### Scenario: Select "All Categories" option
- **WHEN** a user selects "All Categories" from the dropdown
- **THEN** the system sets category_id to null internally
- **AND** makes the end_date field required (removes optional status)
- **AND** displays tooltip explaining "All-categories budgets require a specific date range"
- **AND** clears auto-populated dates (requires manual entry)

#### Scenario: Select period type
- **WHEN** a user selects a period type (daily, weekly, monthly, yearly)
- **THEN** the system auto-populates date fields based on the selected period
- **AND** shows a tooltip explaining the period type
- **AND** updates the date range accordingly

#### Scenario: Enter budget amount
- **WHEN** a user enters an amount in the budget form
- **THEN** the system validates the amount is positive
- **AND** formats the amount with currency symbol on blur
- **AND** shows validation error if amount is negative or zero

#### Scenario: Submit budget creation form
- **WHEN** a user submits a valid budget form
- **THEN** the system calls POST /api/budgets with the form data
- **AND** displays loading indicator during submission
- **AND** closes modal and shows success notification on success
- **AND** displays error message if submission fails

#### Scenario: Validation errors in creation form
- **WHEN** a user submits an invalid form (missing required fields, invalid amount)
- **THEN** the system displays inline validation errors for each field
- **AND** prevents form submission
- **AND** focuses on the first invalid field

#### Scenario: All-categories budget validation
- **WHEN** a user submits a form with "All Categories" selected but no end_date
- **THEN** the system displays validation error "End date is required for all-categories budgets"
- **AND** prevents form submission
- **AND** highlights the end_date field

### Requirement: Budget Update UI
The system SHALL provide a user interface for editing existing budgets.

#### Scenario: Open budget edit form
- **WHEN** a user clicks "Edit" button on a budget card
- **THEN** the system opens a modal with budget edit form
- **AND** pre-fills all fields with current budget values
- **AND** disables the category field (category cannot be changed)

#### Scenario: Update budget amount
- **WHEN** a user changes the amount and submits the edit form
- **THEN** the system calls PATCH /api/budgets/:id with new amount
- **AND** updates the budget in the list
- **AND** shows success notification

#### Scenario: Update budget period and dates
- **WHEN** a user changes the period type or date range
- **THEN** the system validates the new date range
- **AND** updates the budget via PATCH API
- **AND** recalculates budget progress with new date range

#### Scenario: Cancel budget edit
- **WHEN** a user clicks "Cancel" in edit form
- **THEN** the system closes the modal without saving changes
- **AND** discards any unsaved modifications

### Requirement: Budget Deletion UI
The system SHALL provide a user interface for deleting budgets with confirmation.

#### Scenario: Initiate budget deletion
- **WHEN** a user clicks "Delete" button on a budget card
- **THEN** the system opens a confirmation modal
- **AND** displays the category name and period in the confirmation message
- **AND** shows "Cancel" and "Confirm Delete" buttons

#### Scenario: Confirm budget deletion
- **WHEN** a user confirms deletion in the confirmation modal
- **THEN** the system calls DELETE /api/budgets/:id
- **AND** removes the budget from the UI
- **AND** shows success notification "Budget deleted successfully"

#### Scenario: Cancel budget deletion
- **WHEN** a user clicks "Cancel" in the deletion confirmation modal
- **THEN** the system closes the modal without deleting the budget
- **AND** returns to the budget list

### Requirement: Budget Dashboard Page
The system SHALL provide a dedicated dashboard page for comprehensive budget management.

#### Scenario: Navigate to budget dashboard
- **WHEN** a user navigates to /budgets route
- **THEN** the system displays the budget dashboard page
- **AND** shows a list of all budgets with their progress
- **AND** displays "Create Budget" button at the top

#### Scenario: Display all budgets in dashboard
- **WHEN** the budget dashboard loads
- **THEN** the system fetches all budgets via API
- **AND** displays each budget as a card showing category (or "All Categories"), amount, spent, remaining, and progress bar
- **AND** includes Edit and Delete action buttons for each budget
- **AND** displays "All Categories" badge for budgets with category_id = null
- **AND** shows date range prominently for all-categories budgets

#### Scenario: Empty budget dashboard
- **WHEN** no budgets exist
- **THEN** the system displays an empty state illustration
- **AND** shows message "No budgets yet. Create your first budget to start tracking spending."
- **AND** displays a prominent "Create Budget" button

#### Scenario: Search/filter budgets in dashboard
- **WHEN** a user enters text in the search field
- **THEN** the system filters budgets by category name
- **AND** updates the displayed list in real-time
- **AND** shows "No results found" if no budgets match

#### Scenario: Sort budgets in dashboard
- **WHEN** a user clicks a sort option (category, spent amount, remaining)
- **THEN** the system reorders the budget list accordingly
- **AND** displays a visual indicator of current sort order
- **AND** persists sort preference

### Requirement: Budget Widget Customization
The system SHALL allow users to customize which budgets are displayed in the widget.

#### Scenario: Open widget settings
- **WHEN** a user clicks the settings icon in BudgetWidget
- **THEN** the system opens a customization modal
- **AND** displays a list of all budgets with checkboxes
- **AND** shows current visibility state for each budget

#### Scenario: Toggle budget visibility
- **WHEN** a user checks/unchecks a budget in the customization modal
- **THEN** the system immediately updates the widget to show/hide the budget
- **AND** saves the preference to localStorage
- **AND** persists the setting across page reloads

#### Scenario: Show all budgets in widget
- **WHEN** all budgets are checked in customization settings
- **THEN** the widget displays all budgets with their progress
- **AND** sorts budgets by spent percentage (highest first)

#### Scenario: Show selected budgets only
- **WHEN** only some budgets are checked in settings
- **THEN** the widget displays only the selected budgets
- **AND** hides unchecked budgets from the widget
- **AND** maintains sort order

#### Scenario: Widget with no visible budgets
- **WHEN** all budgets are unchecked in settings
- **THEN** the widget displays a message "No budgets selected. Open settings to choose budgets to display."
- **AND** shows the settings icon prominently

### Requirement: Budget Uniqueness Constraints
The system SHALL enforce uniqueness constraints for category budgets and prevent overlapping all-categories budgets.

#### Scenario: Prevent duplicate category budget creation
- **WHEN** a user attempts to create a budget for a category and period that already has a budget
- **THEN** the system returns 409 Conflict from the API
- **AND** displays error message "A {period} budget already exists for {category}. Please edit the existing budget instead."
- **AND** does not create the duplicate budget

#### Scenario: Prevent overlapping all-categories budgets
- **WHEN** a user attempts to create an all-categories budget with dates that overlap existing all-categories budget
- **THEN** the system returns 409 Conflict from the API
- **AND** displays error message "An all-categories budget already exists for overlapping dates ({start} to {end})"
- **AND** does not create the overlapping budget

#### Scenario: Filter categories in creation form
- **WHEN** a user selects a period type in the budget creation form
- **THEN** the system filters the category dropdown
- **AND** shows only categories that don't have a budget for that period
- **AND** disables/hides categories that already have budgets for that period

#### Scenario: Allow multiple periods for same category
- **WHEN** a category has a monthly budget
- **THEN** the system allows creating a weekly or daily budget for the same category
- **AND** both budgets are tracked independently
- **AND** displays both budgets in the dashboard

#### Scenario: Allow category and all-categories budgets simultaneously
- **WHEN** an all-categories budget exists for Oct 1-15
- **THEN** the system allows creating category-specific budgets for any period
- **AND** both budget types are tracked independently
- **AND** displays both in dashboard with clear visual distinction

### Requirement: Budget Update API
The system SHALL provide API endpoints for updating existing budgets.

#### Scenario: Update budget amount via API
- **WHEN** a PATCH request is made to /api/budgets/:id with { amount: 500 }
- **THEN** the system updates only the amount field
- **AND** sets updated_at to current timestamp
- **AND** returns 200 with the updated budget object

#### Scenario: Update budget period and dates via API
- **WHEN** a PATCH request is made with { period: "weekly", start_date: "2025-10-20", end_date: "2025-10-26" }
- **THEN** the system updates the period and date fields
- **AND** validates the date range is consistent with the period
- **AND** returns 200 with updated budget

#### Scenario: Prevent category change via update
- **WHEN** a PATCH request includes category_id field
- **THEN** the system returns 400 Bad Request
- **AND** displays error "Cannot change budget category. Delete and create a new budget instead."
- **AND** does not update the budget

#### Scenario: Update non-existent budget
- **WHEN** a PATCH request is made for a budget ID that doesn't exist
- **THEN** the system returns 404 Not Found
- **AND** includes error message "Budget not found"

### Requirement: Budget Deletion API
The system SHALL provide API endpoints for deleting budgets.

#### Scenario: Delete budget via API
- **WHEN** a DELETE request is made to /api/budgets/:id
- **THEN** the system removes the budget from the database
- **AND** returns 200 with { success: true, message: "Budget deleted successfully" }

#### Scenario: Delete non-existent budget
- **WHEN** a DELETE request is made for a budget ID that doesn't exist
- **THEN** the system returns 404 Not Found
- **AND** includes error message "Budget not found"

#### Scenario: Budget deletion clears widget preferences
- **WHEN** a budget is deleted
- **THEN** the system removes it from the database
- **AND** frontend updates localStorage to remove deleted budget ID from visible budgets list
- **AND** widget no longer attempts to display the deleted budget

## MODIFIED Requirements

### Requirement: Budget Data Storage
The system SHALL store budget data encrypted in LowDB with support for daily, weekly, monthly, yearly periods and all-categories budgets.

#### Scenario: Store budget
- **WHEN** a budget is created (via API or seeded data)
- **THEN** the system stores a budget record with id, category_id (nullable), amount, period, start_date, end_date
- **AND** encrypts the entire budget object before storing
- **AND** sets created_at and updated_at timestamps
- **AND** links the budget to a category (if category_id is not null)

#### Scenario: Store all-categories budget
- **WHEN** a budget is created with category_id = null
- **THEN** the system stores the budget with category_id as null
- **AND** validates end_date is not null
- **AND** encrypts and stores the budget record
- **AND** does not link to any specific category

#### Scenario: Budget with monthly period
- **WHEN** a budget has period "monthly"
- **THEN** the system interprets start_date as the first day of a calendar month
- **AND** calculates end_date as the last day of that month
- **AND** uses this for budget calculations

#### Scenario: Budget with yearly period
- **WHEN** a budget has period "yearly"
- **THEN** the system interprets start_date as the first day of a calendar year
- **AND** calculates end_date as the last day of that year (December 31)
- **AND** uses this for yearly budget calculations

#### Scenario: Store daily budget
- **WHEN** a budget has period "daily"
- **THEN** the system stores start_date and end_date as the same date
- **AND** validates date format is YYYY-MM-DD

#### Scenario: Store weekly budget
- **WHEN** a budget has period "weekly"
- **THEN** the system stores start_date and end_date spanning 7 days
- **AND** validates end_date is 6 days after start_date

### Requirement: Budget Creation API (Implementation Only)
The system SHALL provide API endpoints for budget creation with duplicate and overlap prevention.

#### Scenario: Create monthly budget via API
- **WHEN** a POST request is made to /api/budgets with valid data
- **THEN** the system creates a new budget record
- **AND** validates category_id exists (if not null)
- **AND** validates amount is positive
- **AND** validates period is "daily", "weekly", "monthly", or "yearly"
- **AND** checks for existing budget with same category_id and period (if category_id is not null)
- **AND** returns 201 Created with the new budget if no duplicate exists

#### Scenario: Create all-categories budget via API
- **WHEN** a POST request is made with category_id = null and valid date range
- **THEN** the system validates end_date is not null
- **AND** checks for overlapping all-categories budgets
- **AND** creates the budget if no overlap exists
- **AND** returns 201 Created with the new budget

#### Scenario: Invalid all-categories budget (missing end_date)
- **WHEN** a POST request has category_id = null and end_date = null
- **THEN** the system returns 400 Bad Request
- **AND** includes validation error "end_date is required for all-categories budgets"
- **AND** does not create the budget

#### Scenario: Invalid budget creation
- **WHEN** a POST request has invalid data (negative amount, invalid category)
- **THEN** the system returns 400 Bad Request
- **AND** includes validation error details
- **AND** does not create the budget

#### Scenario: Duplicate category budget
- **WHEN** a budget already exists for a category and period
- **THEN** the system returns 409 Conflict
- **AND** includes error message "A {period} budget already exists for {category_name}"
- **AND** suggests editing the existing budget instead of creating duplicate

#### Scenario: Overlapping all-categories budget
- **WHEN** an all-categories budget already exists for overlapping date range
- **THEN** the system returns 409 Conflict
- **AND** includes error message with existing budget dates
- **AND** does not create the budget

### Requirement: Budget Display - Monthly View
The system SHALL display monthly budget progress for all active monthly budgets with customization support.

#### Scenario: Display current month budgets
- **WHEN** a user views the monthly budget widget
- **THEN** the system displays all budgets with period "monthly" that are marked visible in preferences
- **AND** shows category name, budgeted amount, spent amount, and remaining amount
- **AND** displays a progress bar showing spent percentage
- **AND** uses color coding (green, yellow, red) based on status

#### Scenario: Budget progress bar
- **WHEN** a budget is displayed
- **THEN** the system shows a horizontal progress bar
- **AND** fills the bar proportionally to spent percentage
- **AND** displays exact amounts: "$X spent of $Y budget"
- **AND** shows percentage: "50% used"

#### Scenario: Multiple category budgets
- **WHEN** multiple categories have monthly budgets marked visible
- **THEN** the system displays them sorted by spent percentage descending (highest first)
- **AND** shows all visible budgets in a list or grid layout
- **AND** allows scrolling if many budgets exist

#### Scenario: Link to budget dashboard from widget
- **WHEN** a user views the budget widget
- **THEN** the system displays a "View All Budgets" link
- **AND** clicking the link navigates to /budgets dashboard
- **AND** maintains current budget data

## REMOVED Requirements

None. All existing requirements remain valid with enhancements added above.

