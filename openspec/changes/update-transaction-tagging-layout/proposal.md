# Update Transaction Tagging Layout

## Why
Users currently need to navigate between separate views to tag untagged transactions and see their full transaction list. This creates a fragmented workflow where users cannot see the immediate effect of their tagging actions. By displaying both lists side-by-side, users can tag transactions and immediately see them appear in the full list, creating a more intuitive and satisfying user experience.

## What Changes
- Modify the analytics dashboard layout to display untagged transactions list beside the full transaction list in a two-column layout
- Update the UntaggedTransactions component to work in a side-by-side context
- Ensure that when a transaction is tagged, it immediately disappears from the untagged list and appears in the full transaction list
- Make the layout responsive: side-by-side on desktop (>= 1024px), stacked on tablet/mobile
- Update the TransactionList component to support real-time updates when transactions are tagged
- Add visual feedback when a transaction moves from untagged to tagged state

## Impact

### Affected Specs
- `financial-analytics` (existing): Modify the Untagged Transactions Widget requirement and add new layout requirements for side-by-side display

### Affected Code
- Frontend:
  - `src/components/Analytics/AnalyticsDashboard.tsx`: Update layout to show UntaggedTransactions and TransactionList side-by-side
  - `src/components/Analytics/UntaggedTransactions.tsx`: May need minor UI adjustments for narrower width
  - `src/components/Analytics/TransactionList.tsx`: May need minor UI adjustments for narrower width
  - Potentially add responsive grid CSS classes using Tailwind/DaisyUI
- Backend:
  - No backend changes required (existing API endpoints support this workflow)

### User Experience Impact
- Users can see the immediate effect of tagging transactions
- Reduces navigation between different views
- Creates a more satisfying "inbox zero" workflow for transaction management
- Better spatial relationship between untagged and tagged transactions

### Responsive Considerations
- Desktop (>= 1024px): Two-column layout with untagged list on left, full list on right
- Tablet (768px - 1023px): Two-column layout with adjusted widths
- Mobile (< 768px): Stacked layout with untagged transactions on top, full list below

