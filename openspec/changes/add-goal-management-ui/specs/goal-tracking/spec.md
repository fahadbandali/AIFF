# Goal Tracking Specification Delta

## ADDED Requirements

### Requirement: Goal Creation UI
The system SHALL provide a user interface for creating new savings goals.

#### Scenario: Open goal creation form
- **WHEN** a user clicks "Create New Goal" button
- **THEN** the system displays a goal creation form
- **AND** shows input fields for title, target amount, and deadline
- **AND** all fields are empty/default
- **AND** displays "Create Goal" submit button

#### Scenario: Create goal with valid data
- **WHEN** a user submits the goal creation form with valid data (non-empty title, positive amount, future deadline)
- **THEN** the system validates all inputs
- **AND** sends POST request to /api/goals
- **AND** displays success message "Goal created successfully"
- **AND** redirects to goal dashboard or closes form
- **AND** new goal appears in goal list immediately

#### Scenario: Create goal with invalid data
- **WHEN** a user submits the form with invalid data (empty title, negative amount, past deadline)
- **THEN** the system displays validation errors inline
- **AND** highlights invalid fields
- **AND** does not submit the form
- **AND** provides helpful error messages ("Title is required", "Amount must be positive", "Deadline must be in the future")

#### Scenario: Create goal without deadline
- **WHEN** a user creates a goal without specifying a deadline
- **THEN** the system accepts the goal with null target_date
- **AND** creates the goal successfully
- **AND** displays the goal without deadline information
- **AND** does not show estimated completion calculations

#### Scenario: Duplicate goal name
- **WHEN** a user tries to create a goal with a name that already exists
- **THEN** the system returns 409 Conflict error
- **AND** displays error message "A goal with this name already exists"
- **AND** suggests modifying the name
- **AND** keeps the form open with entered data

### Requirement: Goal Editing UI
The system SHALL provide a user interface for editing existing goals.

#### Scenario: Open goal edit form
- **WHEN** a user clicks "Edit" button on a goal
- **THEN** the system displays a goal edit form
- **AND** pre-fills all fields with current goal data
- **AND** displays "Save Changes" submit button
- **AND** displays "Cancel" button

#### Scenario: Update goal details
- **WHEN** a user modifies goal title, target amount, or deadline and submits
- **THEN** the system validates the new values
- **AND** sends PATCH request to /api/goals/:id
- **AND** displays success message "Goal updated successfully"
- **AND** updates the goal display immediately
- **AND** closes the edit form

#### Scenario: Update goal with invalid data
- **WHEN** a user submits edit form with invalid data
- **THEN** the system displays validation errors
- **AND** does not submit the request
- **AND** keeps the form open with current values

#### Scenario: Cancel edit
- **WHEN** a user clicks "Cancel" in the edit form
- **THEN** the system closes the form without saving
- **AND** discards any changes made
- **AND** returns to the previous view

### Requirement: Goal Deletion UI
The system SHALL provide a user interface for deleting goals with confirmation.

#### Scenario: Delete goal
- **WHEN** a user clicks "Delete" button on a goal
- **THEN** the system displays a confirmation modal
- **AND** shows "Are you sure you want to delete [goal name]?"
- **AND** displays "Delete" and "Cancel" buttons
- **AND** warns "This action cannot be undone"

#### Scenario: Confirm deletion
- **WHEN** a user confirms deletion in the modal
- **THEN** the system sends DELETE request to /api/goals/:id
- **AND** removes the goal from the display
- **AND** displays success message "Goal deleted successfully"
- **AND** closes the confirmation modal

#### Scenario: Cancel deletion
- **WHEN** a user clicks "Cancel" in the confirmation modal
- **THEN** the system closes the modal without deleting
- **AND** keeps the goal unchanged

#### Scenario: Delete goal with contributions
- **WHEN** a user deletes a goal that has contributions (current_amount > 0)
- **THEN** the system displays additional warning in confirmation modal
- **AND** shows "This goal has $X in contributions"
- **AND** confirms user wants to proceed
- **AND** deletes the goal if confirmed

### Requirement: Goal Dashboard Page
The system SHALL provide a dedicated page for comprehensive goal management.

#### Scenario: View goal dashboard
- **WHEN** a user navigates to /goals route
- **THEN** the system displays the goal dashboard page
- **AND** shows summary statistics section at top
- **AND** displays "Create New Goal" button
- **AND** shows goal list with all goals
- **AND** provides filtering and sorting controls

#### Scenario: Display goal summary statistics
- **WHEN** the goal dashboard loads
- **THEN** the system displays summary cards showing:
- **AND** total number of active goals
- **AND** total number of completed goals
- **AND** total target amount across all active goals
- **AND** total saved amount across all active goals
- **AND** overall progress percentage across all goals

