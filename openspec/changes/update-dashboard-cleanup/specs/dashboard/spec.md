# Dashboard Specification (Delta)

## MODIFIED Requirements

### Requirement: Analytics View Toggle
The dashboard SHALL provide a toggle between "Accounts View" and "Analytics View" in the quick actions section, allowing users to switch views without navigating to different routes.

#### Scenario: Analytics view displays transaction management and cash flow widgets
- **WHEN** user toggles to analytics view
- **THEN** the dashboard displays untagged transactions list, full transaction list, yearly cash flow circle graph, and time-based cash flow line graph
- **AND** budget and goal widgets are not displayed in analytics view

### Requirement: Quick Actions Section
The dashboard SHALL provide a quick actions section with buttons for common operations including analytics toggle, budget overview, settings, and connecting new accounts.

#### Scenario: Budget button displays overview on dashboard
- **WHEN** user clicks the "Budgets" button in quick actions
- **THEN** the budget overview widget is displayed on the dashboard page
- **AND** the user is not navigated to a different route
- **AND** the budget widget displays with title "Budgets"
- **AND** the budget widget has the same visual style as other dashboard sections

#### Scenario: Goal button removed
- **WHEN** user views quick actions section
- **THEN** no "Goals" button is present
- **AND** only analytics toggle, budgets, settings, and connect buttons are shown

## ADDED Requirements

### Requirement: Color Scheme Consistency
The dashboard SHALL use a consistent blue (indigo) color scheme in dark mode, replacing any purple color usage to ensure visual consistency across all components.

#### Scenario: Blue color scheme in dark mode
- **WHEN** application is in dark mode
- **THEN** all primary accent colors use blue/indigo tones
- **AND** no purple colors are used for primary UI elements
- **AND** buttons, links, and interactive elements follow the blue color scheme
- **AND** the color scheme is consistent across dashboard, analytics, and all widgets

## REMOVED Requirements

### Requirement: Goal Widget Integration
**Reason**: Goal tracking feature is being removed from the application in favor of focusing on cash flow analysis
**Migration**: Users should rely on enhanced cash flow visualizations for tracking financial progress. Any existing goal data will remain in the database but will not be accessible through the UI.


