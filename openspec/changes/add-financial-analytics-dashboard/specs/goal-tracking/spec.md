# Goal Tracking Specification

## ADDED Requirements

### Requirement: Goal Data Storage
The system SHALL store savings goal data encrypted in LowDB with target amount and date tracking.

#### Scenario: Store goal
- **WHEN** a goal is created (via API)
- **THEN** the system stores a goal record with id, name, target_amount, current_amount, target_date
- **AND** encrypts the entire goal object before storing
- **AND** sets created_at and updated_at timestamps
- **AND** validates target_amount is positive

#### Scenario: Goal with target date
- **WHEN** a goal has a target_date specified
- **THEN** the system stores it as ISO date string
- **AND** uses it to calculate estimated completion date
- **AND** displays it in the UI

#### Scenario: Goal without target date
- **WHEN** a goal is created without a target_date
- **THEN** the system stores target_date as null
- **AND** does not calculate estimated completion
- **AND** displays "No target date" in UI

### Requirement: Goal Retrieval
The system SHALL provide API endpoints to retrieve goal data.

#### Scenario: Fetch all goals
- **WHEN** a client requests goals via GET /api/goals
- **THEN** the system returns all goals decrypted
- **AND** calculates progress percentage for each goal
- **AND** sorts by target_date ascending (closest deadline first)
- **AND** returns 200 status with goal array

#### Scenario: Fetch single goal
- **WHEN** a client requests a specific goal via GET /api/goals/:id
- **THEN** the system returns the goal with full details
- **AND** includes calculated fields (progress percentage, estimated completion)
- **AND** returns 200 status

#### Scenario: No goals exist
- **WHEN** no goals have been created
- **THEN** the system returns an empty array with 200 status
- **AND** displays "No savings goals configured" message in UI

#### Scenario: Goal not found
- **WHEN** a client requests a goal with non-existent ID
- **THEN** the system returns 404 Not Found status
- **AND** includes an error message

### Requirement: Goal Progress Calculation
The system SHALL calculate goal progress and estimated completion dates.

#### Scenario: Calculate goal progress percentage
- **WHEN** displaying a goal
- **THEN** the system calculates progress as (current_amount / target_amount) * 100
- **AND** returns percentage rounded to one decimal place
- **AND** caps percentage at 100% if current_amount exceeds target_amount

#### Scenario: Calculate estimated completion date
- **WHEN** a goal has historical contribution data
- **THEN** the system calculates average monthly contribution based on last 3 months
- **AND** calculates remaining amount: (target_amount - current_amount)
- **AND** estimates months to completion: remaining / avg_monthly
- **AND** returns estimated completion date
- **AND** displays "On track" if estimated date is before target_date

#### Scenario: Goal ahead of schedule
- **WHEN** estimated completion date is before target_date
- **THEN** the system returns status "ahead"
- **AND** displays in green with checkmark icon
- **AND** shows "X months ahead of schedule"

#### Scenario: Goal behind schedule
- **WHEN** estimated completion date is after target_date
- **THEN** the system returns status "behind"
- **AND** displays in yellow/red with warning icon
- **AND** shows "X months behind schedule"
- **AND** suggests increasing monthly contribution

#### Scenario: Goal completed
- **WHEN** current_amount >= target_amount
- **THEN** the system returns status "completed"
- **AND** displays in green with celebration icon
- **AND** shows "Goal achieved!" message
- **AND** displays completion date (when goal was reached)

#### Scenario: Insufficient data for estimation
- **WHEN** a goal has less than 2 months of contribution data
- **THEN** the system returns "Insufficient data" for estimated completion
- **AND** displays "Add more contributions to see estimate"
- **AND** shows basic progress percentage only

### Requirement: Goal Display Widget
The system SHALL display savings goals with visual progress indicators.

#### Scenario: Display goal list
- **WHEN** a user views the goals widget
- **THEN** the system displays all goals sorted by target date
- **AND** shows goal name, target amount, current amount, and progress bar
- **AND** displays estimated completion date for each goal
- **AND** uses color coding based on status (ahead, on_track, behind, completed)

#### Scenario: Goal progress bar
- **WHEN** a goal is displayed
- **THEN** the system shows a horizontal progress bar
- **AND** fills the bar proportionally to progress percentage
- **AND** displays exact amounts: "$X saved of $Y goal"
- **AND** shows percentage: "75% complete"
- **AND** uses appropriate color (green for on_track/ahead, yellow for behind)

#### Scenario: Goal target date display
- **WHEN** a goal has a target_date
- **THEN** the system displays "Target: Month Year"
- **AND** shows countdown: "X months remaining"
- **AND** highlights if target date is within 30 days (urgent)