#### Scenario: No goals exist on dashboard
- **WHEN** no goals have been created
- **THEN** the system displays empty state message
- **AND** shows "You haven't created any goals yet"
- **AND** displays "Create New Goal" button prominently
- **AND** provides helpful text about goal tracking benefits

#### Scenario: Filter goals by status
- **WHEN** a user selects a filter option (All, Active, Completed, Behind Schedule)
- **THEN** the system displays only goals matching the selected filter
- **AND** updates the count in summary statistics
- **AND** maintains filter selection when creating/editing goals

#### Scenario: Sort goals
- **WHEN** a user selects a sort option (By Deadline, By Progress, By Amount)
- **THEN** the system reorders the goal list accordingly
- **AND** maintains sort order when goals are updated
- **AND** visually indicates current sort method

### Requirement: Goal Widget Customization
The system SHALL allow users to customize which goals are displayed in the analytics widget.

#### Scenario: Open widget customization
- **WHEN** a user clicks settings icon on the goal widget
- **THEN** the system displays customization panel
- **AND** shows list of all goals with checkboxes
- **AND** currently displayed goals are checked
- **AND** provides "Show Top N Goals" option with number input
- **AND** displays "View All Goals" link to dashboard

#### Scenario: Select specific goals to display
- **WHEN** a user checks/unchecks goals in customization panel
- **THEN** the system updates the widget immediately
- **AND** shows only selected goals in the widget
- **AND** saves preferences to localStorage
- **AND** restores preferences on page reload

#### Scenario: Show top N goals
- **WHEN** a user selects "Show Top 3 Goals" option
- **THEN** the system displays the 3 goals closest to deadline
- **AND** updates automatically when goals change
- **AND** displays "(Showing top 3 of X goals)" indicator

#### Scenario: Show all goals in widget
- **WHEN** a user selects "Show All Goals" option
- **THEN** the system displays all active goals in the widget
- **AND** uses scrolling if needed for many goals
- **AND** limits to reasonable display height

#### Scenario: Navigate to goal dashboard from widget
- **WHEN** a user clicks "View All Goals" in the widget
- **THEN** the system navigates to /goals route
- **AND** displays the full goal dashboard

### Requirement: Goal Contribution Management
The system SHALL provide a user interface for adding contributions to goals.

#### Scenario: Open contribution form
- **WHEN** a user clicks "Add Contribution" on a goal
- **THEN** the system displays a contribution form modal
- **AND** shows current goal details (name, target, current amount)
- **AND** shows input field for contribution amount
- **AND** shows resulting total if contribution is added
- **AND** displays "Add" and "Cancel" buttons

#### Scenario: Add contribution
- **WHEN** a user enters a valid positive amount and clicks "Add"
- **THEN** the system validates the amount is positive
- **AND** sends PATCH request to /api/goals/:id with updated current_amount
- **AND** updates goal display immediately
- **AND** recalculates progress percentage
- **AND** displays success message "Contribution added: $X"
- **AND** closes the contribution form

#### Scenario: Add contribution that completes goal
- **WHEN** a contribution causes current_amount to reach or exceed target_amount
- **THEN** the system updates the goal status to "completed"
- **AND** displays celebration message "Goal achieved!"
- **AND** shows completion date
- **AND** updates goal display with completed styling

#### Scenario: Invalid contribution amount
- **WHEN** a user enters zero, negative, or non-numeric value
- **THEN** the system displays validation error
- **AND** does not submit the request
- **AND** shows "Amount must be positive"

#### Scenario: Contribution exceeds target
- **WHEN** a contribution would cause current_amount to exceed target_amount
- **THEN** the system displays warning "This will exceed your goal by $X"
- **AND** allows the contribution to proceed if user confirms
- **AND** displays goal as completed with "exceeded" status

### Requirement: Goal List Display
The system SHALL display goals in a list with comprehensive information.

#### Scenario: Display goal card
- **WHEN** a goal is displayed in the list
- **THEN** the system shows a card containing:
- **AND** goal title
- **AND** target amount and current amount with currency formatting
- **AND** horizontal progress bar with percentage
- **AND** deadline with countdown (X days/months remaining)
- **AND** estimated completion date if available
- **AND** status indicator (ahead, on track, behind, completed)
- **AND** "Edit", "Delete", and "Add Contribution" action buttons

#### Scenario: Display goal deadline urgency
- **WHEN** a goal's deadline is within 30 days
- **THEN** the system highlights the deadline in urgent color (orange/red)
- **AND** displays "Due soon!" badge
- **AND** increases visual prominence

