# Landing Page Design

## Context
The application currently has a basic landing page implemented inline in `App.tsx`. We need to refactor this into a proper component structure that follows React best practices, uses DaisyUI effectively, and provides a maintainable foundation for future landing page iterations.

## Goals
- Create reusable, composable components for landing page sections
- Leverage DaisyUI theming and component classes for consistency
- Implement responsive design using Tailwind/DaisyUI utilities
- Follow project conventions (TypeScript strict mode, named exports, component structure)

## Non-Goals
- Authentication implementation (button navigates to dashboard placeholder)
- Backend integration for this phase
- Complex animations or interactions
- SEO optimization (meta tags, etc.) - defer to future iteration

## Decisions

### Component Architecture
**Decision**: Split landing page into three separate components:
1. `LandingPage.tsx` - Container component that composes Hero and FeatureCard
2. `Hero.tsx` - Hero section with heading, tagline, and CTA button
3. `FeatureCard.tsx` - Reusable card component for feature highlights

**Rationale**: 
- Separation of concerns: Each component has a single responsibility
- Reusability: FeatureCard can be used for different features without duplication
- Testability: Smaller components are easier to test in isolation
- Maintainability: Changes to hero vs features are isolated

**Alternatives considered**:
- Single monolithic component: Rejected due to poor maintainability and reusability
- Even more granular (e.g., separate Button component): Rejected as over-engineering for current needs

### File Structure
**Decision**: Place components in `frontend/src/components/Landing/` directory
- `Landing/LandingPage.tsx` - Main page component
- `Landing/Hero.tsx` - Hero section
- `Landing/FeatureCard.tsx` - Feature card

**Rationale**:
- Feature-based organization aligns with project conventions (see project.md)
- Landing folder clearly groups related components
- Easy to find and navigate

### DaisyUI Usage
**Decision**: Use DaisyUI utility classes and components directly in JSX
- Hero section: `hero`, `hero-content`, `text-center`
- Buttons: `btn`, `btn-primary`, `btn-lg`
- Cards: `card`, `card-body`, `card-title`
- Grid: Tailwind's `grid`, `grid-cols-1`, `lg:grid-cols-3`

**Rationale**:
- DaisyUI is already installed and configured
- No additional CSS files needed
- Automatic theme support (light/dark mode)
- Consistent with project's "boring technology" principle

### Responsive Breakpoints
**Decision**: Use Tailwind's default breakpoints:
- Mobile: < 768px (default/base styles)
- Tablet: 768px - 1024px (`md:` prefix)
- Desktop: ≥ 1024px (`lg:` prefix)

**Rationale**:
- Standard Tailwind breakpoints are well-documented and familiar
- Aligns with common device sizes
- Spec requirements map cleanly to these breakpoints

### Props and Type Safety
**Decision**: Define explicit TypeScript interfaces for component props

```typescript
// FeatureCard.tsx
interface FeatureCardProps {
  title: string
  description: string
  icon?: React.ReactNode  // Optional for future icon support
}
```

**Rationale**:
- Type safety prevents runtime errors
- Follows project's TypeScript strict mode convention
- Clear contract for component consumers
- Optional icon prop allows future enhancement without breaking changes

### Navigation Implementation
**Decision**: Use React Router's `Link` component for navigation
```typescript
import { Link } from 'react-router-dom'
// In Hero.tsx:
<Link to="/dashboard" className="btn btn-primary btn-lg">
  Get Started
</Link>
```

**Rationale**:
- Client-side routing (no page reload)
- React Router already installed and configured
- Semantic HTML (renders as `<a>` tag)
- Better accessibility than button with onClick

## Risks / Trade-offs

### Risk: Feature card content becomes stale
**Mitigation**: Keep feature descriptions in LandingPage component data array, making updates centralized and easy to find

### Trade-off: Icon placeholder in FeatureCard
**Decision**: Accept that icons will be text/emoji placeholders initially
**Rationale**: No icon library installed yet; adds complexity. Can enhance later when design system matures.

### Risk: DaisyUI version updates breaking styles
**Mitigation**: DaisyUI is stable and has semantic versioning. Breaking changes would be in major version updates (4.x → 5.x), giving us control over when to upgrade.

## Implementation Notes

### Feature Card Content
Store feature data in LandingPage component:
```typescript
const features = [
  {
    title: 'Bank Connection',
    description: 'Securely connect your bank accounts and credit cards via Plaid...'
  },
  // ...
]
```

Map over array to render FeatureCard components. This keeps content in one place and makes it easy to add/remove features.

### Responsive Grid
Use Tailwind grid utilities:
```typescript
<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
```
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3 columns (matches spec requirement)

### Theme Compatibility
DaisyUI automatically handles theme switching via `data-theme` attribute on root element. No additional code needed in landing page components.

## Open Questions
None. All technical decisions are clear for implementation.