#### Scenario: Goal estimated completion display
- **WHEN** a goal has estimated completion date
- **THEN** the system displays "Estimated: Month Year"
- **AND** compares to target date
- **AND** shows ahead/behind status
- **AND** displays trend indicator (up arrow = ahead, down arrow = behind)

### Requirement: Goal Summary Card
The system SHALL display a summary card with aggregate goal statistics.

#### Scenario: Display goal summary
- **WHEN** a user views the goals section
- **THEN** the system displays a summary card showing:
- **AND** total number of active goals
- **AND** total target amount across all goals
- **AND** total saved amount across all goals
- **AND** overall progress percentage
- **AND** number of completed goals

#### Scenario: Multiple goals at different progress
- **WHEN** multiple goals exist with varying progress
- **THEN** the system calculates weighted average progress
- **AND** displays goals grouped by status (ahead, on_track, behind, completed)
- **AND** allows filtering by status

### Requirement: Goal Empty States
Goal widgets SHALL display helpful empty states when no goals exist.

#### Scenario: No goals configured
- **WHEN** no goals have been created
- **THEN** the system displays "No savings goals configured" message
- **AND** shows a placeholder illustration
- **AND** displays "Goal creation coming soon" note
- **AND** provides link to learn more about savings goals

### Requirement: Goal Data Encryption
All goal data SHALL be encrypted at rest using the existing encryption service.

#### Scenario: Encrypt goal on storage
- **WHEN** a goal is saved to the database
- **THEN** the system encrypts the entire goal object
- **AND** uses the encryption key from environment variables
- **AND** stores the encrypted string in LowDB

#### Scenario: Decrypt goal on retrieval
- **WHEN** a goal is read from the database
- **THEN** the system decrypts the encrypted string
- **AND** returns the full goal object
- **AND** handles decryption errors gracefully

### Requirement: Goal Creation API (Implementation Only)
The system SHALL provide API endpoints for goal creation, but UI is deferred to future change.

#### Scenario: Create goal via API
- **WHEN** a POST request is made to /api/goals with valid data
- **THEN** the system creates a new goal record
- **AND** validates name is not empty
- **AND** validates target_amount is positive
- **AND** validates current_amount is non-negative and <= target_amount
- **AND** validates target_date is in the future (if provided)
- **AND** returns 201 Created with the new goal

#### Scenario: Invalid goal creation
- **WHEN** a POST request has invalid data (negative amount, past date)
- **THEN** the system returns 400 Bad Request
- **AND** includes validation error details
- **AND** does not create the goal

#### Scenario: Goal name already exists
- **WHEN** a goal with the same name already exists
- **THEN** the system returns 409 Conflict
- **AND** includes error message about duplicate name
- **AND** suggests using a different name

### Requirement: Goal Update API (Implementation Only)
The system SHALL provide API endpoints for goal updates, but UI is deferred to future change.

#### Scenario: Update goal progress via API
- **WHEN** a PATCH request is made to /api/goals/:id
- **THEN** the system updates the goal record
- **AND** allows updating current_amount, target_amount, target_date
- **AND** validates new values are valid
- **AND** updates updated_at timestamp
- **AND** returns 200 with updated goal

#### Scenario: Update goal current amount
- **WHEN** a user adds money to a goal (increases current_amount)
- **THEN** the system updates the current_amount
- **AND** recalculates progress percentage
- **AND** updates estimated completion date
- **AND** checks if goal is now completed

#### Scenario: Goal not found for update
- **WHEN** a PATCH request is made for non-existent goal
- **THEN** the system returns 404 Not Found
- **AND** includes error message

### Requirement: Goal Widget Loading States
Goal widgets SHALL display appropriate loading states during data fetching.

#### Scenario: Goal widget loading
- **WHEN** goal data is being fetched
- **THEN** the system displays skeleton loading placeholders
- **AND** shows loading indicators for each goal slot
- **AND** prevents interaction until data is loaded

#### Scenario: Goal widget error
- **WHEN** goal data fails to load
- **THEN** the system displays an error message in the widget
- **AND** shows a "Retry" button
- **AND** logs the error for debugging

### Requirement: Goal Achievement Celebration
The system SHALL provide visual feedback when a goal is completed.

#### Scenario: Display completed goal
- **WHEN** a goal reaches 100% progress
- **THEN** the system displays a completion badge
- **AND** shows "Goal Achieved!" message
- **AND** displays completion date
- **AND** uses celebratory colors and icons
- **AND** moves completed goal to "Completed Goals" section

#### Scenario: Goal exceeded target
- **WHEN** current_amount exceeds target_amount
- **THEN** the system displays progress as 100%
- **AND** shows "Goal exceeded by $X"
- **AND** uses celebration styling
- **AND** caps progress bar at 100% visually