#### Scenario: Display completed goal
- **WHEN** a goal is completed
- **THEN** the system displays with completion styling (green badge)
- **AND** shows "Goal Achieved!" message
- **AND** displays completion date
- **AND** grays out or de-emphasizes compared to active goals
- **AND** still allows deletion and editing

### Requirement: Goal Form Validation
The system SHALL validate all goal form inputs before submission.

#### Scenario: Validate goal title
- **WHEN** a user enters a goal title
- **THEN** the system validates title is not empty
- **AND** validates title is between 1 and 100 characters
- **AND** trims whitespace from beginning and end
- **AND** displays error if invalid

#### Scenario: Validate target amount
- **WHEN** a user enters a target amount
- **THEN** the system validates amount is a positive number
- **AND** validates amount is at least $1
- **AND** validates amount has at most 2 decimal places
- **AND** displays error if invalid

#### Scenario: Validate deadline
- **WHEN** a user selects a deadline
- **THEN** the system validates date is in the future
- **AND** validates date is within reasonable range (within 50 years)
- **AND** displays error if invalid
- **AND** allows null/empty deadline (no deadline set)

#### Scenario: Validate current amount in edit
- **WHEN** editing a goal with existing current_amount
- **THEN** the system validates current_amount is non-negative
- **AND** allows current_amount to equal or exceed target_amount (over-achievement)
- **AND** displays warning if current_amount > target_amount

### Requirement: Goal API Integration
The system SHALL integrate with backend API for all goal operations.

#### Scenario: Handle API errors gracefully
- **WHEN** an API request fails (network error, server error)
- **THEN** the system displays user-friendly error message
- **AND** does not crash or freeze the UI
- **AND** provides "Retry" option where applicable
- **AND** logs error details for debugging

#### Scenario: Handle loading states
- **WHEN** waiting for API response (create, update, delete)
- **THEN** the system displays loading indicator
- **AND** disables submit buttons to prevent duplicate requests
- **AND** shows spinner or progress indicator
- **AND** updates UI immediately when response received

#### Scenario: Optimistic updates
- **WHEN** user performs an action (add contribution, update goal)
- **THEN** the system updates UI immediately (optimistic)
- **AND** sends API request in background
- **AND** reverts UI if request fails
- **AND** shows error message if reverted

### Requirement: Goal Navigation and Routing
The system SHALL provide proper navigation for goal-related pages.

#### Scenario: Navigate to goal dashboard
- **WHEN** a user clicks "Goals" in main navigation
- **THEN** the system navigates to /goals route
- **AND** displays the goal dashboard page
- **AND** highlights "Goals" in navigation

#### Scenario: Deep link to goal dashboard
- **WHEN** a user navigates directly to /goals URL
- **THEN** the system loads the goal dashboard page
- **AND** fetches goal data from API
- **AND** displays properly without errors

#### Scenario: Return to previous page
- **WHEN** a user clicks back button after viewing goal dashboard
- **THEN** the system navigates to previous page
- **AND** preserves previous page state if applicable

### Requirement: Goal Responsive Design
The system SHALL ensure goal management UI works on all device sizes.

#### Scenario: Display on mobile
- **WHEN** viewing goal dashboard on mobile device (screen width < 640px)
- **THEN** the system displays goals in single column layout
- **AND** adjusts card sizes to fit screen
- **AND** stacks action buttons vertically if needed
- **AND** ensures forms are usable on small screens

#### Scenario: Display on tablet
- **WHEN** viewing goal dashboard on tablet device (screen width 640-1024px)
- **THEN** the system displays goals in two-column layout
- **AND** optimizes spacing for touch interactions

#### Scenario: Display on desktop
- **WHEN** viewing goal dashboard on desktop (screen width > 1024px)
- **THEN** the system displays goals in three-column layout
- **AND** utilizes available screen space efficiently
- **AND** displays forms in centered modals

### Requirement: Goal Accessibility
The system SHALL ensure goal management UI is accessible to all users.

#### Scenario: Keyboard navigation
- **WHEN** a user navigates using keyboard only
- **THEN** the system allows tabbing through all interactive elements
- **AND** provides visible focus indicators
- **AND** supports Enter key for buttons
- **AND** supports Escape key to close modals

#### Scenario: Screen reader support
- **WHEN** using a screen reader
- **THEN** the system provides descriptive labels for all inputs
- **AND** announces status messages (success, error)
- **AND** provides alt text for icons
- **AND** ensures logical reading order

#### Scenario: Color contrast
- **WHEN** viewing goal UI
- **THEN** the system uses sufficient color contrast for text (WCAG AA)
- **AND** does not rely solely on color for status indicators
- **AND** provides text labels or icons alongside colors

