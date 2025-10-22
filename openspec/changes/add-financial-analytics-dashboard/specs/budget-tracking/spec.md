# Budget Tracking Specification

## ADDED Requirements

### Requirement: Budget Data Storage
The system SHALL store budget data encrypted in LowDB with support for monthly and yearly periods.

#### Scenario: Store budget
- **WHEN** a budget is created (via API or seeded data)
- **THEN** the system stores a budget record with id, category_id, amount, period, start_date, end_date
- **AND** encrypts the entire budget object before storing
- **AND** sets created_at and updated_at timestamps
- **AND** links the budget to a category

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

### Requirement: Budget Retrieval
The system SHALL provide API endpoints to retrieve budget data.

#### Scenario: Fetch all budgets
- **WHEN** a client requests budgets via GET /api/budgets
- **THEN** the system returns all budgets decrypted
- **AND** includes category details (name, color, icon)
- **AND** returns 200 status with budget array

#### Scenario: Fetch single budget
- **WHEN** a client requests a specific budget via GET /api/budgets/:id
- **THEN** the system returns the budget with full details
- **AND** includes category information
- **AND** returns 200 status

#### Scenario: No budgets exist
- **WHEN** no budgets have been created
- **THEN** the system returns an empty array with 200 status
- **AND** displays "No budgets configured" message in UI

#### Scenario: Budget not found
- **WHEN** a client requests a budget with non-existent ID
- **THEN** the system returns 404 Not Found status
- **AND** includes an error message

### Requirement: Budget Calculation
The system SHALL calculate budget progress by comparing spent amount vs budgeted amount.

#### Scenario: Calculate monthly budget spent
- **WHEN** calculating progress for a monthly budget
- **THEN** the system sums all tagged transactions in the budget's category for the current month
- **AND** includes transactions in subcategories if category has children
- **AND** uses absolute values of transaction amounts (positive = spent)
- **AND** excludes untagged transactions

#### Scenario: Calculate yearly budget spent
- **WHEN** calculating progress for a yearly budget
- **THEN** the system sums all tagged transactions in the budget's category for the current year
- **AND** includes transactions in subcategories
- **AND** returns the total spent vs yearly budget amount

#### Scenario: Budget exceeded
- **WHEN** spent amount exceeds budget amount
- **THEN** the system calculates percentage as (spent / budget) * 100
- **AND** returns status "exceeded"
- **AND** displays in red in UI with warning indicator

#### Scenario: Budget on track
- **WHEN** spent amount is between 50% and 90% of budget
- **THEN** the system returns status "on_track"
- **AND** displays in blue/normal color in UI

#### Scenario: Budget nearly exceeded
- **WHEN** spent amount is between 90% and 100% of budget
- **THEN** the system returns status "warning"
- **AND** displays in yellow/warning color in UI

### Requirement: Budget Display - Monthly View
The system SHALL display monthly budget progress for all active monthly budgets.

#### Scenario: Display current month budgets
- **WHEN** a user views the monthly budget widget
- **THEN** the system displays all budgets with period "monthly"
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
- **WHEN** multiple categories have monthly budgets
- **THEN** the system displays them sorted by spent percentage descending (highest first)
- **AND** shows all budgets in a list or grid layout
- **AND** allows scrolling if many budgets exist

### Requirement: Budget Display - Yearly View
The system SHALL display yearly budget progress for all active yearly budgets.

#### Scenario: Display current year budgets
- **WHEN** a user views the yearly budget widget
- **THEN** the system displays all budgets with period "yearly"
- **AND** shows category name, budgeted amount, spent amount (year-to-date), and remaining amount
- **AND** displays a progress bar showing spent percentage
- **AND** calculates projected spending based on current rate

#### Scenario: Yearly budget projection
- **WHEN** displaying a yearly budget
- **THEN** the system calculates average monthly spending for the year
- **AND** projects total spending if rate continues: (avg_monthly * 12)
- **AND** displays projection: "On track to spend $X by year end"
- **AND** warns if projection exceeds budget

### Requirement: Budget Display - Category View
The system SHALL display budget information grouped by category.

#### Scenario: Display category budget breakdown
- **WHEN** a user views the category budget widget
- **THEN** the system displays each category with active budgets
- **AND** shows parent category and subcategories hierarchically
- **AND** displays budget amounts and spending for each level
- **AND** allows expanding/collapsing subcategories

#### Scenario: Category with subcategory budgets
- **WHEN** a category has subcategories with individual budgets
- **THEN** the system displays each subcategory budget separately
- **AND** displays a parent-level total (sum of subcategory budgets)
- **AND** calculates parent spending as sum of all subcategory spending

#### Scenario: Category without budget
- **WHEN** a category has no active budget
- **THEN** the system still displays the category
- **AND** shows "No budget set" message
- **AND** displays total spending for the category
- **AND** provides link to create budget (deferred feature note)

### Requirement: Budget Widget Loading States
Budget widgets SHALL display appropriate loading states during data fetching.

#### Scenario: Budget widget loading
- **WHEN** budget data is being fetched
- **THEN** the system displays skeleton loading placeholders
- **AND** shows loading indicators for each budget slot
- **AND** prevents interaction until data is loaded

#### Scenario: Budget widget error
- **WHEN** budget data fails to load
- **THEN** the system displays an error message in the widget
- **AND** shows a "Retry" button
- **AND** logs the error for debugging

### Requirement: Budget Empty States
Budget widgets SHALL display helpful empty states when no budgets exist.

#### Scenario: No budgets configured
- **WHEN** no budgets have been created
- **THEN** the system displays "No budgets configured" message
- **AND** shows a placeholder illustration
- **AND** displays "Budget creation coming soon" note
- **AND** provides link to learn more about budgets

### Requirement: Budget Data Encryption
All budget data SHALL be encrypted at rest using the existing encryption service.

#### Scenario: Encrypt budget on storage
- **WHEN** a budget is saved to the database
- **THEN** the system encrypts the entire budget object
- **AND** uses the encryption key from environment variables
- **AND** stores the encrypted string in LowDB

#### Scenario: Decrypt budget on retrieval
- **WHEN** a budget is read from the database
- **THEN** the system decrypts the encrypted string
- **AND** returns the full budget object
- **AND** handles decryption errors gracefully

### Requirement: Budget Creation API (Implementation Only)
The system SHALL provide API endpoints for budget creation, but UI is deferred to future change.

#### Scenario: Create monthly budget via API
- **WHEN** a POST request is made to /api/budgets with valid data
- **THEN** the system creates a new budget record
- **AND** validates category_id exists
- **AND** validates amount is positive
- **AND** validates period is "monthly" or "yearly"
- **AND** returns 201 Created with the new budget

#### Scenario: Invalid budget creation
- **WHEN** a POST request has invalid data (negative amount, invalid category)
- **THEN** the system returns 400 Bad Request
- **AND** includes validation error details
- **AND** does not create the budget

#### Scenario: Duplicate budget
- **WHEN** a budget already exists for a category and period
- **THEN** the system returns 409 Conflict
- **AND** includes error message about duplicate
- **AND** suggests updating the existing budget

### Requirement: Budget Update API (Implementation Only)
The system SHALL provide API endpoints for budget updates, but UI is deferred to future change.

#### Scenario: Update budget amount via API
- **WHEN** a PATCH request is made to /api/budgets/:id
- **THEN** the system updates the budget record
- **AND** validates new amount is positive
- **AND** updates updated_at timestamp
- **AND** returns 200 with updated budget

#### Scenario: Budget not found for update
- **WHEN** a PATCH request is made for non-existent budget
- **THEN** the system returns 404 Not Found
- **AND** includes error message

