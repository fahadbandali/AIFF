# Design System: Unified Color Scheme and Component Patterns

## Context

The application currently uses an inconsistent color scheme with both purple and indigo colors across different components. The budget dashboard also lacks the navigation pattern present in the goal dashboard, creating an inconsistent user experience. This change standardizes the design system to ensure visual consistency.

## Goals / Non-Goals

**Goals:**
- Establish blue (indigo) as the primary brand color throughout the application
- Ensure all interactive elements (buttons, links, focus states) use the indigo color scheme
- Apply consistent navigation patterns across all feature dashboards
- Standardize widget card styling, spacing, and shadows

**Non-Goals:**
- Complete design system overhaul (keeping DaisyUI base theme)
- Custom color palette beyond standard Tailwind/DaisyUI colors
- Rebranding or logo changes

## Decisions

### Color Scheme Standardization

**Decision:** Replace all purple colors with blue (indigo) colors for consistency.

**Mapping:**
- `bg-purple-100` → `bg-blue-100`
- `text-purple-700` → `text-blue-700`
- `bg-purple-50` → `bg-blue-50`
- All `indigo-*` colors remain unchanged (primary color)

**Rationale:**
- User feedback indicates preference for blue over purple
- Indigo is already the primary action color (buttons, focus states)
- Blue/indigo is more commonly used in financial applications
- Creates a cohesive brand identity

**Affected Components:**
- BudgetDashboard: badge styling for "All Categories"
- BudgetWidget: category badge styling
- Any other components using purple variants

### Navigation Pattern Consistency

**Decision:** Apply the goal dashboard navigation pattern to the budget dashboard.

**Pattern:**
```tsx
<div className="bg-base-200 border-b border-base-300">
  <div className="container mx-auto px-4 py-3">
    <div className="flex items-center gap-4">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate("/dashboard")}>
        <BackArrowIcon /> Dashboard
      </button>
      <div className="text-gray-400">|</div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate("/analytics")}>
        📊 Analytics
      </button>
    </div>
  </div>
</div>
```

**Rationale:**
- Provides consistent navigation experience across all feature dashboards
- Users can easily return to main dashboard
- Quick access to analytics from any feature page
- Matches existing goal dashboard pattern that users appreciate

**Affected Components:**
- BudgetDashboard.tsx (add navigation bar)
- Potentially other feature dashboards in the future

### Widget Card Styling

**Decision:** Standardize all widget/card components to use consistent DaisyUI classes.

**Standard Widget Pattern:**
```tsx
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">
    {/* Widget content */}
  </div>
</div>
```

**Rationale:**
- DaisyUI provides consistent styling through semantic classes
- `shadow-xl` provides appropriate depth for widget cards
- `bg-base-100` ensures proper contrast with page background
- Maintains theme compatibility (light/dark mode support)

## Risks / Trade-offs

**Risk:** Users may be confused by sudden color change
- **Mitigation:** Change is subtle (purple → blue), both are professional colors
- **Mitigation:** Rolling out as part of larger UX improvement, not isolated

**Risk:** Missing some purple references in the codebase
- **Mitigation:** Comprehensive grep search before implementation
- **Mitigation:** Visual testing of all pages after changes

**Trade-off:** Design consistency vs. component independence
- **Decision:** Favor consistency to improve overall UX
- **Benefit:** Easier maintenance and future development

## Migration Plan

### Phase 1: Color Updates
1. Search for all purple color classes in components
2. Replace with blue/indigo equivalents
3. Test each component visually

### Phase 2: Navigation Pattern
1. Extract navigation bar pattern from GoalDashboard
2. Apply to BudgetDashboard
3. Ensure routing works correctly

### Phase 3: Widget Standardization
1. Review all widget components
2. Ensure consistent use of card classes
3. Verify spacing and shadows match

### Rollback
- Changes are primarily CSS/styling, easy to revert
- Git history preserves previous color scheme
- No database or API changes involved

## Open Questions

None - implementation is straightforward with clear guidelines.

