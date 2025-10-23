# Rate Limiting Fix for Plaid Sync

## Problem
When landing on the Analytics page, you were getting multiple `429 (Too Many Requests)` errors from the Plaid sync endpoint. This was happening because:

1. The AnalyticsDashboard was auto-syncing transactions every time it mounted
2. In React development mode (and hot reload), components can mount multiple times
3. Each mount triggered a sync for every Plaid item
4. This quickly exceeded the rate limit

## Solution Implemented

### 1. Backend Changes

#### Added `last_sync` Timestamp Tracking
**File: `backend/src/services/database.ts`**
- Added `last_sync: string | null` field to the `PlaidItem` interface
- This tracks when we last successfully synced transactions from Plaid

#### Update Sync Timestamp
**File: `backend/src/services/plaid.ts`**
- Updated `syncTransactions()` function to set `last_sync` after successful sync (line 425)
- Set `last_sync: null` when creating new PlaidItems (line 149)

#### Rate Limiting Logic in Endpoint
**File: `backend/src/routes/plaid.ts`**
- Added check in `POST /api/plaid/sync-transactions` to skip sync if last sync was < 5 minutes ago
- Returns early with success message: "Synced recently, skipping"
- This prevents excessive Plaid API calls even if the frontend requests multiple syncs

#### New Sync Status Endpoint
**File: `backend/src/routes/plaid.ts`**
- Added `GET /api/plaid/sync-status` endpoint
- Returns sync status for all Plaid items including:
  - `last_sync`: ISO timestamp of last successful sync
  - `should_sync`: boolean indicating if enough time has passed (> 5 minutes)

### 2. Frontend Changes

#### Removed Auto-Sync on Mount
**File: `frontend/src/components/Analytics/AnalyticsDashboard.tsx`**
- **Removed** the `useEffect` that auto-synced transactions on component mount
- Users now must **manually** click "Refresh Transactions" to sync
- This prevents automatic syncs that were triggering rate limits

## How It Works Now

### Manual Sync Flow
1. User clicks "Refresh Transactions" button
2. Frontend sends sync request for each Plaid item
3. Backend checks `last_sync` timestamp:
   - If < 5 minutes ago: Returns success immediately without calling Plaid API
   - If > 5 minutes ago: Calls Plaid API and updates `last_sync` timestamp
4. Frontend displays sync status

### Benefits
- ✅ No more 429 errors from automatic syncing
- ✅ Plaid API calls are throttled to once per 5 minutes per item
- ✅ Users have control over when syncing happens
- ✅ Multiple sync button clicks within 5 minutes won't trigger new API calls
- ✅ Data is still fresh (5 minute window is reasonable for personal finance)

## Configuration

### Sync Interval
The sync interval is currently hard-coded to **5 minutes** in two places:

1. `backend/src/routes/plaid.ts` line 239-240:
   ```typescript
   const fiveMinutes = 5 * 60 * 1000;
   ```

2. `backend/src/routes/plaid.ts` line 199:
   ```typescript
   Date.now() - new Date(item.last_sync).getTime() > 5 * 60 * 1000
   ```

To change the interval, update these values (in milliseconds).

## Testing

### Test the Fix
1. Navigate to the Analytics dashboard
2. Click "Refresh Transactions" button
3. ✅ Should sync successfully
4. Click "Refresh Transactions" again within 5 minutes
5. ✅ Should show "Synced: 0 added, 0 updated, 0 removed" (skip message from backend)
6. Wait 5 minutes and click again
7. ✅ Should sync again and fetch any new transactions

### Verify No Auto-Sync
1. Navigate away from Analytics page
2. Navigate back to Analytics page
3. ✅ Should NOT automatically trigger a sync
4. Transactions should display from cache/database

## Migration Notes

### For Existing Databases
If you have an existing database without the `last_sync` field:
- New field is nullable (`last_sync: string | null`)
- Existing PlaidItems will have `last_sync` as `undefined` initially
- First sync after upgrade will set the timestamp
- No data migration needed - system handles gracefully

## Monitoring

### Check Sync Status
You can check the sync status programmatically:

```bash
curl http://localhost:3000/api/plaid/sync-status
```

Response:
```json
{
  "items": [
    {
      "plaid_item_id": "uuid-here",
      "institution_name": "Chase",
      "last_sync": "2025-10-23T10:30:00.000Z",
      "should_sync": false
    }
  ]
}
```

## Future Enhancements (Optional)

1. **Display Last Sync Time in UI**
   - Show "Last synced: 2 minutes ago" below the refresh button
   - Update in real-time

2. **Auto-Refresh on Stale Data**
   - If `last_sync` is > 24 hours, show a warning banner
   - Prompt user to refresh

3. **Configurable Sync Interval**
   - Add environment variable for sync interval
   - Allow per-user customization

4. **Background Sync Worker**
   - Set up a cron job to sync once per hour
   - Keep data fresh without user action

## Summary

✅ **Fixed:** No more rate limiting errors when landing on Analytics page
✅ **Fixed:** Plaid API calls now throttled to once per 5 minutes
✅ **Fixed:** Users have manual control over syncing
✅ **Added:** Last sync timestamp tracking
✅ **Added:** Sync status endpoint for monitoring

The application now respects rate limits while still providing fresh data when needed!

