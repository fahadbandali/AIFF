# Cash Flow Widget Category Display Issue

## Problem Description
When users tag transactions with categories, the "Yearly Cash Flow" widget (Categories view) only shows "Uncategorized" transactions, not the newly tagged categories.

## Root Cause Analysis

### Initial Hypothesis
- **Cache invalidation issue** - React Query wasn't refreshing data after tagging
- **API rate limiting** - Plaid API was being called too frequently during cache invalidation

### Discovery Process
1. **Backend verification:** Confirmed transactions are being updated correctly in database
2. **Frontend debugging:** Added comprehensive logging to track transaction counts and category breakdowns
3. **Cache investigation:** Found that `queryClient.refetchQueries()` was calling ALL queries including Plaid API

### Real Issues Found
1. **Over-broad cache invalidation:** `queryClient.refetchQueries()` was refetching Plaid link token queries, causing 429 rate limit errors
2. **Frontend caching:** React Query was caching API responses and not refetching fresh data after tagging

## Solutions Implemented

### 1. Fixed Cache Invalidation
**File:** `frontend/src/components/Analytics/UntaggedTransactions.tsx`
```typescript
// Before: Refetched ALL queries (including Plaid)
await queryClient.refetchQueries();

// After: Only invalidate transaction-related queries
await queryClient.invalidateQueries({
  queryKey: ["transactions"],
  exact: false,
});
await queryClient.invalidateQueries({
  queryKey: ["cashFlowStats"],
  exact: false,
});
```

### 2. Disabled Caching
**File:** `frontend/src/components/Analytics/CashFlowCircle.tsx`
```typescript
const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
  queryKey: ["transactions", "all", startDate, endDate],
  queryFn: () => api.transactions.getAll({ start_date: startDate, end_date: endDate }),
  staleTime: 0, // Always consider data stale
  gcTime: 0, // Don't cache data
  refetchOnWindowFocus: true, // Refetch when window gains focus
});
```

### 3. Added Comprehensive Debugging
**Backend:** `backend/src/routes/transactions.ts`
- Added logging before/after transaction updates
- Added verification that transaction still exists after database write

**Frontend:** `frontend/src/components/Analytics/CashFlowCircle.tsx`
- Added transaction count logging
- Added category breakdown analysis
- Added specific transaction tracking
- Added tagged transaction detection

## Current Status

### ✅ Working
- Backend tagging API works correctly
- Cache invalidation is targeted (no more 429 errors)
- Backend logs show transactions being updated successfully

### ❌ Still Broken
- Frontend still not showing tagged transactions in Categories view
- Transaction count decreases when tagging (should stay same)
- Tagged transactions not appearing in Cash Flow widget

## Debug Output Examples

### Backend Logs (Working)
```
Before update - Transaction 1045fab4-c06b-4c64-8ac2-df76bc5000a0: category=cat-uncategorized, is_tagged=false, date=2025-10-14
After update - Transaction 1045fab4-c06b-4c64-8ac2-df76bc5000a0: category=cat-entertainment, is_tagged=true, date=2025-10-14
Transaction 1045fab4-c06b-4c64-8ac2-df76bc5000a0 still exists after write: true
```

### Frontend Logs (Still Broken)
```
Processing 41 transactions with 9 categories
Specific transaction NOT found in query results
Found 35 expense transactions
Healthcare transactions: 0
Tagged transactions: 0
Transaction counts by category:
  cat-uncategorized: 35 transactions (Uncategorized)
Category breakdown: 1 categories found
```

## Remaining Investigation Needed

### Possible Issues
1. **Date range filtering:** Transaction dates might be outside the query date range
2. **Query parameters:** Frontend query might have hidden filters
3. **Database corruption:** Transactions might be getting deleted during update
4. **Race conditions:** Frontend might be querying before backend update completes

### Next Steps
1. **Verify date ranges:** Check if tagged transactions fall within the query date range
2. **Check query parameters:** Ensure frontend query isn't filtering out tagged transactions
3. **Database inspection:** Manually check database to confirm transactions exist
4. **Timing analysis:** Check if there's a race condition between update and query

## Files Modified
- `frontend/src/components/Analytics/UntaggedTransactions.tsx` - Fixed cache invalidation
- `frontend/src/components/Analytics/CashFlowCircle.tsx` - Disabled caching, added debugging
- `backend/src/routes/transactions.ts` - Added comprehensive logging

## Technical Details
- **Frontend:** React Query caching with `staleTime: 0` and `gcTime: 0`
- **Backend:** LowDB with transaction updates and verification
- **API:** RESTful endpoints with proper error handling
- **Debugging:** Console logging on both frontend and backend
